# 🚇 ngrok Integration Guide
### For Any Local Project — Mobile & Remote Access

---

## 📌 What is this guide?

This guide explains how to expose any locally running app (on your PC) to the internet,
so you can test it on **any mobile, any PC, from anywhere in the world** — without deployment.

---

## 🧠 The Core Problem (Why ngrok?)

```
Your App runs on:   http://localhost:3000   (only YOUR PC can see this)

Mobile types:       http://localhost:3000   ❌ FAILS — mobile sees its own localhost!

Solution:           ngrok creates a public URL that tunnels traffic to your localhost
                    https://xxxx.ngrok-free.dev  →  localhost:3000  ✅
```

---

## 🏗️ High Level Design (HLD)

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR PC                              │
│                                                             │
│   Your App (localhost:PORT)                                 │
│          ▲                                                  │
│          │ forwards traffic                                  │
│          │                                                  │
│       ngrok.exe  ──── outbound connection ────────────────┐ │
│                                                           │ │
└───────────────────────────────────────────────────────────┼─┘
                                                            │
                                                            ▼
                                               ngrok Cloud Server (Internet)
                                               https://xxxx.ngrok-free.dev
                                                            │
                                                            │
                              ┌─────────────────────────────┤
                              │                             │
                         📱 Mobile                    💻 Another PC
                    (any network works!)           (any network works!)
```

### Key Concept: Reverse Tunnel
- Your PC connects **OUT** to ngrok server (router allows outbound)
- ngrok server gives you a **public URL**
- Anyone accessing that URL → traffic goes through existing tunnel → your localhost
- Router never blocks it because **your PC initiated** the connection

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

| Requirement | Check Command | Expected Output |
|---|---|---|
| Your app is running | `curl http://localhost:PORT` | Some response |
| Docker running (if dockerized) | `docker ps` | Containers listed |
| Internet connection | `ping google.com` | Packets received |
| ngrok installed | See Step 1 below | — |

---

## 🚀 Step-by-Step Implementation

---

### STEP 1 — Install ngrok (One Time Only)

**Windows (using winget — recommended):**
```powershell
winget install ngrok.ngrok
```

**After install — verify with full path:**
```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" version
```

Expected output: `ngrok version 3.x.x`

> ⚠️ **PATH Conflict Warning:**
> If you have old npm ngrok installed, typing just `ngrok` might use the wrong one.
> Always use the full path above, OR uninstall npm ngrok: `npm uninstall -g ngrok`

---

### STEP 2 — Create Free Account (One Time Only)

1. Go to → **https://ngrok.com**
2. Sign up (Google login works)
3. Go to → **https://dashboard.ngrok.com/get-started/your-authtoken**
4. Copy your **Auth Token**

---

### STEP 3 — Set Auth Token (One Time Only)

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" config add-authtoken YOUR_TOKEN_HERE
```

Expected output:
```
Authtoken saved to configuration file: C:\Users\...\AppData\Local\ngrok\ngrok.yml
```

> ✅ This is saved permanently — you never need to do this again on same PC.

---

### STEP 4 — Update ngrok (If Version Error Occurs)

If you see error: `your ngrok-agent version is too old`:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" update
```

---

### STEP 5 — Start Your App First

Make sure your local app is running before starting ngrok.

**Example — Docker project:**
```powershell
cd "D:\Your Project Folder"
docker compose up -d
docker ps   # verify containers are running
```

**Example — Node.js project:**
```powershell
npm run dev   # app runs on localhost:5173 or similar
```

**Example — Spring Boot:**
```powershell
./mvnw spring-boot:run   # app runs on localhost:8080
```

---

### STEP 6 — Start ngrok Tunnel

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http YOUR_PORT
```

**Replace `YOUR_PORT` with your app's port:**

| Project Type | Typical Port | Command |
|---|---|---|
| React (Vite dev) | 5173 | `... http 5173` |
| React (Docker) | 3000 | `... http 3000` |
| Node.js / Express | 3000 | `... http 3000` |
| Spring Boot | 8080 | `... http 8080` |
| Django / Flask | 8000 | `... http 8000` |
| Laravel | 8000 | `... http 8000` |

---

### STEP 7 — Get Your Public URL

After running ngrok, terminal shows:

```
Session Status    online
Account           your@email.com (Plan: Free)
Forwarding        https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:3000
                           ▲
                           └── THIS IS YOUR PUBLIC URL — share this!
```

**Copy the `https://xxxx.ngrok-free.app` URL.**

---

### STEP 8 — Access on Mobile / Another PC

1. Open browser on mobile or any PC
2. Paste the URL: `https://xxxx.ngrok-free.app`
3. First time: a warning page appears → click **"Visit Site"**
4. Your app loads! ✅

---

### STEP 9 — Verify Tunnel is Active (Optional)

```powershell
Invoke-RestMethod http://localhost:4040/api/tunnels | ConvertTo-Json -Depth 3
```

Look for `public_url` in the response — that's your live URL.

