import { useEffect, useRef } from 'react';

// Yargıç tokmağı — karar üretilirken tam ekran. CSS ile çizili, görsel dosyası gerekmez.
// Tokmak periyodik olarak iner, "DARBE" anında ekran sarsılır + ses çalar.
export default function GavelOverlay({ title = 'Hüküm veriliyor', subtitle = 'Tokmak kalkıyor...' }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // Her vuruşta ses — /public/sounds/gavel.mp3 koyarsan çalar
    const playHit = () => {
      const a = new Audio('/sounds/gavel.mp3');
      a.volume = 0.6;
      a.play().catch(() => {});
    };
    // Animasyon 2sn döngü; vuruş ~0.55sn'de iniyor
    playHit();
    const interval = setInterval(playHit, 2000);
    audioRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'radial-gradient(120% 90% at 50% 30%, #2a2018 0%, #16110c 60%, #0c0805 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      className="gavel-stage"
    >
      <div style={{ position: 'relative', width: 240, height: 200 }}>
        {/* tokmak — inip kalkan */}
        <div className="gavel-arm">
          {/* sap */}
          <div
            style={{
              position: 'absolute',
              left: 104,
              top: 0,
              width: 14,
              height: 110,
              background: 'linear-gradient(90deg,#5a3a1a,#8a5a2a,#5a3a1a)',
              borderRadius: 4,
              transformOrigin: 'bottom center',
            }}
          />
          {/* tokmak başı */}
          <div
            style={{
              position: 'absolute',
              left: 70,
              top: -34,
              width: 82,
              height: 50,
              background: 'linear-gradient(180deg,#9a6a32,#6a4420)',
              borderRadius: 8,
              border: '2px solid #3a2410',
              boxShadow: 'inset 0 3px 6px rgba(255,220,170,0.3)',
            }}
          />
        </div>
        {/* ses bloğu — tokmağın indiği yer */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            bottom: 0,
            width: 120,
            height: 26,
            background: 'linear-gradient(180deg,#8a5a2a,#4a2e14)',
            borderRadius: 5,
            border: '2px solid #2a1808',
          }}
        />
      </div>

      {/* DARBE yazısı — vuruş anında flaş */}
      <div className="gavel-impact">DARBE</div>

      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 28,
            color: '#f3eccf',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#8a7a5a',
          }}
        >
          {subtitle}
        </div>
      </div>

      <style>{`
        .gavel-arm {
          position: absolute;
          inset: 0;
          transform-origin: 111px 110px;
          animation: gavel-swing 2s ease-in-out infinite;
        }
        @keyframes gavel-swing {
          0%   { transform: rotate(-42deg); }
          22%  { transform: rotate(-42deg); }
          30%  { transform: rotate(8deg); }
          34%  { transform: rotate(0deg); }
          50%  { transform: rotate(-42deg); }
          100% { transform: rotate(-42deg); }
        }
        .gavel-stage {
          animation: gavel-shake 2s ease-in-out infinite;
        }
        @keyframes gavel-shake {
          0%,28%,38%,100% { transform: translate(0,0); }
          30% { transform: translate(-3px, 2px); }
          32% { transform: translate(3px, -2px); }
          34% { transform: translate(-2px, 1px); }
          36% { transform: translate(2px, 0); }
        }
        .gavel-impact {
          position: absolute;
          font-family: "DM Serif Display", Georgia, serif;
          font-size: 64px;
          color: #7a1f1f;
          -webkit-text-stroke: 2px #f3eccf;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0;
          animation: gavel-darbe 2s ease-out infinite;
        }
        @keyframes gavel-darbe {
          0%,28% { opacity: 0; transform: scale(0.4) rotate(-8deg); }
          31% { opacity: 0.92; transform: scale(1.15) rotate(-8deg); }
          44% { opacity: 0; transform: scale(1.3) rotate(-8deg); }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
