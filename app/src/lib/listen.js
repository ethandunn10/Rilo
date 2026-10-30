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

export function useListen() {
  const [supported] = useState(Boolean(SR));
  /* mic refused or missing — the whole app hides its voice bits when true */
  const [blocked, setBlocked] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  /* a human-readable reason the last attempt failed, '' when fine */
  const [problem, setProblem] = useState('');
  const rec = useRef(null);
  const finalText = useRef('');
  const lastText = useRef('');
  const onDone = useRef(null);
  const gotAudio = useRef(false);

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
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      gotAudio.current = true;
      return true;
    } catch {
      setBlocked(true);
      setProblem('no mic. allow it in the address bar, or type instead.');
      return false;
    }
  };

  const start = async (done) => {
    if (!SR || listening) return;
    setProblem('');
    if (!(await permission())) return;

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
          setProblem('mic is blocked. allow it in the address bar, or type instead.');
        } else if (e.error === 'network') {
          setProblem("couldn't reach the speech service. check wifi, or type instead.");
        } else if (e.error === 'no-speech') {
          setProblem("didn't catch that. try again, or type instead.");
        } else if (e.error === 'audio-capture') {
          setBlocked(true);
          setProblem('no microphone found. type instead.');
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

  return { supported, usable, blocked, listening, text, setText, start, stop, problem, setProblem };
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

function matches(text, table) {
  const t = ` ${text.toLowerCase()} `;
  return Object.keys(table).filter((k) => table[k].test(t));
}

export const hobbiesIn = (text) => matches(text, HOBBY_WORDS);
export const goalsIn = (text) => matches(text, GOAL_WORDS);

/* "my name's ethan" / "i'm ethan" / "ethan" → "Ethan" */
export function nameIn(text) {
  const t = text.trim().replace(/[.!?,]/g, '');
  const m = t.match(/(?:my name is|my name's|name's|i'm|i am|call me|it's|its)\s+([a-z'-]+)/i);
  const word = m ? m[1] : t.split(/\s+/).slice(-1)[0];
  if (!word || word.length > 16) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/* what you said on the pop-up → which screen */
export function reasonIn(text) {
  const t = text.toLowerCase();
  /* "nothing to do" is the bored answer, so don't let plain "nothing" eat it */
  if (/never ?mind|nah|nothing(?! to do)|no reason|close it/.test(t)) return 'never mind';
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
