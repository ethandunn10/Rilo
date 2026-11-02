/* The weekly card, sized 9:16 for stories. Drawn to a canvas so the save
   button hands over a real PNG — no library, no server. */

import { useEffect, useRef, useState } from 'react';
import Rilo from '../components/Rilo';
import { useTheme } from '../lib/themes';
import { fmtMins } from '../lib/plan';

const W = 1080;
const H = 1920;

export default function ShareCard({ go, skin, level, streak, week, total }) {
  const theme = useTheme();
  const holder = useRef(null);
  const [saved, setSaved] = useState('');

  useEffect(() => () => setSaved(''), []);

  /* Draw the card at full story size, then hand back a PNG. The Rilo on
     screen is inline SVG, so it gets serialised into the canvas. */
  const save = async () => {
    const node = holder.current?.querySelector('svg');
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.sky);
    grad.addColorStop(1, theme.hills[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#12301A';
    ctx.textAlign = 'center';

    const line = (text, y, size, weight = 700, color = '#12301A') => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Fredoka, system-ui, sans-serif`;
      ctx.fillText(text, W / 2, y);
    };

    line('rilo', 190, 72, 600, '#2C4A36');
    line('time i got back', 300, 96);
    line(fmtMins(week), 470, 190, 700, '#1F6B2E');
    line('this week', 560, 56, 600, '#2C4A36');

    if (node) {
      const svg = new XMLSerializer().serializeToString(node);
      const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      await new Promise((done) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, W / 2 - 300, 640, 600, 600);
          done();
        };
        img.onerror = done;
        img.src = url;
      });
    }

    line(`${streak} day streak`, 1400, 76);
    line(`level ${level}`, 1500, 64, 600, '#2C4A36');
    line(`${fmtMins(total)} back in total`, 1620, 56, 600, '#2C4A36');
    line('tryrilo.vercel.app', 1800, 44, 600, '#3D5A46');

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rilo-week.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSaved('saved to your downloads.');
    }, 'image/png');
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
      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '44px 22px 0',
          '--tail': '26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          your week
        </h1>

        {/* the card itself, 9:16 */}
        <div
          ref={holder}
          style={{
            width: '100%',
            maxWidth: 300,
            aspectRatio: '9 / 16',
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: 18,
            borderRadius: 26,
            background: `linear-gradient(180deg, ${theme.sky}, ${theme.hills[1]})`,
            border: '2px solid var(--line, #12301A)',
            boxShadow: '0 16px 40px rgba(10,40,20,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>rilo</p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              time i got back
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 44,
                fontWeight: 700,
                color: '#1F6B2E',
                lineHeight: 1,
              }}
            >
              {fmtMins(week)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              this week
            </p>
          </div>

          <Rilo skin={skin} mood="proud" size={150} talks />

          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {streak} day streak
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              level {level} · {fmtMins(total)} back in total
            </p>
          </div>
        </div>

        {saved && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1F6B2E' }}>{saved}</p>
        )}

        <div style={{ flexGrow: 1, minHeight: 6 }} />

        <button
          type="button"
          className="tap"
          onClick={save}
          style={{
            width: '100%',
            height: 56,
            flexShrink: 0,
            border: 0,
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 19,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
          }}
        >
          save image
        </button>

        <button
          type="button"
          className="tap"
          onClick={() => go('progress', 'back')}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#12301A',
            padding: 8,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          back
        </button>
      </div>
    </div>
  );
}
