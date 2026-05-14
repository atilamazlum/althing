// Gemini API wrapper. Görsel kanıt destekli + 503/429 retry + fallback model.

import 'dotenv/config';

const KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

if (!KEY) {
  throw new Error('GEMINI_API_KEY tanımlı değil. backend/.env dosyasına ekle.');
}

const RETRY_DELAYS_MS = [0, 1500, 4000]; // 3 deneme: hemen, 1.5sn, 4sn
const FALLBACK_THRESHOLD = 2; // 2. denemeden sonra fallback modele geç

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOnce(model, systemPrompt, userMessage, images) {
  const parts = [{ text: userMessage }];
  for (const img of images) {
    parts.push({
      inline_data: { mime_type: img.mimeType, data: img.data },
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    const e = new Error(`Gemini ${response.status}: ${errText}`);
    e.status = response.status;
    throw e;
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error(`Gemini boş yanıt: ${JSON.stringify(data).slice(0, 500)}`);

  const cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse hatası: ${content.slice(0, 300)}`);
  }
}

function isRetryable(err) {
  if (err.status && (err.status >= 500 || err.status === 429)) return true;
  if (err.message?.includes('fetch failed')) return true;
  return false;
}

export async function callGemini(systemPrompt, userMessage, images = []) {
  let lastErr;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i] > 0) await sleep(RETRY_DELAYS_MS[i]);
    const model = i >= FALLBACK_THRESHOLD ? FALLBACK_MODEL : PRIMARY_MODEL;
    try {
      const result = await callOnce(model, systemPrompt, userMessage, images);
      if (i > 0) console.log(`✓ Gemini ${model} ${i + 1}. denemede başardı.`);
      return result;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      console.warn(`Gemini ${model} hatası (${err.status || 'network'}), yeniden denenecek...`);
    }
  }
  throw lastErr;
}
