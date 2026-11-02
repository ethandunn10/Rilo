/* A guided, click-through Creator Mode demo. The Instagram view and Reels
   interception are simulated; iOS cannot inspect Instagram's internal UI. */
import { useEffect, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import BackButton from '../components/BackButton';
import TabBar from '../components/TabBar';

const card = {
  padding: 16,
  borderRadius: 24,
  background: 'var(--card)',
  border: '2px solid var(--line)',
  boxShadow: '0 4px 0 var(--line)',
};
const primary = {
  width: '100%',
  minHeight: 50,
  border: 0,
  borderRadius: 999,
  background: '#12301A',
  color: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 17,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function CreatorMode({ go, skin, isPro, active, stats, onStart, onFinish, onUseNormalLimit }) {
  const [purpose, setPurpose] = useState('post');
  const [duration, setDuration] = useState(10);
  const [now, setNow] = useState(Date.now());
  const [reelsAttempts, setReelsAttempts] = useState(0);
  const [alert, setAlert] = useState('');
  const [screen, setScreen] = useState(active ? 'instagram' : 'task');

  useEffect(() => {
    if (!active?.duration) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active?.startedAt, active?.duration]);

  const remaining = active?.duration
    ? Math.max(0, Math.ceil((active.startedAt + active.duration * 60000 - now) / 1000))
    : null;

  useEffect(() => {
    if (active?.duration && remaining === 0 && !alert) setAlert('time-up');
  }, [active?.duration, remaining, alert]);

  const elapsedMinutes = () => {
    if (!active) return 0;
    const elapsed = Math.max(1, Math.ceil((Date.now() - active.startedAt) / 60000));
    return active.duration ? Math.min(active.duration, elapsed) : elapsed;
  };

  const start = () => {
    setAlert('');
    setReelsAttempts(0);
    setScreen('instagram');
    onStart(purpose, duration);
  };

  const finish = () => {
    if (active) onFinish({ task: active.task, minutes: elapsedMinutes() });
    setAlert('');
    setScreen('task');
  };

  const tryReels = () => {
    if (reelsAttempts === 0) {
      setReelsAttempts(1);
      setAlert('nudge');
    } else {
      setReelsAttempts(2);
      setAlert('kicked');
    }
  };

  const useNormalLimit = () => {
    if (active) onUseNormalLimit({ task: active.task, minutes: elapsedMinutes() });
    setAlert('');
    setScreen('task');
  };

  const optionStyle = (selected) => ({
    minHeight: 44,
    flex: 1,
    borderRadius: 999,
    border: selected ? '2px solid #12301A' : '2px solid rgba(18,48,26,.18)',
    background: selected ? '#12301A' : '#FFFFFF',
    color: selected ? '#FFFFFF' : '#12301A',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  });

  let content;
  if (!isPro) {
    content = <div style={{ ...card, textAlign: 'center' }}><Rilo skin="gold" mood="coach" size={112} /><h2 style={{ fontFamily: 'Fredoka, sans-serif' }}>Creator Mode is Pro</h2><p>Focused Instagram sessions for posting a video or doing research, with Creator time kept separate from your daily goal.</p><button className="tap-94" onClick={() => go('upgrade')} style={primary}>see Rilo Pro</button></div>;
  } else if (active && screen === 'instagram') {
    const posting = active.task === 'post';
    const taskLabel = posting ? 'posting a video' : 'doing research';
    const alertCopy = alert === 'nudge'
      ? { title: 'Back to your creator task.', body: `You opened Instagram for ${taskLabel}. Reels can wait. Go back to your ${posting ? 'video' : 'research'}.`, action: `back to ${posting ? 'posting' : 'research'}` }
      : alert === 'kicked'
        ? { title: 'That’s two Reels tries.', body: 'Rilo is closing Instagram in this demo. If you open it again, your usual Instagram time limits apply.', action: 'close Instagram' }
        : alert === 'time-up'
          ? { title: 'Creator time is up.', body: 'Rilo is closing Instagram in this demo. Your usual Instagram time limits apply if you open it again.', action: 'close Instagram' }
          : null;

    content = <>
      <div style={{ ...card, padding: 13, background: '#F8F9F7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 11, borderBottom: '1px solid rgba(18,48,26,.12)' }}>
          <AppLogo label="instagram" variant="brand" size={34} radius={11} />
          <div style={{ flex: 1 }}><p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600 }}>Instagram</p><p style={{ margin: 0, color: '#54705B', fontSize: 11, fontWeight: 700 }}>CREATOR MODE DEMO</p></div>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600 }}>{active.duration ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : '∞'}</span>
        </div>
        <div style={{ padding: '14px 2px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Rilo skin={skin} mood="proud" size={42} /><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#405C47' }}>focused session · {taskLabel}</p></div>
          <div style={{ minHeight: 190, borderRadius: 18, background: 'linear-gradient(150deg, #D8F1D3, #A8D9B0 52%, #5B9C68)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, boxSizing: 'border-box', textAlign: 'center' }}>
            <span style={{ fontSize: 42 }}>{posting ? '🎥' : '🔎'}</span>
            <strong style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, color: '#12301A' }}>{posting ? 'your video is ready to post' : 'look for ideas with a purpose'}</strong>
            <span style={{ maxWidth: 220, fontSize: 12, fontWeight: 600, color: '#24442B' }}>This sample screen stands in for Instagram. No post or research content is created in Rilo.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 5, paddingTop: 8, borderTop: '1px solid rgba(18,48,26,.12)' }}>
          <span style={{ color: '#54705B', fontSize: 11, fontWeight: 700 }}>HOME</span>
          <button type="button" className="tap" onClick={() => setScreen('instagram')} style={{ border: 0, background: 'transparent', color: '#54705B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>POST</button>
          <button type="button" className="tap" onClick={() => setScreen('instagram')} style={{ border: 0, background: 'transparent', color: '#54705B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>SEARCH</button>
          <button type="button" className="tap" onClick={tryReels} style={{ minHeight: 38, padding: '0 12px', border: '2px solid #D55C4C', borderRadius: 999, background: '#FFF4F1', color: '#9D3429', fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>REELS</button>
        </div>
        <p style={{ margin: '9px 0 0', textAlign: 'center', color: '#55725C', fontSize: 11, fontWeight: 600 }}>Tap Reels to see Rilo’s reminder. Try it twice.</p>
      </div>

      {alertCopy && <div role="dialog" aria-modal="true" aria-labelledby="creator-alert-title" style={{ position: 'absolute', zIndex: 4, inset: '0 0 94px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', background: 'rgba(10,32,16,.58)', animation: 'scrim-in .2s ease-out both' }}>
        <div style={{ width: '100%', boxSizing: 'border-box', padding: 18, border: '3px solid #FFFFFF', borderRadius: 28, background: '#F1F8EC', boxShadow: '0 7px 0 rgba(10,32,16,.25)', textAlign: 'center', animation: 'rise14 .35s ease-out both' }}>
          <div style={{ height: 102, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}><Rilo skin={skin} mood={alert === 'nudge' ? 'coach' : 'letdown'} size={112} motion="jump" /></div>
          <p style={{ margin: '3px 0 5px', color: '#347244', fontSize: 10, fontWeight: 800, letterSpacing: '.1em' }}>{alert === 'nudge' ? 'RILO POP-UP · FIRST TRY' : 'RILO SHIELD · DEMO'}</p>
          <h2 id="creator-alert-title" style={{ margin: '0 auto 8px', fontFamily: 'Fredoka, sans-serif', fontSize: 24, lineHeight: 1.08 }}>{alertCopy.title}</h2>
          <p style={{ margin: '0 auto 15px', color: '#365642', fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{alertCopy.body}</p>
          <button className="tap-94" onClick={alert === 'nudge' ? () => setAlert('') : useNormalLimit} style={primary}>{alertCopy.action}</button>
        </div>
      </div>}

      <button type="button" className="tap" onClick={finish} style={{ ...primary, marginTop: 12, background: '#FFFFFF', border: '2px solid var(--line)', color: '#12301A' }}>finish creator session</button>
      <p style={{ margin: 0, padding: '0 4px', color: '#5A7A64', fontSize: 11, fontWeight: 600, lineHeight: 1.35 }}>This is a click-through web demo. iPhone can limit the whole Instagram app, but Rilo can’t see Reels inside it.</p>
    </>;
  } else {
    content = <>
      <div style={card}><p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>today: {stats?.todayMinutes ?? 0} Creator minutes</p><p style={{ margin: '3px 0 0', color: '#3D5A46', fontSize: 12 }}>tracked separately from your daily goal</p></div>
      <div style={card}><p style={{ margin: '0 0 10px', fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>What are you opening Instagram for?</p><div style={{ display: 'flex', gap: 8 }}><button className="tap" aria-pressed={purpose === 'post'} onClick={() => setPurpose('post')} style={optionStyle(purpose === 'post')}>post a video</button><button className="tap" aria-pressed={purpose === 'research'} onClick={() => setPurpose('research')} style={optionStyle(purpose === 'research')}>research</button></div></div>
      <div style={card}><p style={{ margin: '0 0 10px', fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>How long?</p><div style={{ display: 'flex', gap: 7 }}>{[5, 10, null].map((item) => <button key={item ?? 'open'} className="tap" aria-pressed={duration === item} onClick={() => setDuration(item)} style={optionStyle(duration === item)}>{item ? `${item} min` : 'no limit'}</button>)}</div></div>
      <button className="tap-94" onClick={start} style={primary}>go on Instagram</button>
      <p style={{ margin: 0, padding: '0 4px', color: '#5A7A64', fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>This demo simulates Instagram. On iPhone, Rilo can limit the whole app; it can’t see Reels or pop up over that screen.</p>
    </>;
  }

  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', color: '#12301A', fontFamily: 'Inter, system-ui, sans-serif' }}><Sky hills="low" /><div className="scroll-y" style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '40px 20px 0', '--tail': 'calc(112px + var(--safe-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}><BackButton onBack={() => go('you', 'back')} /><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Rilo skin={skin} mood="curious" size={68} talks /><div><p style={{ margin: 0, color: '#2C4A36', fontSize: 11, fontWeight: 700, letterSpacing: '.08em' }}>RILO PRO</p><h1 style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 28 }}>creator mode</h1></div></div>{content}</div><TabBar active="you" go={go} skin={skin} /></div>;
}
