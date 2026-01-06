# Glasschaden Melden - Mobile App

Mobile App version built with Next.js + Capacitor for iOS and Android.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- For iOS: Xcode 14+ (macOS only)
- For Android: Android Studio with SDK 33+

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize Capacitor** (nur beim ersten Mal)
   ```bash
   npm run capacitor:init
   ```

3. **Add platforms**
   ```bash
   # For iOS (macOS only)
   npm run capacitor:add:ios
   
   # For Android
   npm run capacitor:add:android
   ```

## 📱 Development

### Web Development (empfohlen für schnelles Testen)
```bash
npm run dev
```
Öffne http://localhost:3002

### Build and Run on iOS
```bash
npm run mobile:ios
```
Dies wird:
1. Next.js App bauen
2. Static export erstellen
3. Zu iOS-Projekt syncen
4. Xcode öffnen

Dann in Xcode:
- Simulator oder Gerät auswählen
- ▶️ Play drücken

### Build and Run on Android
```bash
npm run mobile:android
```
Dies wird:
1. Next.js App bauen
2. Static export erstellen
3. Zu Android-Projekt syncen
4. Android Studio öffnen

Dann in Android Studio:
- Emulator oder Gerät auswählen
- ▶️ Run drücken

## 🔄 Update nach Code-Änderungen

Wenn Sie Code ändern:
```bash
npm run mobile:build
```
Oder für spezifische Plattform:
```bash
npm run mobile:ios
# oder
npm run mobile:android
```

## 📦 Manual Sync (wenn nötig)
```bash
npm run capacitor:sync
```

## 🎨 Mobile-Optimierungen

Die Mobile-App nutzt die gleiche Codebasis wie die Web-App, aber mit:
- Touch-optimierten Buttons (min 44px)
- Angepassten Layouts für kleinere Bildschirme
- Native Status Bar Integration
- Haptic Feedback
- Keyboard-Management

## 🔧 Troubleshooting

### iOS Build Fehler
1. Öffne Xcode: `npm run capacitor:open:ios`
2. Gehe zu Signing & Capabilities
3. Wähle dein Team aus

### Android Build Fehler
1. Öffne Android Studio: `npm run capacitor:open:android`
2. Sync Gradle Files
3. Prüfe SDK Version (sollte 33+ sein)

### "out" directory not found
```bash
npm run build
npm run export
```

## 📝 Environment Variables

Erstelle `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚢 Production Build

### iOS
1. Build in Xcode mit Release Scheme
2. Archive erstellen
3. Zu App Store Connect hochladen

### Android
1. Build in Android Studio mit Release Variant
2. APK/AAB signieren
3. Zu Google Play Console hochladen

## 📚 Weitere Informationen

- [Capacitor Dokumentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [iOS Developer Guide](https://developer.apple.com/)
- [Android Developer Guide](https://developer.android.com/)
