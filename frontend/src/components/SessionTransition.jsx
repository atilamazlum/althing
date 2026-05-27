import { useEffect, useRef, useState } from 'react';
import { pickRandomQuote, toRoman } from '../data/justice-quotes.js';

const DURATION_MS = 14000;
const FADE_MS = 700;

export default function SessionTransition({ turnNumber, onDone }) {
  const [quote] = useState(() => pickRandomQuote());
  const [phase, setPhase] = useState('in'); // in → hold → out
  // onDone'u ref'te tut — yeniden render'da timer'lar sıfırlanmasın
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const tIn = setTimeout(() => setPhase("hold"), 900);
    const tOut = setTimeout(() => setPhase('out'), DURATION_MS - FADE_MS);
    const tEnd = setTimeout(() => {
      if (onDoneRef.current) onDoneRef.current();
    }, DURATION_MS);
    return () => {
      clearTimeout(tIn);
      clearTimeout(tOut);
      clearTimeout(tEnd);
    };
    // Boş bağımlılık — sadece mount/unmount'ta çalışsın, room state güncellemelerinde sıfırlanmasın
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink text-parchment transition-opacity duration-700 ${
        phase === 'out' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`transition-all duration-1000 text-center px-8 ${
          phase === 'in' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="font-mono text-xs tracking-[0.5em] uppercase text-parchment/60 mb-4">
          Oturum
        </div>
        <div
          className="font-display text-[140px] md:text-[200px] leading-none tracking-wider text-oxblood-bright"
          style={{ textShadow: '0 0 40px rgba(168,40,40,0.5)' }}
        >
          {toRoman(turnNumber)}
        </div>
        <div className="font-mono text-sm tracking-[0.3em] uppercase text-parchment/80 mt-4 mb-12">
          başlıyor
        </div>

        <div className="max-w-2xl mx-auto border-t border-parchment/30 pt-8">
          <p className="font-body italic text-xl md:text-2xl leading-relaxed text-parchment/90">
            "{quote.text}"
          </p>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-parchment/60 mt-4">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
