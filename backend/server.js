// Althing Mahkemesi — Backend
// Express HTTP + Socket.io WebSocket + Oda yönetimi + Gemini akışı

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { IDDIANAME_YAZICI, YARGIC, DANISMAN_VARGA, DANISMAN_ADLER } from './prompts.js';
import { callGemini } from './gemini.js';

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Birden fazla origin destekle, sondaki slash'a takılmayan esnek CORS
const ALLOWED_ORIGINS = FRONTEND_URL
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
ALLOWED_ORIGINS.push('http://localhost:5173'); // local dev için her zaman izinli

function corsOriginCheck(origin, callback) {
  // Server-to-server veya curl gibi origin'siz istekler — izin ver
  if (!origin) return callback(null, true);
  const normalized = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(normalized)) return callback(null, true);
  console.warn(`[CORS reddedildi] origin=${origin} | izinli=${ALLOWED_ORIGINS.join(', ')}`);
  callback(new Error(`CORS: ${origin} izinli değil`));
}

const TURN_LIMIT_MS = 10 * 60 * 1000; // 10 dakika
const BASE_COURT_TURNS = 5;
const EXTENSION_TURNS = 2;
const MIN_TURN_CHARS = 40;
const MIN_COMPLAINT_CHARS = 40;
const DISCONNECT_GRACE_MS = 5 * 60 * 1000; // 5 dk reconnect penceresi

const app = express();
app.use(cors({ origin: corsOriginCheck }));
app.use(express.json({ limit: '20mb' }));

// Basit health endpoint
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOriginCheck },
  maxHttpBufferSize: 20e6, // 20MB — base64 görseller için
});

// ============ ROOM STATE ============
// rooms: Map<code, room>
// room = {
//   code, phase, davaci: {socketId, anonName} | null, sanik: {socketId, displayName} | null,
//   complaint: { text, images } | null,
//   indictment: {...} | null,
//   turns: [{role, text, images, ts}, ...],
//   currentTurn: 'davaci'|'sanik' | null,
//   turnNumber: number,
//   deadline: timestamp | null,
//   verdict: {...} | null,
//   counsel: {...} | null,
//   timerHandle: setTimeout handle | null
// }

const rooms = new Map();

const PHASES = {
  WAITING: 'WAITING',
  COMPLAINT: 'COMPLAINT',
  GENERATING_INDICTMENT: 'GENERATING_INDICTMENT',
  COURT: 'COURT',
  EXTENSION_VOTE: 'EXTENSION_VOTE',
  GENERATING_VERDICT: 'GENERATING_VERDICT',
  GENERATING_COUNSEL: 'GENERATING_COUNSEL',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
};

function makeCode() {
  // 4 harf, kolay paylaşılır (örn. "KZRT")
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(c) ? makeCode() : c;
}

// İzleyici kodu — 6 karakter, oda kodundan ayrı (örn. "İZL-7K3M")
function makeSpectatorCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  // Çakışma kontrolü
  for (const r of rooms.values()) if (r.spectatorCode === c) return makeSpectatorCode();
  return c;
}

const MAX_SPECTATORS = 5;
const MAX_ROOMS_PER_IP_PER_DAY = 2;

// IP başına günlük oda açma sayacı — { ip: { date: 'YYYY-MM-DD', count: 2 } }
const ipRoomCounter = new Map();

