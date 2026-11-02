/* Buddy mode. Invite codes only — no profiles, no search, nobody can look
   you up. Friends see your Rilo's mood and your streak, never your hours.
   DEMO ONLY: codes and friends are local, see src/demo/mockAI.js. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import { makeInviteCode, DEMO_FRIENDS, NUDGE_LINES } from '../demo/mockAI';

const MAX_FRIENDS = 3;

const card = {
  padding: 14,
  borderRadius: 24,
  background: 'rgba(255,255,255,0.82)',
  border: '2px solid var(--line, #12301A)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const MOOD_WORD = {
  proud: 'doing great',
  coach: 'hanging in',
  curious: 'close to the line',
  letdown: 'had a rough one',
  angry: 'way over',
  sleepy: 'asleep',
  wave: 'just started',
};

export default function Buddies({
  go,
  skin,
  buddies = { code: '', friends: [] },
  setBuddies = () => {},
  myMood = 'coach',
  myStreak = 0,
}) {
  const [join, setJoin] = useState('');
  const [said, setSaid] = useState('');

  const friends = buddies.friends ?? [];
  const code = buddies.code || '';

  const makeCode = () => setBuddies({ ...buddies, code: makeInviteCode() });

  const addFriend = () => {
    const typed = join.trim().toUpperCase();
    if (!typed || friends.length >= MAX_FRIENDS) return;
    /* DEMO ONLY: any code works and hands back a scripted friend */
    const next = DEMO_FRIENDS.find((f) => !friends.some((x) => x.id === f.id));
    if (!next) return;
    setBuddies({ ...buddies, friends: friends.concat([{ ...next, code: typed }]) });
    setJoin('');
    setSaid(`${next.name} is in.`);
  };

  const nudge = (id) => {
    setBuddies({
      ...buddies,
      friends: friends.map((f) => (f.id === id ? { ...f, nudged: true } : f)),
    });
    setSaid(NUDGE_LINES[Math.floor(Math.random() * NUDGE_LINES.length)]);
  };

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
          padding: '48px 20px 0',
          '--tail': 'calc(104px + var(--safe-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          buddies
        </h1>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C4A36', flexShrink: 0 }}>
          they see your rilo and your streak. never your hours.
        </p>

        {/* you */}
        <div style={{ ...card, flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
          <Rilo skin={skin} mood={myMood} size={64} talks />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
              you
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              {MOOD_WORD[myMood] ?? 'getting there'} · {myStreak} day streak
            </p>
          </div>
        </div>

        {/* invite */}
        <div style={{ ...card, flexShrink: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
            your invite code
          </p>
          {code ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#1F6B2E',
              }}
            >
              {code}
            </p>
          ) : (
            <button
              type="button"
              className="tap"
              onClick={makeCode}
              style={{
                minHeight: 46,
                borderRadius: 999,
                border: 0,
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              make a code
            </button>
          )}

          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
            or type a friend&apos;s code ({friends.length} of {MAX_FRIENDS})
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={join}
              onChange={(e) => setJoin(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{
                flexGrow: 1,
                minWidth: 0,
                height: 46,
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: '#12301A',
              }}
            />
            <button
              type="button"
              className="tap"
              disabled={friends.length >= MAX_FRIENDS}
              onClick={addFriend}
              style={{
                minHeight: 46,
                padding: '0 18px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: friends.length >= MAX_FRIENDS ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#12301A',
                cursor: friends.length >= MAX_FRIENDS ? 'default' : 'pointer',
              }}
            >
              join
            </button>
          </div>
        </div>

        {said && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1F6B2E', flexShrink: 0 }}>
            {said}
          </p>
        )}

        {/* friends */}
        {friends.map((f) => (
          <div key={f.id} style={{ ...card, flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
            <Rilo skin={f.skin} mood={f.mood} size={60} />
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <p
                style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
              >
                {f.name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
                {MOOD_WORD[f.mood] ?? 'getting there'} · {f.streak} day streak
              </p>
            </div>
            <button
              type="button"
              className="tap"
              onClick={() => nudge(f.id)}
              style={{
                flexShrink: 0,
                minHeight: 42,
                padding: '0 14px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: f.nudged ? '#12301A' : '#FFFFFF',
                color: f.nudged ? '#FFFFFF' : '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f.nudged ? 'nudged' : 'nudge'}
            </button>
          </div>
        ))}

        {!friends.length && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C4A36', flexShrink: 0 }}>
            nobody yet. send someone your code, or type theirs.
          </p>
        )}
      </div>

      <TabBar active="you" go={go} skin={skin} />
    </div>
  );
}
