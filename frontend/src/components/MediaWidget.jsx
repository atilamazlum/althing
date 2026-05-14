import { useEffect, useMemo, useState } from 'react';
import { PLAYLIST, getThumbnail, getEmbedUrl } from '../data/playlist.js';

export default function MediaWidget({ deadline }) {
  const categories = useMemo(() => Object.keys(PLAYLIST), []);
  const [expanded, setExpanded] = useState(false);
  const [playingUrl, setPlayingUrl] = useState(null);
  const [activeCat, setActiveCat] = useState(categories[0] || null);

  // Tur süresi son 10sn — otomatik küçült (ses devam eder)
  useEffect(() => {
    if (!deadline || !expanded) return;
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining > 0 && remaining < 10000) setExpanded(false);
    };
    const h = setInterval(tick, 500);
    return () => clearInterval(h);
  }, [deadline, expanded]);

  const playingSong = useMemo(() => {
    if (!playingUrl) return null;
    for (const cat of Object.values(PLAYLIST)) {
      const s = cat.find((x) => x.url === playingUrl);
      if (s) return s;
    }
    return null;
  }, [playingUrl]);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        {expanded ? (
          <div className="paper p-4 shadow-deep w-[420px] max-h-[540px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">
                Müzik
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="w-6 h-6 border border-ink-faded text-xs hover:bg-ink hover:text-parchment"
                title="Küçült"
              >
                −
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
                          onClick={() => setPlayingUrl(song.url)}
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
                Henüz şarkı eklenmemiş.
                <br />
                <span className="font-mono text-[10px] tracking-widest uppercase mt-2 inline-block">
                  src/data/playlist.js
                </span>
              </div>
            )}

            {playingSong && (
              <div className="mt-3 pt-3 border-t border-ink-faded/30 flex items-center justify-between gap-2">
                <div className="text-xs truncate flex-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faded mr-2">
                    ♪
                  </span>
                  {playingSong.title}
                </div>
                <button
                  onClick={() => setPlayingUrl(null)}
                  className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 border border-ink hover:bg-ink hover:text-parchment"
                >
                  Durdur
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="paper px-4 py-3 hover:translate-y-[-2px] hover:shadow-deep transition-all flex items-center gap-2"
            title={playingSong ? `Çalıyor: ${playingSong.title}` : 'Müzik kütüphanesi'}
          >
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">
              ♪
            </span>
            <span className="font-mono text-[11px] tracking-widest uppercase truncate max-w-[160px]">
              {playingSong ? playingSong.title : 'Müzik'}
            </span>
          </button>
        )}
      </div>

      {/* Gizli iframe — collapsed olsa bile ses devam eder */}
      {playingUrl && (
        <iframe
          src={getEmbedUrl(playingUrl)}
          allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
          allowFullScreen
          title="player"
          className="fixed pointer-events-none opacity-0"
          style={{ width: 1, height: 1, bottom: 0, right: 0, zIndex: -1 }}
        />
      )}
    </>
  );
}
