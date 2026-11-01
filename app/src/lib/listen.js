/* Talking to Rilo.

   useListen() wraps the browser's built-in speech-to-text (Chrome, Safari,
   iOS Safari 14.5+). The mic is ONLY on while you hold / tap the button —
   never in the background. If the browser has no speech-to-text, or the
   tester says no to the mic, `supported` goes false and the screens fall
   back to typing.

   understand() turns what you said into the same chips About you uses, so a
   spoken answer and a tapped chip end up in exactly the same place. */

import { useEffect, useRef, useState } from 'react';

const SR =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/* Remember a refusal. iOS Safari has no permissions API to ask up front, so
   the only way to know is to try once — after that the app must stop
   offering voice entirely rather than asking again every screen. */
const BLOCKED_KEY = 'rilo.micBlocked';

function wasBlocked() {
  try {
    return localStorage.getItem(BLOCKED_KEY) === '1';
  } catch {
    return false;
  }
}

function forgetBlocked() {
  try {
    localStorage.removeItem(BLOCKED_KEY);
  } catch {
    /* storage off — nothing was remembered anyway */
  }
}

function rememberBlocked() {
  try {
    localStorage.setItem(BLOCKED_KEY, '1');
  } catch {
    /* storage off — it just asks again next session */
  }
}

export function useListen() {
  const [supported] = useState(Boolean(SR));
  /* mic refused or missing — the whole app hides its voice bits when true */
  const [blocked, setBlockedState] = useState(wasBlocked);

  const setBlocked = (v) => {
    setBlockedState(v);
    if (v) rememberBlocked();
  };
  const [listening, setListening] = useState(false);
  /* has the mic actually been granted, and are we mid-request? */
  const [granted, setGranted] = useState(false);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState('');
  /* a human-readable reason the last attempt failed, '' when fine */
  const [problem, setProblem] = useState('');
  const rec = useRef(null);
  const finalText = useRef('');
  const lastText = useRef('');
  const onDone = useRef(null);
  const gotAudio = useRef(false);
  /* start() awaits the permission prompt, so two quick taps could both
     get past the `listening` check and build two recognisers — one of
     which immediately aborts the other. */
  const starting = useRef(false);

  useEffect(() => () => rec.current?.abort?.(), []);

  /* Ask the browser up front whether the mic is already refused, so screens
     can hide their talk buttons instead of offering something that fails. */
  useEffect(() => {
    let alive = true;
    navigator.permissions
      ?.query({ name: 'microphone' })
      .then((p) => {
        if (alive && p.state === 'denied') setBlocked(true);
        p.onchange = () => alive && setBlocked(p.state === 'denied');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* Ask for the mic up front. Chrome shows its prompt here, so a denial is
     reported properly instead of the recogniser dying half a second later. */
  const permission = async () => {
    if (gotAudio.current) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setGranted(true);
      return true;
    }
    /* Check a mic actually exists before prompting. Safari will happily put
       up a permission dialog on a machine with no input device, which is
       the one thing worse than not offering voice at all. */
    try {
      const devices = await navigator.mediaDevices.enumerateDevices?.();
      if (devices && devices.length && !devices.some((d) => d.kind === 'audioinput')) {
        setBlocked(true);
        setProblem('no mic found — you can type instead.');
        return false;
      }
    } catch {
      /* can't enumerate — fall through and let the prompt decide */
    }

    setAsking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      gotAudio.current = true;
      setGranted(true);
      setAsking(false);
      return true;
    } catch {
      setAsking(false);
      setBlocked(true);
      setProblem('no mic access — you can type instead.');
      return false;
    }
  };

  const start = async (done) => {
    if (!SR || listening || starting.current) return;
    starting.current = true;
    setProblem('');
    if (!(await permission())) {
      starting.current = false;
      return;
    }

    onDone.current = done;
    finalText.current = '';
    lastText.current = '';
    setText('');

    try {
      const r = new SR();
      r.lang = 'en-US';
      r.interimResults = true;
      r.continuous = true;

      r.onresult = (e) => {
        let interim = '';
        let fin = '';
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fin += t;
          else interim += t;
        }
        finalText.current = fin;
        lastText.current = (fin + ' ' + interim).trim();
        setText(lastText.current);
      };

      /* Say what went wrong rather than going quiet. A bad run never
         disables the mic for good — they can always tap again. */
      r.onerror = (e) => {
        /* an error can fire without onend — never leave it stuck "listening" */
        setListening(false);
        rec.current = null;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          gotAudio.current = false;
          setBlocked(true);
          setProblem('no mic access — you can type instead.');
        } else if (e.error === 'network') {
          setProblem("couldn't reach the speech service. check wifi, or type instead.");
        } else if (e.error === 'no-speech') {
          setProblem("didn't catch that. try again, or type instead.");
        } else if (e.error === 'audio-capture') {
          setBlocked(true);
          setProblem('no mic found — you can type instead.');
        }
      };

      r.onend = () => {
        setListening(false);
        rec.current = null;
        const out = (finalText.current || '').trim() || lastText.current;
        setText(out);
        const fn = onDone.current;
        onDone.current = null;
        if (fn) fn(out);
      };

      rec.current = r;
      r.start();
      setListening(true);
    } catch {
      setProblem("couldn't start the mic. type instead.");
    } finally {
      starting.current = false;
    }
  };

  const stop = () => {
    if (!rec.current) {
      setListening(false);
      return;
    }
    try {
      rec.current.stop();
    } catch {
      rec.current = null;
      setListening(false);
    }
  };

  /* the only flag screens should check: can we actually offer talking? */
  const usable = supported && !blocked;

  /* A refusal is remembered, so there has to be a way to take it back. */
  const retry = () => {
    forgetBlocked();
    gotAudio.current = false;
    setBlockedState(false);
    setProblem('');
  };

  /* Walk away without answering — reaching for the keyboard shouldn't
     submit half a sentence. Clearing onDone first is what makes it a
     cancel rather than a stop. */
  const cancel = () => {
    starting.current = false;
    onDone.current = null;
    finalText.current = '';
    lastText.current = '';
    const r = rec.current;
    rec.current = null;
    setListening(false);
    setText('');
    try {
      r?.abort?.();
    } catch {
      /* already gone */
    }
  };

  return {
    /* app-talk's screens read `supported` as "can we offer talking at all" */
    supported: usable,
    hasSpeech: supported,
    usable,
    cancel,
    retry,
    blocked,
    granted,
    asking,
    listening,
    text,
    setText,
    start,
    stop,
    /* ask for the mic on its own, so the screen can explain itself first */
    request: permission,
    problem,
    setProblem,
  };
}

