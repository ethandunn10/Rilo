import SwiftUI

/// Port of app/src/screens/Buddies.jsx — buddy mode. Invite codes only: no
/// profiles, no search, nobody can look you up. Friends see your Rilo's
/// mood and your streak, never your hours.
/// DEMO ONLY: codes and friends are local (MockAI.makeInviteCode,
/// DEMO_FRIENDS, NUDGE_LINES).
struct BuddiesView: View {
    @Environment(AppState.self) private var state

    @State private var join = ""
    @State private var said = BuddiesView.initialSaid

    /// DEBUG -buddysaid <text>: the line under the invite card (screenshots)
    private static var initialSaid: String {
        #if DEBUG
        return DemoSeed.arg("-buddysaid") ?? ""
        #else
        return ""
        #endif
    }

    static let MAX_FRIENDS = 3

    static let MOOD_WORD: [String: String] = [
        "proud": "doing great",
        "coach": "hanging in",
        "curious": "close to the line",
        "letdown": "had a rough one",
        "angry": "way over",
        "sleepy": "asleep",
        "wave": "just started",
    ]

    private var friends: [Friend] { state.buddies.friends }
    private var full: Bool { friends.count >= Self.MAX_FRIENDS }

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low).ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("buddies")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(30, 700))
                    Text("they see your rilo and your streak. never your hours.")
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)

                    /* you */
                    personRow(skin: state.chosenRilo, mood: state.riloMood, size: 64, talks: true,
                              name: "you", streak: state.streak) { EmptyView() }

                    inviteCard

                    if !said.isEmpty {
                        Text(said)
                            .font(.inter(13, 700))
                            .foregroundStyle(ProgressScreenView.deepGreen)
                    }

                    /* friends */
                    ForEach(friends) { f in
                        personRow(skin: f.skin, mood: f.mood, size: 60, talks: false, name: f.name, streak: f.streak) {
                            Button { nudge(f.id) } label: {
                                Text(f.nudged ? "nudged" : "nudge")
                                    .font(.fredoka(15, 600))
                                    .foregroundStyle(f.nudged ? .white : RC.ink)
                                    .padding(.horizontal, 14 + 2)
                                    .frame(minHeight: 42)
                                    .background(Capsule().fill(f.nudged ? RC.ink : .white))
                                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                            }
                            .buttonStyle(.tap)
                        }
                    }

                    if friends.isEmpty {
                        Text("nobody yet. send someone your code, or type theirs.")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, WebLayout.top(48))
                /* --tail: calc(104px + safe-bottom) */
                .padding(.bottom, WebLayout.bottom(104))
            }
            .scrollDismissesKeyboard(.interactively)
            .foregroundStyle(RC.ink)

            TabBar(active: "you", skin: state.chosenRilo) { name in
                if let s = Screen(rawValue: name) { state.go(s) }
            }
            .ignoresSafeArea(.keyboard)
        }
    }

    // MARK: pieces

    private func card<C: View>(@ViewBuilder _ content: () -> C) -> some View {
        content()
            .padding(14 + 2)   // css border sits outside the padding
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(Color.white.opacity(0.82)))
            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
    }

    private func personRow<T: View>(skin: String, mood: String, size: CGFloat, talks: Bool, name: String,
                                    streak: Int, @ViewBuilder trailing: () -> T) -> some View {
        card {
            HStack(spacing: 10) {
                RiloView(skin: skin, mood: mood, size: size, talks: talks)
                VStack(alignment: .leading, spacing: 2) {
                    Text(name)
                        .font(.fredoka(18, 600))
                    Text("\(Self.MOOD_WORD[mood] ?? "getting there") · \(streak) day streak")
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                }
                .accessibilityElement(children: .combine)
                .frame(maxWidth: .infinity, alignment: .leading)
                trailing()
            }
        }
    }

    private var inviteCard: some View {
        card {
            VStack(alignment: .leading, spacing: 10) {
                Text("your invite code")
                    .font(.fredoka(18, 600))
                    .accessibilityAddTraits(.isHeader)
                if !state.buddies.code.isEmpty {
                    Text(state.buddies.code)
                        .speechSpellsOutCharacters()
                        .font(.fredoka(34, 700))
                        .tracking(34 * 0.18)
                        .foregroundStyle(ProgressScreenView.deepGreen)
                } else {
                    Button(action: makeCode) {
                        Text("make a code")
                            .font(.fredoka(16, 600))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 46)
                            .background(Capsule().fill(RC.ink))
                    }
                    .buttonStyle(.tap)
                }

                Text("or type a friend's code (\(friends.count) of \(Self.MAX_FRIENDS))")
                    .font(.inter(12, 600))
                    .foregroundStyle(RC.ink2)

                HStack(spacing: 8) {
                    TextField("", text: $join, prompt: Text("ABC123").foregroundStyle(Color(hex: "#757575")))
                        .font(.fredoka(17, 600))
                        .tracking(1.7)
                        .foregroundStyle(RC.ink)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .accessibilityLabel("a friend's code")
                        .onChange(of: join) { _, v in
                            let next = String(v.uppercased().prefix(6))
                            if next != v { join = next }
                        }
                        .padding(.horizontal, 16 + 2)
                        .frame(height: 46)
                        .background(Capsule().fill(.white))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                    Button(action: addFriend) {
                        Text("join")
                            .font(.fredoka(16, 600))
                            .foregroundStyle(RC.ink)
                            .padding(.horizontal, 18 + 2)
                            .frame(minHeight: 46)
                            .background(Capsule().fill(full ? Color.white.opacity(0.5) : .white))
                            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                    .disabled(full)
                }
            }
        }
    }

    // MARK: actions (same as the web)

    private func makeCode() {
        state.buddies.code = MockAI.makeInviteCode()
    }

    private func addFriend() {
        let typed = join.trimmingCharacters(in: .whitespaces).uppercased()
        guard !typed.isEmpty, !full else { return }
        /* DEMO ONLY: any code works and hands back a scripted friend */
        guard var next = MockAI.DEMO_FRIENDS.first(where: { f in !friends.contains { $0.id == f.id } }) else { return }
        next.code = typed
        state.buddies.friends = friends + [next]
        join = ""
        said = "\(next.name) is in."
    }

    private func nudge(_ id: String) {
        state.buddies.friends = friends.map { f in
            var f = f
            if f.id == id { f.nudged = true }
            return f
        }
        said = MockAI.NUDGE_LINES.randomElement() ?? ""
    }
}
