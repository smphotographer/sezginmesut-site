# sezginmesut.com — Yönetim Paneli Rehberi

**Panel adresi:** https://sezginmesut.com/admin
**Giriş:** "GitHub ile Giriş Yap" (smphotographer hesabı)

Panelde yaptığınız her kayıt GitHub'a yazılır; Cloudflare siteyi **1–2 dakika içinde** otomatik yeniden yayınlar.
Hosting ücreti yoktur.

---

## Yeni blog yazısı

1. **Blog Yazıları → Yeni**
2. Alanlar:
   | Alan | İpucu |
   |---|---|
   | **Başlık** | Sayfadaki ana başlık. Ana anahtar kelimeyi başa yakın yazın. |
   | **SEO Başlığı** (isteğe bağlı) | Google'da görünen başlık, en fazla ~55 karakter. Boşsa Başlık kullanılır. |
   | **SEO Açıklaması** | Google sonucunda başlığın altındaki metin. 120–160 karakter ideal. |
   | **Yayın Tarihi** | Listedeki sıralama buna göre yapılır. |
   | **Güncelleme Tarihi** | Yazıyı sonradan ciddi şekilde güncellerseniz girin (Google bunu sever). |
   | **Kategori** | Listeden seçin. |
   | **Etiketler** | Örn. `honda sh125`, `motor gezi` |
   | **Kapak Görseli** | Yatay, en az 1200 px genişlik. Sosyal medya paylaşım görseli de budur. |
   | **Kapak Görseli Açıklaması** | Görselde ne olduğunu yazın (Google Görseller için önemli). |
   | **YouTube Videosu** | Bağlantıyı yapıştırın; yazının sonunda gömülü görünür. |
   | **Taslak** | Açıkken yazı yayınlanmaz. |
   | **İçerik** | Ara başlıklar için "Başlık 2" kullanın. Görsel eklerken açıklama yazın. |
3. Sağ üstten **Kaydet**. 1–2 dakika sonra yazı `sezginmesut.com/blog/yazi-adi/` adresinde yayında olur.

> Yazının adresi başlıktan otomatik oluşur ve **sonradan değişmez**. Adres değişirse eski bağlantılar kırılır.

## YouTube video kartı

**YouTube Videoları → Yeni** → başlık, YouTube bağlantısı, kanal, tarih, kısa açıklama.
Küçük resim boş bırakılırsa YouTube'un kendi küçük resmi kullanılır. Kart blog listesinde "Videoyu İzle" olarak görünür.

## Kategoriler

**Ayarlar → Kategoriler** → ekle / düzenle / sil.
"Adres (slug)" alanına küçük harf, Türkçe karaktersiz, tireli yazın (örn. `urun-deneyimi`) ve sonradan değiştirmeyin.
Boş kategoriler blogda gösterilmez.

## Görseller

Panelden yüklenen görseller otomatik WebP'ye çevrilip küçültülür; site de her görseli farklı ekran boyutları için ayrıca optimize eder.
Telefon fotoğraflarını doğrudan yükleyebilirsiniz.

## SEO için kısa kontrol listesi

- [ ] Başlıkta ana anahtar kelime var
- [ ] SEO açıklaması 120–160 karakter, merak uyandırıyor
- [ ] Kapak görseli ve tüm görsellerde açıklama (alt metin) var
- [ ] En az 2–3 ara başlık (Başlık 2)
- [ ] İlgili başka bir yazıya veya videoya bağlantı verildi
- [ ] Doğru kategori seçildi

Sitemap, Google etiketleri, yapısal veri ve RSS **otomatik** güncellenir; ayrıca bir şey yapmanız gerekmez.

---

## Teknik notlar (geliştirici için)

- Kaynak: GitHub `smphotographer/sezginmesut-site`, Eleventy 3 + Sveltia CMS
- Yayın: Cloudflare Worker `shiny-band-eca5` (Workers Builds, `main` dalı)
- GitHub girişi: `worker/index.js` (`/auth`, `/callback`), gizli anahtar Cloudflare'de `GITHUB_CLIENT_SECRET`
- Yerelde çalıştırma: `npm install` sonra `npm start` → http://localhost:8080
- Eski site yedeği: `eski-site-yedek.zip` (depoya gönderilmez)
