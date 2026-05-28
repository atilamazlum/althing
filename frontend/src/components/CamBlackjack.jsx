import { useState, useEffect } from 'react';

const SUITS = [
  { s: '♠', c: '#0d0a06' }, { s: '♥', c: '#a01818' },
  { s: '♦', c: '#a01818' }, { s: '♣', c: '#0d0a06' },
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function newDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ r, suit: s.s, color: s.c });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function handValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.r === 'A') { total += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(c.r)) total += 10;
    else total += parseInt(c.r, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

const KEY = 'blackjack-balance';

export default function CamBlackjack({ wordsPurchased = false, onPurchaseWords = () => {} }) {
  const [balance, setBalance] = useState(() => {
    try { return parseInt(sessionStorage.getItem(KEY), 10) || 500; }
    catch { return 500; }
  });
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [reward, setReward] = useState(false);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, String(balance)); } catch {}
    if (balance >= 100 && !reward) setReward(true);
    if (balance <= 0) setState('over');
  }, [balance, reward]);

  function deal() {
    if (balance <= 0) return;
    const d = newDeck();
    const p = [d.pop(), d.pop()];
    const dl = [d.pop(), d.pop()];
    setDeck(d); setPlayer(p); setDealer(dl);
    setResult(null);
    if (handValue(p) === 21) finalize(p, dl, 'blackjack');
    else setState('playing');
  }

  function hit() {
    if (state !== 'playing') return;
    const d = [...deck]; const card = d.pop();
    const p = [...player, card];
    setDeck(d); setPlayer(p);
    if (handValue(p) > 21) finalize(p, dealer, 'bust');
  }

  function stand() {
    if (state !== 'playing') return;
    setState('dealer');
    let dl = [...dealer]; const d = [...deck];
    while (handValue(dl) < 17) dl.push(d.pop());
    setDeck(d); setDealer(dl);
    setTimeout(() => finalize(player, dl, 'stand'), 800);
  }

  function finalize(p, dl, reason) {
    const pv = handValue(p), dv = handValue(dl);
    let outcome, delta;

    if (reason === 'bust' || pv > 21) { outcome = 'BATTIN'; delta = -50; }
    else if (dv > 21) { outcome = 'KRUPİYE BATTI — KAZANDIN'; delta = 60; }
    else if (reason === 'blackjack' && pv === 21 && dv !== 21) { outcome = 'BLACKJACK!'; delta = 60; }
    else if (pv > dv) { outcome = 'KAZANDIN'; delta = 60; }
    else if (pv < dv) { outcome = 'KAYBETTİN'; delta = -50; }
    else { outcome = 'BERABERE'; delta = 0; }

    setBalance((b) => Math.max(0, b + delta));
    setResult({ outcome, delta, pv, dv });
    setState('result');
  }

  function reset() {
    setBalance(500); setReward(false); setState('idle'); setResult(null);
    setPlayer([]); setDealer([]);
    try { sessionStorage.setItem(KEY, '500'); } catch {}
  }

  if (state === 'over') {
    return (
      <Table>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 52, color: '#d8483f', letterSpacing: '0.08em', textShadow: '0 6px 20px rgba(0,0,0,0.9)' }}>
            OYUN BİTTİ
          </div>
          <div style={{ color: '#c9a868', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.3em', marginTop: 16, marginBottom: 32 }}>
            Bakiyen tükendi
          </div>
          <button style={chipBtn} onClick={reset}>♠ YENİDEN BAŞLA · 500₺ ♠</button>
        </div>
      </Table>
    );
  }

  return (
    <Table>
      {/* Üst Bilgi Şeridi */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, gap: 16, flexWrap: 'wrap', zIndex: 10,
      }}>
        {/* Sol - Kelime Hakkı */}
        <div>
          {wordsPurchased ? (
            <div style={{
              background: 'linear-gradient(180deg,#1f5c3a,#0f3a22)',
              color: '#f3eccf', padding: '8px 16px', borderRadius: 14,
              fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 13,
              letterSpacing: '0.08em', fontWeight: 700, border: '1px solid #c9a868',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              🎫 4. CÜMLE HAKKI AKTİF
            </div>
          ) : balance >= 700 ? (
            <button onClick={() => { if (balance >= 700) { setBalance(b => b - 300); onPurchaseWords(); } }} style={premiumBtn}>
              ✦ Kelime Hakkı Al · 300₺
            </button>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.45)', color: '#c9a868', padding: '9px 16px', borderRadius: 14, border: '1px dashed #c9a868', fontSize: 12 }}>
              700₺ biriktir → 4. cümle hakkı
            </div>
          )}
        </div>

        {/* Sağ - Bakiye */}
        <div style={{ textAlign: 'right' }}>
          <div style={balanceStyle}>
            <span style={{ fontSize: 11, opacity: 0.8, letterSpacing: '0.2em' }}>BAKİYE</span>
            <span style={{ fontSize: 26, fontWeight: 700 }}>{balance}₺</span>
          </div>
          <div style={{ fontSize: 9.5, color: '#c9a868', opacity: 0.75, marginTop: 6, letterSpacing: '0.2em' }}>
            +60 KAZANÇ • −50 KAYIP
          </div>
        </div>
      </div>

      {/* Krupiye */}
      <Zone label="KRUPİYE" position="top">
        <Hand>
          {dealer.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={state === 'playing' && i === 1} delay={i * 90} />
          ))}
        </Hand>
        <Score value={state === 'playing' || state === 'idle' ? '?' : handValue(dealer)} />
      </Zone>

      {/* Sonuç Banner */}
      {result && (
        <div style={resultBannerStyle(result.delta)}>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '0.04em' }}>
            {result.outcome}
          </div>
          {result.delta !== 0 && (
            <div style={{ fontSize: 22, marginTop: 8, fontWeight: 700 }}>
              {result.delta > 0 ? '+' : ''}{result.delta}₺
            </div>
          )}
        </div>
      )}

      {/* Oyuncu */}
      <Zone label="SEN" position="bottom" accent="#e8d9a8">
        <Score value={player.length ? handValue(player) : '-'} accent="#e8d9a8" />
        <Hand>
          {player.map((c, i) => <PlayingCard key={i} card={c} delay={i * 90} />)}
        </Hand>
      </Zone>

      {/* Aksiyon Butonları */}
      <div style={actionAreaStyle}>
        {state === 'playing' && (
          <>
            <button style={chipBtn} onClick={hit}>♥ KART ÇEK</button>
            <button style={{ ...chipBtn, background: 'linear-gradient(180deg,#2c2c2c,#111)' }} onClick={stand}>♠ DUR</button>
          </>
        )}
        {(state === 'idle' || state === 'result') && (
          <button style={chipBtn} onClick={deal}>
            {state === 'idle' ? '♦ DAĞIT' : '♦ YENİ EL'}
          </button>
        )}
        {state === 'dealer' && <DealerThinking />}
      </div>
    </Table>
  );
}

