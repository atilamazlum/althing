import { useEffect } from 'react';

export default function LetterModal({ title, kicker, content, onClose }) {
  // ESC ile kapat + arkadaki sayfayı scroll'dan kilitle
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      <style>{`
        .letter-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .letter-scroll::-webkit-scrollbar-track {
          background: rgba(20, 16, 12, 0.04);
          border-left: 1px solid rgba(20, 16, 12, 0.08);
        }
        .letter-scroll::-webkit-scrollbar-thumb {
          background: #7a1f1f;
          border: 2px solid #f1e8d4;
        }
        .letter-scroll::-webkit-scrollbar-thumb:hover {
          background: #921e1e;
        }
        .letter-scroll {
          scrollbar-width: thin;
          scrollbar-color: #7a1f1f rgba(20, 16, 12, 0.04);
        }
        @keyframes letter-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes letter-paper-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .letter-backdrop { animation: letter-backdrop-in 220ms ease-out; }
        .letter-paper    { animation: letter-paper-in 360ms cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-ink/80 backdrop-blur-md letter-backdrop">
        <div
          className="relative w-full max-w-3xl paper letter-paper shadow-deep flex flex-col"
          style={{ maxHeight: '92vh' }}
        >
          {/* Köşe markaları (yargısal evrak hissi) */}
          <span className="pointer-events-none absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-ink/40" />
          <span className="pointer-events-none absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-ink/40" />
          <span className="pointer-events-none absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 border-ink/40" />
          <span className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 border-ink/40" />

          {/* HEADER */}
          <div className="px-8 md:px-14 pt-12 pb-5 relative">
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="absolute top-5 right-5 w-9 h-9 border border-ink hover:bg-ink hover:text-parchment font-mono text-sm flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {kicker && (
              <div className="font-mono text-[10px] tracking-[0.45em] uppercase text-ink-faded mb-4 text-center">
                {kicker}
              </div>
            )}

            {title && (
              <h1 className="font-display text-3xl md:text-4xl text-center text-ink leading-tight">
                {title}
              </h1>
            )}

            {/* Süs ayıraç */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="h-px bg-ink-faded/40 flex-1 max-w-[90px]" />
              <span className="text-oxblood text-base leading-none">❦</span>
              <span className="h-px bg-ink-faded/40 flex-1 max-w-[90px]" />
            </div>
          </div>

          {/* BODY (scroll'lu) */}
          <div className="letter-scroll overflow-y-auto px-8 md:px-14 pb-10 flex-1">
            <div className="font-body text-[17px] md:text-[18px] leading-[1.85] whitespace-pre-wrap text-ink first-letter:font-display first-letter:text-4xl first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-oxblood">
              {content}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-8 md:px-14 py-4 border-t border-ink-faded/30 flex items-center justify-between bg-parchment/40">
            <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">
            
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-ink hover:bg-ink hover:text-parchment transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </>
  );
}