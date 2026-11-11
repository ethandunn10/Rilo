import SwiftUI

/// Port of app/src/screens/NightCheckIn.jsx — the thirty seconds at night.
/// Rilo asks how today went and what's on tomorrow, they type it, and he
/// turns it into tomorrow's schedule. On night one of the first week (Pro)
/// he adds the first-week question as a third step.
///
/// What they say goes to Rilo's brain (Services/RiloBrain): Apple's
/// on-device model when the phone has it, otherwise (and in the DEBUG
/// seeds/checks) the patterns in MockAI.
/// Voice: real on-device speech-to-text when `SpeechInput` is available
/// (DEBUG `-voice` fakes it). Then HOLDING Rilo talks; letting go sends it.
/// No speech (or a "no" to the mic) → typing only, like the web.
///
/// DEBUG launch args (with `-screen nightcheckin`):
///   -checkstep N          answer the first N questions with demo lines
///   -checkdraft "text"    text already in the field
///   -checkdone            "demo: fill it in for me" already tapped
///   -voice [-listening]   show the mic (and start listening at once)
struct NightCheckInView: View {
    @Environment(AppState.self) var state

    struct Question { var id: String; var ask: String; var sub: String? }

    static let SECONDS = 30
    static let DEMO_LINES = ["pretty good, a long day", "bio test and practice after school", "better grades"]

    @State var step = 0
    @State var said = NightSaid()
    @State var draft = ""
    @State var done = false
    /// what his brain made of it (nil until it answers)
    @State var result: NightResult? = nil
    @State var listening = false
    @State var heard = ""
    @State var left = NightCheckInView.SECONDS
    @State var clock: Task<Void, Never>?
    @State var speech: SpeechInput = Speech.make(demoLines: NightCheckInView.DEMO_LINES)
    @FocusState var focused: Bool

    var questions: [Question] {
        let base = MockAI.NIGHT_QUESTIONS.map { Question(id: $0.id, ask: $0.ask, sub: nil) }
        guard let extra = state.checkinAsk else { return base }
        return base + [Question(id: "ask", ask: extra.ask, sub: extra.sub)]
    }
    var q: Question { questions[min(step, questions.count - 1)] }
    var reply: NightReply { result?.reply ?? MockAI.nightReply(said.today) }
    var tasks: [NightTask] { result?.tasks ?? MockAI.tasksFrom(said.tomorrow) }
    /// the on-device model is still working on it
    var thinking: Bool { done && result == nil && state.brain.usesModel }
    var showText: String { listening ? heard : draft }

    var body: some View {
        ZStack {
            SkyView(hills: .low, tone: .dusk).ignoresSafeArea()
            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    column
                        .padding(.top, WebLayout.top(52))
                        .padding(.horizontal, 22)
                        .padding(.bottom, WebLayout.bottom(26 + 10))
                        .frame(maxWidth: .infinity, minHeight: geo.size.height, alignment: .top)
                }
                .scrollDismissesKeyboard(.interactively)
            }
        }
        .foregroundStyle(.white)
        .onAppear(perform: appear)
        .onDisappear {
            clock?.cancel()
            if listening { speech.stop() }
        }
    }

    private var column: some View {
        VStack(spacing: 10) {
            topRow
            bubble
            /* with a mic, Rilo is the talk button: hold him, say it, let go */
            RiloStage(skin: state.chosenRilo, mood: done && !thinking ? reply.mood : "curious", size: 180,
                      state: listening ? .listening : .idle,
                      onHold: speech.isAvailable && !done ? { down in
                          down ? startMic() : speech.stop()
                      } : nil)
            if speech.isAvailable { WaveBars(on: listening, color: .white) }
            if !done { pill }
            if !showText.isEmpty && !done {
                Text("“\(showText)”")
                    .font(.inter(15, 700))
                    .multilineTextAlignment(.center)
            }
            if !done { form }
            if done && !thinking { tomorrowCard }
            Spacer(minLength: 6)
            if done {
                Button {
                    state.nightCheckInDone(said: said, tasks: tasks)
                } label: {
                    Text("put it in tomorrow's plan")
                        .font(.fredoka(19, 600))
                        .foregroundStyle(Color(hex: "#2B3A6B"))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Capsule().fill(.white))
                }
                .buttonStyle(.tap(0.94))
                .disabled(thinking)
                .opacity(thinking ? 0.5 : 1)
            } else {
                #if DEBUG
                demoFill
                #endif
            }
        }
        .task(id: done) { await think() }
    }

    /// once both answers are in, ask his brain what tomorrow looks like
    func think() async {
        guard done, result == nil else { return }
        let r = await state.brain.nightCheckIn(today: said.today, tomorrow: said.tomorrow,
                                               context: state.brainContext)
        guard done else { return }
        result = r
        state.remember(r.learned)
    }

    // MARK: answering

    func answer(_ raw: String) {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        let at = min(step, questions.count - 1)
        let key = questions[at].id
        if key == "today" { said.today = text }
        if key == "tomorrow" { said.tomorrow = text }
        draft = ""
        track("night", key)

        if key == "ask" { state.nightAskAnswer(text) }

        if at + 1 < questions.count { step = at + 1 } else { done = true }
    }

    private func appear() {
        #if DEBUG
        if let n = DemoSeed.arg("-checkstep").flatMap(Int.init) {
            for i in 0..<min(n, Self.DEMO_LINES.count) { answer(Self.DEMO_LINES[i]) }
        }
        if let d = DemoSeed.arg("-checkdraft") { draft = d }
        if DemoSeed.flag("-checkdone") { said = MockAI.DEMO_NIGHT; done = true }
        if DemoSeed.flag("-listening") { startMic(); return }
        #endif
        /* The web's `autoFocus` never opens the keyboard on an iPhone
           (Safari ignores focus that isn't from a tap), so testers see the
           screen without it. Same here: the field waits for a tap. */
    }

    // MARK: voice (only when SpeechInput is available)

    func startMic() {
        guard speech.isAvailable, !done, !listening else { return }
        focused = false
        listening = true
        heard = ""
        left = Self.SECONDS
        /* the clock only runs while the mic is on */
        clock?.cancel()
        clock = Task { @MainActor in
            while !Task.isCancelled && listening {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled, listening else { return }
                if left <= 1 { left = 0; speech.stop(); return }
                left -= 1
            }
        }
        speech.start(onPartial: { heard = $0 }, onFinal: { text in
            listening = false
            clock?.cancel()
            heard = ""
            left = Self.SECONDS
            answer(text)
        })
    }
}
