import Foundation

/// Small helpers so the ports of app/src/lib/*.js do the same arithmetic as
/// the JavaScript they came from.
nonisolated enum JS {
    /// Math.round: halves go up (toward +infinity), so Math.round(-2.5) is -2.
    static func round(_ x: Double) -> Double { (x + 0.5).rounded(.down) }
    /// Phase 9: a NaN/infinite number (e.g. 0 / 0 on a brand-new account)
    /// reads 0 instead of crashing Int(); the web would print "NaN"
    static func roundInt(_ x: Double) -> Int {
        let r = round(x)
        return r.isFinite && abs(r) < 1e15 ? Int(r) : 0
    }

    /// String(n) for a JS number: 15 → "15", 7.5 → "7.5"
    static func num(_ x: Double) -> String {
        if x.isFinite, x == x.rounded(), abs(x) < 1e15 { return String(Int(x)) }
        return String(x)
    }

    /// Date.now()
    static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

    /// new Date().toISOString().slice(0, 10) — note: UTC, like the web
    static func isoDay(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    /// new Date().toISOString()
    static func isoString(_ date: Date = Date()) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: date)
    }

    /// `pattern.test(text)` with a JS-style regex literal body
    static func test(_ pattern: String, _ text: String, ignoreCase: Bool = false) -> Bool {
        guard let re = regex(pattern, ignoreCase: ignoreCase) else { return false }
        return re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) != nil
    }

    /// first match's capture groups (index 0 = whole match), like String.match
    static func match(_ pattern: String, _ text: String) -> [String?]? {
        guard let re = regex(pattern),
              let m = re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text))
        else { return nil }
        return (0..<m.numberOfRanges).map { i in
            let r = m.range(at: i)
            guard r.location != NSNotFound, let rr = Range(r, in: text) else { return nil }
            return String(text[rr])
        }
    }

    /// every match's capture groups, like a /g exec loop
    static func matches(_ pattern: String, _ text: String) -> [[String?]] {
        guard let re = regex(pattern) else { return [] }
        return re.matches(in: text, range: NSRange(text.startIndex..., in: text)).map { m in
            (0..<m.numberOfRanges).map { i in
                let r = m.range(at: i)
                guard r.location != NSNotFound, let rr = Range(r, in: text) else { return nil }
                return String(text[rr])
            }
        }
    }

    /// text.replace(/pattern/g, with)
    static func replaceAll(_ pattern: String, in text: String, with: String) -> String {
        guard let re = regex(pattern) else { return text }
        return re.stringByReplacingMatches(
            in: text, range: NSRange(text.startIndex..., in: text),
            withTemplate: NSRegularExpression.escapedTemplate(for: with))
    }

    private nonisolated(unsafe) static var cache: [String: NSRegularExpression] = [:]
    private static let lock = NSLock()

    static func regex(_ pattern: String, ignoreCase: Bool = false) -> NSRegularExpression? {
        let key = (ignoreCase ? "i:" : "s:") + pattern
        lock.lock(); defer { lock.unlock() }
        if let hit = cache[key] { return hit }
        let re = try? NSRegularExpression(pattern: pattern, options: ignoreCase ? [.caseInsensitive] : [])
        cache[key] = re
        return re
    }
}

extension Array {
    /// Array.prototype.slice(-n)
    nonisolated func suffixJS(_ n: Int) -> [Element] { Array(suffix(n)) }
}
