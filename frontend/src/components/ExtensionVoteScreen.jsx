import { useState } from 'react';
import { socket } from '../socket.js';

export default function ExtensionVoteScreen({ room, role, myName }) {
  const [submitting, setSubmitting] = useState(false);
  const myVote = room.extensionVotes?.[role];
  const oppRole = role === 'davaci' ? 'sanik' : 'davaci';
  const oppVote = room.extensionVotes?.[oppRole];
  const oppName =
    role === 'davaci' ? room.sanik?.displayName || 'Sanık' : room.davaci?.anonName || 'Müşteki';

  function vote(value) {
    if (submitting || myVote !== null) return;
    setSubmitting(true);
    socket.emit('vote-extension', { code: room.code, vote: value }, (resp) => {
      setSubmitting(false);
      if (resp.error) console.warn(resp.error);
    });
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="paper p-10 max-w-2xl mx-auto slide-up">
        <div className="court-header mb-6">5 Tur Tamamlandı</div>

        {/* KARŞI TARAFIN OY DURUMU — her zaman üstte */}
        <div className={`mb-6 p-4 border-2 ${oppVote !== null ? 'border-oxblood bg-oxblood/5' : 'border-ink-faded/30'}`}>
          <div className="font-mono text-[10px] tracking-[0.3em] text-ink-faded uppercase mb-1">
            Karşı Taraf · {oppName}
          </div>
          {oppVote === null ? (
            <div className="italic text-ink-soft">
              Henüz oy vermedi <span className="ink-pulse">· · ·</span>
            </div>
          ) : (
            <div className="text-lg font-display text-oxblood">
              {oppVote ? '✓ +2 tur daha istiyor' : '✗ Karar verilsin diyor'}
            </div>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl mb-4 text-center">
          Karar zamanı mı, +2 tur daha mı?
        </h1>

        <p className="italic text-ink-soft text-center mb-10 leading-relaxed">
          Standart 5 tur sona erdi. Yargıç şimdi karar verebilir.
          <br />
          Ya da iki taraf da kabul ederse <strong>2 tur daha</strong> eklenir.
          <br />
          <span className="text-sm">Biri reddederse karara geçilir.</span>
        </p>

        {myVote === null ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => vote(true)}
              disabled={submitting}
              className="p-6 border-2 border-ink hover:bg-ink hover:text-parchment transition-colors text-left"
            >
              <div className="font-mono text-xs tracking-widest text-oxblood mb-2 group-hover:text-parchment">
                EVET, +2 TUR
              </div>
              <div className="text-xl">Devam edelim</div>
              <div className="text-sm text-ink-soft mt-2">
                Söyleyeceklerim daha bitmedi.
              </div>
            </button>

            <button
              onClick={() => vote(false)}
              disabled={submitting}
              className="p-6 border-2 border-ink hover:bg-ink hover:text-parchment transition-colors text-left"
            >
              <div className="font-mono text-xs tracking-widest text-oxblood mb-2">
                KARAR VERİLSİN
              </div>
              <div className="text-xl">Yargıç hüküm versin</div>
              <div className="text-sm text-ink-soft mt-2">
                Söyleyeceğim her şeyi söyledim.
              </div>
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="font-mono text-xs tracking-widest text-ink-faded uppercase mb-2">
              Senin oyun
            </div>
            <div className="text-2xl mb-6">
              {myVote ? '+2 tur daha' : 'Karar verilsin'}
            </div>
            <div className="border-t border-ink-faded/30 pt-6">
              <div className="font-mono text-xs tracking-widest text-ink-faded uppercase mb-2">
                {oppName}
              </div>
              {oppVote === null ? (
                <>
                  <div className="text-lg italic text-ink-soft">Oyu bekleniyor...</div>
                  <div className="ink-pulse text-3xl tracking-widest mt-4">· · ·</div>
                </>
              ) : (
                <div className="text-2xl">
                  {oppVote ? '+2 tur daha' : 'Karar verilsin'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center text-xs font-mono tracking-widest text-ink-faded uppercase mt-8">
          Esas No · {room.code}
        </div>
      </div>
    </div>
  );
}
