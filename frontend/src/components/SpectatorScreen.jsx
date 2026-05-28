import { useState, useEffect } from 'react';
import { socket } from '../socket.js';
import CamBlackjack from './CamBlackjack.jsx';

// İzleyici ekranı — karanlık güvenlik locası (FNAF), parchment/oxblood ekran (tema).

const PHASE_LABEL = {
  COMPLAINT: 'Müşteki şikayetini yazıyor',
  GENERATING_INDICTMENT: 'İddianame hazırlanıyor',
  COURT: 'Duruşma sürüyor',
  EXTENSION_VOTE: 'Uzatma oylaması',
  GENERATING_VERDICT: 'Yargıç karar veriyor',
  GENERATING_COUNSEL: 'Danışmanlar söz alıyor',
  COMPLETE: 'Dava sonuçlandı',
};

const CAMERAS = [
  { id: 1, label: 'CAM 1A', name: 'Duruşma Salonu' },
  { id: 2, label: 'CAM 2B', name: 'Kumar Masası' },
];

// PALET — sıcak FNAF
const C = {
  roomDark: '#0a0705',
  roomMid: '#1a120c',
  frame: '#2a1d12',
  frameLit: '#5a3a1a',
  screenBg: '#1a130c',
  paper: '#f3eccf',
  paperDeep: '#e3d6b0',
  ink: '#1a1410',
  oxblood: '#7a1f1f',
  amber: '#c9a868',
  red: '#d8483f',
  faded: '#7a6a4a',
};

