/* The onboarding lists, and turning the picked hobbies into Rilo's suggestion.

   Lists and the "show the top ~10, then a show-more chip" split come from the
   "Fixes from Ethan's testing" section of RILO_SPEC.md.

   Rilo's suggestions use the hobbies picked in onboarding. basketball is the
   design's own example, so its wording is copied verbatim from
   Suggestion.dc.html — with the default picks the screens read exactly as
   designed. The others follow the same shape in the same voice. */

export const HOBBIES = [
  'basketball',
  'soccer',
  'football',
  'golf',
  'gym',
  'running',
  'skating',
  'swimming',
  'gaming',
  'making videos',
  /* --- behind "show more" --- */
  'photography',
  'drawing',
  'music',
  'guitar',
  'piano',
  'reading',
  'writing',
  'coding',
  'cooking',
  'hanging with friends',
];

export const GOALS = [
  'better grades',
  'get fit',
  'grow my content',
  'build something',
  'sleep more',
  'read more',
  'learn an instrument',
  'make a team',
  'less phone',
  'save money',
  /* --- behind "show more" --- */
  'learn to code',
  'spend time with family',
];

/* how many of each are shown before "show more" */
export const HOBBIES_SHOWN = 10;
export const GOALS_SHOWN = 10;

const SUGGESTIONS = {
  basketball: {
    bubble: "bored? perfect time for those free throws. {app} will still be here.",
    task: 'shoot 50 free throws',
    meta: 'about 20 min · +40 xp',
  },
  soccer: {
    bubble: 'bored? perfect time to go take some shots. {app} will still be here.',
    task: 'take 50 shots on goal',
    meta: 'about 25 min · +40 xp',
  },
  football: {
    bubble: 'bored? perfect time to go throw some routes. {app} will still be here.',
    task: 'throw some routes',
    meta: 'about 30 min · +40 xp',
  },
  golf: {
    bubble: 'bored? perfect time to work on your swing. {app} will still be here.',
    task: 'hit a bucket of balls',
    meta: 'about 30 min · +40 xp',
  },
  gym: {
    bubble: 'bored? perfect time to get a session in. {app} will still be here.',
    task: 'go get your session in',
    meta: 'about 45 min · +40 xp',
  },
  running: {
    bubble: 'bored? perfect time to get a couple miles in. {app} will still be here.',
    task: 'run a couple miles',
    meta: 'about 25 min · +40 xp',
  },
  skating: {
    bubble: 'bored? perfect time to go land that trick. {app} will still be here.',
    task: 'go land that trick',
    meta: 'about 30 min · +40 xp',
  },
  swimming: {
    bubble: 'bored? perfect time to swim some laps. {app} will still be here.',
    task: 'swim 20 laps',
    meta: 'about 30 min · +40 xp',
  },
  gaming: {
    bubble: 'bored? play something you actually choose. the feed picks for you.',
    task: 'play an actual game',
    meta: 'about 30 min · +40 xp',
  },
  'making videos': {
    bubble: 'bored? perfect time to film something. {app} will still be here.',
    task: 'film 2 videos',
    meta: 'about 30 min · +40 xp',
  },
  photography: {
    bubble: 'bored? perfect time to go shoot something. {app} will still be here.',
    task: 'go shoot 20 frames',
    meta: 'about 30 min · +40 xp',
  },
  drawing: {
    bubble: 'bored? perfect time to fill a page. {app} will still be here.',
    task: 'fill one page',
    meta: 'about 25 min · +40 xp',
  },
  music: {
    bubble: 'bored? perfect time to practice. {app} will still be here.',
    task: 'practice for 20 minutes',
    meta: 'about 20 min · +40 xp',
  },
  guitar: {
    bubble: 'bored? perfect time to run your scales. {app} will still be here.',
    task: 'run your scales',
    meta: 'about 20 min · +40 xp',
  },
  piano: {
    bubble: 'bored? perfect time to run your scales. {app} will still be here.',
    task: 'run your scales',
    meta: 'about 20 min · +40 xp',
  },
  reading: {
    bubble: 'bored? perfect time for those 20 pages. {app} will still be here.',
    task: 'read 20 pages',
    meta: 'about 25 min · +40 xp',
  },
  writing: {
    bubble: 'bored? perfect time to get some words down. {app} will still be here.',
    task: 'write 300 words',
    meta: 'about 25 min · +40 xp',
  },
  coding: {
    bubble: 'bored? perfect time to ship something small. {app} will still be here.',
    task: 'ship one small thing',
    meta: 'about 30 min · +40 xp',
  },
  cooking: {
    bubble: 'bored? perfect time to cook something real. {app} will still be here.',
    task: 'cook something real',
    meta: 'about 30 min · +40 xp',
  },
  'hanging with friends': {
    bubble: 'bored? text someone and actually go do something. the feed can wait.',
    task: 'text someone, go outside',
    meta: 'about an hour · +40 xp',
  },
};

/* First hobby the user left switched on, in the order they were shown. */
export function pickedHobby(about) {
  const all = HOBBIES.concat(about.extra.hobby);
  return all.find((h) => about.on[h]) ?? null;
}

/* `app` is the app they were about to open, so Rilo names the right one. */
export function suggestion(about, app = 'the feed') {
  const fill = (s) => s.replace('{app}', app);
  const hobby = pickedHobby(about);

  if (!hobby) {
    return {
      hobby: null,
      bubble: fill('bored? anything beats the feed right now. {app} will still be here.'),
      task: 'get outside for 20 min',
      meta: 'about 20 min · +40 xp',
    };
  }

  const known = SUGGESTIONS[hobby];
  if (known) return { hobby, ...known, bubble: fill(known.bubble) };

  /* a hobby the tester typed in themselves */
  return {
    hobby,
    bubble: fill(`bored? perfect time for ${hobby}. {app} will still be here.`),
    task: `20 minutes of ${hobby}`,
    meta: 'about 20 min · +40 xp',
  };
}
