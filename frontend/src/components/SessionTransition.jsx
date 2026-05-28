import { useEffect, useRef, useState } from 'react';
import { pickRandomQuote, toRoman } from '../data/justice-quotes.js';

const DURATION_MS = 14000;
const FADE_MS = 700;

export default function SessionTransition({ turnNumber, onDone }) {
  const [quote] = useState(() => pickRandomQuote());
  const [phase, setPhase] = useState('in'); // in → hold → out
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const tIn = setTimeout(() => setPhase('hold'), 900);
    const tOut = setTimeout(() => setPhase('out'), DURATION_MS - FADE_MS);
    const tEnd = setTimeout(() => {
      if (onDoneRef.current) onDoneRef.current();
    }, DURATION_MS);
    return () => { clearTimeout(tIn); clearTimeout(tOut); clearTimeout(tEnd); };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'out' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(120% 90% at 50% 30%, #f5eed6 0%, #e8dcb8 55%, #d8c89e 100%)',
      }}
    >
      <span style={cornerStyle('tl')} />
      <span style={cornerStyle('tr')} />
      <span style={cornerStyle('bl')} />
      <span style={cornerStyle('br')} />

      <div
        className={`transition-all duration-1000 text-center px-8 ${
          phase === 'in' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="font-mono text-xs tracking-[0.5em] uppercase mb-4" style={{ color: '#7a1f1f' }}>
          Oturum
        </div>

        <div
          className="font-display text-[120px] md:text-[190px] leading-none tracking-wider"
          style={{ color: '#7a1f1f', textShadow: '0 4px 24px rgba(122,31,31,0.25)' }}
        >
          {toRoman(turnNumber)}
        </div>

        <div className="font-mono text-sm tracking-[0.3em] uppercase mt-4 mb-10" style={{ color: '#5a4a3a' }}>
          başlıyor
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span style={{ width: 50, height: 1, background: '#7a1f1f', opacity: 0.4 }} />
          <span style={{ color: '#7a1f1f', fontSize: 18 }}>❦</span>
          <span style={{ width: 50, height: 1, background: '#7a1f1f', opacity: 0.4 }} />
        </div>

        <div className="max-w-2xl mx-auto">
          <p className="font-body italic text-xl md:text-2xl leading-relaxed" style={{ color: '#2a2018' }}>
            "{quote.text}"
          </p>
          <p className="font-mono text-xs tracking-[0.25em] uppercase mt-4" style={{ color: '#7a1f1f' }}>
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}

function cornerStyle(pos) {
  const base = {
    position: 'absolute', width: 26, height: 26,
    borderColor: '#7a1f1f', borderStyle: 'solid', opacity: 0.5,
  };
  const m = 28;
  if (pos === 'tl') return { ...base, top: m, left: m, borderWidth: '2px 0 0 2px' };
  if (pos === 'tr') return { ...base, top: m, right: m, borderWidth: '2px 2px 0 0' };
  if (pos === 'bl') return { ...base, bottom: m, left: m, borderWidth: '0 0 2px 2px' };
  return { ...base, bottom: m, right: m, borderWidth: '0 2px 2px 0' };
}
