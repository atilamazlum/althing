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
    text: 'Bir tek kişiye yapılan haksızlık, bütün bir topluma yönelmiş açık bir tehdittir.', 
    author: 'Montesquieu' 
  },
  { 
    text: 'İnsanlar özgür olmadıklarını sanır. Oysa asıl zincirleri kendi zihinlerindedir. Gerçek adalet, bu zincirleri kırmaktır.', 
    author: 'Ezio Auditore da Firenze' 
  },
  { 
    text: 'Kötülük, kötülüktür. Azı da çoğu da birdir. Seviyesi yoktur. Eğer iki kötülük arasında seçim yapmak zorunda kalırsam, ikisini de reddederim.', 
    author: 'Geralt of Rivia' 
  },
  { 
    text: 'Adaletsizliğin en kötüsü, adaletsiz olduğun hâlde adil görünmektir.', 
    author: 'Platon' 
  },
  { 
    text: 'Biz adalet adına intikam peşinde koşan yalnızca insanız. Ama intikam adalet diye sunulduğunda, o adalet yeni intikamlar doğurur ve sonsuz bir nefret çemberine dönüşür.', 
    author: 'Nagato' 
  },
  { 
    text: 'Adalet, güçlü olanın değil, doğru olanın yanında durmaktır.', 
    author: 'Sokrates' 
  },
  { 
    text: 'Gerçek adalet, intikam duygusunu değil, vicdanın sesini dinlediğinde ortaya çıkar.', 
    author: 'Victor Hugo' 
  }
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
