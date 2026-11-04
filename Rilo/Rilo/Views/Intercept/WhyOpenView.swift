import SwiftUI

/// Port of app/src/screens/WhyOpen.jsx — "what are you opening this for?",
/// the check-in before a session (§4).
///
/// They say why, then pick how long: quick (half an open) or full (one
/// open), using the app's own numbers. With only half an open left, only
/// quick is on offer (§2.5). In strict mode halves are off, so only full is.
struct WhyOpenView: View {
    @Environment(AppState.self) private var state
    @State private var reason = ""
    @State private var why = ""
    /// 'reason' -> 'push' (or 'what' for posting) -> 'length'
    @State private var stage = "reason"
    @State private var length: String? = nil

    /// "7.5 min" reads better than "7.5m"; a whole number loses the .0
    static func mins(_ n: Double) -> String { "\(JS.num(JS.round(n * 10) / 10)) min" }

    var body: some View {
        let app = state.currentApp
        let setting = state.settingOf(app)
        let minutes = setting.minutes
        let opensLeft = state.whyOpenOpensLeft
        let strictOn = state.strict.on

        /* which lengths are actually on offer */
        let half = Limits.halfOf(minutes)
        let canFull = opensLeft >= 1
        let canQuick = !strictOn && opensLeft >= 0.5
        /* default to whatever's available — full if they have it, else quick */
        let initial = canFull && strictOn ? "full" : canQuick ? "quick" : "full"
        let chosen = length ?? initial
        let picked = chosen == "quick" && canQuick ? "quick" : "full"
        let capMins = picked == "quick" ? half : Double(minutes)
        let cost: Double = picked == "quick" ? 0.5 : 1

        /* "something else" and "need to post" both have to be described */
        let needsWords = reason == "custom" || reason == "post"
        let trimmed = why.trimmingCharacters(in: .whitespacesAndNewlines)
        let ready = !reason.isEmpty && (!needsWords || !trimmed.isEmpty) && stage == "length"

        ZStack {
            SkyView(hills: .mid)

            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 11) {
                        HStack(spacing: 10) {
                            RiloView(skin: state.chosenRilo, mood: "curious", size: 88, talks: true)
                            Text("what are you opening \(app) for?")
                                .font(.fredoka(25, 700))
                                .webLineHeight(25, 1.1)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        /* what's left, in the same circles as everywhere else (§3) */
                        Opens(total: state.totalOpensFor(app), used: state.opensUsedFor(app), minutes: minutes)
                            .padding(.vertical, 10 + 2)
                            .padding(.horizontal, 14 + 2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .fill(Color.white.opacity(0.72)))
                            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .strokeBorder(Color.white.opacity(0.95), lineWidth: 2))

                        switch stage {
                        case "reason":
                            WhyOpenReasons(selected: reason) { r in
                                if r.id == "bored" || r.id == "tired" {
                                    state.whyOpenFeeling(r.id)
                                    return
                                }
                                reason = r.id
                                /* posting is the one he doesn't argue with — but he does ask what */
                                stage = r.id == "post" ? "what" : "push"
                            }
                        case "what":
                            WhyOpenWhat(reason: reason, why: $why) { stage = "length" }
                        case "push":
                            if let argument = MockAI.pushBack(reason: reason, app: app,
                                                              hobbies: state.profileList("hobby"),
                                                              goals: state.profileList("goal"),
                                                              schedule: state.schedulePlan.rows,
                                                              nowMins: state.nowMins) {
                                WhyOpenPush(app: app, argument: argument,
                                            onInstead: { state.whyOpenInstead($0) },
                                            onAnyway: { stage = reason == "custom" ? "what" : "length" })
                            }
                        default:
                            WhyOpenLength(picked: picked, half: half, minutes: minutes, canQuick: canQuick,
                                          canFull: canFull, strictOn: strictOn) { length = $0 }
                        }

                        Spacer(minLength: 6)

                        if stage == "length" {
                            HStack(spacing: 10) {
                                AppLogo(label: app, size: 44, radius: 12)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                Button {
                                    state.startCheckedIn(app, CheckinPick(reason: reason, why: trimmed,
                                                                          mins: capMins, length: picked, cost: cost))
                                } label: {
                                    Text(ready ? "open for \(Self.mins(capMins))" : "pick a reason")
                                        .font(.fredoka(18, 600))
                                        .foregroundStyle(ready ? RC.ink : RC.ink.opacity(0.45))
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 56)
                                        .background(Capsule().fill(ready ? Color.white : Color.white.opacity(0.45)))
                                        .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30)
                                }
                                .buttonStyle(.tap)
                                .disabled(!ready)
                            }
                        }

                        Button { state.whyOpenNevermind() } label: {
                            Text("never mind")
                                .font(.fredoka(16, 600))
                                .foregroundStyle(.white)
                                .padding(8)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.tap)
                    }
                    .foregroundStyle(RC.ink)
                    .padding(.top, WebLayout.top(44))
                    .padding(.horizontal, 22)
                    .padding(.bottom, WebLayout.bottom(26 + 11))   // --tail + the column gap
                    .frame(maxWidth: .infinity, minHeight: geo.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
                .scrollDismissesKeyboard(.interactively)
            }
        }
        .onAppear(perform: debugStart)
    }

    /// DEBUG: -whyreason <id> picks a reason, -whystage <stage> jumps to it,
    /// -whylength quick|full picks the length, -why <text> fills the words.
    private func debugStart() {
        #if DEBUG
        if let r = DemoSeed.arg("-whyreason") { reason = r; stage = r == "post" ? "what" : "push" }
        if let s = DemoSeed.arg("-whystage") { stage = s }
        if let l = DemoSeed.arg("-whylength") { length = l }
        if let w = DemoSeed.arg("-why") { why = w }
        #endif
    }
}
