// Mahkeme reaksiyon emojileri.
//
// Dosyalar: frontend/public/emojis/ ve frontend/public/sounds/ klasörlerine koy.
// PNG / GIF / WebP destekli görsel için. Ses için MP3/WAV/OGG.
//
// Telifsiz "boing", "ding" gibi efektleri freesound.org veya
// pixabay.com/sound-effects'den (CC0) indirebilirsin.

export const EMOJIS = [
   { id: 'tekkas',      file: 'tekkas.gif',      label: 'Tekkas',       sound: 'boing.mp3' },
   { id: 'jumpscare',   file: 'jumpscare.gif',   label: 'Jumpscare',    sound: 'boing.mp3' },
   { id: 'ragebait',    file: 'ragebait.gif',    label: 'Ragebait',     sound: 'boing.mp3' },
   { id: 'jjk',         file: 'jjk.gif',         label: 'JJK',          sound: 'boing.mp3' },
   { id: 'wtfisthat',   file: 'wtfisthat.gif',   label: 'Wtf is that?', sound: 'boing.mp3' },
   { id: 'turn',        file: 'turn.gif',        label: 'Turn?',        sound: 'boing.mp3' },

   // Eksik olanlar eklendi:
   { id: 'alpha',       file: 'alpha.gif',       label: 'Alpha',        sound: 'boing.mp3' },
   { id: 'angry',       file: 'angry.gif',       label: 'Angry',        sound: 'boing.mp3' },
   { id: 'downfall',    file: 'downfall.gif',    label: 'Downfall',     sound: 'boing.mp3' },
   { id: 'duvar',       file: 'duvar.gif',       label: 'Duvar',        sound: 'boing.mp3' },
   { id: 'homelander',  file: 'homelander.gif',  label: 'Homelander',   sound: 'boing.mp3' },
   { id: 'homelanderv2',file: 'homelanderv2.gif', label: 'Homelander V2',sound: 'boing.mp3' },
   { id: 'honest',      file: 'honest.gif',      label: 'Honest',       sound: 'boing.mp3' },
   { id: 'kick',        file: 'kick.gif',        label: 'Kick',         sound: 'boing.mp3' },
   { id: 'lero',        file: 'lero.gif',        label: 'Lero',         sound: 'boing.mp3' },
   { id: 'mogger',      file: 'mogger.gif',      label: 'Mogger',       sound: 'boing.mp3' },
   { id: 'monkey',      file: 'monkey.gif',      label: 'Monkey',       sound: 'boing.mp3' },
   { id: 'sideeye',     file: 'sideeye.gif',     label: 'Side Eye',     sound: 'boing.mp3' },
   { id: 'sigma',       file: 'sigma.gif',       label: 'Sigma',        sound: 'boing.mp3' },
   { id: 'stfu',        file: 'stfu.gif',        label: 'STFU',         sound: 'boing.mp3' },
   { id: 'yap',         file: 'yap.gif',         label: 'Yap',          sound: 'boing.mp3' },
    { id: 'doukes',         file: 'doukes.gif',         label: 'doukes',          sound: 'boing.mp3' },
     { id: 'gif',         file: 'gif.gif',         label: 'gif',          sound: 'boing.mp3' },
];

// Her emojinin tek başına 3dk cooldown'u var
export const EMOJI_COOLDOWN_MS = 3 * 60 * 1000;

export function getEmojiUrl(file) {
  return `/emojis/${file}`;
}

export function getSoundUrl(file) {
  if (!file) return null;
  return `/sounds/${file}`;
}

export function findEmoji(id) {
  return EMOJIS.find((e) => e.id === id) || null;
}
