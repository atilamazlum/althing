// Mahkeme reaksiyon emojileri.
//
// Dosyalar: frontend/public/emojis/ ve frontend/public/sounds/ klasörlerine koy.
// PNG / GIF / WebP destekli görsel için. Ses için MP3/WAV/OGG.
//
// Telifsiz "boing", "ding" gibi efektleri freesound.org veya
// pixabay.com/sound-effects'den (CC0) indirebilirsin.

export const EMOJIS = [

   { id: 'tekkas',  file: 'tekkas.gif',   label: 'tekkas',   sound: 'boing.mp3' },
   { id: 'jumpscare',  file: 'jumpscare.gif',   label: 'Jumpscare', sound: 'boing.mp3' },
   { id: 'ragebait',  file: 'ragebait.gif',   label: 'Ragebait',  sound: 'boing.mp3' },
   { id: 'jjk',  file: 'jjk.gif',   label: 'JJK',  sound: 'boing.mp3' },  
   { id: 'wtfisthat',  file: 'wtfisthat.gif',   label: 'What is that?',  sound: 'boing.mp3' },
      { id: 'turn',  file: 'turn.gif',   label: 'turn?',  sound: 'boing.mp3' },  
  
 
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
