import { useState, useEffect } from 'react';
import LetterModal from './LetterModal.jsx';
import { socket } from '../socket.js';

export default function HomeScreen({ onCreate, onJoin, onSpectate, error }) {
  const [mode, setMode] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [spectateCode, setSpectateCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);

  // İzle modunda — aktif public odaları 5sn'de bir çek
  useEffect(() => {
    if (mode !== 'spectate') return;
    function fetchRooms() {
      socket.emit('list-rooms', (resp) => {
        if (resp?.rooms) setPublicRooms(resp.rooms);
      });
    }
    fetchRooms();
    const t = setInterval(fetchRooms, 5000);
    return () => clearInterval(t);
  }, [mode]);

  const PHASE_SHORT = {
    COMPLAINT: 'Şikayet yazılıyor',
    GENERATING_INDICTMENT: 'İddianame hazırlanıyor',
    COURT: 'Duruşma sürüyor',
    EXTENSION_VOTE: 'Uzatma oylaması',
    GENERATING_VERDICT: 'Karar veriliyor',
    GENERATING_COUNSEL: 'Danışman söz alıyor',
  };

  return (
    <>
      <style>{`
        .seal-stamp {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #7a1f1f;
          border: 1.5px solid #7a1f1f;
          padding: 6px 12px;
          display: inline-block;
          transform: rotate(-2deg);
          opacity: 0.75;
        }
        .ribbon {
          position: relative;
          color: #7a1f1f;
        }
        .ribbon::before, .ribbon::after {
          content: '';
          display: inline-block;
          width: 40px;
          height: 1px;
          background: currentColor;
          vertical-align: middle;
          margin: 0 14px 4px;
          opacity: 0.6;
        }
        .red-rule {
          height: 2px;
          background: #7a1f1f;
          opacity: 0.55;
        }
        .red-rule-thin {
          height: 1px;
          background: #7a1f1f;
          opacity: 0.35;
        }
        .role-card {
          transition: all 200ms;
        }
        .role-card:hover {
          background: #7a1f1f;
          color: #f1e8d4;
          border-color: #7a1f1f;
        }
        .role-card:hover .role-tag {
          color: #f1e8d4;
        }
        .role-card:hover .role-desc {
          color: rgba(241, 232, 212, 0.85);
        }
        .role-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: #7a1f1f;
          text-transform: uppercase;
        }
        .step-roman {
          font-family: 'DM Serif Display', serif;
          color: #7a1f1f;
        }
      `}</style>

      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-2xl slide-up">

          {/* HERO */}
          <header className="text-center mb-10 relative">
            <div className="absolute top-0 left-0 hidden md:block">
              <span className="seal-stamp">Esas No · ?</span>
            </div>
            <div className="absolute top-0 right-0 hidden md:block">
              <span className="seal-stamp" style={{ transform: 'rotate(2deg)' }}>
                Mühürlüdür
              </span>
            </div>

            <div className="esas-no mb-3">A · L · T · H · I · N · G</div>
            <h1 className="text-5xl md:text-7xl mb-3 leading-none">Mahkemesi</h1>
            <div className="red-rule w-24 mx-auto mb-5" />
            <p className="ribbon italic font-body text-lg md:text-xl">
              Anlatamadığın bir hesap mı kaldı
            </p>
            <p className="text-ink-soft italic font-body text-base mt-1">
              resmen sun — yargıç bekliyor.
            </p>
          </header>

          {/* MAIN — iki kart */}
          {!mode && (
            <>
              <div className="paper p-8 md:p-10 mb-6">
                <div className="court-header mb-7">İki Yol</div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('create')}
                    className="role-card text-left p-6 border-2 border-ink"
                  >
                    <div className="role-tag mb-2">Rol 01 · Davacı</div>
                    <h3 className="text-2xl mb-2">Mahkeme aç</h3>
                    <p className="role-desc text-sm text-ink-soft leading-snug">
                      Sen müştekisin. Şikayetini sunarsın, sanığa tebligat gider.
                    </p>
                  </button>

                  <button
                    onClick={() => setMode('join')}
                    className="role-card text-left p-6 border-2 border-ink"
                  >
                    <div className="role-tag mb-2">Rol 02 · Sanık</div>
                    <h3 className="text-2xl mb-2">Davaya katıl</h3>
                    <p className="role-desc text-sm text-ink-soft leading-snug">
                      Sana esas numarası verildi. Savunmanı hazırla.
                    </p>
                  </button>
                </div>

                {/* İZLE — tam genişlik üçüncü kart */}
                <button
                  onClick={() => setMode('spectate')}
                  className="role-card text-left p-6 border-2 border-ink w-full mt-4"
                >
                  <div className="role-tag mb-2">Loca · İzleyici</div>
                  <h3 className="text-2xl mb-2">Mahkeme izle</h3>
                  <p className="role-desc text-sm text-ink-soft leading-snug">
                    Açık duruşmaları izle ya da sana verilen izleyici koduyla gir.
                  </p>
                </button>

                {error && <div className="error-box mt-6">{error}</div>}
              </div>

              {/* NASIL İŞLER */}
              <div className="paper p-6 md:p-8">
                <div className="court-header mb-6">Nasıl İşler</div>
                <ol className="space-y-3">
                  {[
                    ['I',   'Müşteki şikayetini sunar — istediği kadar uzun.'],
                    ['II',  'Yapay zekâ resmî bir iddianame hazırlar.'],
                    ['III', 'Beş oturum boyunca taraflar sırayla konuşur.'],
                    ['IV',  'Yargıç Sigrid tavizsiz bir karar verir.'],
                    ['V',   'İki danışman taraflara yüzleşme ve yol gösterir.'],
                  ].map(([num, text]) => (
                    <li key={num} className="flex gap-4 items-baseline border-b border-ink/10 pb-2 last:border-b-0">
                      <span className="step-roman text-xl w-8 flex-shrink-0 text-center">
                        {num}
                      </span>
                      <span className="font-body text-[15px] leading-relaxed text-ink">
                        {text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {/* CREATE */}
          {mode === 'create' && (
            <div className="paper p-8 md:p-10">
              <div className="court-header mb-6">Davacı Onayı</div>
              <p className="mb-6 text-ink-soft font-body">
                İstersen bir isim gir — sanık ve izleyiciler seni böyle görür.
                Boş bırakırsan sana otomatik anonim bir müşteki numarası verilir.
              </p>

              {/* İsim (opsiyonel) */}
              <label className="block mb-6">
                <span className="text-xs font-mono tracking-[0.3em] text-ink-faded uppercase">
                  İsmin (opsiyonel)
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 24))}
                  placeholder="Örn. Mazlum (boş = anonim)"
                  className="block w-full mt-2 bg-transparent border-b-2 border-ink font-body text-xl py-2 outline-none focus:border-oxblood"
                />
              </label>

              {/* Public / Private seçimi */}
              <div className="mb-6">
                <div className="text-xs font-mono tracking-[0.3em] text-ink-faded uppercase mb-3">
                  Görünürlük
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`text-left p-4 border-2 transition-colors ${
                      !isPublic ? 'border-oxblood bg-oxblood/5' : 'border-ink-faded/40 hover:border-ink'
                    }`}
                  >
                    <div className="font-display text-xl mb-1">Özel</div>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      Sadece izleyici kodunu verdiğin kişiler izleyebilir.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`text-left p-4 border-2 transition-colors ${
                      isPublic ? 'border-oxblood bg-oxblood/5' : 'border-ink-faded/40 hover:border-ink'
                    }`}
                  >
                    <div className="font-display text-xl mb-1">Açık</div>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      Ana sayfada listelenir, herkes izleyebilir (maks 5 kişi).
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button className="btn-brutal" onClick={() => onCreate(isPublic, displayName.trim())}>
                  Onaylıyorum, mahkemeyi aç
                </button>
                <button className="btn-brutal btn-brutal-secondary" onClick={() => setMode(null)}>
                  Geri
                </button>
              </div>
              {error && <div className="error-box mt-6">{error}</div>}
            </div>
          )}

          {/* SPECTATE */}
          {mode === 'spectate' && (
            <div className="paper p-8 md:p-10">
              <div className="court-header mb-6">İzleyici Locası</div>

              {/* İzleyici koduyla gir */}
              <label className="block mb-3">
                <span className="text-xs font-mono tracking-[0.3em] text-ink-faded uppercase">
                  İzleyici / Oda Kodu
                </span>
                <input
                  type="text"
                  value={spectateCode}
                  onChange={(e) => setSpectateCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="KOD"
                  className="block w-full mt-2 bg-transparent border-b-2 border-ink font-mono text-3xl tracking-[0.3em] py-2 outline-none focus:border-oxblood"
                />
              </label>
              <div className="flex gap-3 flex-wrap mb-8">
                <button
                  className="btn-brutal"
                  disabled={spectateCode.length < 4}
                  onClick={() => onSpectate(spectateCode)}
                >
                  İzlemeye gir
                </button>
                <button className="btn-brutal btn-brutal-secondary" onClick={() => setMode(null)}>
                  Geri
                </button>
              </div>

              {/* Açık duruşmalar listesi */}
              <div className="court-header mb-4">Şu An Açık Duruşmalar</div>
              {publicRooms.length === 0 ? (
                <p className="text-sm text-ink-faded italic">
                  Şu an izlenebilecek açık duruşma yok. Birazdan tekrar bak.
                </p>
              ) : (
                <ul className="space-y-2">
                  {publicRooms.map((r) => (
                    <li key={r.code}>
                      <button
                        onClick={() => onSpectate(r.code)}
                        className="w-full text-left p-4 border border-ink-faded/30 hover:border-ink hover:bg-parchment-dark/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs tracking-widest text-oxblood uppercase">
                            Esas No {r.code}
                          </span>
                          <span className="font-mono text-[10px] text-ink-faded uppercase tracking-widest">
                            {r.spectatorCount}/5 izleyici
                          </span>
                        </div>
                        <p className="text-sm text-ink leading-snug">{r.topic}</p>
                        <p className="font-mono text-[10px] text-ink-faded uppercase tracking-widest mt-1">
                          {PHASE_SHORT[r.phase] || r.phase}
                          {r.phase === 'COURT' && ` · Tur ${r.turnNumber}/${r.maxTurns}`}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {error && <div className="error-box mt-6">{error}</div>}
            </div>
          )}

          {/* JOIN */}
          {mode === 'join' && (
            <div className="paper p-8 md:p-10">
              <div className="court-header mb-6">Sanık Beyanı</div>

              <label className="block mb-5">
                <span className="text-xs font-mono tracking-[0.3em] text-ink-faded uppercase">
                  Esas No (4 harf)
                </span>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="ABCD"
                  className="block w-full mt-2 bg-transparent border-b-2 border-ink font-mono text-3xl tracking-[0.3em] py-2 outline-none focus:border-oxblood"
                  autoFocus
                />
              </label>

              <label className="block mb-6">
                <span className="text-xs font-mono tracking-[0.3em] text-ink-faded uppercase">
                  Adın (mahkemede görünecek)
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                  placeholder="Ali"
                  className="block w-full mt-2 bg-transparent border-b-2 border-ink font-body text-xl py-2 outline-none focus:border-oxblood"
                />
              </label>

              <div className="flex gap-3 flex-wrap">
                <button
                  className="btn-brutal"
                  disabled={joinCode.length !== 4 || !displayName.trim()}
                  onClick={() => onJoin(joinCode, displayName.trim())}
                >
                  Mahkemeye katıl
                </button>
                <button className="btn-brutal btn-brutal-secondary" onClick={() => setMode(null)}>
                  Geri
                </button>
              </div>

              {error && <div className="error-box mt-6">{error}</div>}
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-10">
            <div className="red-rule-thin mb-4" />
            <div className="text-center flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setAboutOpen(true)}
                className="font-mono text-[11px] tracking-[0.3em] uppercase text-oxblood hover:text-ink underline-offset-4 hover:underline transition-colors"
              >
                Hakkımızda
              </button>
              <span className="text-ink-faded/50">·</span>
              <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-faded">
                Sprint 1.2 · MVP
              </span>
            </div>
          </footer>

        </div>
      </div>

      {aboutOpen && (
        <LetterModal
          kicker="Mahkeme Defteri"
          title="Bu Mahkeme Hakkında"
          content={<AboutContent />}
          onClose={() => setAboutOpen(false)}
        />
      )}
    </>
  );
}

function AboutContent() {
  return (
    <div className="space-y-5">
      <p>
        İlişkilerde en çok kırılan yer, anlatılamayan yerdir. İki taraf da haklı olabilir;
        iki taraf da haksız olabilir. Ama ortada bir hakem yoksa konuşma çıkmaza saplanır.
        Althing Mahkemesi tam bu boşluğa kuruldu: söylenememiş olanı resmen söyletmek için.
      </p>

      <p>
        Burada yargıç bir yapay zekâdır — tarafsız, soğukkanlı, sadece anlatılanı dinler ve
        hakkaniyet üzerine bir görüş bildirir. Sonra bir danışman gelir; iki tarafa da yumuşak
        bir el uzatır: "Bu anlaşmazlığın altında asıl ne var?"
      </p>

      <div className="flex items-center justify-center gap-3 my-8">
        <span className="h-px bg-ink-faded/40 flex-1 max-w-[100px]" />
        <span className="text-oxblood">❦</span>
        <span className="h-px bg-ink-faded/40 flex-1 max-w-[100px]" />
      </div>

      <h3 className="font-display text-2xl text-ink mb-2">Geliştirici</h3>
      <p className="italic text-ink-soft">
        [Burayı kendin yaz — kim olduğun, neden bu projeyi yaptığın, nasıl bir hayalin var.
        Yargıç sabırlıdır, istediğin kadar uzun olabilir.]
      </p>

      <h3 className="font-display text-2xl text-ink mb-2 mt-8">Mahkemenin Vaadi</h3>
      <p>
        Anonimlik: kimliğin sadece dört harfli bir esas numarasıyla temsil edilir.
        Tartışma: beş oturum boyunca her iki taraf da söyleyeceğini söyler.
        Adalet: yargıç delillere bakar, taraflara değil.
      </p>

      <p className="text-sm text-ink-faded mt-10 pt-5 border-t border-ink-faded/30 text-center">
        Althing — yapay zekânın gözünden yargısal bir oyun. MVP, Sprint 1.2.
      </p>
    </div>
  );
}
