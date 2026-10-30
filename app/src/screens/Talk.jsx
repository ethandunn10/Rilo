/* Talk — the last step of onboarding, and the "tell rilo something" screen
   from Home.

   Deliberately bare: the panda, one question at a time above him, and
   "click to talk". Typing and skipping are always there underneath, so a
   dead mic never blocks anyone.

   The mic is only on while you're talking to him — never in the background. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import { RiloStage, WaveBars } from '../components/TalkBits';
import { useListen, hobbiesIn, goalsIn, nameIn, joinNice, saidAny } from '../lib/listen';
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
/* The Home chat works through its own short run of questions, so he isn't
   asking the same thing every time. */
const OPEN = [
  { id: 'chat', ask: 'what’s new? tell me anything.', mood: 'wave' },
  { id: 'chat', ask: 'what have you been up to today?', mood: 'curious' },
  { id: 'chat', ask: 'anything you’re working on right now?', mood: 'curious' },
  { id: 'chat', ask: 'what’s been eating your time lately?', mood: 'curious' },
  { id: 'chat', ask: 'anything you want me to push you on?', mood: 'coach' },
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

function whenHits(t) {
  const s = t.toLowerCase();
  const hits = [];

  /* someone can scroll at more than one time of day — catch all of them */
  const has = (re, near) => re.test(s) || saidAny(s, near);

  if (has(/night|bed|late|2 ?am|midnight/, ['night', 'tonight', 'midnight', 'bedtime']))
    hits.push('late at night');
  if (has(/morning|wake|breakfast/, ['morning', 'mornings', 'breakfast']))
    hits.push('in the mornings');
  if (has(/after ?school|afternoon/, ['afternoon', 'afterschool'])) hits.push('after school');
  else if (has(/school|class|lunch/, ['school', 'class', 'classes', 'lunch']))
    hits.push('during school');
  if (has(/evening|dinner/, ['evening', 'evenings', 'dinner'])) hits.push('in the evening');
  if (has(/weekend|saturday|sunday/, ['weekend', 'weekends', 'saturday', 'sunday']))
    hits.push('on weekends');
  if (has(/work|job|office/, ['work', 'office'])) hits.push('at work');
  if (has(/bored|nothing to do/, ['bored', 'boring', 'boredom'])) hits.push("when you're bored");

  return hits;
}

function whenReply(hits) {
  if (!hits.length) return "got it. i'll watch for that.";
  if (hits.length === 1) return `${hits[0]}. that's the one i'll guard.`;
  return `${joinNice(hits)}. i'll watch ${hits.length === 2 ? 'both' : 'all'} of those.`;
}


/* a long arrow pointing up at Rilo, so it's obvious he's the button */
function PointUp({ label, live }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        /* the Rilo stage carries padding around the panda — pull back up
           through it so the arrow sits just under his feet */
        marginTop: -34,
        animation: 'point-up 1.1s ease-in-out infinite',
      }}
    >
      <svg width="26" height="58" viewBox="0 0 26 58" aria-hidden="true">
        <path
          d="M13 56 L13 10"
          fill="none"
          stroke={live ? '#1F6B2E' : '#12301A'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M4 18 L13 6 L22 18"
          fill="none"
          stroke={live ? '#1F6B2E' : '#12301A'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          padding: '9px 20px',
          borderRadius: 999,
          background: live ? '#DCF3DF' : '#12301A',
          color: live ? '#12301A' : '#FFFFFF',
          border: '2px solid var(--line)',
          boxShadow: '0 3px 0 var(--line)',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 17,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
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
      /* About you no longer asks for a name, so Rilo always does — even if
         a previous tester left one saved. */
      name: false,
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
  /* out of questions: wait a beat, then say thanks, then leave */
  const [wrapUp, setWrapUp] = useState(false);
  /* what he heard for each question, for the check-over screen */
  const [answers, setAnswers] = useState({});
  /* set while they're redoing one answer, so we come straight back */
  const [redoing, setRedoing] = useState(null);
  const [checked, setChecked] = useState(false);
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
  /* saying thanks and heading out — immediate in onboarding, after the
     3s pause in the Home chat */
  /* onboarding stops on a check-over screen first; the chat doesn't */
  const reviewing = done && !chat && !checked;
  const winding = wrapUp || (done && !chat && checked);
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
    /* what Rilo actually took from it — this is what the check-over shows */
    let value = '';

    if (q.id === 'name') {
      const n = nameIn(text);
      if (n) setName(n);
      value = n;
      said = n ? `nice to meet you, ${n.toLowerCase()}.` : "cool, i'll call you friend for now.";
    } else if (q.id === 'hobby') {
      const found = hobbiesIn(text);
      setAbout((a) => applyPicks(a, found, HOBBIES));
      value = joinNice(found);
      said = found.length
        ? `${joinNice(found)}? love that.`
        : "ooh okay. i'll learn more as we go.";
    } else if (q.id === 'goal') {
      const found = goalsIn(text);
      setAbout((a) => applyPicks(a, found, GOALS));
      value = joinNice(found);
      said = found.length ? `${joinNice(found)}. i'm locked in on that.` : "got it. we'll work on it.";
    } else if (q.id === 'when') {
      const hits = whenHits(text);
      value = joinNice(hits);
      said = whenReply(hits);
    } else {
      const picks = [...hobbiesIn(text), ...goalsIn(text)];
      setAbout((a) => applyPicks(a, picks));
      value = joinNice(picks);
      said = picks.length ? `added ${joinNice(picks)}.` : "got it. i'll keep that in mind.";
    }

    /* they answered after "anything else?" — take it and wind up */
    if (done) setWrapUp(true);

    setAnswers((a) => ({ ...a, [step]: { ask: q.ask, value, said: text } }));

    setReply(said);
    setMood('proud');
    setDraft('');
    mic.setText('');

    timer.current = setTimeout(() => {
      setReply('');
      if (redoing !== null) {
        /* straight back to the check-over screen */
        setRedoing(null);
        setStep(qs.length);
        return;
      }
      setStep((n) => {
        const next = n + 1;
        setMood(qs[Math.min(next, qs.length - 1)].mood);
        return next;
      });
    }, 1000);
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
    if (!autoTalk || typing || winding || reply) return;
    const m = latest.current.mic;
    if (!m.granted || m.listening) return;
    const t = setTimeout(() => latest.current.mic.start(latest.current.take), 350);
    return () => clearTimeout(t);
  }, [step, autoTalk, typing, winding, reply]);

  /* Out of questions. Hold for 3s in case they're still mid-thought — if
     they start talking or typing the clock stops — then say thanks, and
     2s later hand off (to the paywall in onboarding, home from the chat). */
  useEffect(() => {
    if (!chat || !done || wrapUp) return;
    if (listening || draft.trim()) return;
    const t = setTimeout(() => setWrapUp(true), 3000);
    return () => clearTimeout(t);
  }, [chat, done, wrapUp, listening, draft]);

  useEffect(() => {
    if (!winding) return;
    const t = setTimeout(() => latest.current.finish(), 2000);
    return () => clearTimeout(t);
  }, [winding]);

  /* what sits above Rilo: his question, or his reply to it */
  const line = winding
    ? "that's everything — thanks!"
    : done
      ? 'anything else?'
      : reply || q.ask;
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

        {reviewing ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'line-in .34s cubic-bezier(.2,.8,.3,1) both',
            }}
          >
            <p
              style={{
                margin: '4px 0 2px',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 26,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              is this right?
            </p>

            {qs.map((x, i) => (
              <div
                key={x.ask}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.9)',
                  border: '2px solid var(--line)',
                  boxShadow: '0 3px 0 var(--line)',
                }}
              >
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#3D5A46' }}>
                    {x.ask}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 18,
                      fontWeight: 600,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {answers[i]?.value || answers[i]?.said || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  className="tap-94"
                  onClick={() => {
                    if (listening) mic.stop();
                    setReply('');
                    setRedoing(i);
                    setStep(i);
                  }}
                  style={{
                    flexShrink: 0,
                    minHeight: 40,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: '2px solid var(--line)',
                    background: '#4CC160',
                    color: '#0C2A14',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  change
                </button>
              </div>
            ))}

            <button
              type="button"
              className="tap-94"
              onClick={() => setChecked(true)}
              style={{
                marginTop: 2,
                width: '100%',
                minHeight: 54,
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 0 var(--line)',
              }}
            >
              looks good
            </button>
          </div>
        ) : null}

        {!reviewing && (
          <>
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
            animation: 'line-in .34s cubic-bezier(.2,.8,.3,1) both',
          }}
        >
          {line}
        </p>

        {/* the panda */}
        <RiloStage
          skin={skin}
          mood={winding ? 'proud' : listening ? 'coach' : mood}
          size={215}
          state={listening ? 'listening' : 'idle'}
          onTap={mic.usable ? tapRilo : undefined}
        />

        <WaveBars on={listening} />

        {/* arrow + label pointing back up at Rilo */}
        {heard ? (
          <p
            style={{
              margin: '2px 0 0',
              minHeight: 24,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#1F6B2E',
              textAlign: 'center',
            }}
          >
            “{heard}”
          </p>
        ) : mic.asking ? (
          <PointUp label="tap allow when your browser asks" />
        ) : listening ? (
          <PointUp label="tap to stop" live />
        ) : done ? null : !mic.usable ? (
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#2C4A36',
            }}
          >
            type your answer below
          </p>
        ) : (
          <PointUp label="tap to start" />
        )}

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

        {/* while he's still asking: only the typing toggle.
            once he's done: only the way forward. */}
        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          {!winding && mic.usable && (
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
              {typingPick ? 'talk instead' : 'type instead'}
            </button>
          )}

          {(done || chat) && (
            <button
              type="button"
              className="tap-94"
              onClick={finish}
              style={{
                ...footBtn,
                background: '#12301A',
                color: '#FFFFFF',
              }}
            >
              {chat ? "that's it" : 'next step'}
            </button>
          )}
        </div>
          </>
        )}

      </div>
    </div>
  );
}
