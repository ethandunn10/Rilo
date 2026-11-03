import Foundation

/// Port of app/src/lib/track.js — test tracking. Logs every tracked tap to
/// the console AND keeps a running count in UserDefaults (same key the web
/// used in localStorage), so the hidden Results screen can show what
/// testers did. Nothing leaves the phone.
nonisolated enum Track {
    static let KEY = "rilo.track.v1"

    /// the four things the spec asks us to count
    static let EVENTS: [String: String] = [
        "reason": "pop-up reason tapped",
        "checkin": "check-in choice",
        "paywall": "paywall choice",
        "rilo": "rilo previewed",
    ]

    private static func read() -> [String: [String: Int]] {
        guard let data = UserDefaults.standard.data(forKey: KEY),
              let obj = try? JSONDecoder().decode([String: [String: Int]].self, from: data)
        else { return [:] }
        return obj
    }

    private static func write(_ data: [String: [String: Int]]) {
        guard let raw = try? JSONEncoder().encode(data) else { return }
        UserDefaults.standard.set(raw, forKey: KEY)
        UserDefaults.standard.set(JS.isoString(), forKey: KEY + ".updated")
    }

    /// DEMO/DEBUG: DemoSeed turns this on so seeding a screenshot state
    /// doesn't count as tester taps
    nonisolated(unsafe) static var muted = false

    @discardableResult
    static func track(_ event: String, _ value: String) -> Int {
        if muted { return 0 }
        var data = read()
        var bucket = data[event] ?? [:]
        let next = (bucket[value] ?? 0) + 1
        bucket[value] = next
        data[event] = bucket
        write(data)
        print("[rilo] \(event): \(value) (\(next))")
        return next
    }

    /// event → value → count
    static func counts() -> [String: [String: Int]] { read() }

    /// when anything was last tracked (the web keeps this as `__updated`)
    static func updated() -> String? { UserDefaults.standard.string(forKey: KEY + ".updated") }

    static func resetCounts() {
        UserDefaults.standard.removeObject(forKey: KEY)
        UserDefaults.standard.removeObject(forKey: KEY + ".updated")
    }
}

/// the web's `track(event, value)`
nonisolated func track(_ event: String, _ value: String) {
    Track.track(event, value)
}
