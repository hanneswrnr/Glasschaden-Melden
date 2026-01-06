# 📱 Mobile App - Native Setup Guide

## Voraussetzungen

### Für Android:
- ✅ Android Studio installiert
- ✅ Android SDK 33+
- ✅ Java JDK 11+

### Für iOS (nur macOS):
- ✅ Xcode 14+
- ✅ CocoaPods installiert
- ✅ iOS Simulator oder echtes Gerät

---

## 🤖 Android Setup

### 1. Capacitor initialisieren
```bash
cd Mobile_Glasschadenmelden
npm run capacitor:init
```

### 2. Android-Plattform hinzufügen
```bash
npm run capacitor:add:android
```

### 3. App bauen und Android Studio öffnen
```bash
npm run mobile:android
```

**In Android Studio:**
1. Warte, bis Gradle sync fertig ist
2. Wähle einen Emulator aus (oder verbinde ein echtes Gerät)
3. Klicke auf ▶️ **Run**

---

## 🍎 iOS Setup (nur macOS)

### 1. Capacitor initialisieren
```bash
cd Mobile_Glasschadenmelden
npm run capacitor:init
```

### 2. iOS-Plattform hinzufügen
```bash
npm run capacitor:add:ios
```

### 3. App bauen und Xcode öffnen
```bash
npm run mobile:ios
```

**In Xcode:**
1. Wähle einen Simulator (z.B. iPhone 15 Pro)
2. Gehe zu **Signing & Capabilities**
3. Wähle dein **Team** aus
4. Klicke auf ▶️ **Play**

---

## 🔄 Nach Code-Änderungen

Wenn Sie Code ändern:

```bash
# Build und sync zu nativen Projekten
npm run mobile:build

# Oder für spezifische Plattform:
npm run mobile:ios
npm run mobile:android
```

---

## 🐛 Troubleshooting

### Fehler: "out directory not found"
```bash
npm run build
```

### Android: Gradle Fehler
1. Öffne Android Studio
2. File → Invalidate Caches
3. Rebuild Project

### iOS: Signing Fehler
1. Öffne Xcode
2. Wähle das Projekt in der Sidebar
3. Gehe zu "Signing & Capabilities"
4. Wähle dein Apple Developer Team

### Port bereits belegt
```bash
# Ändere Port in package.json:
"dev": "next dev -p 3003"
```

---

## 📦 Projekt-Struktur

```
Mobile_Glasschadenmelden/
├── app/              # Next.js Pages (React Components)
├── lib/              # Utilities & Supabase Client
├── out/              # Static Export (wird gebaut)
├── ios/              # Native iOS Projekt (nach capacitor:add:ios)
├── android/          # Native Android Projekt (nach capacitor:add:android)
├── capacitor.config.ts  # Capacitor-Konfiguration
└── next.config.js    # Next.js für Static Export
```

---

## 🚀 Production Build

### Android APK/AAB
1. Öffne Android Studio
2. Build → Generate Signed Bundle/APK
3. Folge dem Wizard zum Signieren

### iOS IPA
1. Öffne Xcode
2. Product → Archive
3. Distribute App
4. Upload zu App Store Connect

---

## 📚 Nützliche Commands

```bash
# Entwicklung
npm run dev                    # Browser-Test (Port 3002)

# Capacitor
npm run capacitor:sync         # Sync zu nativen Projekten
npm run capacitor:open:ios     # Öffne Xcode
npm run capacitor:open:android # Öffne Android Studio

# Build
npm run build                  # Next.js Build
npm run mobile:build          # Build + Sync
npm run mobile:ios            # Build + Öffne Xcode
npm run mobile:android        # Build + Öffne Android Studio
```
