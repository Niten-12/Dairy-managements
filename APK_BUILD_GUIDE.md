# 📱 APK Build & Deploy Guide

Testing ke liye Android APK banane ka poora process — **laptop pe kuch install kiye bina**.
APK GitHub ke server pe banegi, tum download karke WhatsApp/Drive se bhej doge.

```
┌──────────────┐        ┌──────────────────┐        ┌─────────────┐
│  Railway     │◄───────│  APK (phone)     │        │ GitHub      │
│  backend+DB  │  HTTPS │  React in WebView│◄───────│ Actions     │
│  24×7 online │        └──────────────────┘  build │ builds APK  │
└──────────────┘                                    └─────────────┘
```

**Zaroori baat:** APK sirf frontend hai. Backend Railway pe hona chahiye —
warna app khulegi par products/login kuch kaam nahi karega.

---

## Part 1 — Backend Railway pe deploy karo

### 1.1 Project banao
1. [railway.app](https://railway.app) → GitHub se sign in
2. **New Project → Deploy from GitHub repo** → `Niten-12/Dairy-managements`
3. Service settings → **Root Directory** = `backend`
   (Railway khud `backend/Dockerfile` detect kar lega)

### 1.2 Database add karo
Same project me → **New → Database → Add PostgreSQL**

### 1.3 Environment variables set karo
Backend service → **Variables** tab:

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | koi bhi random 32+ character string |
| `ADMIN_EMAIL` | tumhara admin email |
| `ADMIN_PASSWORD` | **strong password** (default `admin123` public repo me hai!) |
| `APP_CORS_ALLOWED_ORIGINS` | `https://localhost,capacitor://localhost` |
| `UPLOAD_DIR` | `/app/uploads` |

> ⚠️ Railway ka `DATABASE_URL` (`postgresql://...` format) JDBC nahi samajhta.
> Isliye upar wali `jdbc:postgresql://...` line hi use karni hai.

> ⚠️ `ADMIN_PASSWORD` sirf **pehli baar** account banate waqt lagta hai.
> Baad me badalne se purana password change nahi hota — admin panel se change karo.

### 1.4 Uploads ke liye Volume (warna images gayab ho jaayengi)
Railway ka filesystem har deploy pe wipe hota hai. Service → **Settings → Volumes →
New Volume**, mount path = `/app/uploads`.

### 1.5 Public URL lo
Service → **Settings → Networking → Generate Domain**
Kuch aisa milega: `https://dairy-backend-production.up.railway.app`

**Test karo:** browser me `https://<tumhara-url>/api/public/products` kholo — JSON aana chahiye.

---

## Part 2 — GitHub Actions se APK banao

### 2.1 Code push karo
```bash
cd "D:\Dairy management"
git add -A
git commit -m "feat: Capacitor Android build + Railway deploy config"
git push
```

### 2.2 Backend URL GitHub ko batao
GitHub repo → **Settings → Secrets and variables → Actions → Variables tab → New variable**

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<tumhara-railway-url>/api` |

> `/api` lagana mat bhoolna. Ye set na ho to workflow saaf error ke saath fail hoga.

### 2.3 Build chalao
Repo → **Actions** tab → **Build Android APK** → **Run workflow** → Run

~5–8 minute lagenge. Green tick aane par run kholo → neeche **Artifacts** section →
**dairyflow-debug-apk** download karo → zip kholo → `app-debug.apk` mil jaayegi.

Har `frontend/` change push karne pe APK apne aap rebuild ho jaayegi.

---

## Part 3 — APK phone me install karo

1. `app-debug.apk` WhatsApp / Google Drive / USB se phone me bhejo
2. File pe tap karo → Android poochega → **Settings → "Allow from this source"** ON karo
3. Install → done ✅

**Requirements:** Android 7.0+ (minSdk 24). Play Store ki koi zaroorat nahi.

> ℹ️ "Unsafe app blocked" ya Play Protect warning normal hai — debug APK Play Store
> se verified nahi hoti. **Install anyway** pe tap karna hoga.

---

## Local pe APK banani ho to (optional)

Android Studio install karke:
```bash
cd "D:\Dairy management\frontend"
cp .env.production.example .env.production   # isme apna Railway URL daalo
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Emulator/phone pe direct chalane ke liye: `npx cap run android`

---

## Play Store ke liye baad me kya chahiye

Abhi ki debug APK sirf testing ke liye hai. Play Store pe jaane ke liye:

1. **Release keystore** banao (`keytool -genkey ...`) — isse hamesha ke liye sambhaal ke rakhna
2. Keystore ko GitHub Secret me daalo, workflow me `bundleRelease` chalao
3. `.aab` (App Bundle) upload karo, `.apk` nahi
4. Play Console account (one-time $25) + privacy policy URL

Ye sab tab karenge jab testing complete ho jaaye.

---

## Troubleshooting

| Problem | Wajah | Fix |
|---|---|---|
| App khulti hai par white screen | web assets sync nahi hue | `npx cap sync android` phir rebuild |
| Products load nahi hote | `VITE_API_URL` galat ya missing | GitHub variable check karo, `/api` suffix confirm karo |
| Login pe "Network Error" | CORS block | Railway me `APP_CORS_ALLOWED_ORIGINS` me `https://localhost` hai? |
| Images nahi dikhtin (emoji dikhta hai) | uploads volume nahi laga | Railway Volume `/app/uploads` pe mount karo |
| Workflow "VITE_API_URL is not set" | repo variable missing | Part 2.2 dobara karo |
| Gradle build fail | SDK/Java mismatch | workflow JDK 21 + compileSdk 36 use karta hai — `variables.gradle` mat badlo |

---

## Kya-kya add hua (reference)

| File | Kaam |
|---|---|
| `frontend/capacitor.config.json` | App ID `com.dairyflow.app`, name `DairyFlow` |
| `frontend/android/` | Native Android project (Capacitor generated) |
| `frontend/src/api/mediaUrl.js` | `/uploads/...` ko absolute backend URL banata hai |
| `frontend/.env.production.example` | Production build ka template |
| `.github/workflows/android-apk.yml` | Cloud APK build |
| `backend/.../CorsConfig.java` | CORS origins ab env se configurable |
| `backend/.../DataSeeder.java` | Admin creds ab `ADMIN_EMAIL` / `ADMIN_PASSWORD` se |
| `backend/.../application.yml` | `server.port` ab `${PORT:8080}` (Railway ke liye) |
