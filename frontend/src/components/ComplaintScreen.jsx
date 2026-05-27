import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const MIN_CHARS = 40;

export default function ComplaintScreen({ room, role, myName, onSubmit }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (role === 'sanik') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="paper p-10 max-w-xl mx-auto slide-up text-center">
          <div className="esas-no mb-2">ESAS NO · {room.code}</div>
          <h1 className="text-4xl mb-4">Müşteki ifade veriyor</h1>
          <p className="italic text-ink-soft mb-8">
            {room.davaci?.anonName || 'Müşteki'} şikayetini yazıyor.
            <br />Tamamlanınca iddianame sana tebliğ edilecek.
          </p>
          <div className="ink-pulse text-4xl tracking-widest">· · ·</div>
        </div>
      </div>
    );
  }

  const trimmedLen = text.trim().length;
  const canSubmit = trimmedLen >= MIN_CHARS && !submitting;

  function doSubmit() {
    setConfirmOpen(false);
    setSubmitting(true);
    const payload = images.map((img) => ({ mimeType: img.mimeType, data: img.data }));
    onSubmit(text.trim(), payload);
  }

  return (
    <>
      <div className="min-h-full p-6">
        <div className="max-w-3xl mx-auto slide-up">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <div className="esas-no">ESAS NO · {room.code}</div>
              <h1 className="text-3xl mt-1">Şikayet Beyanı</h1>
            </div>
            <span className="turn-indicator turn-indicator-active">{myName}</span>
          </header>

          <div className="paper p-8 md:p-10">
            <div className="court-header mb-6">Müştekinin Beyanı</div>

            <p className="italic text-ink-soft mb-6 leading-relaxed">
              Olanları olduğu gibi anlat. Konuşma dili rahat — mahkeme kalemi metni resmi diliyle iddianameye çevirecek.
              Süre limiti yok, ama en az {MIN_CHARS} karakter.
            </p>

            <textarea
              className="court-textarea min-h-[280px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Sevgilim Ali bir hafta önce..."
              autoFocus
            />

            <div className="mt-8 pt-6 border-t border-ink-faded/30">
              <div className="text-sm font-mono tracking-widest text-ink-faded uppercase mb-3">
                Görsel Kanıt (varsa)
              </div>
              <ImageUploader images={images} setImages={setImages} />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className={`text-xs font-mono ${trimmedLen < MIN_CHARS ? 'text-oxblood' : 'text-ink-faded'}`}>
                {trimmedLen}/{MIN_CHARS} min · {images.length} görsel
              </div>
              <button
                className="btn-brutal"
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                Şikayeti sun
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Şikayetini sunmak istediğine emin misin?"
          body="Sun dedikten sonra metni değiştiremezsin. AI iddianameyi yazacak ve sanığa tebliğ edecek."
          confirmLabel="Evet, sun"
          cancelLabel="Geri dön"
          onConfirm={doSubmit}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
