import { useState } from 'react';
import ImageUploader from './ImageUploader.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const MIN_CHARS = 40;

export default function ComplaintScreen({ room, role, myName, onSubmit }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [judgeMode, setJudgeMode] = useState('normal');

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
    onSubmit(text.trim(), payload, judgeMode);
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

            <div className="mb-6">
              <div className="text-sm font-mono tracking-widest text-ink-faded uppercase mb-3">
                Yargıç Seç
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJudgeMode('normal')}
                  className={`text-left p-4 border-2 transition-colors ${
                    judgeMode === 'normal'
                      ? 'border-oxblood bg-oxblood/5'
                      : 'border-ink-faded/40 hover:border-ink'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xl">Yargıç Ayumi</span>
                    <span className={`font-mono text-[10px] tracking-widest uppercase ${judgeMode === 'normal' ? 'text-oxblood' : 'text-ink-faded'}`}>
                      {judgeMode === 'normal' ? '✓ Seçili' : 'Normal'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Sert ama ölçülü. Kanıta saplanır, taraf seçer. Gerektiğinde iğneli espri.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setJudgeMode('radikal')}
                  className={`text-left p-4 border-2 transition-colors ${
                    judgeMode === 'radikal'
                      ? 'border-oxblood bg-oxblood/5'
                      : 'border-ink-faded/40 hover:border-ink'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xl">Yargıç Sigrid</span>
                    <span className={`font-mono text-[10px] tracking-widest uppercase ${judgeMode === 'radikal' ? 'text-oxblood' : 'text-ink-faded'}`}>
                      {judgeMode === 'radikal' ? '✓ Seçili' : 'Radikal'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Tavizsiz, acımasız, dolaysız. Yumuşatma yok. Severity'de cömert.
                  </p>
                </button>
              </div>
            </div>

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
