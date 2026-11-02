/* Talk — tell Rilo about yourself.

   mode="onboarding": after "Instead", before About you. Rilo asks 5 quick
   questions (name, hobbies, goals, whether they post, when they scroll
   most). What they answer is turned into the same chips About you uses, so
   the next screen shows "here's what i got" and they can fix anything.

   mode="chat": from Home (tap Rilo). Tell him anything new — a hobby, a
   goal — and he adds it.

   It's typed, not spoken. There used to be a microphone here; see the note
   at the top of lib/listen.js for why it's gone. To keep that from being a
   chore on a phone, every question that CAN have tappable answers has
   them — so most of onboarding is taps, and the keyboard is there for
   whatever the chips don't cover. */

import { useEffect, useRef, useState } from 'react';
import Dots from '../components/Dots';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import { RiloStage } from '../components/TalkBits';
import {
  hobbiesIn,
  goalsIn,
  nameIn,
  creatorIn,
  joinNice,
  isNonAnswer,
} from '../lib/listen';
import { track } from '../lib/track';
import { HOBBIES, GOALS, CREATOR_ANSWERS } from '../lib/profile';

/* roughly how long one of his lines takes to land */
const speakMs = (line) => Math.min(1600, 450 + line.length * 16);

const CHAT = [{ id: 'chat', ask: "what's new? tell me a hobby, a goal, anything.", mood: 'curious' }];

/* Tappable answers. A phone keyboard is the most annoying part of any
   onboarding, so anything that can be a tap is one — the text field stays
   for whatever the chips don't cover. A name has to be typed; everything
   else gets a shortlist. */
const QUICK = {
  hobby: HOBBIES.slice(0, 8),
  goal: GOALS.slice(0, 8),
  creator: CREATOR_ANSWERS.map((a) => a.label),
  when: ['after school', 'at night', 'in bed', 'when i should be studying', 'all day honestly'],
  chat: [...HOBBIES.slice(0, 4), ...GOALS.slice(0, 3)],
};

/* Most questions take more than one answer — nobody has exactly one hobby,
   and people scroll after school AND in bed. So the chips are a
   multi-select: tap as many as you like, they go green, and nothing is
   sent until you hit send.

   "do you post?" is the exception. yes / sometimes / no are mutually
   exclusive, so tapping one there replaces the other. */
const PICK_ONE = new Set(['creator']);

/* what he says when the answer was a shrug */
const NUDGE = {
  name: 'come on, what do your friends call you?',
  hobby: "anything. one thing you'd do instead of scrolling.",
  goal: 'one thing. grades, gym, whatever you actually want.',
  creator: 'do you make stuff and post it, or mostly just watch?',
  when: 'just roughly — night? after school?',
  chat: 'try me. a hobby, a goal, anything.',
};

