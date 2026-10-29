/* Test tracking.
   Logs every tracked tap to the console AND keeps a running count in
   localStorage, so we can see what testers did. Read it on /results. */

const KEY = 'rilo.track.v1';

/* the four things the spec asks us to count */
export const EVENTS = {
  reason: 'pop-up reason tapped',
  checkin: 'check-in choice',
  paywall: 'paywall choice',
  rilo: 'rilo previewed',
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / storage off — console logging still works */
  }
}

export function track(event, value) {
  const data = read();
  const bucket = data[event] ?? {};
  const next = (bucket[value] ?? 0) + 1;

  data[event] = { ...bucket, [value]: next };
  data.__updated = new Date().toISOString();
  write(data);

  /* eslint-disable-next-line no-console */
  console.log(`[rilo] ${event}: ${value} (${next})`);
  return next;
}

export function counts() {
  return read();
}

export function resetCounts() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
