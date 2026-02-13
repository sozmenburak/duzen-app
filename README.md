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

## Veriler Nerede Saklanır?

Tüm veriler **yalnızca kullandığınız cihazın tarayıcısında** (localStorage) tutulur. Sunucuya gönderilmez; hesap açmanız gerekmez. Veriyi yedeklemek için uygulama içindeki dışa aktarma özelliğini kullanabilir, yedek dosyayı başka cihaza aktararak içe aktarabilirsiniz.

---

## Kullanım

1. Uygulamayı açın; ilk açılışta hedef seçme veya kendi hedeflerinizi ekleme adımlarını tamamlayın.
2. **Takvim** sekmesinde ilgili güne tıklayarak hedefi yapıldı / yapılmadı / boş olarak işaretleyin.
3. **Özet** sekmesinden hedef seçip dönem istatistiklerini ve ısı haritasını inceleyin.
4. **Para** sekmesinden günlük kazanç ve not girebilirsiniz.
5. Hedef başlığına tıklayıp “Hedefi sil” ile hedefi kaldırabilirsiniz; veriyi tamamen sıfırlamak için üstteki “Sıfırla” butonunu kullanabilirsiniz.

---

*Düzen — Günlük hedeflerini takip et. Su, egzersiz, alışkanlıklar.*

---

## Geliştiriciler: Edge Function (Hesap silme) deploy

"Hesabımı sil" özelliği `delete-account` Edge Function’ına bağlıdır. Deploy için:

1. **Supabase CLI ile giriş** (bir kez; tarayıcı açılır):
   ```bash
   npx supabase login
   ```
2. **Fonksiyonu deploy et**:
   ```bash
   npm run supabase:deploy:delete-account
   ```

Proje bağımlılıklarında `supabase` paketi yer alır; `npx supabase` ile de komutları çalıştırabilirsiniz. İlk deploy’da Docker uyarısı çıkabilir; Supabase CLI genelde Docker’sız da deploy eder. 403 hatası alırsanız `npx supabase login` ile giriş yapıp tekrar deneyin.

---

## Güvenlik (public repo)

- **`.env`** ve **`.env.local`** `.gitignore`'da; commit edilmez. Supabase URL ve anon (publishable) key sadece `.env` içinde tutulmalı; asla repoya eklemeyin.
- **Service role key** kodda yok; sadece Supabase Dashboard ve Edge Function ortamında tanımlı. Repoda aranmaz.
- **Edge Function** tüm hassas değerleri `Deno.env.get(...)` ile alıyor; repo içinde gizli bilgi yok.
- **Project ref** (örn. `uhawgonqyjmxwrpydddo`) `package.json` script'lerinde görünür; Supabase tasarımı gereği proje URL’inizin bir parçasıdır ve tek başına veri erişimi sağlamaz. İsterseniz script'lerde env ile kullanabilirsiniz.
- Geçmişte **`.env` commit edildiyse**: Supabase Dashboard → Project Settings → API üzerinden anon key’i yenileyin ve git history’dan `.env` dosyasını kaldırın. 
