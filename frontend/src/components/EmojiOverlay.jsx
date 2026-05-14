import { useEffect, useRef } from 'react';
import { findEmoji, getEmojiUrl, getSoundUrl } from '../data/emojis.js';

const DURATION_MS = 6000;

export default function EmojiOverlay({ emojiId, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const audioRef = useRef(null);

  const emoji = findEmoji(emojiId);

  useEffect(() => {
    // Ses çal
    if (emoji?.sound) {
      try {
        const audio = new Audio(getSoundUrl(emoji.sound));
        audio.volume = 0.7;
        audio.play().catch(() => {});
        audioRef.current = audio;
      } catch (_) {}
    }

    const t = setTimeout(() => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (_) {}
      }
      if (onDoneRef.current) onDoneRef.current();
    }, DURATION_MS);

    return () => {
      clearTimeout(t);
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (_) {}
      }
    };
  }, []);

  if (!emoji) return null;

  return (
    <>
      <style>{`
        @keyframes emoji-fade {
          0%   { opacity: 0; transform: scale(0.92); }
          15%  { opacity: 1; transform: scale(1); }
          85%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes emoji-bg-fade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .emoji-overlay-bg {
          animation: emoji-bg-fade 5500ms ease-in-out forwards;
        }
        .emoji-overlay-img {
          animation: emoji-fade 5500ms ease-in-out forwards;
          filter: drop-shadow(0 10px 40px rgba(168, 40, 40, 0.5));
        }
      `}</style>

      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none emoji-overlay-bg" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}>
        <img
          src={getEmojiUrl(emoji.file)}
          alt={emoji.label}
          className="emoji-overlay-img"
          style={{
            maxWidth: '72vw',
            maxHeight: '72vh',
            width: 'auto',
            height: 'auto',
          }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>
    </>
  );
}