import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const SEVERITY_STYLES = {
  HAFIF: { bg: '#c9a868', label: 'HAFİF' },
  ORTA:  { bg: '#7a1f1f', label: 'ORTA' },
  AGIR:  { bg: '#3a0a0a', label: 'AĞIR' },
};

const VERDICT_LABELS = {
  DAVACI_HAKLI: 'MÜŞTEKİ HAKLI',
  SANIK_HAKLI: 'SANIK HAKLI',
  IKISI_DE_PAY_SAHIBI: 'PAYLAŞIMLI KUSUR',
};

function truncate(text, max) {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max).trimEnd() + '…';
}

export default function VerdictScreen({ room, role, onNewCase }) {
  const v = room.verdict;
  const c = room.counsel;
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!v) return null;

  const winner = v.verdict;
  const sanikName = room.indictment?.defendant_name || 'Sanık';
  const davaciName = room.davaci?.anonName || 'Müşteki';
  const stampLabel = VERDICT_LABELS[winner] || 'KARAR';
  const severityStyle = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES.ORTA;
  const today = new Date().toLocaleDateString('tr-TR');

  // Karta basılacak damga — bakan kişiye göre değişir
  let stampText = 'KARAR';
  let stampColor = '#b8902f'; // nötr sarı/altın
  if (winner === 'IKISI_DE_PAY_SAHIBI') {
    stampText = 'BERABERLİK';
    stampColor = '#b8902f';
  } else {
    const viewerWon =
      (role === 'davaci' && winner === 'DAVACI_HAKLI') ||
      (role === 'sanik' && winner === 'SANIK_HAKLI');
    stampText = viewerWon ? 'KAZANDI' : 'KAYBETTİ';
    stampColor = viewerWon ? '#1f5c3a' : '#7a1f1f';
  }

  // En çarpıcı söz — gerekçenin ilk cümlesi (genelde en sert), yoksa özet
  const punchSource = v.verdict_reasoning || v.summary || '';
  const firstSentence = (punchSource.match(/[^.!?]+[.!?]/) || [punchSource])[0].trim();
  const punchLine = truncate(firstSentence, 160);

  async function snapshotCard(pixelRatio = 3) {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    return toPng(cardRef.current, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: '#f3eccf',
    });
  }

  async function downloadCard() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await snapshotCard(3);
      const link = document.createElement('a');
      link.download = `althing-${room.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG indirme hatası:', err);
      alert('Görsel oluşturulamadı.');
    } finally {
      setDownloading(false);
    }
  }

  async function shareCard() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await snapshotCard(3);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `althing-${room.code}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Althing Mahkemesi Kararım',
          text: `Esas No ${room.code} — ${stampLabel}`,
        });
      } else {
        await downloadCard();
      }
    } catch (_) {}
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-4xl mx-auto slide-up space-y-6">

        {/* === ASIL KARAR BELGESİ === */}
        <div className="paper p-5 md:p-12">
          <div className="court-header mb-6">Mahkeme Kararı</div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="esas-no">ESAS NO · {room.code}</div>
              <h1 className="text-4xl mt-2">Hüküm</h1>
            </div>
            <div className="stamp">{stampLabel}</div>
          </div>

          <div className="mb-8">
            <div className="font-mono text-xs tracking-widest text-ink-faded uppercase mb-2">
              Yargıcın Özeti
            </div>
            <p className="text-lg italic leading-relaxed">{v.summary}</p>
          </div>

          <div className="mb-8">
            <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
              Gerekçe
            </div>
            <p className="text-[17px] leading-[1.7] whitespace-pre-wrap">{v.verdict_reasoning}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <PointsBox title={`${davaciName} — Güçlü Yönler`} items={v.davaci_strong_points} tone="green" />
            <PointsBox title={`${davaciName} — Zayıf Yönler`} items={v.davaci_weak_points} tone="red" />
            <PointsBox title={`${sanikName} — Güçlü Yönler`} items={v.sanik_strong_points} tone="green" />
            <PointsBox title={`${sanikName} — Zayıf Yönler`} items={v.sanik_weak_points} tone="red" />
          </div>

          <div className="flex items-center justify-between text-sm font-mono tracking-widest uppercase text-ink-faded pt-6 border-t border-ink">
            <span>Yargıç Ayumi · Althing Mahkemesi</span>
            <span>Şiddet · {v.severity}</span>
          </div>
        </div>

        {/* === DANIŞMAN VARGA (sert) === */}
        {c?.varga && (
          <div className="paper p-5 md:p-12">
            <div className="court-header mb-2">Danışman Varga</div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-oxblood mb-6">
              Yüzleştirme
            </p>
            <p className="text-xl italic mb-8 leading-relaxed text-ink-soft">{c.varga.intro}</p>
            <div className="space-y-6">
              <CounselMessage label={davaciName} text={c.varga.davaci_message} />
              <CounselMessage label={sanikName} text={c.varga.sanik_message} />
              <div>
                <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
                  İki Tarafa
                </div>
                <p className="leading-relaxed">{c.varga.joint_advice}</p>
              </div>
              <p className="italic text-lg pt-6 border-t border-ink-faded/30">{c.varga.closing}</p>
            </div>
          </div>
        )}

        {/* === DANIŞMAN ADLER (ılımlı) === */}
        {c?.adler && (
          <div className="paper p-5 md:p-12">
            <div className="court-header mb-2">Danışman Adler</div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-oxblood mb-6">
              Yol Gösterme
            </p>
            <p className="text-xl italic mb-8 leading-relaxed text-ink-soft">{c.adler.intro}</p>
            <div className="space-y-6">
              <CounselMessage label={davaciName} text={c.adler.davaci_message} />
              <CounselMessage label={sanikName} text={c.adler.sanik_message} />
              <div>
                <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
                  Ortak Tavsiye
                </div>
                <p className="leading-relaxed">{c.adler.joint_advice}</p>
              </div>
              <p className="italic text-lg pt-6 border-t border-ink-faded/30">{c.adler.closing}</p>
            </div>
          </div>
        )}

        {/* === İZLEYİCİ YORUMLARI === */}
        {room.spectatorComments && room.spectatorComments.length > 0 && (
          <div className="paper p-5 md:p-8">
            <div className="court-header mb-2">İzleyici Yorumları</div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faded mb-5">
              Locadan gelen sözler · {room.spectatorComments.length} adet
            </p>
            <div className="space-y-3">
              {room.spectatorComments.map((s, i) => (
                <div key={i} className="border-l-2 border-oxblood/30 pl-4 py-1">
                  <p className="text-ink leading-relaxed italic">“{s.text}”</p>
                  <p className="font-mono text-[9px] tracking-widest uppercase text-ink-faded mt-1">
                    İzleyici #{i + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === PAYLAŞILABİLİR KÜÇÜK ÖZET KARTI === */}
        <div className="paper p-6 md:p-8">
          <div className="court-header mb-2">Paylaşılabilir Özet</div>
          <p className="text-sm text-ink-soft italic mb-6">
            Sosyal medyada paylaşmak için aşağıdaki kartı PNG olarak indir veya direkt story'ne yolla.
          </p>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
            {/* STORY CARD */}
            <div
              ref={cardRef}
              style={{
                width: 300,
                height: 533,
                background: 'radial-gradient(120% 80% at 50% 0%, #2a2018 0%, #16110c 60%, #0e0a07 100%)',
                padding: '34px 28px',
                color: '#f3eccf',
                fontFamily: '"Crimson Pro", Georgia, serif',
                boxShadow: '0 20px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(243,236,207,0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* köşe çentikleri */}
              <span style={{ position: 'absolute', top: 11, left: 11, width: 14, height: 14, borderLeft: '1.5px solid rgba(243,236,207,0.35)', borderTop: '1.5px solid rgba(243,236,207,0.35)' }} />
              <span style={{ position: 'absolute', top: 11, right: 11, width: 14, height: 14, borderRight: '1.5px solid rgba(243,236,207,0.35)', borderTop: '1.5px solid rgba(243,236,207,0.35)' }} />
              <span style={{ position: 'absolute', bottom: 11, left: 11, width: 14, height: 14, borderLeft: '1.5px solid rgba(243,236,207,0.35)', borderBottom: '1.5px solid rgba(243,236,207,0.35)' }} />
              <span style={{ position: 'absolute', bottom: 11, right: 11, width: 14, height: 14, borderRight: '1.5px solid rgba(243,236,207,0.35)', borderBottom: '1.5px solid rgba(243,236,207,0.35)' }} />

              {/* ÇAPRAZ DAMGA — boylu boyunca */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-32deg)',
                width: 620,
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}>
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: 70,
                  letterSpacing: '0.06em',
                  color: stampColor,
                  opacity: 0.42,
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  WebkitTextStroke: `2px ${stampColor}`,
                }}>
                  {stampText}
                </div>
                <div style={{
                  margin: '6px auto 0',
                  width: 460,
                  height: 5,
                  background: stampColor,
                  opacity: 0.42,
                }} />
                <div style={{
                  margin: '5px auto 0',
                  width: 460,
                  height: 2,
                  background: stampColor,
                  opacity: 0.42,
                }} />
              </div>

              {/* ÜST — sadece mahkeme ismi */}
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', color: '#c9a868' }}>
                  Althing Mahkemesi
                </div>
                <div style={{ margin: '12px auto 0', width: 44, height: 1, background: '#c9a868', opacity: 0.5 }} />
              </div>

              {/* ORTA — kişinin sprite'ı + en çarpıcı söz */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <img
                    src={`/sprites/${role}/normal.png`}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{
                      height: 132,
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))',
                    }}
                  />
                </div>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 8,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: '#8a7a5a',
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                  Yargıç Sigrid'in Hükmü
                </div>
                <p style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: 19,
                  lineHeight: 1.3,
                  color: '#f3eccf',
                  margin: 0,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                  “{punchLine}”
                </p>
              </div>

              {/* ALT — rozet + tarih */}
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 18px',
                  background: severityStyle.bg,
                  color: '#f7f0dd',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  letterSpacing: '0.38em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  border: '1px solid rgba(243,236,207,0.25)',
                }}>
                  Şiddet · {severityStyle.label}
                </div>
                <div style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(201,168,104,0.3)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 8,
                  letterSpacing: '0.3em',
                  color: '#8a7a5a',
                }}>
                  Esas No {room.code} · {today}
                </div>
              </div>
            </div>

            {/* BUTONLAR — kartın yanında dikey */}
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[180px]">
              <button onClick={downloadCard} disabled={downloading} className="btn-brutal w-full">
                {downloading ? 'Hazırlanıyor…' : 'PNG İndir'}
              </button>
              <button onClick={shareCard} className="btn-brutal btn-brutal-secondary w-full">
                Story Paylaş
              </button>
              <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faded text-center mt-2 leading-relaxed">
                Mobilde direkt Instagram / WhatsApp story'ne yollar. <br />
                Masaüstünde PNG indirir.
              </p>
            </div>
          </div>
        </div>

        {/* === YENİ DAVA === */}
        <div className="text-center pt-4 pb-12">
          <button className="btn-brutal" onClick={onNewCase}>
            Yeni Dava Aç
          </button>
        </div>
      </div>
    </div>
  );
}

function PointsBox({ title, items, tone }) {
  const color = tone === 'green' ? 'border-l-emerald-700' : 'border-l-oxblood';
  return (
    <div className={`pl-4 border-l-4 ${color}`}>
      <div className="font-mono text-xs tracking-widest text-ink-faded uppercase mb-2">
        {title}
      </div>
      <ul className="space-y-1 text-[15px] leading-relaxed">
        {(items || []).map((item, i) => (
          <li key={i}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function CounselMessage({ label, text }) {
  if (!text) return null;
  return (
    <div>
      <div className="font-mono text-xs tracking-widest text-oxblood uppercase mb-2">
        {label}'ya
      </div>
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
