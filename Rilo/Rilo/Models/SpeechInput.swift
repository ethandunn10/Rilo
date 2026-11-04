import Foundation

/// Talking to Rilo instead of typing. The web demo has no microphone (see
/// the note at the top of app/src/lib/listen.js): every answer is typed, so
/// the screens show the mic UI only when `isAvailable` is true.
///
/// Phase 7 adds a real Apple Speech implementation behind this same
/// protocol. Until then the only implementation is `DemoSpeechInput`.
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

/// The one place that picks the speech engine, so Phase 7 swaps one line.
enum Speech {
    @MainActor
    static func make(demoLines: [String]) -> SpeechInput {
        DemoSpeechInput(lines: demoLines)
    }
}

/// DEMO ONLY. With no real recognition the web falls back to typing, so by
/// default this is unavailable and the screens are exactly the web's.
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
