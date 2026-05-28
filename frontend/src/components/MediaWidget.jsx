import { useEffect, useMemo, useState } from 'react';
import { PLAYLIST, getThumbnail, getEmbedUrl } from '../data/playlist.js';

export default function MediaWidget({ deadline }) {
  const categories = useMemo(() => Object.keys(PLAYLIST), []);
  const [showGrid, setShowGrid] = useState(false);
  const [playingUrl, setPlayingUrl] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [activeCat, setActiveCat] = useState(categories[0] || null);

  // Tur süresi son 10sn — sadece grid panelini kapat, iframe çalmaya devam
  useEffect(() => {
    if (!deadline || !showGrid) return;
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining > 0 && remaining < 10000) setShowGrid(false);
    };
    const h = setInterval(tick, 500);
    return () => clearInterval(h);
  }, [deadline, showGrid]);

  const playingSong = useMemo(() => {
    if (!playingUrl) return null;
    for (const cat of Object.values(PLAYLIST)) {
      const s = cat.find((x) => x.url === playingUrl);
      if (s) return s;
    }
    return null;
  }, [playingUrl]);

  function playSong(url) {
    setPlayingUrl(url);
  }

  function stopSong() {
    setPlayingUrl(null);
  }

  return (
    <>
      {/* GRID PANEL — playing veya değil, açıldığında üstte beliren panel */}
      {showGrid && (
        <div
          className="fixed z-40 paper p-4 shadow-deep w-[420px] max-w-[calc(100vw-1.5rem)] max-h-[70vh] flex flex-col"
          style={{
            bottom: playingUrl ? 200 : 70,
            right: 16,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">
              Müzik Listesi
            </div>
            <button
              onClick={() => setShowGrid(false)}
              className="w-6 h-6 border border-ink-faded text-xs hover:bg-ink hover:text-parchment"
              title="Kapat"
            >
              ×
            </button>
          </div>

          {categories.length > 0 ? (
            <>
              {categories.length > 1 && (
                <div className="flex gap-1 mb-3 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(cat)}
                      className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1 border whitespace-nowrap ${
                        activeCat === cat
                          ? 'bg-ink text-parchment border-ink'
                          : 'border-ink-faded/40 text-ink-soft hover:border-ink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="overflow-y-auto flex-1 -mx-1 px-1">
                <div className="grid grid-cols-2 gap-2">
                  {(PLAYLIST[activeCat] || []).map((song) => {
                    const thumb = getThumbnail(song.url);
                    const isPlaying = song.url === playingUrl;
                    return (
                      <button
                        key={song.url}
                        onClick={() => playSong(song.url)}
                        className={`text-left p-2 border transition-colors ${
                          isPlaying
                            ? 'border-oxblood bg-oxblood/10'
                            : 'border-ink-faded/30 hover:border-ink'
                        }`}
                      >
                        {thumb && (
                          <div className="relative aspect-video bg-ink mb-2 overflow-hidden">
                            <img
                              src={thumb}
                              alt={song.title}
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.opacity = '0')}
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center ${
                                isPlaying ? 'bg-oxblood/70' : 'bg-ink/30'
                              }`}
                            >
                              {isPlaying ? (
                                <span className="font-mono text-[10px] tracking-widest uppercase text-parchment">
                                  ♪ Çalıyor
                                </span>
                              ) : (
                                <span className="text-parchment text-2xl">▶</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-xs leading-tight">{song.title}</div>
                      </button>
                    );
                  })}
                </div>

                {(!PLAYLIST[activeCat] || PLAYLIST[activeCat].length === 0) && (
                  <div className="text-xs italic text-ink-faded text-center py-10">
                    Bu kategori boş.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs italic text-ink-faded text-center py-10">
              Şarkı eklenmemiş.
              <br />
              <span className="font-mono text-[10px] tracking-widest uppercase mt-2 inline-block">
                src/data/playlist.js
              </span>
            </div>
          )}
        </div>
      )}

      {/* MINI PLAYER — şarkı çalıyorsa her zaman görünür (YouTube duraklatmasın diye) */}
      {playingUrl ? (
        <div className="fixed bottom-4 right-4 z-40 paper p-2 shadow-deep">
          <div className="flex items-center justify-between mb-1 px-1 gap-2">
            <button
              onClick={() => setShowGrid((v) => !v)}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-faded hover:text-oxblood truncate max-w-[120px]"
              title="Müzik listesini aç"
            >
              ♪ {playingSong?.title || 'Çalıyor'}
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => setMinimized((v) => !v)}
                className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border border-ink hover:bg-ink hover:text-parchment"
                title={minimized ? 'Videoyu göster' : 'Küçült (müzik çalmaya devam eder)'}
              >
                {minimized ? '▢ Büyüt' : '— Küçült'}
              </button>
              <button
                onClick={stopSong}
                className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border border-ink hover:bg-ink hover:text-parchment"
              >
                Durdur
              </button>
            </div>
          </div>

          {/* iframe HER ZAMAN DOM'da kalır — küçültünce 1px'e kırpılır, ses durmaz */}
          <div style={{
            width: minimized ? 0 : 280,
            height: minimized ? 0 : 158,
            overflow: 'hidden',
            transition: 'width 0.2s, height 0.2s',
          }}>
            <iframe
              src={getEmbedUrl(playingUrl)}
              allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
              allowFullScreen
              title="player"
              className="border border-ink"
              style={{ width: 280, height: 158, background: '#000', display: 'block' }}
            />
          </div>

          {minimized && (
            <div className="font-mono text-[9px] tracking-widest uppercase text-ink-faded px-1 pt-1 pb-0.5">
              ♪ çalıyor — gizli
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowGrid((v) => !v)}
          className="fixed bottom-4 right-4 z-40 paper px-4 py-3 hover:translate-y-[-2px] hover:shadow-deep transition-all flex items-center gap-2"
          title="Müzik kütüphanesi"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">♪</span>
          <span className="font-mono text-[11px] tracking-widest uppercase">Müzik</span>
        </button>
      )}
    </>
  );
}
