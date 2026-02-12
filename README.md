# Düzen — Günlük Hedef Takibi

**Düzen**, günlük hedeflerinizi ve alışkanlıklarınızı tek bir yerde takip etmenizi sağlayan, basit ve gizlilik odaklı bir uygulamadır. Su içmek, egzersiz yapmak, kitap okumak gibi alışkanlıklarınızı takvim üzerinde işaretleyerek tutarlılığınızı görselleştirir.

---

## Ne Sağlar?

- **Günlük hedefleri tek ekranda takip** — Birden fazla hedefi (ör. “3 litre su iç”, “20 şınav”, “30 sayfa kitap oku”) aynı takvimde görebilir, her gün için yapıldı / yapılmadı / boş olarak işaretleyebilirsiniz.
- **Özet ve istatistikler** — Seçtiğiniz hedef için son 1 hafta, 1 ay, 3 ay, 6 ay veya 1 yıllık “sadakat” oranını ve önceki dönemle karşılaştırmayı görürsünüz; katkı ısı haritası ile ilerlemenizi bir bakışta takip edebilirsiniz.
- **Günlük kazanç takibi** — İsterseniz günlük kazancınızı (tutar + not) kaydedebilir, “Para” sekmesinden geçmişe dönük listeleyebilirsiniz.
- **Günlük yorumlar** — Belirli bir güne not veya yorum ekleyebilirsiniz; veriler yalnızca cihazınızda saklanır.
- **Veri sizin cihazınızda** — Hesap, giriş veya sunucu yok; tüm veriler tarayıcıda (localStorage) tutulur. İstediğiniz zaman yedek alıp başka cihaza aktarabilirsiniz.

---

## Hangi Sorunlara Çözüm Getirir?

| Sorun | Düzen ile çözüm |
|-------|------------------|
| Alışkanlıklarımı unutuyorum | Takvimde her günü işaretleyerek ne yaptığınızı net görürsünüz. |
| Birden fazla hedefi ayrı ayrı takip etmek zor | Tüm hedefler tek takvimde; tek tıkla ✓ / ✗ işaretleyebilirsiniz. |
| İlerleme hissetmek istiyorum | Özet sekmesinde dönemsel istatistikler ve ısı haritası ile ilerlemenizi görürsünüz. |
| Günlük kazançları not etmek istiyorum | “Para” sekmesi ile günlük kazanç ve not girişi yapıp listeleyebilirsiniz. |
| Verilerimin güvende olmasını istiyorum | Veri sunucuya gönderilmez; sadece cihazınızda saklanır. Yedekleme ve geri yükleme ile taşıyabilirsiniz. |

--- 

## Özellikler

- **Takvim görünümü** — Aylık takvimde her hedef için hücreye tıklayarak: ✓ (yapıldı) → ✗ (yapılmadı) → boş döngüsü.
- **Hedef yönetimi** — Hedef ekleme, silme; hedeflere başlangıç tarihi verebilme; hazır öneri hedeflerden seçebilme.
- **Özet sekmesi** — Hedef bazlı dönem istatistikleri (1 hafta / 1 ay / 3 ay / 6 ay / 1 yıl), sadakat yüzdesi ve önceki dönemle karşılaştırma; katkı ısı haritası.
- **Para sekmesi** — Günlük kazanç ve not girişi, geçmiş kayıtların listelenmesi.
- **Günlük yorumlar** — İstediğiniz güne kısa not ekleme.
- **Yedekleme ve geri yükleme** — Veriyi JSON olarak dışa aktarma ve içe aktarma; veriyi sıfırlama seçenekleri.
- **Açık / koyu tema** — Arayüzde tema değiştirme.
- **PWA desteği** — Uyumlu tarayıcılarda “Ana ekrana ekle” ile uygulama gibi kullanılabilir.

---

## Kullanıcı Sistemi (Login / Register)

Uygulama isteğe bağlı olarak **Cloudflare Workers KV** ile basit bir kullanıcı sistemi kullanır:

- **Kayıt ol**: Kullanıcı adı ve şifre ile KV'de hesap oluşturulur; bilgiler ayrıca tarayıcıda (localStorage) tutulur.
- **Giriş yap**: Kullanıcı adı ve şifre KV'de eşleşirse, KV'deki uygulama verisi localStorage'a yüklenir.
- Veri her değiştiğinde (hedef, tik, yorum, kazanç vb.) otomatik olarak KV'ye senkronize edilir.

Kurulum için:

1. `worker` klasöründe `npm install` çalıştırıp Worker'ı deploy edin: `npm run deploy`.
2. Proje kökünde `.env` oluşturup `VITE_AUTH_API_URL=https://duzen-auth.<hesabınız>.workers.dev` ekleyin.
3. Frontend'i build edip yayınlayın.

KV namespace ID'si `wrangler.toml` içinde tanımlıdır (`c4cfc4491841488aa4c8c5c104a8aea9` — duzen-app).

---

## Veriler Nerede Saklanır?

Giriş yapmadan kullanırsanız tüm veriler **yalnızca tarayıcıda** (localStorage) tutulur. Giriş yaptıysanız veriler hem localStorage'da hem de Cloudflare KV'de (kullanıcı bazlı) saklanır; böylece farklı cihazlardan aynı hesapla giriş yapıp verinize erişebilirsiniz. Veriyi yedeklemek için uygulama içindeki dışa aktarma özelliğini de kullanabilirsiniz.

---

## Kullanım

1. Uygulamayı açın; ilk açılışta hedef seçme veya kendi hedeflerinizi ekleme adımlarını tamamlayın.
2. **Takvim** sekmesinde ilgili güne tıklayarak hedefi yapıldı / yapılmadı / boş olarak işaretleyin.
3. **Özet** sekmesinden hedef seçip dönem istatistiklerini ve ısı haritasını inceleyin.
4. **Para** sekmesinden günlük kazanç ve not girebilirsiniz.
5. Hedef başlığına tıklayıp “Hedefi sil” ile hedefi kaldırabilirsiniz; veriyi tamamen sıfırlamak için üstteki “Sıfırla” butonunu kullanabilirsiniz.

---

*Düzen — Günlük hedeflerini takip et. Su, egzersiz, alışkanlıklar.*
