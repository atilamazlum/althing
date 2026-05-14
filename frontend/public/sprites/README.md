# Sprite Klasörü

Şu an Phaser sahnesi tamamen **programatik placeholder şekiller** kullanıyor — bu klasör boş çalışıyor, dosyaya gerek yok.

İleride gerçek karakter görselleri eklemek istediğinde, sahne kodu (`src/courtroom-game/CourtroomScene.js`) bu klasördeki PNG'leri otomatik yükleyecek şekilde genişletilecek.

## Planlanan dosya yapısı

```
sprites/
├── davaci/
│   ├── normal.png
│   ├── konusuyor.png
│   ├── sinirli.png
│   └── saskin.png
├── sanik/
│   ├── normal.png
│   ├── konusuyor.png
│   ├── sinirli.png
│   └── saskin.png
└── yargic/
    ├── ciddi.png
    ├── sinirli.png
    ├── memnun.png
    └── dusunceli.png
```

Her PNG ~256×256, transparent background, karakter ortalanmış.

## Asset kaynakları

- **Yayına çıkacaksa:** **VRoid Studio** (ücretsiz, anime karakter üretici) ile kendi karakterlerini tasarlayıp her duygu için tek tek poz çıkarabilirsin. Lisans tamamen senin olur.
- **Sadece kişisel test/öğrenme için:** itch.io, OpenGameArt, Kenney.nl gibi sitelerde CC0 (kamuya açık) lisanslı karakter sprite'ları var.

Üçüncü taraf telifli karakter sprite'ları (oyunlardan, animelerden) bu repoya **kaynak koduyla birlikte commit edilemez**. Yayına geçince orijinal art şart.

## Şu an

Sprite eklemeden de oyun çalışır — geometrik placeholder'lar sahnededir. Test akışını bozmaz.
