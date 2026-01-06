# 🚀 Quick Reference - Glasschaden Melden Mobile App

## 📥 Download-Links (Quick Access)

### **Basis (alle Plattformen)**
| Software | Link | Größe | Für |
|----------|------|-------|-----|
| **Node.js LTS** | https://nodejs.org/ | ~50 MB | Alle |

### **Android Development**
| Software | Link | Größe | Für |
|----------|------|-------|-----|
| **JDK 17** | https://adoptium.net/ | ~150 MB | Android |
| **Android Studio** | https://developer.android.com/studio | ~1 GB + SDK | Android |

### **iOS Development (nur macOS)**
| Software | Link | Größe | Für |
|----------|------|-------|-----|
| **Xcode** | https://apps.apple.com/de/app/xcode/id497799835 | ~12 GB | iOS |

---

## 🎯 Server URLs

| App | URL | Status |
|-----|-----|--------|
| **Web-App** | http://localhost:3001 | ✅ Läuft |
| **Mobile-App** | http://localhost:3002 | ✅ Läuft |

---

## ⚡ Wichtigste Commands

### **Entwicklung**
```bash
# Im Browser testen (SCHNELLSTER WEG!)
cd Mobile_Glasschadenmelden
npm run dev
# → http://localhost:3002

# Dann F12 → Device Toolbar (📱 Symbol) → "iPhone 14 Pro"
```

### **Native Builds**
```bash
# Android
npm run mobile:android      # Build + Android Studio öffnen

# iOS (nur macOS)
npm run mobile:ios          # Build + Xcode öffnen
```

### **Nur Build ohne IDE**
```bash
npm run mobile:build        # Build + Sync zu nativen Projekten
```

---

## 🔧 Setup Commands (einmalig)

```bash
# 1. Capacitor initialisieren
npm run capacitor:init

# 2a. Android hinzufügen
npm run capacitor:add:android

# 2b. iOS hinzufügen (macOS)
npm run capacitor:add:ios
```

---

## 📱 Browser DevTools - Mobile Ansicht

### **Chrome / Edge**
1. Drücken Sie `F12`
2. Klicken Sie auf 📱 Symbol (Toggle Device Toolbar)
3. Wählen Sie:
   - **iPhone 14 Pro** (390 x 844)
   - **Pixel 7** (412 x 915)
   - **iPad Air** (820 x 1180)

### **Firefox**
1. Drücken Sie `F12`
2. Klicken Sie auf 📱 Symbol (Responsive Design Mode)
3. Wählen Sie Gerät

---

## 📂 Projekt-Struktur

```
Glasschadenmelden/
├── Web_Glasschadenmelden/          # Desktop Web-App (Port 3001)
│   ├── app/                         # Pages & Components
│   ├── lib/                         # Utilities & Supabase
│   └── .env.local                   # Environment Variables
│
├── Mobile_Glasschadenmelden/       # Mobile App (Port 3002)
│   ├── app/                         # Pages & Components (kopiert)
│   ├── lib/                         # Utilities & Supabase (kopiert)
│   ├── android/                     # Native Android (nach add:android)
│   ├── ios/                         # Native iOS (nach add:ios)
│   ├── out/                         # Static Build (nach Build)
│   ├── capacitor.config.ts          # Capacitor Config
│   ├── next.config.js               # Next.js Static Export
│   └── .env.local                   # Environment Variables
│
├── INSTALLATION_CHECKLISTE.md      # Detaillierte Anleitung
├── MOBILE_SETUP.md                 # Mobile-Setup Guide
└── QUICK_REFERENCE.md              # Diese Datei
```

---

## 🌐 Browser-Test vs Native Build

| Feature | Browser | Native Android/iOS |
|---------|---------|-------------------|
| **Geschwindigkeit** | ⚡ Sofort | 🐌 Build: 10-15 Min (erstes Mal) |
| **Hot Reload** | ✅ Ja | ❌ Nein (Rebuild nötig) |
| **Native Features** | ❌ Begrenzt | ✅ Alle (Kamera, GPS, etc.) |
| **Ideal für** | Entwicklung & UI-Tests | Finales Testing vor Release |

**Empfehlung**: Entwickeln Sie im Browser, testen Sie final in nativen Apps!

---

## 🔍 Testing-Workflow

### **Phase 1: Entwicklung (Browser)**
```bash
npm run dev
# → http://localhost:3002
# Code ändern → Auto-Reload
```

### **Phase 2: Mobile Testing (Emulator)**
```bash
# Android
npm run mobile:android
# → Android Studio → Run

# iOS (macOS)
npm run mobile:ios
# → Xcode → Play
```

### **Phase 3: Gerät Testing**
- Android: USB-Debugging aktivieren → Gerät verbinden
- iOS: Kostenloses Apple Developer Account reicht für Entwicklung

---

## 🆘 Schnelle Problemlösung

| Problem | Schnelle Lösung |
|---------|----------------|
| Port belegt | `"dev": "next dev -p 3003"` in package.json |
| Build Fehler | `npm install` neu ausführen |
| Supabase Error | `.env.local` prüfen |
| Android langsam | Normal beim ersten Build! (5-15 Min) |
| iOS Signing | Kostenloses Apple Account reicht |

---

## 📖 Dokumentation

| Ressource | Link |
|-----------|------|
| **Capacitor Docs** | https://capacitorjs.com/docs |
| **Next.js Docs** | https://nextjs.org/docs |
| **Supabase Docs** | https://supabase.com/docs |
| **Android Studio** | https://developer.android.com/studio/intro |
| **Xcode** | https://developer.apple.com/documentation/xcode |

---

## ✅ Schnellstart-Checkliste

- [ ] Node.js installiert?
- [ ] `npm install` in Mobile_Glasschadenmelden ausgeführt?
- [ ] `.env.local` erstellt mit Supabase Keys?
- [ ] Browser-Test erfolgreich (http://localhost:3002)?
- [ ] (Optional) Android Studio installiert für Android?
- [ ] (Optional) Xcode installiert für iOS (macOS)?

---

## 🎉 Los geht's!

**Einfachster Start JETZT**:
```bash
cd Mobile_Glasschadenmelden
npm run dev
```

Dann Browser öffnen: http://localhost:3002
DevTools (F12) → Mobile View aktivieren → Testen!

**Native Builds SPÄTER** (nach Installation):
```bash
npm run mobile:android   # oder
npm run mobile:ios
```

---

Viel Erfolg! 🚀