// Site geneli sayaçlar
const stats = {
  totalCases: 0,        // toplam açılan dava
  totalVisits: 0,       // toplam tekil ziyaret (yaklaşık — yeni socket bağlantısı)
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(socket) {
  const fwd = socket.handshake.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return socket.handshake.address || 'unknown';
}

function canCreateRoom(ip) {
  const today = todayKey();
  const rec = ipRoomCounter.get(ip);
  if (!rec || rec.date !== today) return { ok: true, used: 0, max: MAX_ROOMS_PER_IP_PER_DAY };
  if (rec.count >= MAX_ROOMS_PER_IP_PER_DAY) {
    return { ok: false, used: rec.count, max: MAX_ROOMS_PER_IP_PER_DAY };
  }
  return { ok: true, used: rec.count, max: MAX_ROOMS_PER_IP_PER_DAY };
}

function recordRoomCreation(ip) {
  const today = todayKey();
  const rec = ipRoomCounter.get(ip);
  if (!rec || rec.date !== today) {
    ipRoomCounter.set(ip, { date: today, count: 1 });
  } else {
    rec.count++;
  }
}

function anonHandle() {
  return `Müşteki #${Math.floor(1000 + Math.random() * 9000)}`;
}

function publicRoomState(room) {
  return {
    code: room.code,
    phase: room.phase,
    davaci: room.davaci ? { anonName: room.davaci.anonName, connected: !!room.davaci.socketId } : null,
    sanik: room.sanik ? { displayName: room.sanik.displayName, connected: !!room.sanik.socketId } : null,
    complaint: room.complaint ? { text: room.complaint.text, hasImages: (room.complaint.images || []).length > 0 } : null,
    indictment: room.indictment,
    turns: room.turns.map((t) => ({ role: t.role, text: t.text, hasImages: (t.images || []).length > 0, ts: t.ts })),
    currentTurn: room.currentTurn,
    turnNumber: room.turnNumber,
    maxTurns: room.maxTurns,
    deadline: room.deadline,
    verdict: room.verdict,
    counsel: room.counsel,
    extensionVotes: room.extensionVotes,
    extensionUsed: room.extensionUsed,
    error: room.error || null,
    errorStep: room.errorStep || null,
    isPublic: !!room.isPublic,
    spectatorCount: (room.spectators || []).length,
    spectatorComments: room.spectatorComments || [],
  };
}

// Ana ekranda gösterilecek aktif public oda listesi
function listPublicRooms() {
  const open = [];
  for (const room of rooms.values()) {
    if (!room.isPublic) continue;
    // Sadece izlenebilir aşamadakiler — bekleyen, biten, hatalı olanlar görünmez
    const watchable = ['COMPLAINT', 'GENERATING_INDICTMENT', 'COURT', 'EXTENSION_VOTE', 'GENERATING_VERDICT', 'GENERATING_COUNSEL'];
    if (!watchable.includes(room.phase)) continue;
    open.push({
      code: room.code,
      phase: room.phase,
      topic: room.indictment?.main_topic || 'İddianame hazırlanıyor',
      turnNumber: room.turnNumber,
      maxTurns: room.maxTurns,
      spectatorCount: (room.spectators || []).length,
    });
  }
  return open;
}

function broadcast(room) {
  io.to(room.code).emit('room-state', publicRoomState(room));
}

function clearTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
}

function startTurnTimer(room) {
  clearTimer(room);
  room.deadline = Date.now() + TURN_LIMIT_MS;
  room.timerHandle = setTimeout(() => {
    // Süre doldu — boş bir turn ile geç
    handleTurnSubmit(room, { text: '[Süre doldu, savunma yapılmadı]', images: [] }, true);
  }, TURN_LIMIT_MS);
}

async function handleComplaintSubmit(room, { text, images }) {
  room.complaint = { text, images: images || [] };
  room.phase = PHASES.GENERATING_INDICTMENT;
  room.error = null;
  room.errorStep = null;
  broadcast(room);

  try {
    const indictment = await callGemini(IDDIANAME_YAZICI, text, images);
    room.indictment = indictment;
    room.phase = PHASES.COURT;
    room.currentTurn = 'sanik';
    room.turnNumber = 1;
    startTurnTimer(room);
    broadcast(room);
  } catch (err) {
    console.error('İddianame hatası:', err);
    room.phase = PHASES.ERROR;
    room.error = `İddianame oluşturulamadı: ${err.message}`;
    room.errorStep = 'indictment';
    broadcast(room);
  }
}

async function proceedToVerdict(room) {
  room.currentTurn = null;
  room.deadline = null;
  room.phase = PHASES.GENERATING_VERDICT;
  room.error = null;
  room.errorStep = null;
  broadcast(room);

  try {
    const allImages = [
      ...(room.complaint.images || []),
      ...room.turns.flatMap((t) => t.images || []),
    ];

    const caseHistory = [
      `İDDİANAME:\n${room.indictment.indictment_letter}`,
      ...room.turns.map((t, i) => {
        const role = t.role === 'davaci' ? 'DAVACI' : `SANIK (${room.indictment.defendant_name})`;
        return `TUR ${i + 1} — ${role}:\n${t.text}`;
      }),
    ].join('\n\n');

    if (!room.verdict) {
      const verdict = await callGemini(YARGIC, caseHistory, allImages);
      room.verdict = verdict;
    }
    room.phase = PHASES.GENERATING_COUNSEL;
    broadcast(room);

    const counselInput = `${caseHistory}\n\nYARGIÇ KARARI:\n${JSON.stringify(room.verdict, null, 2)}`;
    const varga = await callGemini(DANISMAN_VARGA, counselInput);
    const adler = await callGemini(DANISMAN_ADLER, counselInput);
    room.counsel = { varga, adler };
    room.phase = PHASES.COMPLETE;
    broadcast(room);
  } catch (err) {
    console.error('Karar/danışman hatası:', err);
    room.phase = PHASES.ERROR;
    room.error = `Üretilemedi: ${err.message}`;
    room.errorStep = room.verdict ? 'counsel' : 'verdict';
    broadcast(room);
  }
}

