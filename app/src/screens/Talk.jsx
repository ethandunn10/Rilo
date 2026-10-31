/* Talk — tell Rilo about yourself, out loud.

   mode="onboarding": after "Instead", before About you. Rilo asks 4 quick
   questions (name, hobbies, goals, when you scroll most). What he hears is
   turned into the same chips About you uses, so the next screen shows
   "here's what i got" and they can fix anything.

   mode="chat": from Home (tap Rilo). Tell him anything new — a hobby, a
   goal — and he adds it.

   The mic is only on while you hold the button (or after one tap, until
   you tap again). No mic / said no → typing. */

import { useEffect, useRef, useState } from 'react';
import Dots from '../components/Dots';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import { RiloStage, WaveBars } from '../components/TalkBits';
import {
  useListen,
  say,
  hobbiesIn,
  goalsIn,
  nameIn,
  joinNice,
  didYouMean,
  isNonAnswer,
} from '../lib/listen';
import { track } from '../lib/track';
import { HOBBIES, GOALS } from '../lib/profile';

/* roughly how long one of his lines takes to land */
const speakMs = (line) => Math.min(1600, 450 + line.length * 16);

const ONBOARDING = [
  { id: 'name', ask: "hey! i'm rilo. what should i call you?", mood: 'wave' },
  { id: 'hobby', ask: "what do you love doing when you're not on your phone?", mood: 'curious' },
  { id: 'goal', ask: "what are you working toward right now?", mood: 'curious' },
  { id: 'when', ask: 'last one. when do you end up scrolling the most?', mood: 'curious' },
];

const CHAT = [{ id: 'chat', ask: "what's new? tell me a hobby, a goal, anything.", mood: 'curious' }];

/* what he says when the answer was a shrug */
const NUDGE = {
  name: "come on, what do your friends call you?",
  hobby: "anything. one thing you'd do instead of scrolling.",
  goal: "one thing. grades, gym, whatever you actually want.",
  when: 'just roughly — night? after school?',
  chat: 'try me. a hobby, a goal, anything.',
};

function whenReply(t) {
  const s = t.toLowerCase();
  if (/night|bed|late|sleep/.test(s)) return "late at night, huh. i'll be extra annoying then.";
  if (/school|class|lunch/.test(s)) return "during school? i'll keep an eye on that.";
  if (/morning|wake/.test(s)) return 'first thing in the morning? not on my watch.';
  if (/homework|study/.test(s)) return "when you should be doing homework. classic. i've got you.";
  if (/bored|always|all day/.test(s)) return "okay, honesty. i like that. we'll fix it together.";
  return "noted. i'll watch out for that.";
}

/* turn picks into the about-you shape. In onboarding, spoken picks replace
   the demo defaults in that list (hobbies or goals); in chat they add. */
function applyPicks(about, picks, replaceList) {
  if (!picks.length) return about;
  const on = { ...about.on };
  if (replaceList) replaceList.forEach((k) => (on[k] = false));
  picks.forEach((k) => (on[k] = true));
  return { ...about, on };
}