export default function SpectatorScreen({ room }) {
  const [activeCam, setActiveCam] = useState(1);
  const [paper, setPaper] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCd, setCommentCd] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wordsPurchased, setWordsPurchased] = useState(() => {
    try { return sessionStorage.getItem(`wordbuyout-${room.code}`) === 'true'; }
    catch { return false; }
  });

  const COMMENT_LIMIT = wordsPurchased ? 260 : 200;

  function handlePurchaseWords() {
    try { sessionStorage.setItem(`wordbuyout-${room.code}`, 'true'); } catch {}
    setWordsPurchased(true);
    setFeedback('🎫 4. cümle hakkı satın alındı — yorumun artık 260 karaktere kadar olabilir.');
  }

  const commentsLocked = room.phase !== 'COMPLETE';

  // Cooldown sayacı
  useEffect(() => {
    if (commentCd <= 0) return;
    const t = setInterval(() => setCommentCd((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [commentCd]);
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(''), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  function submitComment() {
    if (!commentText.trim() || commentCd > 0 || commentsLocked) return;
    socket.emit('spectator-comment', { code: room.code, text: commentText }, (res) => {
      if (res?.error) {
        setFeedback(res.error);
        if (res.cooldown) setCommentCd(res.cooldown);
        return;
      }
      setCommentText('');
      setCommentCd(120);
      setFeedback('Yorumun kaydedildi — karar kağıdının altında çıkacak.');
    });
  }
  const turns = room.turns || [];
  // Davacı'nın orijinal şikayeti = açılış beyanı, turlarının başına ekle
  const davaciAll = [];
  if (room.complaint?.text) {
    davaciAll.push({ role: 'davaci', text: room.complaint.text, isOpening: true });
  }
  davaciAll.push(...turns.filter((t) => t.role === 'davaci'));
  const sanikTurns = turns.filter((t) => t.role === 'sanik');
  const davaciName = room.davaci?.anonName || 'Müşteki';
  const sanikName = room.sanik?.displayName || 'Sanık';

  return (
    <div
      style={{
        minHeight: '100%',
        background:
          `radial-gradient(90% 70% at 50% 18%, ${C.roomMid} 0%, #100a06 60%, ${C.roomDark} 100%)`,
        padding: '18px 12px 28px',
        position: 'relative',
      }}
    >
      {/* karanlık oda gölgesi */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 240px 70px rgba(0,0,0,0.95)', zIndex: 0,
      }} />

      <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ÜST HUD */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          marginBottom: 10, flexWrap: 'wrap', gap: 6,
        }}>
          <span style={{ color: C.red }} className="nv-blink">● REC</span>
          <span style={{ color: C.faded }}>GÜVENLİK LOCASI — ESAS {room.code}</span>
          <span style={{ color: C.faded }}>{room.spectatorCount || 1}/5</span>
        </div>

        {/* ANA MONİTÖR */}
        <div style={{
          position: 'relative',
          border: `5px solid ${C.frame}`,
          borderRadius: 14,
          background: C.paper,
          overflow: 'hidden',
          boxShadow:
            `inset 0 0 90px rgba(60,30,0,0.35), 0 0 0 2px #000, 0 22px 60px rgba(0,0,0,0.7)`,
        }}>
          {/* scanline */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(122,31,31,0.06) 0px, rgba(122,31,31,0.06) 1px, transparent 1px, transparent 3px)' }} />
          {/* vignette */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none',
            boxShadow: 'inset 0 0 120px rgba(60,30,0,0.5)' }} />
          {/* statik */}
          <div className="nv-static" style={{ position: 'absolute', inset: 0, zIndex: 29,
            pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'multiply' }} />

          {/* CAM etiketi */}
          <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 31,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 14, letterSpacing: '0.18em',
            color: C.oxblood, fontWeight: 700 }}>
            ▶ {CAMERAS[activeCam - 1].label}
            <span style={{ color: C.faded, marginLeft: 10, fontSize: 10, fontWeight: 400 }}>
              {CAMERAS[activeCam - 1].name.toUpperCase()}
            </span>
          </div>
          <div className="nv-blink" style={{ position: 'absolute', top: 14, right: 18, zIndex: 31,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: C.red, fontWeight: 600 }}>
            ● CANLI
          </div>

          {/* EKRAN İÇİ */}
          <div style={{ minHeight: 540, padding: '46px 18px 18px', position: 'relative', zIndex: 1 }}>
            {activeCam === 1 && (
              <Cam1 room={room} davaciName={davaciName} sanikName={sanikName}
                davaciTurns={davaciAll} sanikTurns={sanikTurns} onOpenPaper={setPaper} />
            )}
            {activeCam === 2 && (
              <CamBlackjack
                wordsPurchased={wordsPurchased}
                onPurchaseWords={handlePurchaseWords}
              />
            )}
          </div>

          {/* alt durum şeridi */}
          <div style={{ borderTop: `1px solid ${C.frame}`, padding: '8px 16px',
            background: C.paperDeep, position: 'relative', zIndex: 31,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.oxblood, display: 'flex', justifyContent: 'space-between' }}>
            <span>{PHASE_LABEL[room.phase] || 'Bekleniyor'}</span>
            <span>{room.phase === 'COURT' ? `TUR ${room.turnNumber}/${room.maxTurns}` : '— —'}</span>
          </div>
        </div>

        {/* KAMERA ÖNİZLEMELERİ */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {CAMERAS.map((cam) => {
            const on = activeCam === cam.id;
            return (
              <button key={cam.id} onClick={() => setActiveCam(cam.id)}
                style={{
                  flex: 1, padding: 0,
                  background: C.roomDark,
                  border: `3px solid ${on ? C.amber : C.frame}`,
                  borderRadius: 9, cursor: 'pointer', overflow: 'hidden',
                  position: 'relative',
                  boxShadow: on ? `0 0 0 2px ${C.oxblood}, 0 6px 18px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.15s',
                }}>
                <div style={{ height: 76, background: on ? C.paperDeep : '#0e0907',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div className="nv-static" style={{ position: 'absolute', inset: 0,
                    opacity: on ? 0.08 : 0.25, mixBlendMode: on ? 'multiply' : 'screen' }} />
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22,
                    color: on ? C.oxblood : C.faded, letterSpacing: '0.1em', fontWeight: 700 }}>
                    {cam.label}
                  </span>
                  {on && (
                    <span className="nv-blink" style={{ position: 'absolute', top: 5, right: 8,
                      color: C.red, fontSize: 10, fontFamily: 'monospace' }}>●</span>
                  )}
                </div>
                <div style={{ padding: '6px 4px', background: on ? C.amber : C.frame,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: on ? C.ink : C.faded, fontWeight: 600 }}>
                  {cam.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {paper && <PaperModal paper={paper} onClose={() => setPaper(null)} />}

      {/* İZLEYİCİ YORUM PANELİ */}
      <div style={{ maxWidth: 920, margin: '14px auto 0', position: 'relative', zIndex: 1 }}>
        {feedback && (
          <div style={{
            background: C.paperDeep, color: C.oxblood, padding: '8px 14px',
            borderRadius: 6, border: `1px solid ${C.oxblood}`, marginBottom: 8,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: '0.1em', textAlign: 'center',
          }}>
            {feedback}
          </div>
        )}

        <div style={{
          background: `linear-gradient(170deg, ${C.paper}, ${C.paperDeep})`,
          border: `2px solid ${C.frame}`, borderRadius: 10, padding: '12px 14px',
          opacity: commentsLocked ? 0.7 : 1,
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: C.oxblood, fontWeight: 700, marginBottom: 8,
          }}>
            İzleyici Sözü
            {commentsLocked
              ? ' · Karar açıklanınca açılacak'
              : ` · max ${COMMENT_LIMIT} karakter${wordsPurchased ? ' · 🎫 4 cümle hakkı' : ''} · ${commentCd > 0 ? `${Math.floor(commentCd/60)}:${String(commentCd%60).padStart(2,'0')} bekle` : '2dk cooldown'}`
            }
          </div>

          {commentsLocked ? (
            <div style={{
              padding: '14px 12px', textAlign: 'center', color: C.faded,
              fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 14, fontStyle: 'italic',
              border: `1px dashed ${C.frame}`, borderRadius: 4,
            }}>
              🔒 Duruşma sürüyor — yorumunu yargıç kararını verdikten sonra yazabilirsin.
            </div>
          ) : (
            <>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, COMMENT_LIMIT))}
                placeholder="Karar hakkında düşüncen — kararın altında izleyici yorumu olarak görünür..."
                disabled={commentCd > 0}
                rows={2}
                style={{
                  width: '100%', resize: 'none',
                  background: '#fff', color: C.ink,
                  border: `1px solid ${C.frame}`, borderRadius: 4,
                  padding: '8px 10px', fontFamily: '"Crimson Pro", Georgia, serif',
                  fontSize: 14, outline: 'none', opacity: commentCd > 0 ? 0.5 : 1,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.faded }}>
                  {commentText.length}/{COMMENT_LIMIT}
                </span>
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || commentCd > 0}
                  style={{
                    background: !commentText.trim() || commentCd > 0 ? '#3a2e28' : C.oxblood,
                    color: C.paper, border: `2px solid ${C.paper}`,
                    padding: '6px 14px', borderRadius: 5,
                    fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 13,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: !commentText.trim() || commentCd > 0 ? 'not-allowed' : 'pointer',
                    opacity: !commentText.trim() || commentCd > 0 ? 0.5 : 1,
                  }}
                >
                  Yorumu Gönder
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes nv-blink-kf { 0%,55%{opacity:1} 56%,100%{opacity:0.18} }
        .nv-blink { animation: nv-blink-kf 1.4s steps(1) infinite; }
        @keyframes nv-static-kf {
          0%{transform:translate(0,0)} 25%{transform:translate(-2px,1px)}
          50%{transform:translate(1px,-2px)} 75%{transform:translate(-1px,2px)}
          100%{transform:translate(0,0)}
        }
        .nv-static {
          background-image:
            repeating-radial-gradient(circle at 30% 40%, #000 0px, transparent 1px, transparent 3px),
            repeating-radial-gradient(circle at 70% 60%, #000 0px, transparent 1px, transparent 4px);
          animation: nv-static-kf 0.18s steps(2) infinite;
        }
        @media (max-width: 600px) {
          .cam1-split { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}

// ---- CAM 1: iddianame + müşteki/sanık split ----
function Cam1({ room, davaciName, sanikName, davaciTurns, sanikTurns, onOpenPaper }) {
  const ind = room.indictment;
  return (
    <div>
      {/* İDDİANAME — üst kağıt */}
      <button
        onClick={() => ind && onOpenPaper({
          label: 'İDDİANAME', isIndictment: true, body: ind.indictment_letter, accent: C.oxblood,
        })}
        style={{
          width: '100%',
          background: `linear-gradient(170deg, ${C.paper}, ${C.paperDeep})`,
          border: `2px solid ${C.oxblood}`,
          borderRadius: 4, padding: '14px 16px', marginBottom: 16,
          textAlign: 'left', cursor: ind ? 'pointer' : 'default',
          color: C.ink, fontFamily: '"Crimson Pro", Georgia, serif',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: '0.28em', textTransform: 'uppercase', color: C.oxblood,
          marginBottom: 6, fontWeight: 700 }}>
          İddianame {ind ? '· dokun ve oku' : ''}
        </div>
        {ind ? (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontStyle: 'italic' }}>
            “{ind.main_topic}”
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: C.faded }}>
            İddianame henüz hazırlanmadı.
          </p>
        )}
      </button>

      {/* İKİ MASA */}
      <div className="cam1-split" style={{ display: 'flex', gap: 14 }}>
        <DeskColumn side="davaci" label="Müşteki" name={davaciName} turns={davaciTurns} onOpenPaper={onOpenPaper} />
        <DeskColumn side="sanik" label="Sanık" name={sanikName} turns={sanikTurns} onOpenPaper={onOpenPaper} />
      </div>
    </div>
  );
}

function DeskColumn({ side, label, name, turns, onOpenPaper }) {
  const accent = side === 'davaci' ? C.oxblood : '#3a5a7a';
  const last = turns[turns.length - 1];
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase', color: accent,
        marginBottom: 7, textAlign: 'center', fontWeight: 700 }}>
        {label} · {name}
      </div>
      <button
        onClick={() => turns.length && onOpenPaper({ label: `${label} · ${name}`, turns, accent })}
        style={{
          width: '100%', minHeight: 240,
          background: `linear-gradient(170deg, ${C.paper}, ${C.paperDeep})`,
          border: `2px solid ${accent}`, borderRadius: 4, padding: '15px 14px',
          textAlign: 'left', cursor: turns.length ? 'pointer' : 'default',
          color: C.ink, fontFamily: '"Crimson Pro", Georgia, serif',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        {turns.length === 0 ? (
          <span style={{ fontStyle: 'italic', color: C.faded, fontSize: 13 }}>
            Henüz söz alınmadı.
          </span>
        ) : (
          <>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: accent,
              marginBottom: 7, fontWeight: 700 }}>
              {last.isOpening ? 'Açılış Beyanı' : `Son söz · ${turns.length}. tur`}
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
              {last.text.length > 280 ? last.text.slice(0, 280) + '…' : last.text}
            </p>
            <div style={{ marginTop: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: C.oxblood, fontWeight: 600 }}>
              ⊕ Dokun — {turns.length} sözün hepsi
            </div>
          </>
        )}
      </button>
    </div>
  );
}

function CamPlaceholder({ title, note }) {
  return (
    <div style={{ minHeight: 460, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace' }}>
      <div className="nv-static" style={{ width: 160, height: 100, opacity: 0.4,
        borderRadius: 4, border: `2px dashed ${C.frame}` }} />
      <div style={{ fontSize: 26, letterSpacing: '0.22em', color: C.oxblood,
        textTransform: 'uppercase', marginTop: 22, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 11, letterSpacing: '0.28em', marginTop: 10,
        textTransform: 'uppercase', color: C.faded }}>{note}</div>
    </div>
  );
}

// ---- Kağıt büyütme popup ----
function PaperModal({ paper, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: `linear-gradient(170deg, ${C.paper}, ${C.paperDeep})`,
        border: `3px solid ${paper.accent}`,
        borderRadius: 6, maxWidth: 580, width: '100%', maxHeight: '84vh',
        overflowY: 'auto', padding: '24px 26px', color: C.ink,
        fontFamily: '"Crimson Pro", Georgia, serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: '0.25em', textTransform: 'uppercase', color: C.oxblood, fontWeight: 700 }}>
            {paper.label}
          </div>
          <button onClick={onClose} style={{ background: C.oxblood, color: C.paper,
            border: 'none', borderRadius: 4, width: 30, height: 30, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 14 }}>✕</button>
        </div>

        {paper.isIndictment ? (
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {paper.body}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paper.turns.map((t, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(122,31,31,0.18)', paddingBottom: 14 }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                  letterSpacing: '0.22em', textTransform: 'uppercase', color: C.oxblood,
                  marginBottom: 6, fontWeight: 700 }}>
                  {t.isOpening ? 'Açılış Beyanı' : `${i + 1}. söz`}
                </div>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>{t.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
