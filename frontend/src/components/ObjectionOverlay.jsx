import { useEffect, useState } from 'react';

const DURATION_MS = 1600;

// İTİRAZ patlama overlay'i — tur sırasında oyuncu bastığında çıkar.
// trigger: { key } değişince yeni patlama. fromSelf: kendin mi bastın.
export default function ObjectionOverlay({ trigger, fromSelf }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);

    // Ses — /public/sounds/objection.mp3 koyarsan çalar, yoksa sessiz
    const audio = new Audio('/sounds/objection.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});

    const t = setTimeout(() => setActive(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* hızlı flaş */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(122,31,31,0.22)',
          animation: 'obj-flash 0.35s ease-out',
        }}
      />
      {/* eğik İTİRAZ baloncuğu */}
      <div
        style={{
          transform: 'rotate(-8deg)',
          animation: 'obj-pop 0.4s cubic-bezier(0.34,1.56,0.64,1), obj-shake 0.5s 0.4s ease-in-out',
        }}
      >
        <div
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 'clamp(48px, 11vw, 110px)',
            fontWeight: 700,
            color: '#f3eccf',
            background: '#7a1f1f',
            padding: '0.15em 0.45em',
            border: '5px solid #f3eccf',
            borderRadius: 14,
            boxShadow: '0 0 0 4px #7a1f1f, 0 14px 40px rgba(0,0,0,0.55)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            WebkitTextStroke: '1px rgba(0,0,0,0.25)',
          }}
        >
          İtiraz!
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 8,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#f3eccf',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          {fromSelf ? 'İtiraz ettin' : 'İtiraz edildi'}
        </div>
      </div>

      <style>{`
        @keyframes obj-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes obj-pop {
          0% { transform: rotate(-8deg) scale(0.2); opacity: 0; }
          70% { transform: rotate(-8deg) scale(1.12); opacity: 1; }
          100% { transform: rotate(-8deg) scale(1); opacity: 1; }
        }
        @keyframes obj-shake {
          0%,100% { transform: rotate(-8deg) translateX(0); }
          20% { transform: rotate(-8deg) translateX(-9px); }
          40% { transform: rotate(-8deg) translateX(9px); }
          60% { transform: rotate(-8deg) translateX(-6px); }
          80% { transform: rotate(-8deg) translateX(6px); }
        }
      `}</style>
    </div>
  );
}
