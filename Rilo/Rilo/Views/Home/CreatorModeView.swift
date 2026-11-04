import SwiftUI

/// Port of app/src/screens/CreatorMode.jsx — a guided, click-through
/// Creator Mode demo. The Instagram view and Reels interception are
/// simulated; iOS cannot inspect Instagram's internal UI.
///   CreatorModeView+Session   the pretend Instagram and Rilo's pop-ups
struct CreatorModeView: View {
    @Environment(AppState.self) var state

    @State var purpose = "post"
    @State var duration: Double? = 10
    @State var now = JS.nowMs
    @State var reelsAttempts = 0
    /// '' | 'nudge' | 'kicked' | 'time-up'
    @State var alert = CreatorModeView.debugAlert
    /// 'task' | 'instagram'
    @State var screen: String? = nil

    /// DEBUG -creatoralert <kind>: open with that pop-up up (screenshots)
    static var debugAlert: String {
        #if DEBUG
        return DemoSeed.arg("-creatoralert") ?? ""
        #else
        return ""
        #endif
    }

    var active: CreatorActive? { state.creator.active }
    var shownScreen: String { screen ?? (active != nil ? "instagram" : "task") }

    var remaining: Int? {
        guard let a = active, let d = a.duration, d != 0 else { return nil }
        return max(0, Int(((a.startedAt + d * 60000 - now) / 1000).rounded(.up)))
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low)
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 12) {
                    BackButton { state.go(.you, dir: .back) }
                    HStack(spacing: 10) {
                        RiloView(skin: state.chosenRilo, mood: "curious", size: 68, talks: true)
                        VStack(alignment: .leading, spacing: 0) {
                            Text("RILO PRO")
                                .font(.inter(11, 700))
                                .tracking(11 * 0.08)
                                .foregroundStyle(RC.ink2)
                            Text("creator mode")
                                .font(.fredoka(28, 700))
                        }
                    }
                    content
                }
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, WebLayout.top(40))
                .padding(.horizontal, 20)
                .padding(.bottom, 64 + 18)
            }
            .scrollBounceBehavior(.basedOnSize)

            if let copy = alertCopy {
                alertView(copy).zIndex(4)
            }

            TabBar(active: "you", skin: state.chosenRilo) { state.go(Screen(rawValue: $0) ?? .you) }
        }
        .task(id: active?.startedAt) {
            guard active?.duration != nil else { return }
            while !Task.isCancelled {
                now = JS.nowMs
                if let r = remaining, r == 0, alert.isEmpty { alert = "time-up" }
                try? await Task.sleep(for: .seconds(1))
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if !state.isPro {
            VStack(spacing: 0) {
                RiloView(skin: "gold", mood: "coach", size: 112)
                Text("Creator Mode is Pro")
                    .font(.fredoka(24, 700))
                    .padding(.vertical, 20)
                Text("Focused Instagram sessions for posting a video or doing research, with Creator time kept separate from your daily goal.")
                    .font(.inter(16, 500))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 16)
                Button { state.go(.upgrade) } label: { primaryLabel("see Rilo Pro") }
                    .buttonStyle(.tap(0.94))
            }
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .creatorCard()
        } else if active != nil && shownScreen == "instagram" {
            instagram
        } else {
            taskPicker
        }
    }

    private var taskPicker: some View {
        Group {
            VStack(alignment: .leading, spacing: 3) {
                Text("today: \(JS.num(state.creatorTodayMinutes)) Creator minutes")
                    .font(.fredoka(18, 600))
                Text("tracked separately from your daily goal")
                    .font(.inter(12, 500))
                    .foregroundStyle(RC.ink3)
            }
            .creatorCard()

            VStack(alignment: .leading, spacing: 10) {
                Text("What are you opening Instagram for?")
                    .font(.fredoka(18, 600))
                HStack(spacing: 8) {
                    option("post a video", purpose == "post") { purpose = "post" }
                    option("research", purpose == "research") { purpose = "research" }
                }
            }
            .creatorCard()

            VStack(alignment: .leading, spacing: 10) {
                Text("How long?")
                    .font(.fredoka(18, 600))
                HStack(spacing: 7) {
                    ForEach([5.0, 10.0, nil] as [Double?], id: \.self) { item in
                        option(item.map { "\(JS.num($0)) min" } ?? "no limit", duration == item) { duration = item }
                    }
                }
            }
            .creatorCard()

            Button(action: start) { primaryLabel("go on Instagram") }
                .buttonStyle(.tap(0.94))

            Text("This demo simulates Instagram. On iPhone, Rilo can limit the whole app; it can\u{2019}t see Reels or pop up over that screen.")
                .font(.inter(12, 600))
                .webLineHeight(12, 1.4)
                .foregroundStyle(Color(hex: "#5A7A64"))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 4)
        }
    }

    private func option(_ title: String, _ selected: Bool, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.fredoka(15, 600))
                .foregroundStyle(selected ? .white : RC.ink)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(Capsule().fill(selected ? RC.ink : .white))
                .overlay(Capsule().strokeBorder(selected ? RC.ink : Color.rgba(18, 48, 26, 0.18), lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    func primaryLabel(_ title: String, light: Bool = false) -> some View {
        Text(title)
            .font(.fredoka(17, 600))
            .foregroundStyle(light ? RC.ink : .white)
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(Capsule().fill(light ? .white : RC.ink))
            .overlay(light ? Capsule().strokeBorder(RC.line, lineWidth: 2) : nil)
    }

    // MARK: actions

    func elapsedMinutes() -> Double {
        guard let a = active else { return 0 }
        let elapsed = max(1, ((JS.nowMs - a.startedAt) / 60000).rounded(.up))
        if let d = a.duration, d != 0 { return min(d, elapsed) }
        return elapsed
    }

    private func start() {
        alert = ""
        reelsAttempts = 0
        screen = "instagram"
        state.startCreatorSession(task: purpose, duration: duration)
    }

    func finish() {
        if let a = active { state.finishCreatorSession(task: a.task, minutes: elapsedMinutes()) }
        alert = ""
        screen = "task"
    }

    func tryReels() {
        if reelsAttempts == 0 {
            reelsAttempts = 1
            alert = "nudge"
        } else {
            reelsAttempts = 2
            alert = "kicked"
        }
    }

    func useNormalLimit() {
        if let a = active { state.creatorUseNormalLimit(task: a.task, minutes: elapsedMinutes()) }
        alert = ""
        screen = "task"
    }
}

extension View {
    /// CreatorMode's card: padding 16, radius 24, 2px ink border, 4px ink drop
    func creatorCard(fill: Color = RC.card, pad: CGFloat = 16) -> some View {
        self
            .padding(pad + 2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .sticker(fill: fill, radius: 24, drop: 4)
    }
}