/* ==================== TASARIM KOMPONENTLERİ ==================== */

function Table({ children }) {
  return (
    <div style={{
      position: 'relative',
      minHeight: 560,
      borderRadius: 20,
      padding: 16,
      background: 'linear-gradient(180deg, #2c1e12 0%, #3f2a18 40%, #2c1e12 100%)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 0 80px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        minHeight: 520,
        borderRadius: 18,
        background: 'radial-gradient(145% 110% at 50% 45%, #1d6b3e 0%, #0f4a26 65%, #08321a 100%)',
        boxShadow: 'inset 0 8px 30px rgba(0,0,0,0.7), inset 0 -6px 25px rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px 20px 80px',
      }}>
        {/* Masa dokusu */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
        }} />

        {children}
      </div>
    </div>
  );
}

function Zone({ label, position, accent = '#f0e3b8', children }) {
  return (
    <div style={{ marginTop: position === 'bottom' ? 20 : 0, marginBottom: position === 'top' ? 20 : 0, textAlign: 'center' }}>
      <div style={{ color: accent, fontSize: 11, letterSpacing: '0.4em', fontWeight: 700, marginBottom: 10, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
        ▸ {label} ◂
      </div>
      {children}
    </div>
  );
}

function Hand({ children }) {
  return <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', minHeight: 110 }}>{children}</div>;
}

function Score({ value, accent = '#f0e3b8' }) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '6px 20px',
      background: 'rgba(0,0,0,0.6)',
      border: `2px solid ${accent}`,
      borderRadius: 16,
      color: accent,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '0.12em',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      {value}
    </div>
  );
}

