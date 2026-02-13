# Google ile giriş – Supabase kurulum rehberi

Supabase tarafında Google provider’ı açtıktan sonra, Google Cloud Console’dan alacağın bilgileri ve Supabase’te yapacağın ayarları aşağıda adım adım bulabilirsin.

---

## 1. Google Cloud Console’da proje ve OAuth ayarları

### 1.1 Proje seç / oluştur

1. [Google Cloud Console](https://console.cloud.google.com/) adresine git.
2. Üstten bir **proje seç** veya **Yeni proje** ile yeni proje oluştur.

### 1.2 OAuth consent ekranı

1. Sol menüden **APIs & Services** → **OAuth consent screen**.
2. **User Type**: Dış kullanıcılar için **External** seç, **Create**.
3. Uygulama bilgilerini doldur:
   - **App name**: Örn. `Düzen APP`
   - **User support email**: Kendi e-postan
   - **Developer contact**: Kendi e-postan
4. **Save and Continue** → Scopes’ta **Add or Remove Scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - **Update** → **Save and Continue**.
5. Test users (External ve “Testing” modundaysan) gerekirse ekle; **Save and Continue** ile bitir.

### 1.3 OAuth 2.0 Client ID oluştur

1. **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **OAuth client ID**.
3. **Application type**: **Web application**.
4. **Name**: Örn. `Düzen APP Web`.
5. **Authorized redirect URIs** kısmına **tek satır** olarak şunu ekle (Supabase’teki proje ref’ini kullan):

   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   `<PROJECT_REF>` değerini Supabase’ten alacaksın:
   - Supabase Dashboard → **Authentication** → **Providers** → **Google**.
   - Orada **Callback URL (for OAuth)** satırında tam URL yazar; örnek:  
     `https://abcdefghijk.supabase.co/auth/v1/callback`  
   - Bu adresi **birebir** kopyalayıp Google’daki **Authorized redirect URIs** alanına yapıştır.

6. **Create** de.
7. Açılan pencerede:
   - **Client ID** (uzun bir metin) → kopyala.
   - **Client Secret** → kopyala (gerekirse “Show” ile göster).

Bu **Client ID** ve **Client Secret**’ı bir sonraki adımda Supabase’e gireceksin.

---

## 2. Supabase’te Google provider ayarları

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeni aç.
2. **Authentication** → **Providers** → **Google**.
3. **Enable Sign in with Google** açık olsun.
4. **Client ID**: Google’dan kopyaladığın Client ID.
5. **Client Secret**: Google’dan kopyaladığın Client Secret.
6. **Save** ile kaydet.

---

## 3. Supabase Redirect URL’leri (uygulama dönüş adresleri)

Google’dan başarılı giriş sonrası kullanıcı uygulamanıza yönlendirilecek. Bu adreslerin Supabase’te izinli olması gerekir.

1. Supabase Dashboard → **Authentication** → **URL Configuration**.
2. **Redirect URLs** listesine uygulama adreslerini ekle:
   - Yerel geliştirme: `http://localhost:5173` (veya Vite’ın kullandığı port)
   - Canlı site: `https://yourdomain.com` (kendi domain’in)
3. **Save** ile kaydet.

---

## 4. Özet kontrol listesi

- [ ] Google Cloud Console’da OAuth consent screen ayarlandı.
- [ ] Web application tipinde OAuth Client ID oluşturuldu.
- [ ] **Authorized redirect URIs**’e yalnızca Supabase callback URL’i eklendi:  
      `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Supabase → Authentication → Providers → Google’da **Client ID** ve **Client Secret** girildi ve kaydedildi.
- [ ] Supabase → URL Configuration → **Redirect URLs**’e `http://localhost:5173` ve production URL eklendi.

Bu adımlardan sonra uygulamadaki “Google ile giriş yap” butonu çalışır; hem mevcut kullanıcılar giriş yapabilir hem de ilk kez girenler otomatik kayıt olur.
