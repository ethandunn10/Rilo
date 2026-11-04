import SwiftUI

/// Port of app/src/screens/Talk.jsx in mode="chat" (the only mode App.jsx
/// still renders): from Home, tap Rilo's chat badge. Tell him anything new —
/// a hobby, a goal — and he adds it. Typed, with tappable quick answers; the
/// onboarding questions that used to run through here are gone on the web.
///
/// Voice: the mic button shows when `SpeechInput` is available (real
/// on-device speech-to-text; DEBUG `-voice` fakes it). Hold it to talk, the
/// words stream into the field, letting go sends them. No speech (or a "no"
/// to the mic) → typing only, like the web.
///
/// DEBUG launch args (with `-screen talkchat`):
///   -talkpick "soccer,gym"   chips already tapped
///   -talkdraft "and guitar"  text already in the field
///   -talksay "a|b"           send these, one after another, on launch
///   -voice [-listening]      show the mic (and start listening at once)
struct TalkView: View {
    @Environment(AppState.self) var state
    @Environment(\.riloTheme) private var theme

    /* roughly how long one of his lines takes to land */
    static func speakMs(_ line: String) -> Int { min(1600, 450 + line.count * 16) }

    static let ASK = "what's new? tell me a hobby, a goal, anything."
    static let NUDGE = "try me. a hobby, a goal, anything."
    static let PLACEHOLDER = "tell rilo anything…"
    /* tappable answers: four hobbies and three goals */
    static let QUICK = Array(Profile.HOBBIES.prefix(4)) + Array(Profile.GOALS.prefix(3))

    @State var bubble = TalkView.ASK
    @State var mood = "curious"
    @State var speaking = true
    @State var thinking = false
    @State var draft = ""
    /* quick answers tapped but not sent yet */
    @State var picked: [String] = []
    @State var listening = false
    /* he only pushes back on a shrug once */
    @State var nudged = false
    @State var timers: [Task<Void, Never>] = []
    /* the last few back-and-forths, so his brain can follow along */
    @State var chat: [ChatLine] = []
    @State var speech: SpeechInput = Speech.make(demoLines: ["i want to get into guitar and sleep more"])

    var ready: Bool { !picked.isEmpty || !draft.trimmingCharacters(in: .whitespaces).isEmpty }

    var stageState: RiloStage.StageState {
        listening ? .listening : speaking || thinking ? .talking : .idle
    }

    var body: some View {
        ZStack {
            theme.skyGradient.ignoresSafeArea()
            ThemeDecor()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    topRow
                    bubbleView.padding(.top, 12)
                    RiloStage(skin: state.chosenRilo, mood: mood, size: 210, state: stageState) {
                        if !speaking && !thinking && !listening { riloSays(bubble) }
                    }
                    .padding(.top, 2)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, WebLayout.top(54))
                .padding(.horizontal, 22)
                .padding(.bottom, 10)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { composer }
        .onAppear(perform: appear)
        .onDisappear {
            timers.forEach { $0.cancel() }
            if listening { speech.stop() }
        }
    }

    private var topRow: some View {
        HStack {
            Button(action: finish) {
                Text("done")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(RC.ink)
                    .padding(.horizontal, 14)
                    .frame(height: 36)
                    .capsuleSticker(fill: RC.card, drop: 3)
            }
            .buttonStyle(.tap)
            Spacer()
            Color.clear.frame(width: 64, height: 1)
        }
        .frame(minHeight: 36)
    }

    /* Rilo's line */
    private var bubbleView: some View {
        ShrinkToFit {
            Text(thinking ? "…" : bubble)
                .accessibilityLabel(thinking ? "rilo is thinking" : bubble)
                .font(.fredoka(22, 600))
                .webLineHeight(22, 1.2)
                .foregroundStyle(RC.ink)
                .multilineTextAlignment(.center)
        }
            .padding(.vertical, 14)
            .padding(.horizontal, 18)
            .sticker(fill: RC.card, radius: 22, drop: 4)
            .overlay(alignment: .bottom) { BubbleTail().offset(x: 1, y: 8) }
            .frame(maxWidth: 360)   // 320 content-box + padding + border
            .fixedSize(horizontal: false, vertical: true)
            .bubbleIn()
            .id(bubble)
    }

