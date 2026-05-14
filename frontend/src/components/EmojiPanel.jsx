import { useEffect, useMemo, useState } from 'react';
import { EMOJIS, EMOJI_COOLDOWN_MS, getEmojiUrl } from '../data/emojis.js';

export default function EmojiPanel({ onReact }) {
  const [expanded, setExpanded] = useState(false);
const [globalCooldownUntil, setGlobalCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Saniye sayacı (cooldown göstergesi için)
  useEffect(() => {
    if (!expanded) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [expanded]);

  function fire(emoji) {
  if (globalCooldownUntil > Date.now()) return;
  setGlobalCooldownUntil(Date.now() + 2 * 60 * 1000);
  if (onReact) onReact(emoji.id);
}

 function remainingFor() {
  return Math.max(0, globalCooldownUntil - now);
}
  function formatSeconds(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  }

  // EMOJIS listesi boşsa paneli hiç gösterme (kullanıcı kendi listesini ekleyecek)
  if (!EMOJIS || EMOJIS.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {expanded ? (
        <div className="paper p-3 shadow-deep">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">
              Reaksiyon
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 border border-ink-faded text-xs hover:bg-ink hover:text-parchment"
              title="Küçült"
            >
              −
            </button>
          </div>
          <div className="flex gap-2 flex-wrap max-w-[360px]">
            {EMOJIS.map((e) => {
const remaining = remainingFor();
              const onCooldown = remaining > 0;
              return (
                <button
                  key={e.id}
                  onClick={() => fire(e)}
                  disabled={onCooldown}
                  title={onCooldown ? `${e.label} · ${formatSeconds(remaining)}` : e.label}
                  className={`relative w-14 h-14 border-2 overflow-hidden ${
                    onCooldown
                      ? 'border-ink-faded/30 cursor-not-allowed'
                      : 'border-ink hover:border-oxblood hover:bg-oxblood/10'
                  } transition-colors`}
                >
                  <img
                    src={getEmojiUrl(e.file)}
                    alt={e.label}
                    className={`w-full h-full object-contain ${onCooldown ? 'opacity-30 grayscale' : ''}`}
                    onError={(ev) => (ev.currentTarget.style.opacity = '0.1')}
                  />
                  {onCooldown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                      <span className="font-mono text-[10px] text-parchment">
                        {formatSeconds(remaining)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="paper px-4 py-3 hover:translate-y-[-2px] hover:shadow-deep transition-all flex items-center gap-2"
          title="Reaksiyonlar"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faded">⌒</span>
          <span className="font-mono text-[11px] tracking-widest uppercase">Tepki</span>
        </button>
      )}
    </div>
  );
}
