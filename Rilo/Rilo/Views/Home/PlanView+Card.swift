import SwiftUI

/// The top of the plan card, kept simple on purpose: only the three ways to
/// make the day (rilo makes it, edit it, make your own). The plan check and
/// the calendar notes were cut from here; the nightly check-in moved to
/// Rilo's box on home. Rilo's question of the day (first week only) sits
/// under the buttons until it's answered.
extension PlanView {
    @ViewBuilder
    var cardTop: some View {
        if asking {
            ScheduleAsk(skin: state.chosenRilo, onBuild: buildWithRilo, onCancel: { asking = false })
        } else if building {
            HStack(spacing: 10) {
                RiloView(skin: state.chosenRilo, mood: "curious", size: 54)
                    .accessibilityHidden(true)
                Text("making your day…")
                    .font(.fredoka(18, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.vertical, 12)
        } else {
            whoMakesTheDay
        }
        /* today's question, if the plan tab is where it belongs (App.jsx: planAsk ?? homeAsk) */
        if let ask = state.planAsk ?? state.homeAsk {
            AskCard(ask: ask, state: state)
                .id(ask.id)
                .padding(.vertical, 6)
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
        .padding(.top, 8)
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
