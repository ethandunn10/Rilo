import SwiftUI

/// Port of app/src/components/ScheduleAsk.jsx: the few questions Rilo asks
/// before he builds a day. Tap answers only, so it takes about fifteen seconds.
/// DEMO ONLY: the questions and the rules they feed live in MockAI+Day.
struct ScheduleAsk: View {
    var skin: String = "original"
    let onBuild: (ScheduleAnswers) -> Void
    let onCancel: () -> Void

    @State private var step = 0
    /// keyed by question id, like the web's `answers` object
    @State private var answers: [String: [String]] = [:]

    private var questions: [ScheduleQuestion] { MockAI.SCHEDULE_QUESTIONS }
    private var q: ScheduleQuestion { questions[step] }
    private var picked: [String] { answers[q.id] ?? [] }
    private var ready: Bool { !picked.isEmpty }
    private var last: Bool { step == questions.count - 1 }

    private func toAnswers(_ a: [String: [String]]) -> ScheduleAnswers {
        ScheduleAnswers(free: a["free"]?.first, needs: a["needs"], bed: a["bed"]?.first)
    }

    private func choose(_ id: String) {
        if q.multi {
            let now = answers[q.id] ?? []
            answers[q.id] = now.contains(id) ? now.filter { $0 != id } : now + [id]
        } else {
            var next = answers
            next[q.id] = [id]
            answers = next
            if !last { step += 1 } else { onBuild(toAnswers(next)) }
        }
    }

    private func isOn(_ id: String) -> Bool { picked.contains(id) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                RiloView(skin: skin, mood: "curious", size: 62, talks: true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(q.ask)
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(21, 600))
                        .webLineHeight(21, 1.2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(step + 1) of \(questions.count)\(q.multi ? " · pick any" : "")")
                        .accessibilityLabel("question \(step + 1) of \(questions.count)\(q.multi ? ", pick any" : "")")
                        .font(.inter(12, 700))
                        .foregroundStyle(RC.ink2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .layoutPriority(1)
            }

            ChipFlow(spacing: 7) {
                ForEach(q.options, id: \.id) { o in
                    Button { choose(o.id) } label: {
                        Text(o.label)
                            .font(.fredoka(16, 600))
                            .foregroundStyle(isOn(o.id) ? Color.white : RC.ink)
                            .padding(.horizontal, 16 + 2)
                            .frame(minHeight: 46)
                            .background(Capsule().fill(isOn(o.id) ? RC.ink : Color.white))
                            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                    .accessibilityAddTraits(isOn(o.id) ? .isSelected : [])
                }
            }

            if q.multi {
                Button {
                    if last { onBuild(toAnswers(answers)) } else { step += 1 }
                } label: {
                    Text(last ? "build my day" : "next")
                        .font(.fredoka(17, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(Capsule().fill(ready ? RC.ink : Color.rgba(18, 48, 26, 0.25)))
                }
                .buttonStyle(.tap)
                .disabled(!ready)
            }

            Button(action: onCancel) {
                Text("never mind")
                    .font(.fredoka(14, 600))
                    .foregroundStyle(RC.ink2)
                    .padding(4)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.tap)
        }
        .foregroundStyle(RC.ink)
        .padding(16 + 2)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Color.white.opacity(0.94))
            .cssShadow(Color.rgba(10, 40, 20, 0.18), y: 10, blur: 28))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
        .rise(0, distance: 18, duration: 0.4)
    }
}
