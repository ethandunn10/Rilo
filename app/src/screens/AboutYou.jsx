/* AboutYou — port of designs/AboutYou.dc.html, with the testing fixes:
   the longer hobby / goal lists behind "show more", type-ahead on
   "+ add your own", a × to remove chips you added, the content scrolling
   with "continue" pinned, and an optional first name (fixes round 2).

   The chips themselves live in components/ChipPicker so the You screen can
   edit them with exactly the same controls. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';
import ChipPicker from '../components/ChipPicker';

const cardStyle = (delay) => ({
  padding: 16,
  borderRadius: 26,
  background: 'var(--card)',
  border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flexShrink: 0,
  animation: `rise .5s ${delay} ease-out both`,
});

export default function AboutYou({ go, about, setAbout, name, setName, skin, talked }) {
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
      <Sky hills="low" />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '56px 24px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Dots active={2} />

        {/* everything above the pinned button scrolls */}
        <div
          className="scroll-y"
          style={{
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            margin: '0 -4px',
            padding: '0 4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
              animation: 'rise .5s ease-out both',
            }}
          >
            <Rilo skin={skin} mood={talked ? 'proud' : 'curious'} size={84} />
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              {talked ? "here's what i got." : 'tell me about you.'}
              {talked && (
                <span style={{ display: 'block', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 600, color: '#2C4A36' }}>
                  fix anything i got wrong.
                </span>
              )}
            </h1>
          </div>

          {/* optional first name, so Rilo can say hey properly */}
          <div style={cardStyle('.05s')}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}
            >
              what should i call you?
            </p>
            <input
              id="firstName"
              type="text"
              placeholder="first name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="words"
              autoComplete="given-name"
              style={{
                height: 46,
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 999,
                border: '2px solid #12301A',
                background: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#12301A',
              }}
            />
          </div>

          <ChipPicker about={about} setAbout={setAbout} cardStyle={cardStyle} />
        </div>

        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button
          type="button"
          className="tap-94"
          onClick={() => go('pickapps')}
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 58,
            flexShrink: 0,
            border: '2px solid var(--line)',
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          {talked ? 'looks good' : 'continue'}
        </button>
        </div>
      </div>
    </div>
  );
}
