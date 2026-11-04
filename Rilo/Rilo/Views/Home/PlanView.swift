import SwiftUI

/// Port of app/src/screens/Plan.jsx (exact port of designs/Plan.dc.html).
/// The card's top half is PlanView+Card.swift, the day's rows and the
/// docked "done" bar are PlanView+Rows.swift.
struct PlanView: View {
    @Environment(AppState.self) var state

    /// App.jsx always passes locked={false}: the plan is free. The blurred
    /// pro overlay is still ported (PlanLockedOverlay) so the branch exists.
    var locked = false

    @State var editing = DemoSeed.flag("-planedit")
    /// rilo asks a few things before he builds anything
    @State var asking = DemoSeed.flag("-planask")

    /// the design's day, the fallback so the screen is never empty
    static let ROWS: [(String, String, String)] = [
        ("3:15", "chill + snack", "15 min free scroll allowed"),
        ("3:45", "ap bio homework", "apps locked for 45 min"),
        ("4:30", "shoot 50 free throws", "up next · +40 xp"),
        ("5:15", "film 2 videos", "creator mode on"),
        ("6:30", "dinner", "phone away"),
        ("7:30", "ap gov review", "apps locked for 40 min"),
        ("9:00", "free time", "30 min scroll allowed"),
    ]

    // MARK: rows + actions (same rules as the web)

    var schedule: SchedulePlan { state.schedulePlan }

    /// Rilo's version until they make their own
    var rows: [ScheduleRow] {
        let blank = schedule.mode == "own" && schedule.rows.isEmpty
        if !schedule.rows.isEmpty { return schedule.rows }
        return blank ? [] : Self.ROWS.map { ScheduleRow(at: $0.0, title: $0.1, note: $0.2) }
    }

    func buildWithRilo(_ answers: ScheduleAnswers) {
        state.schedulePlan = SchedulePlan(mode: "rilo", rows: MockAI.riloSchedule(
            hobbies: state.profileList("hobby"), goals: state.profileList("goal"),
            school: state.school, bedtime: state.bedtime, scrollMins: Double(state.goalMins), answers: answers))
        asking = false
        editing = false
    }

    /// "make your own" starts empty on purpose: nothing to delete first
    func startOwn() {
        state.schedulePlan = SchedulePlan(mode: "own", rows: [])
        asking = false
        editing = true
    }

    func editRow(_ i: Int, _ key: WritableKeyPath<ScheduleRow, String>, _ value: String) {
        var next = rows
        guard next.indices.contains(i) else { return }
        next[i][keyPath: key] = value
        state.schedulePlan = SchedulePlan(mode: "own", rows: next)
    }

    func removeRow(_ i: Int) {
        var next = rows
        guard next.indices.contains(i) else { return }
        next.remove(at: i)
        state.schedulePlan = SchedulePlan(mode: "own", rows: next)
    }

    func addRow() {
        state.schedulePlan = SchedulePlan(mode: "own", rows: rows + [ScheduleRow(at: "8:00", title: "something", note: "")])
    }

    // MARK: body

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low).ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 12) {
                    header
                    card
                }
                .padding(.horizontal, 20)
                .padding(.top, WebLayout.top(52))
                /* while editing, clear the docked "done" bar as well as the tab bar */
                .padding(.bottom, WebLayout.bottom(editing ? 206 : 128))
            }
            .defaultScrollAnchor(DemoSeed.flag("-planbottom") ? .bottom : .top)
            .tourScrollable()
            .foregroundStyle(RC.ink)

            VStack(spacing: 0) {
                /* docked above the tab bar, clear of everything it used to cover */
                if editing { doneBar }
                TabBar(active: "plan", skin: state.chosenRilo) { name in
                    if let s = Screen(rawValue: name) { state.go(s) }
                }
            }

            if locked { PlanLockedOverlay() }
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text("today's plan")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(30, 700))
                    Text("pro")
                        .font(.fredoka(12, 600))
                        .foregroundStyle(.white)
                        .padding(.vertical, 3)
                        .padding(.horizontal, 9)
                        .background(Capsule().fill(RC.ink))
                        .accessibilityLabel("rilo pro")
                }
                Text("made by rilo from your goals")
                    .font(.inter(14, 600))
                    .foregroundStyle(RC.ink2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            RiloView(skin: state.chosenRilo, mood: "proud", size: 74, talks: true)
        }
        .rise(0, distance: 14, duration: 0.4)
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 0) {
            cardTop
            dayRows
            if rows.isEmpty {
                Text(editing ? "empty. add your first thing below." : "nothing here yet.")
                    .font(.inter(14, 600))
                    .foregroundStyle(RC.ink3)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
        }
        .padding(.vertical, 6 + 2)      // css border sits outside the padding
        .padding(.horizontal, 16 + 2)
        .sticker(fill: RC.card, radius: 26, drop: 4)
    }
}

/// today's plan is rilo pro: free sees it, blurred, with the way in
struct PlanLockedOverlay: View {
    @Environment(AppState.self) private var state

    var body: some View {
        ZStack(alignment: .topLeading) {
            Rectangle().fill(.ultraThinMaterial).ignoresSafeArea()
            Color.white.opacity(0.45).ignoresSafeArea()
            VStack(spacing: 8) {
                RiloView(skin: "gold", mood: "coach", size: 140)
                Text("today's plan")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(26, 600))
                    .foregroundStyle(RC.ink)
                Text("your day, built around your goals")
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink2)
                Button { state.go(.upgrade) } label: {
                    Text("try rilo pro free")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(.white)
                        .padding(.vertical, 9)
                        .padding(.horizontal, 18)
                        .background(Capsule().fill(RC.ink))
                }
                .buttonStyle(.tap(0.94))
                .padding(.top, 4)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            BackButton { state.go(.home, dir: .back) }
                .padding(.top, 12)
                .padding(.leading, 16)
        }
        .accessibilityLabel("Rilo Pro plan")
    }
}