You can also open **http://localhost:4040** in browser to see ngrok dashboard.

---

## ⚠️ Common Errors & Fixes

| Error | Reason | Fix |
|---|---|---|
| `ENOENT` / not recognized | Wrong ngrok path (npm conflict) | Use full path with `$env:LOCALAPPDATA\...` |
| `version too old` | ngrok needs update | Run `ngrok update` |
| `authentication failed` | No auth token set | Run Step 3 again |
| `already online ERR_NGROK_334` | Tunnel already running | Don't start again! Use existing URL |
| `connection refused` | App not running | Start your app first, then ngrok |

---

## 🔴 Important Rules — Never Forget

```
RULE 1: Start your APP first → then start ngrok
         (ngrok needs something to forward traffic to)

RULE 2: Keep terminal OPEN
         (ngrok stops when terminal closes)

RULE 3: URL changes every restart (free plan)
         (share new URL each time you restart ngrok)

RULE 4: If tunnel already running → just use existing URL
         (check: localhost:4040)

RULE 5: PC must stay ON
         (tunnel dies when PC shuts down)
```

---

## 🔄 Full Workflow — Every Time You Need Mobile Testing

```
Every Session:
──────────────
1. Start your app         →  docker compose up -d  (or npm run dev etc.)
2. Check tunnel active?   →  Invoke-RestMethod http://localhost:4040/api/tunnels
   ├── URL found          →  Use that URL directly ✅
   └── No tunnel          →  Run ngrok command → get new URL
3. Share URL              →  https://xxxx.ngrok-free.app
4. Open on mobile         →  Click "Visit Site" → Done ✅
5. Keep terminal open     →  Don't close it while testing
```

---

## 💾 Quick Start Script (Save this for future)

Create a file `start-ngrok.ps1` in your project folder:

```powershell
# Quick ngrok starter script
# Usage: .\start-ngrok.ps1       (default port 3000)
# Usage: .\start-ngrok.ps1 8080  (custom port)

param([int]$Port = 3000)

Write-Host "Checking if tunnel already exists..." -ForegroundColor Yellow

try {
    $tunnels = Invoke-RestMethod http://localhost:4040/api/tunnels
    $url = $tunnels.tunnels[0].public_url
    Write-Host ""
    Write-Host "Tunnel already LIVE!" -ForegroundColor Green
    Write-Host "URL: $url" -ForegroundColor Cyan
    Write-Host "Open this on mobile or any PC!" -ForegroundColor White
} catch {
    Write-Host "Starting new ngrok tunnel on port $Port..." -ForegroundColor Yellow
    & "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http $Port
}
```

**Run it:**
```powershell
.\start-ngrok.ps1          # default port 3000
.\start-ngrok.ps1 8080     # custom port
.\start-ngrok.ps1 5173     # vite dev server
```

---

## 🔀 ngrok vs Alternatives — When to Use What

| Tool | Best For | Free? | Persistent URL? |
|---|---|---|---|
| **ngrok** | Quick dev testing | ✅ | ❌ Changes each restart |
| **Cloudflare Tunnel** | Production / permanent | ✅ | ✅ |
| **localtunnel** | Super quick hack | ✅ | ❌ |
| **VS Code Port Forward** | VS Code users only | ✅ | ❌ |
| **Deploy to server** | Real production | ❌ (paid) | ✅ |

> For **development & testing** → ngrok is the industry standard
> For **production** → Deploy properly or use Cloudflare Tunnel

---

## 🧠 Mental Model — One Diagram to Remember

```
                    THE TUNNEL EXPLAINED
                    ═══════════════════

  [Your PC]                [ngrok Cloud]              [Mobile/Anyone]
     │                          │                           │
     │── outbound connect ─────►│                           │
     │   (your PC reaches out)  │◄── types public URL ──────│
     │                          │                           │
     │◄── traffic comes back ───│                           │
     │   through same tunnel    │                           │
     │                          │                           │
  localhost:3000             Public URL              Any Network ✅
  (your app)          ngrok-free.dev/...          WiFi / Mobile Data
```

**Remember:** Your PC always initiates — router never blocks outbound connections.
That's the entire magic of ngrok. 🎩

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│              NGROK QUICK REFERENCE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  INSTALL:   winget install ngrok.ngrok              │
│                                                     │
│  AUTH:      ngrok config add-authtoken TOKEN        │
│                                                     │
│  UPDATE:    ngrok update                            │
│                                                     │
│  START:     ngrok http 3000  (change port)          │
│                                                     │
│  CHECK:     localhost:4040   (dashboard)            │
│             OR                                      │
│             Invoke-RestMethod                       │
│             http://localhost:4040/api/tunnels       │
│                                                     │
│  URL FORMAT: https://xxxx.ngrok-free.dev            │
│                                                     │
│  STOP:      Ctrl+C in terminal                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

*Guide created based on real implementation with Dairy Management System project.*
*ngrok version: 3.39.9 | Windows 11 | PowerShell*