async function handleTurnSubmit(room, { text, images }, fromTimer = false) {
  if (room.phase !== PHASES.COURT) return;
  clearTimer(room);

  room.turns.push({
    role: room.currentTurn,
    text,
    images: images || [],
    ts: Date.now(),
  });

  // Daha tur var mı?
  if (room.turnNumber < room.maxTurns) {
    room.turnNumber++;
    room.currentTurn = room.currentTurn === 'sanik' ? 'davaci' : 'sanik';
    startTurnTimer(room);
    broadcast(room);
    return;
  }

  // Maksimum tura ulaşıldı. Henüz uzatma yapılmadıysa oylama aç.
  if (!room.extensionUsed) {
    room.currentTurn = null;
    room.deadline = null;
    room.phase = PHASES.EXTENSION_VOTE;
    room.extensionVotes = { davaci: null, sanik: null };
    broadcast(room);
    return;
  }

  // Aksi takdirde direkt karara geç
  await proceedToVerdict(room);
}

function handleExtensionVote(room, role, vote) {
  if (room.phase !== PHASES.EXTENSION_VOTE) return;
  if (room.extensionVotes[role] !== null) return; // tekrar oy verilemez
  room.extensionVotes[role] = !!vote;

  const { davaci, sanik } = room.extensionVotes;
  if (davaci === null || sanik === null) {
    broadcast(room); // bir oyu kaydet, diğeri bekleniyor
    return;
  }

  // İki oy da geldi
  if (davaci && sanik) {
    // Uzatma onaylandı
    room.extensionUsed = true;
    room.maxTurns += EXTENSION_TURNS;
    room.turnNumber++;
    room.currentTurn = room.turns[room.turns.length - 1].role === 'sanik' ? 'davaci' : 'sanik';
    room.phase = PHASES.COURT;
    startTurnTimer(room);
    broadcast(room);
  } else {
    // Biri reddetti, karar zamanı
    proceedToVerdict(room);
  }
}

// ============ SOCKET.IO HANDLERS ============