export default function Talk({ go, mode = 'onboarding', skin, name, setName, setAbout, onTalked }) {
  const theme = useTheme();
  const qs = mode === 'chat' ? CHAT : ONBOARDING;
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState(qs[0].ask);
  const [mood, setMood] = useState(qs[0].mood);
  const [speaking, setSpeaking] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [typingPick, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  /* something he wants to check before taking it: a name he might have
     misheard, or a word that looks like a typo */
  const [confirm, setConfirm] = useState(null);
  const [done, setDone] = useState(false);
  const mic = useListen();
  const timers = useRef([]);
  const heardName = useRef('');
  /* once they've let the mic through, it comes back on by itself */
  const usedMic = useRef(false);
  /* The mode they chose on purpose, as opposed to a one-off keyboard for
     fixing a name. Sticky: picked once, it holds for the rest. */
  const keyboardMode = useRef(false);
  /* they tapped the panda while Rilo was still replying — start as soon
     as he's finished instead of swallowing the tap */
  const resumeWanted = useRef(false);
  /* the pending auto-start, so a manual tap can cancel it and they don't
     race each other into two recognisers */
  const autoStart = useRef(null);
  /* The live question number. setStep is async, so a mic callback created
     before it lands would otherwise answer the previous question — and
     re-ask the same one forever. */
  const stepRef = useRef(0);
  /* questions he's already pushed back on once, so he only pushes once */
  const nudged = useRef(new Set());

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  /* Rilo "talks" for a moment whenever his line changes */
  const riloSays = (line, m) => {
    setBubble(line);
    if (m) setMood(m);
    setSpeaking(true);
    say(line, false);
    later(() => setSpeaking(false), speakMs(line));
  };

  useEffect(() => {
    later(() => setSpeaking(false), 1100);
  }, []);


  const answer = (raw, opts = {}) => {
    const text = (raw || '').trim();
    if (!text) return;
    const at = Math.min(stepRef.current, qs.length - 1);
    const q = qs[at];

    /* "maybe" isn't an answer — ask again, but only once */
    if (!opts.asTyped && isNonAnswer(text) && !nudged.current.has(q.id)) {
      nudged.current.add(q.id);
      mic.setText('');
      setDraft('');
      riloSays(NUDGE[q.id] ?? "give me something real, even if it's small.", 'coach');
      if (usedMic.current && !keyboardMode.current) {
        later(() => {
          if (!keyboardMode.current) startMic();
        }, 900);
      }
      return;
    }

    /* "noght" → "do you mean night?" before he builds anything on it */
    if (!opts.asTyped) {
      const guess = didYouMean(text, q.id);
      if (guess) {
        mic.setText('');
        setDraft('');
        setConfirm({ kind: 'spell', raw: text, ...guess });
        riloSays(`do you mean ${guess.meant}?`, 'curious');
        return;
      }
    }

    setThinking(true);
    track('talk', q.id);

    let reply = '';
    let checkName = '';
    if (q.id === 'name') {
      const n = nameIn(text);
      if (n) setName(n);
      heardName.current = n;
      checkName = n;
      reply = n
        ? `${n.toLowerCase()}? did i get that right?`
        : "cool. i'll just call you friend for now.";
    } else if (q.id === 'hobby') {
      const found = hobbiesIn(text);
      setAbout((a) => applyPicks(a, found, HOBBIES));
      reply = found.length
        ? `${joinNice(found)}? love that. that's what i'll point you to.`
        : "ooh okay. i'll learn more about that as we go.";
    } else if (q.id === 'goal') {
      const found = goalsIn(text);
      setAbout((a) => applyPicks(a, found, GOALS));
      reply = found.length
        ? `${joinNice(found)}. okay, i'm locked in on that.`
        : "got it. we'll work on that together.";
    } else if (q.id === 'when') {
      reply = whenReply(text);
    } else {
      const hs = hobbiesIn(text);
      const gs = goalsIn(text);
      setAbout((a) => applyPicks(a, [...hs, ...gs]));
      const added = [...hs, ...gs];
      reply = added.length
        ? `added ${joinNice(added)}. i'll use that when you're bored.`
        : "got it. i'll keep that in mind.";
    }

    later(() => {
      setThinking(false);
      riloSays(reply, checkName ? 'curious' : 'proud');
      mic.setText('');
      setDraft('');
      /* wait for a yes before taking a name he might have misheard */
      if (checkName) {
        setConfirm({ kind: 'name', name: checkName });
        return;
      }
      const next = at + 1;
      later(
        () => {
          if (next < qs.length) {
            askNext(next);
          } else if (mode === 'chat') {
            riloSays('anything else? or tap done.', 'coach');
          } else {
            setDone(true);
            riloSays(
              `that's all i needed${heardName.current || name ? `, ${(heardName.current || name).toLowerCase()}` : ''}. i'll remember this.`,
              'proud',
            );
          }
        },
        Math.min(1500, 550 + reply.length * 14),
      );
    }, 220);
  };

  const listening = mic.listening;
  const typing = typingPick || !mic.supported;
  const stageState = listening ? 'listening' : speaking || thinking ? 'talking' : 'idle';
  const showText = listening ? mic.text : mic.text || draft;
  const finish = () => go(mode === 'chat' ? 'home' : 'aboutyou', mode === 'chat' ? 'back' : 'forward');

  const clearAutoStart = () => {
    if (autoStart.current) {
      clearTimeout(autoStart.current);
      autoStart.current = null;
    }
  };

  const startMic = () => {
    if (done) return;
    if (!mic.supported) {
      keyboardMode.current = true;
      setTyping(true);
      return;
    }
    /* Rilo is still talking or thinking: remember the tap and pick it up
       the moment he's done, rather than doing nothing. */
    if (thinking) {
      resumeWanted.current = true;
      return;
    }
    clearAutoStart();
    window.speechSynthesis?.cancel?.();
    setSpeaking(false);
    setMood('coach');
    usedMic.current = true;
    resumeWanted.current = false;
    mic.start((said) => answer(said));
  };

  /* Next question. Whichever way they chose last — keyboard or mic — is
     the way they stay, so nobody has to pick again every question. The
     mic side turns itself back on once he's finished asking. */
  const askNext = (next) => {
    stepRef.current = next;
    mic.setText('');
    setDraft('');
    setTyping(keyboardMode.current);
    setStep(next);
    const line = qs[next].ask;
    riloSays(line, qs[next].mood);
    if ((usedMic.current || resumeWanted.current) && !keyboardMode.current) {
      clearAutoStart();
      autoStart.current = setTimeout(() => {
        autoStart.current = null;
        if (!keyboardMode.current) startMic();
      }, speakMs(line) + 80);
      timers.current.push(autoStart.current);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: theme.sky,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <ThemeDecor />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '54px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* top row */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 36,
          }}
        >
          {mode === 'chat' ? (
            <button type="button" className="tap" onClick={finish} style={pillBtn}>
              done
            </button>
          ) : (
            <span style={{ width: 64 }} />
          )}
          {mode === 'onboarding' ? <Dots active={2} /> : <span />}
          <span style={{ width: 64 }} />
        </div>

        {/* Rilo's line */}
        <div
          key={bubble}
          style={{
            marginTop: 18,
            maxWidth: 320,
            padding: '14px 18px',
            borderRadius: 22,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            textAlign: 'center',
            animation: 'bubble-in .35s ease-out both',
            position: 'relative',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {thinking ? '…' : bubble}
          </p>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -9,
              width: 16,
              height: 16,
              marginLeft: -8,
              background: 'var(--card)',
              borderRight: '2px solid var(--line)',
              borderBottom: '2px solid var(--line)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>

        {/* big Rilo + sound waves */}
        <div style={{ marginTop: 4 }}>
          <RiloStage
            skin={skin}
            mood={listening ? 'coach' : mood}
            size={235}
            state={stageState}
            onTap={() => {
              if (listening) {
                /* tapping him is how you say you're done talking */
                clearAutoStart();
                mic.stop();
              } else {
                startMic();
              }
            }}
          />
        </div>

        {/* kept up while he talks too, so the screen never looks dead
            in the gap between one answer and the next question */}
        <WaveBars on={listening || speaking || thinking} color={listening ? '#12301A' : '#5F8C6B'} />

        {/* what you said */}
        <div
          style={{
            marginTop: 6,
            width: '100%',
            minHeight: 58,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {done ? null : confirm ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="tap"
                onClick={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c.kind === 'spell') {
                    /* take the word he guessed, in place of the typo */
                    answer(c.raw.replace(new RegExp(c.typo, 'i'), c.meant), { asTyped: true });
                  } else {
                    askNext(stepRef.current + 1);
                  }
                }}
                style={{ ...pillBtn, height: 48, padding: '0 22px', fontSize: 18 }}
              >
                yep
              </button>
              <button
                type="button"
                className="tap"
                onClick={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c.kind === 'spell') {
                    /* wrong guess — keep what they actually wrote */
                    answer(c.raw, { asTyped: true });
                    return;
                  }
                  setName('');
                  heardName.current = '';
                  mic.cancel();
                  setDraft('');
                  setTyping(true);
                  riloSays('my bad. type it for me?', 'coach');
                }}
                style={{
                  ...pillBtn,
                  height: 48,
                  padding: '0 22px',
                  fontSize: 18,
                  background: 'transparent',
                }}
              >
                nope
              </button>
            </div>
          ) : typing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                answer(draft);
              }}
              style={{ display: 'flex', gap: 8, width: '100%' }}
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="type it to rilo…"
                style={{
                  flexGrow: 1,
                  minWidth: 0,
                  height: 50,
                  boxSizing: 'border-box',
                  padding: '0 18px',
                  borderRadius: 999,
                  border: '2px solid var(--line)',
                  background: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#12301A',
                }}
              />
              <button type="submit" className="tap" style={{ ...pillBtn, height: 50, padding: '0 18px' }}>
                send
              </button>
            </form>
          ) : (
            <>
              {showText && (
                <p
                  style={{
                    margin: 0,
                    textAlign: 'center',
                    fontSize: listening ? 16 : 18,
                    fontWeight: 700,
                    color: '#12301A',
                    lineHeight: 1.3,
                  }}
                >
                  {`“${showText}”`}
                </p>
              )}
              {(listening || !showText) && (
                <p
                  style={{
                    margin: 0,
                    padding: listening && showText ? '6px 16px' : '9px 20px',
                    borderRadius: 999,
                    background: listening ? '#12301A' : 'var(--card)',
                    color: listening ? '#FFFFFF' : '#12301A',
                    border: '2px solid var(--line)',
                    boxShadow: '0 3px 0 var(--line)',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: listening && showText ? 16 : 19,
                    fontWeight: 600,
                  }}
                >
                  {listening ? 'tap to stop' : 'tap to start'}
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ flexGrow: 1 }} />

        {/* bottom controls */}
        {done ? (
          <>
            {/* he's finished asking — point at the way out */}
            <span
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
                animation: 'point-down 1.1s ease-in-out infinite',
              }}
            >
              <svg width="54" height="58" viewBox="0 0 54 58" aria-hidden="true">
                <path
                  d="M27 4 L27 44 M11 30 L27 48 L43 30"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <button
              type="button"
              className="tap-94"
              onClick={() => {
                onTalked?.();
                finish();
              }}
              style={bigBtn}
            >
              next step
            </button>
          </>
        ) : (
          <button
            type="button"
            className="tap-94"
            onClick={() => {
              if (typing) {
                keyboardMode.current = false;
                setTyping(false);
                startMic();
              } else {
                /* going to the keyboard: drop the mic, don't submit it */
                keyboardMode.current = true;
                mic.cancel();
                setDraft('');
                setTyping(true);
              }
            }}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: 'var(--card)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            {typing ? 'talk instead' : 'type instead'}
          </button>
        )}

        {mic.blocked ? (
          <button
            type="button"
            className="tap"
            onClick={() => {
              mic.retry();
              keyboardMode.current = false;
              setTyping(false);
            }}
            style={{
              margin: '14px 0 0',
              border: 0,
              background: 'transparent',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: '#12301A',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              cursor: 'pointer',
            }}
          >
            mic&apos;s off for this site. tap to try again
          </button>
        ) : (
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 12,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
          }}
        >
          {mic.problem
            ? mic.problem
            : mic.asking
              ? 'allow the mic up there and he starts listening.'
              : mic.supported
                ? "tap rilo to talk, tap him again when you're done."
                : "no mic here, so just type. rilo still gets it."}
        </p>
        )}
      </div>
    </div>
  );
}

const pillBtn = {
  height: 36,
  padding: '0 14px',
  borderRadius: 999,
  border: '2px solid var(--line)',
  background: 'var(--card)',
  boxShadow: '0 3px 0 var(--line)',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#12301A',
  cursor: 'pointer',
};

const bigBtn = {
  width: '100%',
  height: 58,
  border: '2px solid var(--line)',
  borderRadius: 999,
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 0 var(--line)',
};