/* what the keyboard should look like per question */
const KEYBOARD = {
  name: { autoCapitalize: 'words', autoComplete: 'given-name', placeholder: 'your first name' },
  hobby: { autoCapitalize: 'none', placeholder: 'or type something else…' },
  goal: { autoCapitalize: 'none', placeholder: 'or type something else…' },
  creator: { autoCapitalize: 'none', placeholder: 'or say it your own way…' },
  when: { autoCapitalize: 'none', placeholder: 'or type when…' },
  chat: { autoCapitalize: 'none', placeholder: 'tell rilo anything…' },
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

/* turn picks into the about-you shape. In onboarding, picks replace the
   demo defaults in that list (hobbies or goals); in chat they add. */
function applyPicks(about, picks, replaceList) {
  if (!picks.length) return about;
  const on = { ...about.on };
  if (replaceList) replaceList.forEach((k) => (on[k] = false));
  picks.forEach((k) => (on[k] = true));
  return { ...about, on };
}

export default function Talk({
  go,
  mode = 'chat',
  skin,
  name,
  setName,
  setAbout,
  onTalked,
}) {
  const theme = useTheme();
  /* chat only. Onboarding no longer runs through here — its questions
     were replaced by one screen ("what would you rather spend it on?"),
     and the two this list used to hold, "when do you end up scrolling the
     most?" and "are you a content creator?", are gone entirely. */
  const qs = CHAT;
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState(qs[0].ask);
  const [mood, setMood] = useState(qs[0].mood ?? 'curious');
  const [speaking, setSpeaking] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState('');
  /* quick answers tapped but not sent yet */
  const [picked, setPicked] = useState([]);
  const [done, setDone] = useState(false);
  const timers = useRef([]);
  const heardName = useRef('');
  /* The live question number. setStep is async, so a callback created
     before it lands would otherwise answer the previous question. */
  const stepRef = useRef(0);
  /* questions he's already pushed back on once, so he only pushes once */
  const nudged = useRef(new Set());

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const riloSays = (line, m) => {
    setBubble(line);
    if (m) setMood(m);
    setSpeaking(true);
    later(() => setSpeaking(false), speakMs(line));
  };

  useEffect(() => {
    later(() => setSpeaking(false), 1100);
    /* settles the opening line once, on mount */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = qs[Math.min(step, qs.length - 1)];
  const quick = done ? [] : QUICK[q.id] ?? [];
  const one = PICK_ONE.has(q.id);

  /* A single-choice question has nothing to confirm, so tapping an answer
     IS the answer — no second tap on send. Multi-select still needs send,
     because he can't know when you've finished picking. */
  const choose = (label) => {
    if (one) {
      answer(label, { asTyped: true });
      return;
    }
    setPicked((list) =>
      list.includes(label) ? list.filter((x) => x !== label) : list.concat([label]),
    );
  };

  /* everything they've chosen, in one answer. Picks are canonical words
     from our own lists, so they skip the spell-check and the shrug nudge;
     anything they typed themselves still gets both. */
  const ready = picked.length > 0 || draft.trim().length > 0;
  const send = () => {
    if (!ready) return;
    const all = [...picked, draft.trim()].filter(Boolean).join(', ');
    answer(all, { asTyped: picked.length > 0 });
  };
  const keys = KEYBOARD[q.id] ?? KEYBOARD.chat;
  const finish = () =>
    go(mode === 'chat' ? 'home' : 'aboutyou', mode === 'chat' ? 'back' : 'forward');

  const askNext = (next) => {
    stepRef.current = next;
    setDraft('');
    setPicked([]);
    setStep(next);
    riloSays(qs[next].ask, qs[next].mood);
  };

  const answer = (raw, opts = {}) => {
    const text = (raw || '').trim();
    if (!text) return;
    const at = Math.min(stepRef.current, qs.length - 1);
    const asked = qs[at];

    /* "maybe" isn't an answer — ask again, but only once.
       The creator question is exempt: it's a yes/no, and "no" / "yep" are
       exactly the words someone answers it with. */
    const shrug = asked.id === 'creator' ? !creatorIn(text) : isNonAnswer(text);
    if (!opts.asTyped && shrug && !nudged.current.has(asked.id)) {
      nudged.current.add(asked.id);
      setDraft('');
      riloSays(NUDGE[asked.id] ?? "give me something real, even if it's small.", 'coach');
      return;
    }

    setThinking(true);
    track('talk', asked.id);

    let reply = '';

    if (asked.id === 'name') {
      const n = nameIn(text);
      if (n) setName(n);
      heardName.current = n;
      /* No "did i get that right?". It's one tap to fix on the you tab,
         and asking doubled the length of the shortest question here. */
      reply = n ? `nice to meet you, ${n.toLowerCase()}.` : "cool. i'll call you friend for now.";
    } else if (asked.id === 'hobby') {
      const found = hobbiesIn(text);
      setAbout((a) => applyPicks(a, found, HOBBIES));
      reply = found.length
        ? `${joinNice(found)}? love that. that's what i'll point you to.`
        : "ooh okay. i'll learn more about that as we go.";
    } else if (asked.id === 'goal') {
      const found = goalsIn(text);
      setAbout((a) => applyPicks(a, found, GOALS));
      reply = found.length
        ? `${joinNice(found)}. okay, i'm locked in on that.`
        : "got it. we'll work on that together.";
    } else if (asked.id === 'creator') {
      const c = creatorIn(text);
      if (c) setAbout((a) => ({ ...a, creator: c }));
      reply =
        c === 'yes'
          ? "a creator. then posting is work, not scrolling — i'll leave you room for it."
          : c === 'sometimes'
            ? "posting sometimes. you'll get a proper sitting on those, just not forever."
            : c === 'no'
              ? "just watching. that's honest, and it makes my job easier."
              : "we'll sort that one out on the next screen.";
    } else if (asked.id === 'when') {
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
      setDraft('');
      setPicked([]);

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
              `that's all i needed${
                heardName.current || name ? `, ${(heardName.current || name).toLowerCase()}` : ''
              }. i'll remember this.`,
              'proud',
            );
          }
        },
        Math.min(1500, 550 + reply.length * 14),
      );
    }, 220);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: theme.sky,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <ThemeDecor />

      {/* Everything above the composer scrolls. The composer is pinned, so
          the keyboard never covers the field you're typing into — see
          PhoneFrame, which sizes the stage to the space the keyboard
          leaves behind. */}
      <div
        className="scroll-y"
        style={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          boxSizing: 'border-box',
          padding: '54px 22px 0',
          '--tail': '10px',
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
          <span />
          {/* how much is left, so five questions don't feel like twenty */}
          <span style={{ width: 64 }} />
        </div>

        {/* Rilo's line */}
        <div
          key={bubble}
          style={{
            marginTop: 12,
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
              bottom: -10,
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

        {/* He takes the room that was empty. The stage adds its own
            padding for the rings, so a bigger number here mostly fills
            space that was already reserved. */}
        <div style={{ marginTop: 2 }}>
          <RiloStage
            skin={skin}
            mood={mood}
            size={210}
            state={speaking || thinking ? 'talking' : 'idle'}
            onTap={() => !speaking && !thinking && riloSays(bubble)}
          />
        </div>

        <div style={{ flexGrow: 1, minHeight: 0 }} />

      </div>

      {/* ---------- pinned: the way forward, whatever the keyboard does ---------- */}
      {done ? (
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '10px 22px calc(26px + var(--safe-bottom, 0px))',
          }}
        >
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
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '10px 14px calc(14px + var(--safe-bottom, 0px))',
            background: 'var(--card)',
            borderTop: '2px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          {/* tap instead of type, wherever that's possible */}
          {quick.length > 0 && (
            <div className="scroll-x" style={{ display: 'flex', gap: 7, paddingBottom: 2 }}>
              {quick.map((label) => {
                const on = picked.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    className="tap"
                    aria-pressed={on}
                    onClick={() => choose(label)}
                    style={on ? chipOn : chip}
                  >
                    {on ? `✓ ${label}` : label}
                  </button>
                );
              })}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={picked.length ? 'anything else? or just send' : keys.placeholder}
              enterKeyHint="send"
              autoComplete={keys.autoComplete ?? 'off'}
              autoCapitalize={keys.autoCapitalize}
              autoCorrect="on"
              spellCheck={false}
              style={{
                flexGrow: 1,
                minWidth: 0,
                height: 52,
                boxSizing: 'border-box',
                padding: '0 18px',
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                /* 16px at minimum, or iOS zooms the whole page on focus */
                fontSize: 16,
                fontWeight: 600,
                color: '#12301A',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="tap"
              aria-label="send"
              disabled={!ready}
              style={{
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: '50%',
                border: 0,
                background: ready ? '#12301A' : 'rgba(18,48,26,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: ready ? 'pointer' : 'default',
                transition: 'background .18s ease',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12h12M12 6l6 6-6 6"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
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

const chip = {
  flexShrink: 0,
  minHeight: 40,
  padding: '0 15px',
  borderRadius: 999,
  border: '2px solid var(--line)',
  background: 'rgba(255,255,255,0.92)',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#12301A',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/* picked: green, so a glance tells you what's going to be sent.
   Full `border` rather than `borderColor` — React warns about mixing a
   shorthand with a longhand for the same property across a rerender. */
const chipOn = {
  ...chip,
  background: '#2E8B3E',
  border: '2px solid var(--line, #12301A)',
  color: '#FFFFFF',
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