io.on('connection', (socket) => {
  stats.totalVisits++;

  // İstatistik isteği
  socket.on('get-stats', (cb) => {
    if (typeof cb === 'function') {
      cb({ totalCases: stats.totalCases, totalVisits: stats.totalVisits });
    }
  });

  socket.on('create-room', (opts, cb) => {
    // opts opsiyonel — eski çağrılar (sadece cb) da çalışsın
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    opts = opts || {};

    // Günlük IP limiti kontrolü
    const ip = getClientIp(socket);
    const limit = canCreateRoom(ip);
    if (!limit.ok) {
      return cb && cb({ error: `Günlük mahkeme açma sınırına ulaştın (${limit.max}/gün). Yarın tekrar dene.` });
    }
    recordRoomCreation(ip);
    stats.totalCases++;

    const code = makeCode();
    const customName = (opts.davaciName || '').trim().slice(0, 24);
    const anonName = customName || anonHandle();
    const room = {
      code,
      phase: PHASES.WAITING,
      davaci: { socketId: socket.id, anonName },
      sanik: null,
      complaint: null,
      indictment: null,
      turns: [],
      currentTurn: null,
      turnNumber: 0,
      maxTurns: BASE_COURT_TURNS,
      deadline: null,
      verdict: null,
      counsel: null,
      extensionVotes: { davaci: null, sanik: null },
      extensionUsed: false,
      timerHandle: null,
      isPublic: !!opts.isPublic,
      spectatorCode: makeSpectatorCode(),
      spectators: [],
      spectatorComments: [],
    };
    rooms.set(code, room);
    socket.join(code);
    cb({ code, role: 'davaci', anonName, spectatorCode: room.spectatorCode, isPublic: room.isPublic });
    broadcast(room);
  });

  // Aktif public oda listesi iste
  socket.on('list-rooms', (cb) => {
    if (typeof cb === 'function') cb({ rooms: listPublicRooms() });
  });

  // İzleyici olarak odaya katıl — public'te oda kodu, private'ta izleyici kodu
  socket.on('spectate-room', ({ code }, cb) => {
    if (!code || typeof code !== 'string') return cb && cb({ error: 'Kod gerekli.' });
    const key = code.trim().toUpperCase();
    // Önce oda kodu olarak dene (public), sonra izleyici kodu olarak (private)
    let room = rooms.get(key);
    if (!room) {
      for (const r of rooms.values()) {
        if (r.spectatorCode === key) { room = r; break; }
      }
    }
    if (!room) return cb && cb({ error: 'İzlenecek mahkeme bulunamadı.' });
    // Public oda kendi koduyla izlenebilir; private SADECE izleyici koduyla
    if (room.code === key && !room.isPublic) {
      return cb && cb({ error: 'Bu özel bir mahkeme — izleyici kodu gerekli.' });
    }
    const watchable = ['COMPLAINT', 'GENERATING_INDICTMENT', 'COURT', 'EXTENSION_VOTE', 'GENERATING_VERDICT', 'GENERATING_COUNSEL', 'COMPLETE'];
    if (!watchable.includes(room.phase)) {
      return cb && cb({ error: 'Bu mahkeme şu an izlenemiyor.' });
    }
    if ((room.spectators || []).length >= MAX_SPECTATORS) {
      return cb && cb({ error: 'İzleyici kontenjanı dolu (maks. 5).' });
    }
    room.spectators.push({ socketId: socket.id });
    socket.join(room.code);
    cb && cb({ ok: true, code: room.code, role: 'spectator' });
    broadcast(room);
  });

  socket.on('join-room', ({ code, displayName }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda bulunamadı.' });
    if (room.sanik) return cb({ error: 'Oda zaten dolu.' });
    room.sanik = { socketId: socket.id, displayName: (displayName || 'Sanık').slice(0, 32) };
    socket.join(code);
    cb({ code, role: 'sanik', displayName: room.sanik.displayName });
    room.phase = PHASES.COMPLAINT; // Davacı şikayet yazmaya başlayabilir
    broadcast(room);
  });

  socket.on('submit-complaint', async ({ code, text, images, judgeMode }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda yok.' });
    if (room.davaci?.socketId !== socket.id) return cb({ error: 'Yetki yok.' });
    if (room.phase !== PHASES.COMPLAINT) return cb({ error: 'Yanlış aşama.' });
    if (!text || text.trim().length < MIN_COMPLAINT_CHARS) {
      return cb({ error: `En az ${MIN_COMPLAINT_CHARS} karakter gerekli.` });
    }
    room.judgeMode = judgeMode === 'radikal' ? 'radikal' : 'normal';
    cb({ ok: true });
    handleComplaintSubmit(room, { text, images });
  });

  socket.on('submit-turn', async ({ code, text, images }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda yok.' });
    if (room.phase !== PHASES.COURT) return cb({ error: 'Şu an konuşma sırası yok.' });
    const expectedSocketId =
      room.currentTurn === 'davaci' ? room.davaci?.socketId : room.sanik?.socketId;
    if (expectedSocketId !== socket.id) return cb({ error: 'Sıra sende değil.' });
    if (!text || text.trim().length < MIN_TURN_CHARS) {
      return cb({ error: `En az ${MIN_TURN_CHARS} karakter gerekli.` });
    }
    cb({ ok: true });
    handleTurnSubmit(room, { text, images });
  });

  socket.on('rejoin-room', ({ code, role }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda bulunamadı veya zaman aşımına uğradı.' });
    if (room.phase === PHASES.COMPLETE || room.phase === PHASES.ERROR) {
      // Bu fazlarda da bağlanabilir, gözlem yapsın
    }
    if (role === 'davaci') {
      if (!room.davaci) return cb({ error: 'Davacı yeri açık değil.' });
      room.davaci.socketId = socket.id;
      socket.join(code);
      cb({ ok: true, role: 'davaci', anonName: room.davaci.anonName, code });
    } else if (role === 'sanik') {
      if (!room.sanik) return cb({ error: 'Sanık yeri açık değil.' });
      room.sanik.socketId = socket.id;
      socket.join(code);
      cb({ ok: true, role: 'sanik', displayName: room.sanik.displayName, code });
    } else {
      return cb({ error: 'Geçersiz rol.' });
    }
    broadcast(room);
  });

  socket.on('retry-error', async ({ code }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda yok.' });
    if (room.phase !== PHASES.ERROR) return cb({ error: 'Hata fazında değil.' });
    cb({ ok: true });

    if (room.errorStep === 'indictment') {
      handleComplaintSubmit(room, room.complaint);
    } else if (room.errorStep === 'verdict' || room.errorStep === 'counsel') {
      proceedToVerdict(room);
    } else {
      room.error = 'Hata adımı bilinmiyor, baştan başlamak gerekiyor.';
      broadcast(room);
    }
  });

  socket.on('vote-extension', ({ code, vote }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Oda yok.' });
    if (room.phase !== PHASES.EXTENSION_VOTE) return cb({ error: 'Oylama aktif değil.' });
    const role =
      room.davaci?.socketId === socket.id ? 'davaci'
      : room.sanik?.socketId === socket.id ? 'sanik'
      : null;
    if (!role) return cb({ error: 'Bu odada değilsin.' });
    cb({ ok: true });
    handleExtensionVote(room, role, vote);
  });

  socket.on('emoji-react', ({ code, id }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Oda yok.' });
    const role =
      room.davaci?.socketId === socket.id ? 'davaci'
      : room.sanik?.socketId === socket.id ? 'sanik'
      : null;
    if (!role) return cb && cb({ error: 'Bu odada değilsin.' });
    if (typeof id !== 'string' || id.length > 32) {
      return cb && cb({ error: 'Geçersiz emoji.' });
    }
    if (cb) cb({ ok: true });
    io.to(room.code).emit('emoji-broadcast', { id, fromRole: role, at: Date.now() });
  });

  // İzleyici yorumu — SADECE dava bitince, 2dk cooldown (IP bazlı, çıkıp girince sıfırlanmaz)
  socket.on('spectator-comment', ({ code, text }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Oda yok.' });
    const spec = (room.spectators || []).find((s) => s.socketId === socket.id);
    if (!spec) return cb && cb({ error: 'İzleyici değilsin.' });
    // Yorumlar sadece dava bittikten sonra (COMPLETE) yazılır
    if (room.phase !== PHASES.COMPLETE) {
      return cb && cb({ error: 'Yorum yalnızca karar açıklandıktan sonra yazılabilir.' });
    }
    if (typeof text !== 'string' || !text.trim()) return cb && cb({ error: 'Yorum boş.' });
    const clean = text.trim().slice(0, 260);

    // IP bazlı cooldown — çıkıp girince sıfırlanmasın
    const ip = getClientIp(socket);
    const key = `${room.code}:${ip}`;
    if (!room.commentCooldowns) room.commentCooldowns = new Map();
    const COOLDOWN_MS = 2 * 60 * 1000;
    const now = Date.now();
    const last = room.commentCooldowns.get(key) || 0;
    if (now - last < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      return cb && cb({ error: `Bekle — ${wait}sn`, cooldown: wait });
    }
    room.commentCooldowns.set(key, now);

    if (!room.spectatorComments) room.spectatorComments = [];
    room.spectatorComments.push({ text: clean, at: now });
    if (cb) cb({ ok: true });
    broadcast(room);
  });

  // İTİRAZ — Phoenix Wright tarzı. 18sn cooldown (rol başına).
  socket.on('objection', ({ code }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Oda yok.' });
    const role =
      room.davaci?.socketId === socket.id ? 'davaci'
      : room.sanik?.socketId === socket.id ? 'sanik'
      : null;
    if (!role) return cb && cb({ error: 'Bu odada değilsin.' });

    if (!room.objectionCooldown) room.objectionCooldown = {};
    const now = Date.now();
    const last = room.objectionCooldown[role] || 0;
    const COOLDOWN_MS = 5 * 60 * 1000;
    if (now - last < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      return cb && cb({ error: `Biraz bekle — ${wait}sn`, cooldown: wait });
    }
    room.objectionCooldown[role] = now;
    if (cb) cb({ ok: true });
    io.to(room.code).emit('objection-broadcast', { fromRole: role, at: now });
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      // İzleyici ayrıldıysa listeden çıkar
      if (room.spectators && room.spectators.some((s) => s.socketId === socket.id)) {
        room.spectators = room.spectators.filter((s) => s.socketId !== socket.id);
        broadcast(room);
      }
      const isDavaci = room.davaci?.socketId === socket.id;
      const isSanik = room.sanik?.socketId === socket.id;
      if (!isDavaci && !isSanik) continue;
      if (isDavaci) room.davaci.socketId = null;
      if (isSanik) room.sanik.socketId = null;

      const bothGone = !room.davaci?.socketId && !room.sanik?.socketId;
      if (bothGone) {
        setTimeout(() => {
          const r = rooms.get(code);
          if (r && !r.davaci?.socketId && !r.sanik?.socketId) {
            clearTimer(r);
            rooms.delete(code);
          }
        }, DISCONNECT_GRACE_MS);
      }
      broadcast(room);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Althing backend dinliyor: http://localhost:${PORT}`);
  console.log(`Frontend bekleniyor: ${FRONTEND_URL}`);
});
