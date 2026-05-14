import { useEffect, useRef } from 'react';

// Mahkeme kararı reveal videosu — yargıç kararı verdikten sonra
// tam ekran oynar, bitince onEnded çağırır.

export default function VerdictVideoReveal({ videoSrc, onEnded }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Önce sesli oynatmayı dene
    v.muted = false;
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        // Tarayıcı sesli autoplay'i engelledi — sessiz dene
        v.muted = true;
        v.play().catch(() => onEnded && onEnded());
      });
    }
  }, []);

  function handleError() {
    // Video dosyası yoksa ya da bozuksa, doğrudan geç
    if (onEnded) onEnded();
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        className="w-full h-full object-contain"
        style={{ background: '#000' }}
        onEnded={() => onEnded && onEnded()}
        onError={handleError}
      />
    </div>
  );
}