/* Rilo talking out loud (optional, off by default) */
export function say(line, on) {
  if (!on || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(line);
    u.pitch = 1.5;
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* no voice — the bubble still shows the line */
  }
}

/* ---------- understanding what you said ---------- */

const HOBBY_WORDS = {
  basketball: /basketball|hoop|hooping|ball(ing)?\b|free throws/,
  soccer: /soccer|futbol/,
  football: /football/,
  golf: /golf/,
  gym: /gym|lift|lifting|work(ing)? ?out|weights/,
  running: /\brun(ning)?\b|track|cross country|jog/,
  skating: /skat|skateboard/,
  swimming: /swim/,
  gaming: /gam(e|es|ing)|xbox|playstation|ps5|fortnite|minecraft|valorant|2k/,
  'making videos': /video|filming|film|youtube|edit(ing)?|content|tiktoks?\b/,
  photography: /photo|camera|pictures/,
  drawing: /draw|art\b|sketch|paint/,
  music: /music|sing|beats|rap/,
  guitar: /guitar/,
  piano: /piano/,
  reading: /read(ing)?\b|books?/,
  writing: /writ(e|ing)/,
  coding: /cod(e|ing)|program|apps?\b|computer/,
  cooking: /cook|bak(e|ing)/,
  'hanging with friends': /friends|hang(ing)? out/,
};

const GOAL_WORDS = {
  'better grades': /grades|school|gpa|ap\b|test|study|class/,
  'get fit': /fit|in shape|muscle|strong|weight|abs/,
  'grow my content': /grow|followers|content|page|views|audience|brand/,
  'build something': /build|startup|business|company|app|make money online/,
  'sleep more': /sleep|bed/,
  'read more': /read more|more books/,
  'learn an instrument': /instrument|guitar|piano|drums/,
  'make a team': /make (the )?team|varsity|tryouts|starting lineup|\bstarter\b/,
  'less phone': /less phone|phone less|screen ?time|off my phone|stop scrolling/,
  'save money': /save|money|saving/,
  'learn to code': /learn (to )?code|coding|programming/,
  'spend time with family': /family|parents|siblings|brother|sister/,
};

/* ---------- near-enough matching ----------
   People mistype and speech-to-text mishears. "noght" should still get
   you to night, so a typo that's one letter off a word Rilo knows turns
   into a question rather than a shrug. */

