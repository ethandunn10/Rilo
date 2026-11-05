import AVFoundation
import Foundation
import Speech

/// Real speech-to-text for Talk and the night check-in: Apple's Speech
/// framework, ALWAYS on the phone (`requiresOnDeviceRecognition`), US
/// English. A phone that can't recognise speech on-device gets no mic at all
/// (typing only), never Apple's server recogniser: the privacy policy at
/// rilo.one/privacy promises speech is turned into text on the iPhone.
///
/// Privacy, as the permission text promises: the mic is on ONLY while the
/// talk button is held. `start` opens it, `stop` (the finger lifting)
/// closes it and hands over what was heard.
///
/// Permissions are asked the first time they press the mic, not before.
/// That press only asks (the system alert takes the finger anyway); the
/// next press talks. If either is refused, or recognition isn't there,
/// `isAvailable` goes false and the screens hide the mic and fall back to
/// typing, exactly like the web.
@MainActor @Observable
final class AppleSpeechInput: SpeechInput {
    private(set) var isAvailable: Bool

    @ObservationIgnored private let recognizer: SFSpeechRecognizer
    @ObservationIgnored private let engine = AVAudioEngine()
    @ObservationIgnored private var request: SFSpeechAudioBufferRecognitionRequest?
    @ObservationIgnored private var task: SFSpeechRecognitionTask?
    @ObservationIgnored private var tapped = false
    @ObservationIgnored private var heard = ""
    @ObservationIgnored private var partial: ((String) -> Void)?
    @ObservationIgnored private var finish: ((String) -> Void)?
    /* each listen gets a number, so a late callback from an old one is ignored */
    @ObservationIgnored private var session = 0
    @ObservationIgnored private var giveUp: Task<Void, Never>?

    /// nil when this phone has no US English recogniser at all
    init?() {
        guard let r = SFSpeechRecognizer(locale: Locale(identifier: "en-US")) else { return nil }
        recognizer = r
        /* on-device only: no on-device recogniser → no mic, typing instead */
        isAvailable = r.isAvailable && r.supportsOnDeviceRecognition && !Self.refused
    }

    /// either permission already said no (or is blocked by Screen Time /
    /// a parent): no mic, typing only
    private static var refused: Bool {
        let speech = SFSpeechRecognizer.authorizationStatus()
        return speech == .denied || speech == .restricted
            || AVAudioApplication.shared.recordPermission == .denied
    }

    private static var granted: Bool {
        SFSpeechRecognizer.authorizationStatus() == .authorized
            && AVAudioApplication.shared.recordPermission == .granted
    }

    func start(onPartial: @escaping (String) -> Void, onFinal: @escaping (String) -> Void) {
        guard isAvailable else { onFinal(""); return }
        endNow()
        session += 1
        heard = ""
        partial = onPartial
        finish = onFinal

        guard Self.granted else {
            /* first press: ask, then let them press again to talk */
            let mine = session
            Task {
                let ok = await Self.askPermissions()
                if !ok { isAvailable = false }
                if mine == session { deliver() }
            }
            return
        }
        guard recognizer.isAvailable else {
            isAvailable = false
            deliver()
            return
        }
        do {
            try begin()
        } catch {
            deliver()
        }
    }

    func stop() {
        guard finish != nil else { return }
        guard request != nil else { deliver(); return }
        /* the finger's up: close the mic now, then wait a moment for the
           recogniser's last word on what it heard */
        stopAudio()
        request?.endAudio()
        let mine = session
        giveUp?.cancel()
        giveUp = Task {
            try? await Task.sleep(for: .milliseconds(1500))
            if !Task.isCancelled && mine == session { deliver() }
        }
    }

    // MARK: listening

    private func begin() throws {
        let audio = AVAudioSession.sharedInstance()
        try audio.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audio.setActive(true, options: .notifyOthersOnDeactivation)

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        req.taskHint = .dictation
        /* never Apple's servers (the privacy policy promises on-phone) */
        guard recognizer.supportsOnDeviceRecognition else { throw CocoaError(.featureUnsupported) }
        req.requiresOnDeviceRecognition = true

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        /* no input at all (some simulators): nothing to listen to */
        guard format.sampleRate > 0, format.channelCount > 0 else { throw SpeechError.noInput }
        try Self.installTap(input, format: format, request: req)
        tapped = true
        engine.prepare()
        try engine.start()

        request = req
        let mine = session
        task = recognizer.recognitionTask(with: req, resultHandler: Self.handler { [weak self] text, done in
            guard let self, mine == self.session else { return }
            self.got(text, done: done)
        })
    }

    private func got(_ text: String?, done: Bool) {
        if let text, !text.isEmpty {
            /* Rilo writes in lowercase, and so does what he hears */
            heard = text.lowercased()
            partial?(heard)
        }
        if done { deliver() }
    }

    /// hand over what was heard (once) and close everything
    private func deliver() {
        giveUp?.cancel()
        giveUp = nil
        endNow()
        let done = finish
        finish = nil
        partial = nil
        done?(heard)
    }

    private func stopAudio() {
        if engine.isRunning { engine.stop() }
        if tapped {
            engine.inputNode.removeTap(onBus: 0)
            tapped = false
        }
    }

    private func endNow() {
        stopAudio()
        if request != nil || task != nil {
            task?.finish()
            task = nil
            request = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    // MARK: off the main thread (the audio tap and Speech's callbacks)

    private enum SpeechError: Error { case noInput }

    /// iOS 27's throwing tap (the old one is deprecated and crashes on a
    /// bad format instead of throwing). The SDK has no Swift refinement for
    /// it yet, so it imports as `__installTap` with an empty `error:` slot.
    private nonisolated static func installTap(_ node: AVAudioInputNode, format: AVAudioFormat,
                                               request: SFSpeechAudioBufferRecognitionRequest) throws {
        try node.__installTap(onBus: 0, bufferSize: 1024, format: format, error: ()) { buffer, _ in
            request.append(buffer)
        }
    }

    /// Speech calls back on its own queue: hop to the main actor
    private nonisolated static func handler(
        _ deliver: @escaping @MainActor (String?, Bool) -> Void
    ) -> @Sendable (SFSpeechRecognitionResult?, Error?) -> Void {
        { result, error in
            let text = result?.bestTranscription.formattedString
            let done = (result?.isFinal ?? false) || error != nil
            Task { @MainActor in deliver(text, done) }
        }
    }

    private nonisolated static func askPermissions() async -> Bool {
        let speech = await withCheckedContinuation { (cont: CheckedContinuation<SFSpeechRecognizerAuthorizationStatus, Never>) in
            SFSpeechRecognizer.requestAuthorization { cont.resume(returning: $0) }
        }
        guard speech == .authorized else { return false }
        return await AVAudioApplication.requestRecordPermission()
    }
}
