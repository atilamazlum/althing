import { useEffect, useState } from 'react';
import { socket } from './socket.js';
import HomeScreen from './components/HomeScreen.jsx';
import ComplaintScreen from './components/ComplaintScreen.jsx';
import CourtroomScreen from './components/CourtroomScreen.jsx';
import VerdictScreen from './components/VerdictScreen.jsx';
import VerdictVideoReveal from './components/VerdictVideoReveal.jsx';
import GavelOverlay from './components/GavelOverlay.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ExtensionVoteScreen from './components/ExtensionVoteScreen.jsx';
import SpectatorScreen from './components/SpectatorScreen.jsx';

const STORAGE_KEY = 'althing-session';

function saveSession(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function App() {
  const [role, setRole] = useState(null);
  const [myName, setMyName] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [videoSeen, setVideoSeen] = useState(false);
  const [spectatorCode, setSpectatorCode] = useState(null);

  // Karar reveal videosunu görmüş müyüz — oda koduna göre sessionStorage
  useEffect(() => {
    if (room?.code) {
      const seen = sessionStorage.getItem(`videoSeen-${room.code}`) === 'true';
      setVideoSeen(seen);
    }
  }, [room?.code]);

  function markVideoSeen() {
    if (room?.code) {
      try { sessionStorage.setItem(`videoSeen-${room.code}`, 'true'); } catch {}
    }
    setVideoSeen(true);
  }

  // Reconnect on mount: eğer localStorage'da session varsa rejoin dene
  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    function tryRejoin() {
      socket.emit('rejoin-room', { code: session.code, role: session.role }, (resp) => {
        if (resp.error) {
          // Eski oturum öldü, temizle
          clearSession();
          return;
        }
        setRole(resp.role);
        setMyName(resp.role === 'davaci' ? resp.anonName : resp.displayName);
      });
    }
    if (socket.connected) tryRejoin();
    else socket.once('connect', tryRejoin);
  }, []);

  useEffect(() => {
    function onRoomState(state) {
      setRoom(state);
    }
    function onDisconnect() {
      // Otomatik reconnect socket.io tarafından deneniyor. Hata gösterme.
    }
    socket.on('room-state', onRoomState);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('room-state', onRoomState);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  function handleCreateRoom(isPublic, davaciName) {
    setError(null);

    // Frontend tarafı ek limit — backend asıl koruma, bu sadece UX
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem('roomCreationDaily');
      let rec = raw ? JSON.parse(raw) : null;
      if (!rec || rec.date !== today) rec = { date: today, count: 0 };
      if (rec.count >= 2) {
        setError('Günlük mahkeme açma sınırına ulaştın (2/gün). Yarın tekrar dene.');
        return;
      }
      rec.count++;
      localStorage.setItem('roomCreationDaily', JSON.stringify(rec));
    } catch {}

    socket.emit('create-room', { isPublic: !!isPublic, davaciName: davaciName || '' }, ({ code, role: r, anonName, spectatorCode: sc, error: err }) => {
      if (err) {
        setError(err);
        return;
      }
      setRole(r);
      setMyName(anonName);
      setSpectatorCode(sc || null);
      saveSession({ code, role: r });
    });
  }

  function handleJoinRoom(code, displayName) {
    setError(null);
    socket.emit('join-room', { code: code.toUpperCase(), displayName }, (resp) => {
      if (resp.error) {
        setError(resp.error);
        return;
      }
      setRole(resp.role);
      setMyName(resp.displayName);
      saveSession({ code: resp.code, role: resp.role });
    });
  }

  function handleSpectate(code) {
    setError(null);
    socket.emit('spectate-room', { code: (code || '').toUpperCase() }, (resp) => {
      if (resp?.error) {
        setError(resp.error);
        return;
      }
      setRole('spectator');
      setMyName('İzleyici');
      saveSession({ code: resp.code, role: 'spectator' });
    });
  }

  function handleNewCase() {
    clearSession();
    window.location.reload();
  }

  function handleRetry() {
    if (!room) return;
    setRetrying(true);
    socket.emit('retry-error', { code: room.code }, (resp) => {
      setRetrying(false);
      if (resp?.error) setError(resp.error);
    });
  }

  // Henüz odada değil → ana sayfa
  if (!room) {
    return <HomeScreen onCreate={handleCreateRoom} onJoin={handleJoinRoom} onSpectate={handleSpectate} error={error} />;
  }

  // İzleyici → FNAF kamera ekranı
  if (role === 'spectator') {
    return <SpectatorScreen room={room} />;
  }

  // Hata fazı: tekrar dene butonu
  if (room.phase === 'ERROR') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="paper p-8 max-w-2xl mx-auto slide-up">
          <div className="court-header mb-6">Mahkeme Aksaklığı</div>
          <h1 className="text-3xl mb-4">Bir aksilik çıktı</h1>
          <div className="error-box mb-6">{room.error || 'Bilinmeyen hata.'}</div>
          <p className="text-ink-soft mb-6 leading-relaxed">
            Bu çoğunlukla geçici bir Gemini yoğunluğudur. Tekrar denersek genelde geçer
            — dava sıfırdan başlamaz, kaldığı yerden devam eder.
          </p>
          <div className="flex gap-3">
            <button className="btn-brutal" onClick={handleRetry} disabled={retrying}>
              {retrying ? 'Yeniden deniyor...' : 'Tekrar Dene'}
            </button>
            <button className="btn-brutal btn-brutal-secondary" onClick={handleNewCase}>
              Sıfırdan başla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bekleme: sanık katılana kadar
  if (room.phase === 'WAITING') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="paper p-10 max-w-xl mx-auto slide-up text-center relative">
          <button
            onClick={handleNewCase}
            className="absolute top-4 left-4 font-mono text-xs tracking-widest uppercase text-ink-faded hover:text-oxblood"
            title="Davayı iptal et"
          >
            ← Geri
          </button>
          <div className="esas-no mb-2">ESAS NO · {room.code}</div>
          <h1 className="text-4xl mb-2">Müşteki onaylandı</h1>
          <p className="text-ink-soft mb-6 italic">
            Sanığın mahkemeye katılması bekleniyor.
          </p>
          <div className="my-8">
            <span className="ink-pulse text-4xl tracking-widest">· · ·</span>
          </div>
          <p className="text-sm text-ink-faded">Karşı tarafa şu kodu gönder:</p>
          <div className="font-mono text-5xl tracking-[0.3em] my-3 text-oxblood">{room.code}</div>
          <button
            className="btn-brutal-secondary btn-brutal mt-4 text-xs"
            onClick={() => navigator.clipboard.writeText(room.code)}
          >
            Kodu kopyala
          </button>

          {/* İzleyici kodu — özel oda */}
          {!room.isPublic && spectatorCode && (
            <div className="mt-8 pt-6 border-t border-ink-faded/30">
              <p className="text-sm text-ink-faded mb-1">
                Birinin <strong className="text-ink">izlemesini</strong> istersen bu kodu paylaş:
              </p>
              <div className="font-mono text-2xl tracking-[0.25em] my-2 text-ink">{spectatorCode}</div>
              <button
                className="btn-brutal-secondary btn-brutal text-xs"
                onClick={() => navigator.clipboard.writeText(spectatorCode)}
              >
                İzleyici kodunu kopyala
              </button>
            </div>
          )}
          {room.isPublic && (
            <div className="mt-8 pt-6 border-t border-ink-faded/30">
              <p className="text-sm text-ink-faded italic">
                Bu açık bir mahkeme — dava başlayınca herkes ana sayfadan izleyebilir.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (room.phase === 'COMPLAINT') {
    return (
      <ComplaintScreen
        room={room}
        role={role}
        myName={myName}
        onSubmit={(text, images, judgeMode) =>
          socket.emit('submit-complaint', { code: room.code, text, images, judgeMode }, (resp) => {
            if (resp.error) setError(resp.error);
          })
        }
      />
    );
  }

  if (room.phase === 'GENERATING_INDICTMENT') {
    return <LoadingScreen title="İddianame hazırlanıyor" subtitle="Mahkeme kalemi yazıyor..." />;
  }

  if (room.phase === 'COURT') {
    return (
      <CourtroomScreen
        room={room}
        role={role}
        myName={myName}
        onSubmit={(text, images) =>
          socket.emit('submit-turn', { code: room.code, text, images }, (resp) => {
            if (resp.error) setError(resp.error);
          })
        }
      />
    );
  }

  if (room.phase === 'EXTENSION_VOTE') {
    return <ExtensionVoteScreen room={room} role={role} myName={myName} />;
  }

  if (room.phase === 'GENERATING_VERDICT') {
    return <GavelOverlay title="Yargıç Sigrid kararını veriyor" subtitle="Delil ve ifadeler tartılıyor" />;
  }

  // Yargıç bitince → tam ekran reveal videosu (danışman arka planda çalışıyor)
  if ((room.phase === 'GENERATING_COUNSEL' || room.phase === 'COMPLETE') && !videoSeen) {
    return <VerdictVideoReveal videoSrc="/videos/verdict-intro.mp4" onEnded={markVideoSeen} />;
  }

  if (room.phase === 'GENERATING_COUNSEL') {
    return <LoadingScreen title="Danışman söz alıyor" subtitle="Tavsiye hazırlanıyor..." />;
  }

  if (room.phase === 'COMPLETE') {
    return <VerdictScreen room={room} role={role} onNewCase={handleNewCase} />;
  }

  return <LoadingScreen title="Yükleniyor" />;
}
