import SwiftUI

/// Plan.jsx, the day itself (rows, editable while `editing`) and the
/// "done" bar docked above the tab bar while editing.
///
/// The web's rowStyle/dotStyle also have "done"/"now" looks, but no row
/// ever carries a status (ROWS drops it and riloSchedule never sets one),
/// so every row is the plain one with the hollow dot.
extension PlanView {
    var dayRows: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.offset) { i, row in
                rowView(i, row)
                    .rise(0.05 + Double(i) * 0.05, distance: 14, duration: 0.4)
            }
        }
        .tourTarget("plan-day")
    }

    private func rowView(_ i: Int, _ row: ScheduleRow) -> some View {
        HStack(alignment: .center, spacing: 10) {
            Group {
                if editing {
                    PlanCell(text: Binding(get: { row.at }, set: { editRow(i, \.at, $0) }))
                } else {
                    Text(row.at)
                        .font(.fredoka(15, 600))
                        .foregroundStyle(RC.ink3)
                }
            }
            .frame(width: 44, alignment: .leading)

            Circle()
                .strokeBorder(Color(hex: "#7FA38A"), lineWidth: 2.5)
                .frame(width: 14, height: 14)

            VStack(alignment: .leading, spacing: 1) {
                if editing {
                    PlanCell(text: Binding(get: { row.title }, set: { editRow(i, \.title, $0) }))
                    PlanCell(text: Binding(get: { row.note }, set: { editRow(i, \.note, $0) }),
                             placeholder: "what happens to your apps", size: 12)
                } else {
                    Text(row.title)
                        .font(.fredoka(17, 600))
                        .fixedSize(horizontal: false, vertical: true)
                    Text(row.note)
                        .font(.inter(12, 600))
                        .foregroundStyle(RC.ink3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if editing {
                Button { removeRow(i) } label: {
                    Text("×")
                        .font(.inter(15, 700))
                        .foregroundStyle(RC.ink)
                        .frame(width: 28, height: 28)
                        .overlay(Circle().strokeBorder(RC.ink, lineWidth: 2))
                }
                .buttonStyle(.plainTap)
                .accessibilityLabel("Remove \(row.title)")
            }
        }
        .padding(.vertical, 9)
    }

    var doneBar: some View {
        HStack(spacing: 9) {
            Button(action: addRow) {
                Text("+ add something")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(Capsule().fill(RC.card))
                    .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.4),
                                                    style: StrokeStyle(lineWidth: 2, dash: [6, 4])))
            }
            .buttonStyle(.tap)

            Button { editing = false } label: {
                Text("done")
                    .font(.fredoka(19, 600))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .background(Capsule().fill(RC.ink).cssShadow(Color.rgba(10, 40, 20, 0.3), y: 8, blur: 22))
            }
            .buttonStyle(.tap(0.94))
        }
        .padding(.top, 11 + 1.5)
        .padding(.bottom, 13)
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity)
        .background(
            Rectangle().fill(RC.card)
                .overlay(alignment: .top) { Rectangle().fill(Color.rgba(18, 48, 26, 0.10)).frame(height: 1.5) }
                .cssShadow(Color.rgba(10, 40, 20, 0.10), y: -6, blur: 18)
        )
    }
}

/// Plan.jsx `cellInput`: the little inputs a row turns into while editing
struct PlanCell: View {
    @Binding var text: String
    var placeholder = ""
    var size: CGFloat = 15

    var body: some View {
        TextField("", text: $text, prompt: Text(placeholder).foregroundStyle(Color.rgba(18, 48, 26, 0.4)))
            .font(.fredoka(size, 600))
            .foregroundStyle(RC.ink)
            .padding(.horizontal, 8 + 1.5)
            .frame(height: 26)
            .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                .strokeBorder(Color.rgba(18, 48, 26, 0.35), lineWidth: 1.5))
    }
}