    func finish() { state.go(.home, dir: .back) }

    // MARK: timers

    func later(_ ms: Int, _ fn: @escaping () -> Void) {
        let t = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(ms))
            if !Task.isCancelled { fn() }
        }
        timers.append(t)
    }

    func riloSays(_ line: String, _ m: String? = nil) {
        bubble = line
        if let m { mood = m }
        speaking = true
        later(Self.speakMs(line)) { speaking = false }
    }

    private func appear() {
        /* settles the opening line once, on mount */
        later(1100) { speaking = false }
        /* get the on-device model loaded before they type */
        state.brain.prewarm(context: state.brainContext)
        #if DEBUG
        if let p = DemoSeed.arg("-talkpick") {
            picked = p.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        }
        if let d = DemoSeed.arg("-talkdraft") { draft = d }
        if let say = DemoSeed.arg("-talksay") {
            for (i, line) in say.split(separator: "|").enumerated() {
                later(400 + i * 3200) { answer(String(line), asTyped: true) }
            }
        }
        if DemoSeed.flag("-listening") { later(300) { startMic() } }
        #endif
    }

    // MARK: answering

    func choose(_ label: String) {
        if let i = picked.firstIndex(of: label) { picked.remove(at: i) } else { picked.append(label) }
    }

    /* everything they've chosen, in one answer. Picks skip the shrug nudge;
       anything they typed themselves still gets it. */
    func send() {
        guard ready else { return }
        let all = (picked + [draft.trimmingCharacters(in: .whitespaces)]).filter { !$0.isEmpty }
            .joined(separator: ", ")
        answer(all, asTyped: !picked.isEmpty)
    }

    func answer(_ raw: String, asTyped: Bool = false) {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        /* one at a time: wait for his answer */
        guard !text.isEmpty, !thinking else { return }

        /* "maybe" isn't an answer — ask again, but only once */
        if !asTyped && Listen.isNonAnswer(text) && !nudged {
            nudged = true
            draft = ""
            riloSays(Self.NUDGE, "coach")
            return
        }

        thinking = true
        draft = ""
        picked = []
        track("talk", "chat")

        /* his brain: Apple's on-device model, or the scripted one (RiloBrain) */
        let context = state.brainContext
        let history = Array(chat.suffix(6))
        let usedModel = state.brain.usesModel
        let ask = Task { @MainActor in
            let turn = await state.brain.chat(text, history: history, context: context)
            guard !Task.isCancelled else { return }
            state.learn(turn)
            chat.append(ChatLine(you: text, rilo: turn.reply))
            if chat.count > 6 { chat.removeFirst(chat.count - 6) }
            later(220) {
                thinking = false
                riloSays(turn.reply, turn.mood)
                /* he asked them something: leave the question up */
                if usedModel && turn.reply.contains("?") { return }
                later(min(1500, 550 + turn.reply.count * 14)) {
                    #if DEBUG
                    /* screenshots: keep his reply on screen */
                    if DemoSeed.flag("-talkreply") { return }
                    #endif
                    riloSays("anything else? or tap done.", "coach")
                }
            }
        }
        timers.append(ask)
    }

    // MARK: voice (only when SpeechInput is available)

    func startMic() {
        guard speech.isAvailable, !listening, !thinking else { return }
        listening = true
        speaking = false
        mood = "coach"
        speech.start(onPartial: { draft = $0 }, onFinal: { heard in
            listening = false
            let said = heard.trimmingCharacters(in: .whitespaces)
            if said.isEmpty { return }
            draft = ""
            answer(said)
        })
    }

    func stopMic() { speech.stop() }
}

/// The little square under the bubble, turned 45° so its right and bottom
/// borders make the point. Web: 16x16 content + 2px right/bottom borders.
struct BubbleTail: View {
    var fill: Color = RC.card
    var line: Color = RC.line

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Rectangle().fill(fill)
            Path { p in
                p.move(to: CGPoint(x: 17, y: 0))
                p.addLine(to: CGPoint(x: 17, y: 17))
                p.addLine(to: CGPoint(x: 0, y: 17))
            }
            .stroke(line, lineWidth: 2)
        }
        .frame(width: 18, height: 18)
        .rotationEffect(.degrees(45))
        .accessibilityHidden(true)
    }
}
