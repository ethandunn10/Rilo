import Foundation

/// Talking to Rilo instead of typing. The screens show the mic UI only when
/// `isAvailable` is true; otherwise they're typing only, like the web demo
/// (which has no microphone, see app/src/lib/listen.js).
///
/// Implementations: `AppleSpeechInput` (real, on-device speech-to-text) and
/// `DemoSpeechInput` (DEBUG `-voice` canned lines, or "no mic").
@MainActor
protocol SpeechInput: AnyObject {
    /// false → no mic anywhere, typing only (what the web does today)
    var isAvailable: Bool { get }
    /// start listening. `onPartial` gets the transcript so far, `onFinal`
    /// the finished sentence once they stop (or the recogniser does).
    func start(onPartial: @escaping (String) -> Void, onFinal: @escaping (String) -> Void)
    /// stop listening; delivers `onFinal` with whatever was heard
    func stop()
}

/// The one place that picks the speech engine.
enum Speech {
    @MainActor
    static func make(demoLines: [String]) -> SpeechInput {
        /* DEBUG `-voice`: canned lines, since the simulator has no real mic */
        if DemoSpeechInput.debugOn { return DemoSpeechInput(lines: demoLines) }
        /* the real thing, wherever the phone can recognise US English */
        if let apple = AppleSpeechInput() { return apple }
        /* no speech-to-text here: no mic, typing only (the web today) */
        return DemoSpeechInput(lines: demoLines, available: false)
    }
}

/// DEMO ONLY. Unavailable by default (the typing-only fallback when there's
/// no real recognition), so the screens are exactly the web's.
/// DEBUG `-voice` turns it on to show the listening UI: it "hears" a canned
/// line word by word (one per start, in order) and finishes on its own.
@MainActor
final class DemoSpeechInput: SpeechInput {
    let isAvailable: Bool
    private let lines: [String]
    private var next = 0
    private var heard = ""
    private var task: Task<Void, Never>?
    private var finish: ((String) -> Void)?

    init(lines: [String], available: Bool? = nil) {
        self.lines = lines
        self.isAvailable = available ?? DemoSpeechInput.debugOn
    }

    static var debugOn: Bool { DemoSeed.flag("-voice") }

    func start(onPartial: @escaping (String) -> Void, onFinal: @escaping (String) -> Void) {
        guard isAvailable, !lines.isEmpty else { return }
        task?.cancel()
        heard = ""
        finish = onFinal
        let words = lines[next % lines.count].split(separator: " ").map(String.init)
        next += 1
        task = Task { [weak self] in
            /* a beat of silence first, like a real mic opening */
            try? await Task.sleep(for: .milliseconds(700))
            for (i, w) in words.enumerated() {
                guard !Task.isCancelled, let self else { return }
                self.heard = i == 0 ? w : self.heard + " " + w
                onPartial(self.heard)
                try? await Task.sleep(for: .milliseconds(260))
            }
            /* hold the full line on screen, then hand it over */
            try? await Task.sleep(for: .milliseconds(DemoSeed.flag("-listening") ? 60_000 : 900))
            guard !Task.isCancelled else { return }
            self?.stop()
        }
    }

    func stop() {
        task?.cancel()
        task = nil
        let done = finish
        finish = nil
        done?(heard)
    }
}
