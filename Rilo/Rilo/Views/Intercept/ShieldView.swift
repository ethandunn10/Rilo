import SwiftUI

/// Port of app/src/screens/Shield.jsx — the shield iOS puts up over a
/// blocked app.
///
/// Deliberately bare: a real Screen Time shield can only show a picture, a
/// title, one line of text and two buttons. Anything cleverer has to happen
/// after they tap through to Rilo.
struct ShieldView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        let app = state.currentApp
        let lock = state.lockOf(app)
        let schedule = state.schedule
        let locked = lock.locked
        let mode = lock.setting.mode
        /* the circles only make sense for a Limited app that still has opens */
        let showOpens = mode == .limited && !schedule.locked && !locked

        ZStack {
            SkyView(hills: .mid)

            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        InterceptAppChip(app: app, fill: Color.white.opacity(0.75))

                        /* kind, not mean, when the day is simply over (§7) */
                        RiloView(skin: state.chosenRilo, mood: locked ? "letdown" : "coach", size: 180, talks: true)

                        Text(locked ? "rilo locked \(app)" : "\(app)?")
                            .accessibilityAddTraits(.isHeader)
                            .font(.fredoka(30, 700))
                            .webLineHeight(30, 1.15)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)

                        Text(subline(schedule: schedule, mode: mode, locked: locked))
                            .font(.fredoka(17, 600))
                            .foregroundStyle(RC.ink2)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)

                        /* the same circles as the limit card and the pop-up (§3) */
                        if showOpens {
                            Opens(total: state.totalOpensFor(app), used: state.opensUsedFor(app),
                                  minutes: lock.setting.minutes, align: .center)
                                .padding(.vertical, 9 + 1.5)
                                .padding(.horizontal, 14 + 1.5)
                                .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(Color.white.opacity(0.72)))
                                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .strokeBorder(Color.white.opacity(0.95), lineWidth: 1.5))
                        }

                        Spacer(minLength: 0)

                        Button { state.shieldTalk() } label: {
                            Text("talk to rilo")
                                .font(.fredoka(20, 600))
                                .foregroundStyle(RC.ink)
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                                .background(Capsule().fill(.white))
                                .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30)
                        }
                        .buttonStyle(.tap)

                        Button { state.shieldClose() } label: {
                            Text("close")
                                .font(.fredoka(18, 600))
                                .foregroundStyle(RC.ink)
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(Capsule().fill(Color.white.opacity(0.92)))
                                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                        }
                        .buttonStyle(.tap)
                    }
                    .foregroundStyle(RC.ink)
                    .padding(.top, WebLayout.top(72))
                    .padding(.horizontal, 26)
                    .padding(.bottom, WebLayout.bottom(34 + 14))   // --tail + the column gap
                    .frame(maxWidth: .infinity, minHeight: geo.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
        }
    }

    private func subline(schedule: ScheduleLock, mode: AppMode, locked: Bool) -> String {
        if schedule.locked {
            let at = Addons.fmtClock(schedule.until)
            switch schedule.kind {
            case "bedtime": return "bedtime. open again at \(at)"
            case "school": return "school hours. open again at \(at)"
            default: return "focus block. open again at \(at)"
            }
        }
        if mode == .blocked { return "blocked. your pass still works." }
        if locked { return "no opens left. fresh ones at midnight." }
        return "tap through and i’ll ask what for."
    }
}

/// The app's logo and name in a frosted pill (Shield and Intercept).
struct InterceptAppChip: View {
    let app: String
    var fill: Color = Color.white.opacity(0.7)

    var body: some View {
        HStack(spacing: 8) {
            AppLogo(label: app, size: 24, radius: 8)
                .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(.white))
            Text(app)
                .font(.fredoka(14, 600))
                .foregroundStyle(RC.ink)
        }
        .padding(.vertical, 5 + 1.5)
        .padding(.leading, 6 + 1.5)
        .padding(.trailing, 14 + 1.5)
        .background(Capsule().fill(fill))
        .overlay(Capsule().strokeBorder(.white, lineWidth: 1.5))
        .accessibilityElement(children: .combine)
    }
}
