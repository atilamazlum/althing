// Geçiş ekranlarında (Oturum II, III, ...) gösterilen adalet alıntıları.
// Her geçişte rastgele biri seçilir.
//
// Kendi alıntılarını eklemek istersen şu formatta dizinin sonuna ekle:
//   { text: 'Alıntı metni', author: 'Kim söylediyse' }
//
// Not: Telifli eserlerden (manga, anime, oyun, film) doğrudan dialogue
// eklersen kişisel/test kullanımda kalsın. Yayına/Play Store/App Store'a
// çıkarken o satırları silmen iyi olur — hak sahibi şikayet edebilir.





export const JUSTICE_QUOTES = [
  {
    text: 'Bir tek kişiye yapılan haksızlık, bütün topluluğa yönelmiş bir tehdittir.',
    author: 'Montesquieu',
  },
  {
    text: 'İnsanlar özgür olmadığını düşünür, ancak kısıtlamaların çoğu kendi zihinlerindedir. Hakiki adalet, bu yanılgıyı kırmaktır.',
    author: ' Ezio Auditore da Firenze',
  },
  {
    text: 'Kötülük kötülüktür. Daha az, daha fazla ya da tam ortası bir farklılık yaratmaz. Seviyesi keyfi, açıklaması bulanıktır. Eğer ben bir kötülüğü ya da diğerini seçeceksem, hiçbirini seçmemeyi tercih ederim',
    author: 'Geralt of Rivia',
  },
  {
    text: 'Adaletsizliğin en büyüğü, adaletsiz olunduğu halde adil görünmektir.',
    author: 'Platon',
  },
  {
    text: 'Bizler sadece adalet adına intikam peşinde koşan sıradan insanlarız. Ancak intikamın adı adalet olursa, bu adalet sadece daha fazla intikam doğurur ve bir nefret zincirine dönüşür.',
    author: 'Nagato',
  },

  
];

export function pickRandomQuote() {
  return JUSTICE_QUOTES[Math.floor(Math.random() * JUSTICE_QUOTES.length)];
}

export function toRoman(n) {
  const map = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  let num = n;
  for (const [val, sym] of map) {
    while (num >= val) {
      out += sym;
      num -= val;
    }
  }
  return out;
}
