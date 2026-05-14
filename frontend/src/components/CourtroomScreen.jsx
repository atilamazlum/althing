import { useEffect, useRef, useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import LetterModal from './LetterModal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import SessionTransition from './SessionTransition.jsx';
import MediaWidget from './MediaWidget.jsx';
import EmojiPanel from './EmojiPanel.jsx';
import EmojiOverlay from './EmojiOverlay.jsx';
import PhaserCourtroom from '../courtroom-game/PhaserCourtroom.jsx';
import { socket } from '../socket.js';

const MIN_CHARS = 40;

export default function CourtroomScreen({ room, role, myName, onSubmit }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(timeLeft(room.deadline));
  const [modal, setModal] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState(null);
  const [incomingEmoji, setIncomingEmoji] = useState(null);

  // Emoji broadcast dinleyicisi
  useEffect(() => {
    function onEmoji({ id }) {
      setIncomingEmoji({ id, key: Date.now() }); // key — aynı emoji peş peşe atılırsa re-render
    }
    socket.on('emoji-broadcast', onEmoji);
    return () => socket.off('emoji-broadcast', onEmoji);
  }, []);

  function handleReact(emojiId) {
    socket.emit('emoji-react', { code: room.code, id: emojiId }, () => {});
  }

  const prevTurnNum = useRef(room.turnNumber);
  const transitionTimerRef = useRef(null);
  useEffect(() => {
    if (prevTurnNum.current !== room.turnNumber) {
      setText('');
      setImages([]);
      setSubmitting(false);
      // Tur 1'den sonra her tur değişiminde: önce typewriter çalsın, sonra geçiş
      if (room.turnNumber > prevTurnNum.current && room.turnNumber > 1) {
        const lastTurn = room.turns[room.turns.length - 1];
        const textLen = lastTurn?.text?.length || 0;
        // Typewriter ~18ms/char + 1.8sn ek bekleme, min 3sn, maks 9sn
        const delayMs = Math.min(9000, Math.max(3000, textLen * 18 + 1800));
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
          setTransitioningTo(room.turnNumber);
          transitionTimerRef.current = null;
        }, delayMs);
      }
      prevTurnNum.current = room.turnNumber;
    }
  }, [room.turnNumber]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  }, []);

  useEffect(() => {
    if (!room.deadline) return;
    const handle = setInterval(() => setRemaining(timeLeft(room.deadline)), 1000);
    return () => clearInterval(handle);
  }, [room.deadline]);

  const isMyTurn = room.currentTurn === role;
  const oppName =
    role === 'davaci' ? room.sanik?.displayName || 'Sanık' : room.davaci?.anonName || 'Müşteki';
  const trimmedLen = text.trim().length;
  const canSubmit = trimmedLen >= MIN_CHARS && !submitting;

  function doSubmit() {
    setConfirmOpen(false);
    setSubmitting(true);
    const payload = images.map((img) => ({ mimeType: img.mimeType, data: img.data }));
    onSubmit(text.trim(), payload);
  }

  function roleLabel(r) {
    return r === 'davaci'
      ? room.davaci?.anonName || 'Müşteki'
      : room.sanik?.displayName || 'Sanık';
  }

  // İlk turdan önce davacı'nın ham beyanı sahnede; sonra son turun konuşmacısı
  const lastTurn = room.turns[room.turns.length - 1] || null;
  let speakerForScene = null;
  let dialogText = '';
  if (lastTurn) {
    speakerForScene = lastTurn.role;
    dialogText = lastTurn.text;
  } else if (room.complaint) {
    speakerForScene = 'davaci';
    dialogText = room.complaint.text;
  }

  return (
    <>
      <div className="min-h-full p-6">
        <div className="max-w-6xl mx-auto slide-up space-y-6">

          {/* === PHASER MAHKEME SAHNESİ === */}
          <PhaserCourtroom
            speakerRole={speakerForScene}
            speakerName={speakerForScene ? roleLabel(speakerForScene) : null}
            dialogText={dialogText}
            turnNumber={room.turnNumber}
          />

          {/* === ANA İÇERİK === */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">

            {/* SOL: DOSYA */}
            <aside className="space-y-4">
              <div className="paper p-4">
                <div className="esas-no">ESAS NO · {room.code}</div>
                <div className="mt-2 text-sm text-ink-soft">
                  Tur <strong className="text-ink">{room.turnNumber}</strong> / {room.maxTurns}
                  {room.extensionUsed && (
                    <span className="ml-2 font-mono text-xs text-oxblood">+2 UZATILDI</span>
                  )}
                </div>
              </div>

              {room.complaint && (
                <button
                  onClick={() => setModal({ kind: 'complaint' })}
                  className="paper w-full p-5 text-left hover:translate-x-[-2px] hover:shadow-deep transition-all group"
                >
                  <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
                    Müştekinin Beyanı · Ham
                  </div>
                  <p className="text-sm text-ink-soft leading-snug mb-3 line-clamp-2 italic">
                    "{firstLine(room.complaint.text)}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-faded uppercase tracking-widest">
                      {room.complaint.hasImages ? 'görselli' : 'metin'}
                    </span>
                    <span className="font-mono text-ink group-hover:text-oxblood tracking-widest uppercase">
                      Tamamını oku →
                    </span>
                  </div>
                </button>
              )}

              {room.indictment && (
                <button
                  onClick={() => setModal({ kind: 'indictment' })}
                  className="paper w-full p-5 text-left hover:translate-x-[-2px] hover:shadow-deep transition-all group"
                >
                  <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
                    İddianame · Resmi Tebliğ
                  </div>
                  <div className="text-base leading-snug mb-3 italic">
                    {room.indictment.main_topic}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-faded uppercase tracking-widest">
                      {room.indictment.charge_count} suçlama
                    </span>
                    <span className="font-mono text-ink group-hover:text-oxblood tracking-widest uppercase">
                      Tamamını oku →
                    </span>
                  </div>
                </button>
              )}

              {room.turns.length > 0 && (
                <div className="paper p-4">
                  <div className="font-mono text-xs tracking-widest text-ink-faded uppercase mb-3">
                    Tutanak
                  </div>
                  <ul className="space-y-2">
                    {room.turns.map((t, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setModal({ kind: 'turn', index: i })}
                          className="w-full text-left p-3 border border-ink-faded/30 hover:border-ink hover:bg-parchment-dark/40 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs tracking-widest text-oxblood uppercase">
                              Tur {i + 1} · {roleLabel(t.role)}
                            </span>
                            {t.hasImages && (
                              <span className="font-mono text-[10px] text-ink-faded uppercase tracking-widest">
                                + görsel
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-ink-soft leading-snug line-clamp-2">
                            {firstLine(t.text)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            {/* SAĞ: AKTİF TUR */}
            <div className="space-y-6">
              <header className="paper p-5 flex items-center justify-between">
                <span className="turn-indicator">
                  {isMyTurn ? 'SIRA SENDE' : `${oppName.toUpperCase()} KONUŞUYOR`}
                </span>
                <div className="text-right">
                  <div className="text-xs font-mono tracking-widest text-ink-faded uppercase">
                    Kalan
                  </div>
                  <div className={`font-mono text-3xl ${remaining < 60 ? 'text-oxblood' : 'text-ink'}`}>
                    {formatTime(remaining)}
                  </div>
                </div>
              </header>

              {isMyTurn ? (
                <div className="paper p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="turn-indicator turn-indicator-active">{myName}</span>
                    <span className="text-ink-soft italic">
                      {role === 'sanik' ? 'savunmanı sun' : 'karşı argümanını ortaya koy'}
                    </span>
                  </div>

                  <textarea
                    className="court-textarea min-h-[220px]"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      role === 'sanik'
                        ? 'Suçlamalara karşı savunmanı yaz... (en az 40 karakter)'
                        : 'Karşı argümanını sun... (en az 40 karakter)'
                    }
                    autoFocus
                  />

                  <div className="mt-6 pt-5 border-t border-ink-faded/30">
                    <div className="text-xs font-mono tracking-widest text-ink-faded uppercase mb-3">
                      Görsel Kanıt
                    </div>
                    <ImageUploader images={images} setImages={setImages} />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className={`text-xs font-mono ${trimmedLen < MIN_CHARS ? 'text-oxblood' : 'text-ink-faded'}`}>
                      {trimmedLen}/{MIN_CHARS} min · {images.length} görsel
                    </div>
                    <button
                      className="btn-brutal"
                      disabled={!canSubmit}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Sözünü bitir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="paper p-6 md:p-10 text-center">
                  <h2 className="text-2xl md:text-3xl mt-2 mb-3">Söz karşı tarafta</h2>
                  <p className="italic text-ink-soft mb-6">
                    {oppName} {room.turnNumber === 1 ? 'savunmasını' : 'cevabını'} hazırlıyor.
                    <br />
                    Bu sırada dosyayı inceleyebilirsin.
                  </p>
                  <div className="ink-pulse text-3xl tracking-widest">· · ·</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal?.kind === 'complaint' && room.complaint && (
        <LetterModal
          kicker="Müştekinin Beyanı · Ham Metin"
          title="Davacının kendi kelimeleri"
          content={room.complaint.text}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'indictment' && room.indictment && (
        <LetterModal
          kicker="İddianame · Tebligat"
          title={room.indictment.main_topic}
          content={room.indictment.indictment_letter}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'turn' && room.turns[modal.index] && (
        <LetterModal
          kicker={`Tur ${modal.index + 1} · ${roleLabel(room.turns[modal.index].role)}`}
          title={null}
          content={room.turns[modal.index].text}
          onClose={() => setModal(null)}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="Bu cevabı sunmak istediğine emin misin?"
          body="Sun dedikten sonra metni değiştiremezsin. Yargıç bu ifadeni dikkate alacak."
          confirmLabel="Evet, sun"
          cancelLabel="Geri dön"
          onConfirm={doSubmit}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {transitioningTo && (
        <SessionTransition
          turnNumber={transitioningTo}
          onDone={() => setTransitioningTo(null)}
        />
      )}

      <MediaWidget deadline={room.deadline} />
      <EmojiPanel onReact={handleReact} />
      {incomingEmoji && (
        <EmojiOverlay
          key={incomingEmoji.key}
          emojiId={incomingEmoji.id}
          onDone={() => setIncomingEmoji(null)}
        />
      )}
    </>
  );
}

function timeLeft(deadline) {
  if (!deadline) return 0;
  return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
}
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function firstLine(text) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 100) return trimmed;
  return trimmed.slice(0, 100) + '…';
}
