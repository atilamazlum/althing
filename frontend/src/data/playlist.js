// Mahkemede oynatılacak şarkılar. Sadece YouTube URL.
// Kategori isimlerini ve şarkıları kendin yaz. Kapaklar YouTube'dan otomatik gelir.
//
// FORMAT:
// 'Kategori Adı': [
//   { url: 'https://www.youtube.com/watch?v=ID', title: 'Sanatçı - Şarkı Adı' },
// ],

export const PLAYLIST = {
 
  'Pop': [
    { url: 'https://www.youtube.com/watch?v=kXKhNI4DLHM&list=RDkXKhNI4DLHM&start_radio=1', title: 'Manifest - Hileli' },
     { url: 'https://www.youtube.com/watch?v=-crgQGdpZR0&list=RD-crgQGdpZR0&start_radio=1', title: 'Abba - Take a Chance on Me' },
     { url: 'https://www.youtube.com/watch?v=Qf6UZlwipME&list=RD-crgQGdpZR0&index=2', title: 'Jeanette - El Muchacho De Los Ojos Tristes' },
    
],

      'POP-V2': [
    { url: 'https://www.youtube.com/watch?v=iWjLn1rIPXY&list=RDiWjLn1rIPXY&start_radio=1', title: 'Temples - The Golden Throne' },
      { url: 'https://www.youtube.com/watch?v=Cm8TJot5qXo&list=RDCm8TJot5qXo&start_radio=1', title: 'Ayşen-Nerdesin' },
       { url: 'https://www.youtube.com/watch?v=iCxMhnAw7AM&list=RDCm8TJot5qXo&index=6', title: 'Sertab Erener - Asla' },
        { url: 'https://www.youtube.com/watch?v=JGNqvH9ykfA&list=RDJGNqvH9ykfA&start_radio=1', title: 'Slipknot - Nero Forte' },
          { url: 'https://www.youtube.com/watch?v=cnwr0xsAMTo', title: 'Accept - Cant Stand the Night' },
          { url: 'https://www.youtube.com/watch?v=dnlTX3Gt98A&list=RDdnlTX3Gt98A&start_radio=1', title: 'Sibel Gürsoy - Aşık Değilsin' },
          { url: 'https://www.youtube.com/watch?v=Qf6UZlwipME&list=RDQf6UZlwipME&start_radio=1', title: ' Jeanette - El Muchacho' },
                    { url: 'https://www.youtube.com/watch?v=92cwKCU8Z5c&list=RD92cwKCU8Z5c&start_radio=1', title: 'ABBA - The Winner Takes It All' },
                    { url: 'https://www.youtube.com/watch?v=fCGlVahIFm0&list=RD_Z3Z1M15nsc&index=18', title: 'Nev - Zor' },


  ]

};


export function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export function getThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function getEmbedUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}
