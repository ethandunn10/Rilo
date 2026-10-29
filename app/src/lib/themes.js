/* App themes — a Rilo Pro feature.

   Grass is the default everyone gets. The rest are Pro (with UNLOCK_ALL on
   in lib/levels, testers can use them all; flip it off and free users see
   them locked). A theme only changes Rilo's world — the sky, what's in it,
   and the hills. Cards, buttons, text and Rilo himself stay the same so
   every screen keeps working in every theme. */

import { createContext, useContext } from 'react';

export const THEMES = [
  {
    id: 'grass',
    name: 'grass',
    tier: 'free',
    blurb: 'sunny meadow, wildflowers, butterflies',
    sky: 'linear-gradient(180deg, #A6DDF0 0%, #CDEDF0 30%, #EAF6E6 58%, #EEF8E6 100%)',
    hills: ['#A8DCA0', '#4CC160', '#2E8B3E'],
    swatch: ['#A6DDF0', '#4CC160'],
  },
  {
    id: 'bamboo',
    name: 'bamboo',
    tier: 'pro',
    blurb: 'golden morning, swaying bamboo, falling leaves',
    sky: 'linear-gradient(180deg, #FFD7A3 0%, #FFE8C4 26%, #F8F1D9 54%, #EAF5E2 100%)',
    hills: ['#A8DCA0', '#4CC160', '#2E8B3E'],
    swatch: ['#FFD7A3', '#8CCB78'],
  },
  {
    id: 'sakura',
    name: 'sakura',
    tier: 'pro',
    blurb: 'cherry blossoms and drifting petals',
    sky: 'linear-gradient(180deg, #FFD3E0 0%, #FFE6EE 30%, #FFF4F2 58%, #F1F7EA 100%)',
    hills: ['#BFE3B0', '#7DCB7A', '#4E9E5A'],
    swatch: ['#FFC2D6', '#7DCB7A'],
  },
  {
    id: 'sunset',
    name: 'sunset',
    tier: 'pro',
    blurb: 'big low sun, warm sky, birds heading home',
    sky: 'linear-gradient(180deg, #FFB08A 0%, #FFCBA4 28%, #FFE3C8 52%, #F3E9DA 100%)',
    hills: ['#B9C98E', '#6FA35E', '#3F7A4A'],
    swatch: ['#FF9E7A', '#6FA35E'],
  },
  {
    id: 'snow',
    name: 'snow',
    tier: 'pro',
    blurb: 'snowy hills and falling snow',
    sky: 'linear-gradient(180deg, #C9E6FA 0%, #E0F0FB 34%, #F2F8FC 62%, #F6FAFD 100%)',
    hills: ['#EEF5FA', '#8EADC4', '#62849E'],
    swatch: ['#C9E6FA', '#E3EEF6'],
  },
];

export const DEFAULT_THEME = 'grass';

export function themeInfo(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const ThemeContext = createContext(THEMES[0]);

export function useTheme() {
  return useContext(ThemeContext);
}
