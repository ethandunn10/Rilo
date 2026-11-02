/* What Rilo says when you poke him.

   Not advice and not a nudge — poking him is meant to be a small bit of
   fun, so none of these ask anything of you or mention your limits. The
   moment one of them reads like a lecture it stops being a reward for
   tapping and starts being a reason not to.

   Each line can carry a mood, which shows for as long as the line does and
   then reverts. Most have none, so he just keeps the face the screen gave
   him — a screen where he's meant to look let down shouldn't suddenly beam
   because you tapped him. */

export const RILO_LINES = [
  { say: 'oi.' },
  { say: 'that tickles.', mood: 'proud' },
  { say: 'yes? i was napping.', mood: 'sleepy' },
  { say: "i'm a panda, not a button." },
  { say: 'again? okay, again.', mood: 'curious' },
  { say: 'bamboo would be nice.', mood: 'curious' },
  { say: 'still here.', mood: 'wave' },
  { say: 'do that once more. i dare you.', mood: 'coach' },
  { say: 'poke.', mood: 'wave' },
  { say: 'this is my whole job, you know.' },
  { say: "careful, i'm ticklish.", mood: 'proud' },
  { say: 'mm?', mood: 'sleepy' },
];

/* How long the line hangs around. Matches the CSS animation so the text
   disappears exactly when the fade finishes. */
export const SAY_MS = 2000;

/* A different line each time, as far as that's possible — a random pick
   repeats itself about every other tap with a list this size, which reads
   as broken rather than random. Pass the last index you used. */
export function nextLine(lastIndex = -1) {
  if (RILO_LINES.length < 2) return { index: 0, ...RILO_LINES[0] };
  let i = lastIndex;
  while (i === lastIndex) i = Math.floor(Math.random() * RILO_LINES.length);
  return { index: i, ...RILO_LINES[i] };
}