function PlayingCard({ card, hidden, delay = 0 }) {
  const baseStyle = {
    width: 68,
    height: 96,
    borderRadius: 8,
    boxShadow: '0 8px 16px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
    animation: `bj-deal 0.45s ${delay}ms backwards cubic-bezier(0.34,1.56,0.64,1)`,
  };

  if (hidden) {
    return (
      <div style={{
        ...baseStyle,
        background: 'repeating-linear-gradient(45deg, #5c1a1a, #5c1a1a 8px, #3f1111 8px, #3f1111 16px)',
        border: '3px solid #e8d9a8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 42, color: '#e8d9a8', opacity: 0.4 }}>♣</div>
      </div>
    );
  }

  return (
    <div style={{
      ...baseStyle,
      background: '#f8f4eb',
      border: '2px solid #1c140a',
      color: card.color,
      display: 'flex',
      flexDirection: 'column',
      padding: '6px 7px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span style={{ fontSize: 22, fontWeight: 800 }}>{card.r}</span>
        <span style={{ fontSize: 17 }}>{card.suit}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
        {card.suit}
      </div>
    </div>
  );
}

/* Buton Stilleri */
const chipBtn = {
  background: 'linear-gradient(180deg, #e8d9a8 0%, #c9a868 50%, #a67f4a 100%)',
  color: '#1a1208',
  border: '3px solid #f3eccf',
  padding: '13px 26px',
  borderRadius: 30,
  cursor: 'pointer',
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: 15,
  letterSpacing: '0.12em',
  fontWeight: 700,
  boxShadow: '0 6px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.5)',
  transition: 'all 0.2s',
};

const premiumBtn = {
  ...chipBtn,
  background: 'linear-gradient(180deg,#d8483f,#7a1f1f)',
  color: '#f3eccf',
  border: '2px solid #f3eccf',
};

const balanceStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'linear-gradient(180deg, #c9a868, #8a6e3a)',
  color: '#1a1208',
  padding: '8px 22px',
  borderRadius: 16,
  boxShadow: '0 6px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
};

const actionAreaStyle = {
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0,
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
  zIndex: 20,
};

const resultBannerStyle = (delta) => ({
  position: 'absolute',
  top: '48%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 30,
  textAlign: 'center',
  animation: 'bj-pop 0.6s cubic-bezier(0.34,1.56,0.64,1)',
  color: delta > 0 ? '#5eb36e' : delta < 0 ? '#e25b4a' : '#e8d9a8',
  textShadow: '0 6px 20px rgba(0,0,0,0.9)',
  WebkitTextStroke: `1.5px ${delta > 0 ? '#1f3a2a' : '#4a1f1f'}`,
});

function DealerThinking() {
  return (
    <div style={{
      color: '#c9a868',
      fontFamily: 'monospace',
      fontSize: 12,
      letterSpacing: '0.35em',
      padding: '12px 24px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid #c9a868',
      borderRadius: 30,
    }}>
      KRUPİYE OYNUYOR...
    </div>
  );
}

/* Animasyonlar */
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes bj-pop {
    0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0; }
    60% { transform: translate(-50%,-50%) scale(1.12); }
    100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
  }
  @keyframes bj-deal {
    0% { transform: translateY(-80px) rotate(-35deg) scale(0.4); opacity: 0; }
    100% { transform: translateY(0) rotate(0) scale(1); opacity: 1; }
  }
`;
document.head.appendChild(styleTag);