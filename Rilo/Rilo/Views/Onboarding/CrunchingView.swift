import SwiftUI

/// Port of app/src/screens/Crunching.jsx: the beat between allowing
/// Screen Time and seeing the damage. 1.5s, then crunchingDone().
struct CrunchingView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        ZStack {
            SkyView(hills: .low)
            VStack(spacing: 18) {
                RiloView(skin: AppState.OG_SKIN, mood: "curious", size: 190, talks: true)
                Text("rilo's crunching your numbers…")
                    .font(.fredoka(26, 600))
                    .foregroundStyle(RC.ink)
                    .multilineTextAlignment(.center)
                CrunchDots()
            }
            .padding(24)
        }
        .task {
            /* one timer for the life of the screen */
            try? await Task.sleep(for: .milliseconds(1500))
            guard !Task.isCancelled else { return }
            #if DEBUG
            if DemoSeed.arguments.contains("-hold") { return }
            #endif
            state.crunchingDone()
        }
    }
}

/// three ink dots doing the `splash-dot` bounce (1.1s, 0.15s apart)
struct CrunchDots: View {
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { i in
                    let p = Motion.phase(t, period: 1.1, delay: Double(i) * 0.15)
                    let k = Motion.keyframes([(0, 0), (0.4, 1), (1, 0)], p, ease: Motion.easeInOut)
                    Circle()
                        .fill(RC.ink)
                        .frame(width: 11, height: 11)
                        .offset(y: reduce ? 0 : -6 * k)
                        .opacity(reduce ? 1 : 0.45 + 0.55 * k)
                }
            }
        }
    }
}