function editDistance(a, b) {
  /* full matrix, because swapped letters ("tierd" for "tired") need the
     row before last to be counted as a single mistake */
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/* One mistake in most words, two only in long ones. Looser than this and
   near-misses start colliding — "fishing" was being read as "filming". */
function near(word, target) {
  if (word === target) return true;
  if (target.length < 5) return false;
  if (Math.abs(word.length - target.length) > 2) return false;
  return editDistance(word, target) <= (target.length <= 7 ? 1 : 2);
}

function tokens(text) {
  return text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter(Boolean);
}

/* The words worth correcting, per question. Only plain words — nothing
   Rilo already catches with a pattern. */
const VOCAB = {
  when: [
    'night', 'nights', 'late', 'bed', 'bedtime', 'sleep', 'school', 'class',
    'classes', 'lunch', 'morning', 'mornings', 'homework', 'study', 'studying',
    'bored', 'boring', 'evening', 'afternoon', 'weekend', 'weekends', 'dinner',
    'breakfast', 'practice', 'work',
  ],
  hobby: [
    'basketball', 'soccer', 'football', 'golf', 'gym', 'lifting', 'running',
    'track', 'skating', 'skateboard', 'swimming', 'gaming', 'fortnite',
    'minecraft', 'valorant', 'filming', 'editing', 'photography', 'camera',
    'drawing', 'painting', 'sketching', 'music', 'singing', 'guitar', 'piano',
    'drums', 'reading', 'books', 'writing', 'coding', 'programming', 'cooking',
    'baking', 'friends', 'fishing', 'hunting', 'boxing', 'wrestling', 'tennis',
    'volleyball', 'baseball', 'hockey', 'dancing', 'chess', 'karate',
  ],
  goal: [
    'grades', 'school', 'college', 'study', 'fitness', 'muscle', 'stronger',
    'followers', 'content', 'business', 'startup', 'sleep', 'reading', 'books',
    'instrument', 'guitar', 'piano', 'varsity', 'tryouts', 'money', 'saving',
    'coding', 'programming', 'family', 'parents', 'siblings',
  ],
};

/* "noght" on the when question -> { typo: 'noght', meant: 'night' }.
   Nothing is returned when they spelled it right, or when nothing in the
   list is close, so Rilo only asks when he has a real guess. */
export function didYouMean(text, which) {
  /* the chat on Home takes hobbies and goals both */
  const list = which === 'chat' ? [...VOCAB.hobby, ...VOCAB.goal] : VOCAB[which];
  if (!list) return null;
  const toks = tokens(text);
  /* already said something he knows → no need to second-guess them */
  if (toks.some((t) => list.includes(t))) return null;

  for (const t of toks) {
    if (t.length < 4) continue;
    const hit = list.find((target) => target !== t && near(t, target));
    if (hit) return { typo: t, meant: hit };
  }
  return null;
}

function matches(text, table) {
  const t = ` ${text.toLowerCase()} `;
  return Object.keys(table).filter((k) => table[k].test(t));
}

export const hobbiesIn = (text) => matches(text, HOBBY_WORDS);
export const goalsIn = (text) => matches(text, GOAL_WORDS);

/* "my name's ethan" / "i'm ethan" / "ethan" → "Ethan" */
const EXPLICIT =
  /(?:my name is|my name's|names|name's|the name is|i am|i'm|im|call me|they call me|you can call me|everyone calls me|people call me|this is|it's|its)\s+([a-z][a-z'-]*)/;

/* Filler people actually say before getting to the point. Repeated letters
   are allowed, because "ohhh" and "ummm" come through exactly like that. */
const FILLER =
  /^(o+h+|a+h+|h+m+|u+m+|u+h+|e+r+|y+e+a+h?|yep|yup|yes|no|ok|okay|alright|right|well|so|like|just|actually|i|its|it's|is|and|then|hi+|hey+|hello+|yo+|sup|wait|sorry|my|name|call|me|am|a|the)$/;

/* words that are never the answer, even on their own */
const NOT_A_NAME = new Set([
  'the', 'a', 'an', 'and', 'but', 'is', 'am', 'are', 'my', 'me', 'you', 'your',
  'what', 'who', 'thats', "that's", 'nice', 'good', 'hello', 'there', 'name',
  /* shrugs and hedges — people say these before giving a name, or instead
     of giving one, and neither case makes them the name */
  'maybe', 'idk', 'idc', 'dunno', 'nothing', 'none', 'nope', 'nah', 'sure',
  'whatever', 'anything', 'something', 'stuff', 'things', 'guess', 'dont',
  "don't", 'know', 'not', 'uhh', 'umm', 'erm', 'eh',
]);

function tidyName(word) {
  if (!word || word.length > 16) return '';
  if (!/^[a-z][a-z'-]*$/.test(word)) return '';
  if (NOT_A_NAME.has(word) || FILLER.test(word)) return '';
  return word
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

export function nameIn(text) {
  const clean = text.trim().toLowerCase().replace(/[.!?,]/g, '');

  /* "oh my name is ethan", "hey i'm ethan" — take what follows the lead-in */
  const explicit = clean.match(EXPLICIT);
  if (explicit) {
    const got = tidyName(explicit[1]);
    if (got) return got;
  }

  /* otherwise walk past the filler and take the first real word:
     "ohhh umm yeah ethan" -> Ethan */
  const words = clean.split(/\s+/).filter(Boolean);
  for (const w of words) {
    const got = tidyName(w);
    if (got) return got;
  }
  return '';
}

/* Hedges and shrugs. "maybe" is not a hobby and "idk" is not a goal, so
   Rilo pushes once instead of writing it down. */
const NON_ANSWER =
  /^(?:(?:u+m+|u+h+|h+m+|o+h+|a+h+|e+h+|well|like|so|y+e+a+h?|idk|idc|maybe|dunno|nothing|none|nope|no|yes|yep|sure|not sure|i don'?t know|don'?t know|i guess|guess|whatever|anything|something|stuff|things|ok|okay|hi+|hey+)[\s,.!?]*)+$/i;

export function isNonAnswer(text) {
  const t = (text || '').trim();
  if (!t) return true;
  return NON_ANSWER.test(t);
}

/* ---------- "are you a content creator, or post pretty often?" ----------
   A yes / sometimes / no question, answered out loud in whatever words
   people actually use.

   Order matters, and it goes middle, no, yes:
     - An explicit frequency wins over a negation, because "i'm not a
       creator but i post sometimes" is a sometimes, not a no. So does a
       degree qualifier: "i barely post" and "i don't post much" both mean
       a little, which is not the same as never.
     - The "no" family then beats the "yes" family, so "i don't post" can't
       be read as a yes off the word "post" sitting in it.
   Where it's genuinely ambiguous ("no, not much") it lands on sometimes,
   which is the kinder error: they get room to post, and the About you
   screen right after lets them correct it either way.

   Returns '' when it can't tell at all, and Rilo asks once more. */
export function creatorIn(text) {
  const t = (text || '').toLowerCase();

  if (
    /\b(?:sometimes|occasionally|rarely|kinda|sorta)\b|now and then|once in a while|every so often|here and there|not much|not often|a few times|couple times|a bit|don'?t post much|dont post much|hardly|barely/.test(
      t,
    )
  ) {
    return 'sometimes';
  }

  if (
    /\b(?:no|nope|nah|never|lurk|lurker)\b|not really|just watch|only watch|i watch|don'?t post|dont post|do not post|never post|not a creator/.test(
      t,
    )
  ) {
    return 'no';
  }

  if (
    /\b(?:yes|yeah|yep|yup|ya|sure|definitely|creator|influencer|youtuber|tiktoker|streamer|content)\b|all the time|every day|everyday|daily|a lot|lots|constantly|i post|post a lot|make videos|making videos|make content|film/.test(
      t,
    )
  ) {
    return 'yes';
  }

  return '';
}

/* what you said on the pop-up → which screen */
export function reasonIn(text) {
  const t = text.toLowerCase();
  if (/never ?mind|nah|nothing|no reason|close it/.test(t)) return 'never mind';
  if (/tired|sleepy|exhausted|fried|can't think/.test(t)) return 'just tired';
  if (/bored|nothing to do|boring/.test(t)) return "i'm bored";
  if (/break|earned|rest|chill/.test(t)) return 'taking a break';
  if (/need|homework|school|message|text|dm|reply|post|upload|work|look up|check/.test(t))
    return 'need it';
  return null;
}

/* a human list: ["a","b","c"] → "a, b and c" */
export function joinNice(list) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/* "tiktok and insta" → ['tiktok','instagram'] (only apps in the catalog) */
const APP_ALIASES = {
  instagram: /insta|\big\b|instagram/,
  youtube: /youtube|\byt\b|shorts/,
  snapchat: /snap/,
  x: /twitter|\bx\b/,
  tiktok: /tik ?tok/,
  'clash royale': /clash/,
  'disney+': /disney/,
  'prime video': /prime/,
};
export function appsIn(text, labels) {
  const t = ` ${text.toLowerCase()} `;
  return labels.filter((l) => (APP_ALIASES[l] ? APP_ALIASES[l].test(t) : t.includes(` ${l} `) || t.includes(` ${l}s `)));
}

/* "like five hours, i want two" → [5, 2]  ("half" adds .5) */
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
export function hoursIn(text) {
  const t = text.toLowerCase().replace(/an hour/g, '1 hour').replace(/a half/g, 'half');
  const out = [];
  const re = /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)( and half| and a half|½)?/g;
  let m;
  while ((m = re.exec(t))) {
    let n = WORDS[m[1]] ?? parseFloat(m[1]);
    if (m[2]) n += 0.5;
    if (n > 0 && n <= 16) out.push(n);
  }
  return out;
}
