import SwiftUI

/// Plan.jsx, the top of the card: plan check, the calendar's week, today's
/// question, the nightly check-in, and who makes the day.
extension PlanView {
    @ViewBuilder
    var cardTop: some View {
        planCheck
        weekAheadBox
        /* today's question, if the plan tab is where it belongs (App.jsx: planAsk ?? homeAsk) */
        if let ask = state.planAsk ?? state.homeAsk {
            AskCard(ask: ask, state: state)
                .id(ask.id)
                .padding(.bottom, 9)
        }
        checkIn
        if asking {
            ScheduleAsk(skin: state.chosenRilo, onBuild: buildWithRilo, onCancel: { asking = false })
        } else {
            whoMakesTheDay
        }
    }

    /// Does the plan add up? The limits are what actually block apps, so a
    /// day planned around them has to fit inside them (§9).
    private var planCheck: some View {
        let check = state.check
        return Button { state.go(.limits) } label: {
            VStack(alignment: .leading, spacing: 3) {
                Text("PLAN CHECK")
                    .font(.inter(11, 700))
                    .tracking(11 * 0.08)
                    .foregroundStyle(check.over ? Color(hex: "#9FD8A9") : RC.ink2)
                Text(Limits.planCheckLine(check, Plan.fmtMins))
                    .font(.fredoka(15, 600))
                    .webLineHeight(15, 1.35)
                    .fixedSize(horizontal: false, vertical: true)
                Text("tap to change your limits")
                    .font(.inter(12, 600))
                    .foregroundStyle(check.over ? Color(hex: "#C9E6CE") : RC.ink3)
            }
            .foregroundStyle(check.over ? Color.white : RC.ink)
            .multilineTextAlignment(.leading)
            .padding(.vertical, 11)
            .padding(.horizontal, 13)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(check.over ? RC.ink : Color.rgba(18, 48, 26, 0.06)))
        }
        .buttonStyle(.tap)
        .padding(.vertical, 8)
    }

    /// what the calendar means for the week
    @ViewBuilder
    private var weekAheadBox: some View {
        let week = state.weekAhead
        if !week.isEmpty {
            VStack(alignment: .leading, spacing: 5) {
                Text("FROM YOUR CALENDAR")
                    .font(.inter(11, 700))
                    .tracking(11 * 0.08)
                    .foregroundStyle(RC.ink2)
                ForEach(Array(week.prefix(3).enumerated()), id: \.offset) { _, w in
                    Text(w.why)
                        .font(.inter(13, 600))
                        .webLineHeight(13, 1.35)
                        .foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.rgba(18, 48, 26, 0.06)))
            .padding(.bottom, 8)
        }
    }

    /// rilo's nightly check-in (pro; free sees it, locked)
    @ViewBuilder
    private var checkIn: some View {
        let isPro = state.isPro
        let due = state.checkInDue
        let checked = state.checkedInToday
        if state.canCheckIn || !isPro {
            Button { state.go(isPro ? .nightcheckin : .upgrade) } label: {
                HStack(spacing: 10) {
                    Text("🌙").font(.system(size: 20))
                    VStack(alignment: .leading, spacing: 0) {
                        Text(checked ? "checked in" : "check in with rilo")
                            .font(.fredoka(16, 600))
                        Text(!isPro ? "thirty seconds before bed, and tomorrow is planned"
                             : checked ? "tomorrow is planned"
                             : due ? "30 seconds, then bed" : "how today went")
                            .font(.inter(11.5, 600))
                            .opacity(due ? 0.85 : 0.6)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    if !isPro { ProBadge() }
                    if isPro && due && !checked {
                        Circle().fill(Color(hex: "#FFD43B")).frame(width: 9, height: 9)
                    }
                }
                .foregroundStyle(due ? Color.white : RC.ink)
                .multilineTextAlignment(.leading)
                .padding(.vertical, 10 + 1.5)
                .padding(.horizontal, 14 + 1.5)
                .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(due ? Color(hex: "#2B3A6B") : RC.card))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(Color.rgba(18, 48, 26, 0.12), lineWidth: 1.5))
            }
            .buttonStyle(.tap)
            .padding(.bottom, 9)
        }
    }

    /// who makes the day
    private var whoMakesTheDay: some View {
        VStack(spacing: 9) {
            Button {
                editing = false
                asking = true
            } label: {
                PlanBigButton(title: "let rilo make your schedule", sub: "he'll ask a couple of things first", primary: true)
            }
            .buttonStyle(.tap(0.94))

            if !editing {
                Button { editing = true } label: {
                    PlanBigButton(title: "edit the schedule", sub: "change what you already have", primary: false)
                }
                .buttonStyle(.tap(0.94))
            }

            Button(action: startOwn) {
                PlanBigButton(title: "make your own", sub: "start from nothing and add as you go", primary: false)
            }
            .buttonStyle(.tap(0.94))
        }
        .padding(.bottom, 4)
    }
}

/// Plan.jsx `bigBtn` + `bigSub`
struct PlanBigButton: View {
    let title: String
    let sub: String
    let primary: Bool

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 24, style: .continuous)
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.fredoka(20, 600))
            Text(sub)
                .font(.inter(12.5, 600))
                .opacity(primary ? 0.78 : 0.68)
        }
        .foregroundStyle(primary ? Color.white : RC.ink)
        .multilineTextAlignment(.leading)
        .padding(.vertical, 12)
        .padding(.horizontal, primary ? 18 : 20)
        .frame(maxWidth: .infinity, minHeight: 68, alignment: .leading)
        .modifier(PlanBigSurface(primary: primary, shape: shape))
    }
}

private struct PlanBigSurface: ViewModifier {
    let primary: Bool
    let shape: RoundedRectangle
    func body(content: Content) -> some View {
        if primary {
            content
                .background(shape.fill(RC.ink).cssShadow(Color.rgba(10, 40, 20, 0.3), y: 8, blur: 22))
        } else {
            content.sticker(fill: Color.white.opacity(0.92), radius: 24, border: RC.ink, drop: 4)
        }
    }
}
