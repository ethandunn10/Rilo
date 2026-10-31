/* PickApps — port of designs/PickApps.dc.html, with the testing fixes:
   real Simple Icons logos instead of letters, a slide-up search sheet for
   "add another app", and the list scrolling with the button pinned.

   The rows live in components/AppPicker so the You screen edits them with
   exactly the same controls. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';
import AppPicker from '../components/AppPicker';
import { APP_CATALOG, STARTING_APPS, pickedApps } from '../lib/apps';

export default function PickApps({ go, apps, setApps, skin }) {
  /* nothing is pre-checked, so there's nothing to turn on until they pick */
  const picked = pickedApps(apps).length > 0;

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
          gap: 14,
        }}
      >
        <Dots active={3} />

        {/* everything above the pinned button scrolls */}
        <div
          className="scroll-y"
          style={{
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            margin: '0 -4px',
            padding: '0 4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              animation: 'rise .5s ease-out both',
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1, minWidth: 0 }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.05,
                }}
              >
                which apps steal your time?
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: '#2C4A36',
                }}
              >
                i'll check in when you open these.
              </p>
            </div>
            {/* Rilo is on every onboarding page except the paywall */}
            <Rilo skin={skin} mood="coach" size={76} />
          </div>

          <AppPicker
            apps={apps}
            setApps={setApps}
            style={{
              padding: '4px 16px',
              borderRadius: 26,
              background: 'var(--card)',
              border: '2px solid var(--line)',
              boxShadow: '0 4px 0 var(--line)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              animation: 'rise .5s .1s ease-out both',
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.45,
              color: '#2C4A36',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {picked
              ? "rilo uses apple's screen time to see when you open these."
              : 'pick at least one for rilo to watch.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <button
          type="button"
          className="tap-97"
          disabled={!picked}
          onClick={() => go('permission')}
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 58,
            flexShrink: 0,
            border: '2px solid var(--line)',
            borderRadius: 999,
            background: picked ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
            color: picked ? '#12301A' : 'rgba(18,48,26,0.45)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: picked ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          turn on screen time
        </button>
        </div>
      </div>
    </div>
  );
}
