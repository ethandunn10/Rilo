/* Talk — the last step of onboarding, and the "tell rilo something" screen
   from Home.

   Deliberately bare: the panda, one question at a time above him, and
   "click to talk". Typing and skipping are always there underneath, so a
   dead mic never blocks anyone.

   The mic is only on while you're talking to him — never in the background. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import { RiloStage, WaveBars } from '../components/TalkBits';
import { useListen, hobbiesIn, goalsIn, nameIn, joinNice } from '../lib/listen';
import { HOBBIES, GOALS } from '../lib/profile';
import { track } from '../lib/track';

/* Rilo's questions, asked one at a time — but only the ones he still
   needs. By this point onboarding already has the name, hobbies and goals,
   so he skips whatever he's been told and just asks the rest. If there's
   nothing left, he opens it up instead of asking filler. */
const QS = [
  { id: 'name', ask: "hey! i'm rilo. what should i call you?", mood: 'wave' },
  { id: 'hobby', ask: "what do you love doing when you're not on your phone?", mood: 'curious' },
  { id: 'goal', ask: 'what are you working toward right now?', mood: 'curious' },
  { id: 'when', ask: 'last one. when do you end up scrolling the most?', mood: 'curious' },
];

/* nothing to ask — they just describe themselves */
const OPEN = [
  { id: 'chat', ask: 'tell me anything. a hobby, a goal, what you’re into.', mood: 'curious' },
];

function applyPicks(about, picks, list) {
  if (!picks.length) return about;
  const on = { ...about.on };
  const extra = { ...about.extra };
  picks.forEach((p) => {
    on[p] = true;
    const known = !list || list.includes(p);
    const kind = list === GOALS ? 'goal' : 'hobby';
    if (!known && !extra[kind].includes(p)) extra[kind] = [...extra[kind], p];
  });
  return { on, extra };
}

function whenReply(t) {
  const s = t.toLowerCase();
  if (/night|bed|late|2 ?am|midnight/.test(s)) return "late at night. that's the one i'll guard.";
  if (/morning|wake|breakfast/.test(s)) return "mornings. i'll catch you before you spiral.";
  if (/school|class|lunch/.test(s)) return "during school. noted.";
  if (/bored|nothing/.test(s)) return 'when you’re bored. that’s exactly when i’ll step in.';
  return "got it. i'll watch for that.";
}

/* the two ways out of a question — both real buttons, not faint links */
const footBtn = {
  flex: 1,
  minHeight: 54,
  borderRadius: 999,
  border: '2px solid var(--line)',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 0 var(--line)',
};

