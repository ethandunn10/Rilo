/* Onboarding progress dots.
   Exactly as drawn in HowItWorks / Instead / AboutYou / PickApps:
   active dot is a 28x8 ink pill, the rest are 8x8 translucent white. */

export default function Dots({ active = 0, count = 4 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={
            i === active
              ? { width: 28, height: 8, borderRadius: 4, background: '#12301A' }
              : { width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.8)' }
          }
        />
      ))}
    </div>
  );
}
