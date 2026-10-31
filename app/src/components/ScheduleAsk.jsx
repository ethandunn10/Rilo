/* The few questions Rilo asks before he builds a day. Tap answers only,
   so it takes about fifteen seconds.

   DEMO ONLY: the questions and the rules they feed live in
   demo/mockAI.js. In the mobile app a real model does this. */

import { useState } from 'react';
import Rilo from './Rilo';
import { SCHEDULE_QUESTIONS } from '../demo/mockAI';

export default function ScheduleAsk({ skin, onBuild, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = SCHEDULE_QUESTIONS[step];
  const picked = answers[q.id];
  const ready = q.multi ? (picked ?? []).length > 0 : Boolean(picked);
  const last = step === SCHEDULE_QUESTIONS.length - 1;

  const choose = (id) => {
    if (q.multi) {
      const now = answers[q.id] ?? [];
      setAnswers({
        ...answers,
        [q.id]: now.includes(id) ? now.filter((x) => x !== id) : now.concat([id]),
      });
    } else {
      const next = { ...answers, [q.id]: id };
      setAnswers(next);
      if (!last) setStep(step + 1);
      else onBuild(next);
    }
  };

  const isOn = (id) => (q.multi ? (picked ?? []).includes(id) : picked === id);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 26,
        background: 'rgba(255,255,255,0.94)',
        border: '2px solid var(--line, #12301A)',
        boxShadow: '0 10px 28px rgba(10,40,20,0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'rise .4s ease-out both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Rilo skin={skin} mood="curious" size={62} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 21,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {q.ask}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#2C4A36' }}>
            {step + 1} of {SCHEDULE_QUESTIONS.length}
            {q.multi ? ' · pick any' : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="tap"
            onClick={() => choose(o.id)}
            style={{
              minHeight: 46,
              padding: '0 16px',
              borderRadius: 999,
              border: '2px solid var(--line, #12301A)',
              background: isOn(o.id) ? '#12301A' : '#FFFFFF',
              color: isOn(o.id) ? '#FFFFFF' : '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {q.multi && (
        <button
          type="button"
          className="tap"
          disabled={!ready}
          onClick={() => (last ? onBuild(answers) : setStep(step + 1))}
          style={{
            minHeight: 50,
            borderRadius: 999,
            border: 0,
            background: ready ? '#12301A' : 'rgba(18,48,26,0.25)',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            cursor: ready ? 'pointer' : 'default',
          }}
        >
          {last ? 'build my day' : 'next'}
        </button>
      )}

      <button
        type="button"
        className="tap"
        onClick={onCancel}
        style={{
          border: 0,
          background: 'transparent',
          color: '#2C4A36',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          padding: 4,
          cursor: 'pointer',
        }}
      >
        never mind
      </button>
    </div>
  );
}
