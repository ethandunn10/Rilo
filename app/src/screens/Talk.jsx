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
import { RiloStage, WaveBars, MicButton } from '../components/TalkBits';
import { useListen, say, hobbiesIn, goalsIn, nameIn, joinNice } from '../lib/listen';
import { track } from '../lib/track';
import { HOBBIES, GOALS } from '../lib/profile';

const ONBOARDING = [
  { id: 'name', ask: "hey! i'm rilo. what should i call you?", mood: 'wave' },
  { id: 'hobby', ask: "what do you love doing when you're not on your phone?", mood: 'curious' },
  { id: 'goal', ask: "what are you working toward right now?", mood: 'curious' },
  { id: 'when', ask: 'last one. when do you end up scrolling the most?', mood: 'curious' },
];

const CHAT = [{ id: 'chat', ask: "what's new? tell me a hobby, a goal, anything.", mood: 'curious' }];

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
  const [voice, setVoice] = useState(false);
  const [heard, setHeard] = useState({ hobbies: [], goals: [], name: '' });
  const [done, setDone] = useState(false);
  const mic = useListen();
  const timers = useRef([]);
  const heardName = useRef('');

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* Rilo "talks" for a moment whenever his line changes */
  const riloSays = (line, m) => {
    setBubble(line);
    if (m) setMood(m);
    setSpeaking(true);
    say(line, voice);
    later(() => setSpeaking(false), Math.min(2600, 700 + line.length * 28));
  };

  useEffect(() => {
    later(() => setSpeaking(false), 1800);
  }, []);


  const answer = (raw) => {
    const text = (raw || '').trim();
    if (!text) return;
    setThinking(true);
    const q = qs[step];
    track('talk', q.id);

    let reply = '';
    if (q.id === 'name') {
      const n = nameIn(text);
      if (n) setName(n);
      setHeard((h) => ({ ...h, name: n }));
      heardName.current = n;
      reply = n ? `nice to meet you, ${n.toLowerCase()}.` : "cool. i'll just call you friend for now.";
    } else if (q.id === 'hobby') {
      const found = hobbiesIn(text);
      setHeard((h) => ({ ...h, hobbies: found }));
      setAbout((a) => applyPicks(a, found, HOBBIES));
      reply = found.length
        ? `${joinNice(found)}? love that. that's what i'll point you to.`
        : "ooh okay. i'll learn more about that as we go.";
    } else if (q.id === 'goal') {
      const found = goalsIn(text);
      setHeard((h) => ({ ...h, goals: found }));
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
      riloSays(reply, 'proud');
      mic.setText('');
      setDraft('');
      const next = step + 1;
      later(
        () => {
          if (next < qs.length) {
            setStep(next);
            riloSays(qs[next].ask, qs[next].mood);
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
        Math.min(2800, 1100 + reply.length * 25),
      );
    }, 450);
  };

  const listening = mic.listening;
  const typing = typingPick || !mic.supported;
  const stageState = listening ? 'listening' : speaking || thinking ? 'talking' : 'idle';
  const showText = listening ? mic.text : mic.text || draft;
  const finish = () => go(mode === 'chat' ? 'home' : 'aboutyou', mode === 'chat' ? 'back' : 'forward');

  const startMic = () => {
    if (done || thinking) return;
    if (!mic.supported) {
      setTyping(true);
      return;
    }
    window.speechSynthesis?.cancel?.();
    setSpeaking(false);
    setMood('coach');
    mic.start((said) => answer(said));
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
          <button
            type="button"
            className="tap"
            aria-pressed={voice}
            onClick={() => setVoice((v) => !v)}
            style={{ ...pillBtn, width: 64, background: voice ? '#12301A' : 'var(--card)', color: voice ? '#FFFFFF' : '#12301A' }}
          >
            {voice ? 'voice on' : 'voice'}
          </button>
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
            onTap={() => (listening ? mic.stop() : startMic())}
          />
        </div>

        <WaveBars on={listening} />

        {/* what you said */}
        <div
          style={{
            marginTop: 6,
            width: '100%',
            minHeight: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {[...heard.hobbies, ...heard.goals].slice(0, 6).map((k) => (
                <span key={k} style={chip}>
                  {k}
                </span>
              ))}
            </div>
          ) : typing && !listening ? (
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
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: showText ? 18 : 15,
                fontWeight: 700,
                color: showText ? '#12301A' : '#2C4A36',
                lineHeight: 1.35,
              }}
            >
              {showText ? `“${showText}”` : listening ? 'listening…' : 'hold the mic or tap rilo and just talk'}
            </p>
          )}
        </div>

        <div style={{ flexGrow: 1 }} />

        {/* bottom controls */}
        {done ? (
          <button
            type="button"
            className="tap-94"
            onClick={() => {
              onTalked?.();
              finish();
            }}
            style={bigBtn}
          >
            looks good
          </button>
        ) : (
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="tap"
              onClick={() => setTyping((t) => !t)}
              style={{ ...linkBtn, justifySelf: 'start' }}
            >
              {typing ? 'talk instead' : 'type instead'}
            </button>
            <MicButton
              listening={listening}
              disabled={!mic.supported || thinking}
              onStart={startMic}
              onStop={mic.stop}
            />
            <button
              type="button"
              className="tap"
              onClick={() => {
                track('talk', 'skipped');
                finish();
              }}
              style={{ ...linkBtn, justifySelf: 'end' }}
            >
              {mode === 'chat' ? 'done' : 'skip'}
            </button>
          </div>
        )}

        <p
          style={{
            margin: '14px 0 0',
            fontSize: 12,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
          }}
        >
          {mic.supported
            ? "rilo only listens while you're holding the button."
            : "no mic here, so just type. rilo still gets it."}
        </p>
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

const linkBtn = {
  border: 0,
  background: 'transparent',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#12301A',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  padding: 8,
};

const chip = {
  padding: '8px 14px',
  borderRadius: 999,
  background: '#12301A',
  color: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
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
