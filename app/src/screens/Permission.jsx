/* Screen Time permission.

   The web can't actually read Screen Time, so this is the real iOS flow
   faked: Rilo asks, Apple's sheet appears, and whichever way they answer
   decides how honest the numbers downstream can be. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

const btn = {
  width: '100%',
  height: 56,
  borderRadius: 999,
  border: 0,
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
};

/* Apple's own sheet, near enough: centred, blurred behind, two buttons
   split by a hairline. Deliberately not in Rilo's voice — the system
   doesn't speak like Rilo. */
function SystemSheet({ onAllow, onDeny }) {
  /* Rilo can't reach into Apple's sheet, so he points at it instead. */
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(3px)',
        animation: 'scrim-in .25s ease-out both',
      }}
    >
      <div
        role="dialog"
        aria-label="Screen Time permission"
        style={{
          width: 270,
          borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(250,250,250,0.94)',
          backdropFilter: 'blur(20px)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          textAlign: 'center',
          color: '#000000',
          animation: 'ios-pop .22s cubic-bezier(.2,.9,.3,1.1) both',
        }}
      >
        <div style={{ padding: '19px 16px 15px' }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>
            “Rilo” Would Like to Access Screen Time
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.33, color: '#1C1C1E' }}>
            Providing Rilo access to Screen Time may allow it to see your activity data,
            restrict content, and limit the use of apps and websites.
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(60,60,67,0.29)' }} />

        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={onDeny}
            style={{
              flex: 1,
              height: 44,
              border: 0,
              background: 'transparent',
              color: '#007AFF',
              fontSize: 17,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Don&apos;t Allow
          </button>
          <div style={{ width: 1, background: 'rgba(60,60,67,0.29)' }} />
          <button
            type="button"
            onClick={onAllow}
            style={{
              flex: 1,
              height: 44,
              border: 0,
              background: 'transparent',
              color: '#007AFF',
              fontSize: 17,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Rilo pointing at the button he needs */}
      <div
        style={{
          width: 270,
          marginTop: 10,
          display: 'flex',
          animation: 'rise .45s .35s ease-out both',
        }}
      >
        <span style={{ flex: 1 }} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 30,
              lineHeight: 1,
              color: '#FFFFFF',
              textShadow: '0 2px 6px rgba(0,0,0,0.45)',
              animation: 'point-up 1.1s ease-in-out infinite',
            }}
          >
            &#8593;
          </span>
          <p
            style={{
              margin: 0,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            tap here
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Permission({ skin, onAllow, onDeny, onSkip, onTriedAgain }) {
  const [sheet, setSheet] = useState(false);
  const [denied, setDenied] = useState(false);

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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '72px 24px 0',
          '--tail': '34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Rilo skin={skin} mood={denied ? 'letdown' : 'coach'} size={190} />

        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'center',
            animation: 'rise .5s .1s ease-out both',
          }}
        >
          {denied
            ? "no problem. i'll go off your hours and your goal instead."
            : 'i need to see where your time goes to build your plan.'}
        </p>

        <div style={{ flexGrow: 1 }} />

        {denied ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="tap"
              onClick={() => {
                onTriedAgain();
                setDenied(false);
                setSheet(true);
              }}
              style={btn}
            >
              try again
            </button>
            <button
              type="button"
              className="tap"
              onClick={onSkip}
              style={{
                width: '100%',
                height: 52,
                boxSizing: 'border-box',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              keep going without it
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" className="tap" onClick={() => setSheet(true)} style={btn}>
              allow
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => {
                setDenied(true);
                onDeny();
              }}
              style={{
                width: '100%',
                height: 52,
                boxSizing: 'border-box',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              don&apos;t allow
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <SystemSheet
          onAllow={() => {
            setSheet(false);
            onAllow();
          }}
          onDeny={() => {
            setSheet(false);
            setDenied(true);
            onDeny();
          }}
        />
      )}
    </div>
  );
}