export default function Talk({
  go,
  mode = 'onboarding',
  skin,
  name,
  about,
  setName,
  setAbout,
  onTalked,
}) {
  const chat = mode === 'chat';

  /* Worked out once, when the screen opens: what does he already know, and
     so which questions are still worth asking? */
  const [qs] = useState(() => {
    if (chat) return OPEN;
    const picked = (list) => list.some((x) => about?.on?.[x]);
    const extras = (kind) => (about?.extra?.[kind] ?? []).length > 0;
    const knows = {
      name: Boolean(name),
      hobby: picked(HOBBIES) || extras('hobby'),
      goal: picked(GOALS) || extras('goal'),
    };
    const left = QS.filter((x) => !knows[x.id]);
    return left.length ? left : OPEN;
  });

  const mic = useListen();
  const [step, setStep] = useState(0);
  /* no speech support (Firefox, locked-down Safari) → typing from the start */
  /* typing is forced on whenever there's no usable mic */
  const [typingPick, setTyping] = useState(false);
  /* once they've talked, Rilo keeps listening for the next question
     instead of making them tap him again */
  const [autoTalk, setAutoTalk] = useState(false);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState('');
  const [mood, setMood] = useState(qs[0].mood);
  const timer = useRef(null);
  /* `take` and `mic` are rebuilt every render; the auto-listen effect reads
     them through this ref so it can key off the question alone — depending
     on them directly would restart the mic mid-sentence. */
  const latest = useRef({ mic: null, take: null, finish: null });

  useEffect(() => () => clearTimeout(timer.current), []);

  const typing = typingPick || !mic.usable;
  const done = step >= qs.length;
  const q = qs[Math.min(step, qs.length - 1)];
  const listening = mic.listening;

  const finish = () => {
    if (!chat) onTalked?.();
    go(chat ? 'home' : 'paywall', chat ? 'back' : 'forward');
  };

  /* take one answer, move to the next question */
  const take = (raw) => {
    const text = (raw || '').trim();
    if (!text) return;
    track('talk', q.id);

    let said = '';
    if (q.id === 'name') {
      const n = nameIn(text);
      if (n) setName(n);
      said = n ? `nice to meet you, ${n.toLowerCase()}.` : "cool, i'll call you friend for now.";
    } else if (q.id === 'hobby') {
      const found = hobbiesIn(text);
      setAbout((a) => applyPicks(a, found, HOBBIES));
      said = found.length
        ? `${joinNice(found)}? love that.`
        : "ooh okay. i'll learn more as we go.";
    } else if (q.id === 'goal') {
      const found = goalsIn(text);
      setAbout((a) => applyPicks(a, found, GOALS));
      said = found.length ? `${joinNice(found)}. i'm locked in on that.` : "got it. we'll work on it.";
    } else if (q.id === 'when') {
      said = whenReply(text);
    } else {
      const picks = [...hobbiesIn(text), ...goalsIn(text)];
      setAbout((a) => applyPicks(a, picks));
      said = picks.length ? `added ${joinNice(picks)}.` : "got it. i'll keep that in mind.";
    }

    setReply(said);
    setMood('proud');
    setDraft('');
    mic.setText('');

    timer.current = setTimeout(() => {
      setReply('');
      setStep((n) => {
        const next = n + 1;
        setMood(qs[Math.min(next, qs.length - 1)].mood);
        return next;
      });
    }, 1500);
  };

  /* refreshed after every render, so the effect below always calls the
     current handler without depending on it */
  useEffect(() => {
    latest.current.mic = mic;
    latest.current.take = take;
    latest.current.finish = finish;
  });

  const tapRilo = async () => {
    if (done) return;
    if (listening) {
      mic.stop();
      return;
    }
    if (!mic.usable) {
      setTyping(true);
      return;
    }
    /* first time: ask in Rilo's own words, then let the browser ask */
    if (!mic.granted) {
      const ok = await mic.request();
      if (!ok) return;
    }
    setAutoTalk(true);
    mic.start(take);
  };

  /* next question, mic still on — no tapping between answers */
  useEffect(() => {
    if (!autoTalk || typing || done || reply) return;
    const m = latest.current.mic;
    if (!m.granted || m.listening) return;
    const t = setTimeout(() => latest.current.mic.start(latest.current.take), 350);
    return () => clearTimeout(t);
  }, [step, autoTalk, typing, done, reply]);

  /* finished asking → let it sit for a beat, then move on by itself */
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => latest.current.finish(), 3000);
    return () => clearTimeout(t);
  }, [done]);

  /* what sits above Rilo: his question, or his reply to it */
  const line = done ? "that's everything — thanks!" : reply || q.ask;
  const heard = listening ? mic.text : '';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="mid" />

      {/* points at the browser's own permission bubble, which appears
          top-left on desktop and as a dialog on a phone */}
      {mic.asking && (
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 10,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px 8px 10px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            animation: 'point-up 1s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>☝️</span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 600 }}>
            hit allow up there
          </span>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* header: back on the left, progress dots centred */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 2,
          }}
        >
          <button
            type="button"
            className="tap"
            aria-label="back a step"
            onClick={() => {
              if (listening) mic.stop();
              if (step > 0) {
                setReply('');
                setStep((n) => n - 1);
              } else {
                go('timeback', 'back');
              }
            }}
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15 5 L8 12 L15 19"
                fill="none"
                stroke="#12301A"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {qs.length > 1 && !done ? (
            <div style={{ display: 'flex', gap: 6 }}>
            {qs.map((x, i) => (
              <span
                key={x.id}
                style={{
                  width: i === step ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: i <= step ? '#12301A' : 'rgba(255,255,255,0.85)',
                  transition: 'width .2s ease',
                }}
              />
            ))}
            </div>
          ) : (
            <span />
          )}

          {/* keeps the dots centred against the back button */}
          <span style={{ width: 40, flexShrink: 0 }} />
        </div>

        {/* the question, on its own */}
        <p
          key={line}
          style={{
            margin: 0,
            minHeight: 86,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 26,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'center',
            animation: 'rise .4s ease-out both',
          }}
        >
          {line}
        </p>

        {/* the panda */}
        <RiloStage
          skin={skin}
          mood={done ? 'proud' : listening ? 'coach' : mood}
          size={215}
          state={listening ? 'listening' : 'idle'}
          onTap={mic.usable ? tapRilo : undefined}
        />

        <WaveBars on={listening} />

        {/* click to talk / what he's hearing */}
        <p
          style={{
            margin: '2px 0 0',
            minHeight: 24,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: listening ? '#1F6B2E' : '#2C4A36',
            textAlign: 'center',
          }}
        >
          {heard
            ? `“${heard}”`
            : mic.asking
              ? 'tap allow when your browser asks ☝️'
              : listening
                ? 'listening… just stop talking when you’re done'
                : done
                  ? ''
                  : !mic.usable
                    ? 'type your answer below'
                    : mic.granted
                      ? 'click to talk'
                      : 'click me — can i listen?'}
        </p>

        {mic.problem && !listening && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: '#A33A2B',
              textAlign: 'center',
            }}
          >
            {mic.problem}
          </p>
        )}

        {listening && (
          <button
            type="button"
            className="tap-94"
            onClick={mic.stop}
            style={{
              minHeight: 44,
              marginTop: 2,
              padding: '0 20px',
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 3px 0 var(--line)',
            }}
          >
            done talking
          </button>
        )}

        {typing && !done && (
          <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              type="text"
              autoFocus
              value={draft}
              placeholder="type it to rilo…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') take(draft);
              }}
              style={{
                flexGrow: 1,
                minWidth: 0,
                height: 48,
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#12301A',
              }}
            />
            <button
              type="button"
              className="tap"
              onClick={() => take(draft)}
              style={{
                height: 48,
                padding: '0 18px',
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              send
            </button>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {/* type instead · next step */}
        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="tap-94"
            onClick={() => setTyping((t) => !t)}
            style={{
              ...footBtn,
              background: 'rgba(255,255,255,0.9)',
              color: '#12301A',
            }}
          >
            {typingPick && mic.usable ? 'talk instead' : 'type instead'}
          </button>
          <button
            type="button"
            className="tap-94"
            onClick={() => {
              if (!done) track('talk', 'skipped');
              finish();
            }}
            style={{
              ...footBtn,
              background: '#12301A',
              color: '#FFFFFF',
            }}
          >
            {done ? 'done' : 'next step'}
          </button>
        </div>

      </div>
    </div>
  );
}
