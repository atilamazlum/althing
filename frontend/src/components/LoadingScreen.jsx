import { useState } from 'react';

export default function LoadingScreen({ title, subtitle, videoSrc }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="text-center slide-up max-w-2xl w-full">
        <div className="esas-no mb-4">A · L · T · H · I · N · G</div>
        <h2 className="text-4xl mb-2">{title}</h2>
        {subtitle && <p className="italic text-ink-soft mb-6">{subtitle}</p>}

        {/* Video varsa oynat (sessiz, otomatik), yoksa nokta animasyonu */}
        {videoSrc && !videoFailed ? (
          <div className="my-6">
            <video
              src={videoSrc}
              autoPlay
              muted
              playsInline
              className="w-full max-w-xl mx-auto border-2 border-ink shadow-deep"
              style={{ aspectRatio: '16 / 9', background: '#000' }}
              onError={() => setVideoFailed(true)}
              onEnded={(e) => e.currentTarget.pause()}
            />
            <div className="ink-pulse text-3xl tracking-widest mt-6">· · ·</div>
          </div>
        ) : (
          <div className="ink-pulse text-5xl tracking-widest mt-8">· · ·</div>
        )}
      </div>
    </div>
  );
}