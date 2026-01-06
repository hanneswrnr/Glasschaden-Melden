# 📋 Installation-Checkliste: Mobile App Development

## ✅ Schritt-für-Schritt Anleitung

---

## 🟢 TEIL 1: Basis-Installation (für alle)

### ☑️ 1. Node.js installieren

**Download**: https://nodejs.org/

**Schritte**:
1. Gehen Sie zu https://nodejs.org/
2. Laden Sie die **LTS Version** (empfohlen) herunter
3. Führen Sie das Installationsprogramm aus
4. Akzeptieren Sie die Standardeinstellungen
5. Klicken Sie durch den Installer

**Verifizieren**:
```bash
node --version
# Sollte zeigen: v20.x.x oder höher

npm --version
# Sollte zeigen: 10.x.x oder höher
```

✅ **Erledigt** wenn beide Befehle eine Versionsnummer zeigen

---

## 🤖 TEIL 2: Android Development Setup

### ☑️ 2. Java Development Kit (JDK) installieren

**Download**: https://adoptium.net/

**Schritte**:
1. Gehen Sie zu https://adoptium.net/
2. Wählen Sie:
   - **Version**: 17 (LTS)
   - **Operating System**: Windows
   - **Architecture**: x64
3. Klicken Sie auf **Download .msi**
4. Führen Sie das `.msi` Installationsprogramm aus
5. Akzeptieren Sie alle Standardeinstellungen
6. ✅ Wichtig: Aktivieren Sie "Set JAVA_HOME variable"
7. ✅ Wichtig: Aktivieren Sie "Add to PATH"

**Verifizieren**:
```bash
java -version
# Sollte zeigen: openjdk version "17.x.x"
```

✅ **Erledigt** wenn Java-Version angezeigt wird

---

### ☑️ 3. Android Studio installieren

**Download**: https://developer.android.com/studio

**Schritte**:
1. Gehen Sie zu https://developer.android.com/studio
2. Klicken Sie auf **Download Android Studio**
3. Akzeptieren Sie die Nutzungsbedingungen
4. Laden Sie das `.exe` Installationsprogramm herunter (ca. 1 GB)
5. Führen Sie das Installationsprogramm aus

**Während der Installation**:
- ✅ Wählen Sie "Standard Installation"
- ✅ Akzeptieren Sie alle Komponenten:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device
- ✅ Wählen Sie einen Installationsort (min. 5 GB frei)
- Warten Sie (~20-30 Minuten)

**Nach der Installation - Erster Start**:
1. Android Studio öffnet sich
2. Klicken Sie durch den Setup Wizard
3. Wählen Sie **"Standard"** Setup
4. Wählen Sie ein Theme (Light oder Dark)
5. Klicken Sie auf **Finish**
6. Android Studio lädt zusätzliche Komponenten herunter

✅ **Erledigt** wenn Android Studio Startbildschirm erscheint

---

### ☑️ 4. Android SDK konfigurieren

**In Android Studio**:
1. Öffnen Sie Android Studio
2. Klicken Sie auf **More Actions** → **SDK Manager**
   (oder: **Tools** → **SDK Manager**)

**SDK Platforms Tab**:
1. ✅ Aktivieren Sie **Android 13.0 (Tiramisu)** - API Level 33
2. ✅ Optional: **Android 14.0** - API Level 34
3. Klicken Sie auf **Apply**
4. Akzeptieren Sie die Lizenzen
5. Klicken Sie auf **OK**
6. Warten Sie (~2-3 GB Download)

**SDK Tools Tab**:
1. ✅ Aktivieren Sie **Android SDK Build-Tools**
2. ✅ Aktivieren Sie **Android Emulator**
3. ✅ Aktivieren Sie **Android SDK Platform-Tools**
4. Klicken Sie auf **Apply**
5. Warten Sie auf Installation

✅ **Erledigt** wenn alle Tools installiert sind

---

### ☑️ 5. Android Emulator erstellen

**In Android Studio**:
1. Klicken Sie auf **More Actions** → **Virtual Device Manager**
   (oder: **Tools** → **Device Manager**)
2. Klicken Sie auf **Create Device**

**Gerät auswählen**:
1. Kategorie: **Phone**
2. Wählen Sie: **Pixel 7** oder **Pixel 7 Pro**
3. Klicken Sie auf **Next**

**System Image auswählen**:
1. Tab: **Recommended**
2. Wählen Sie: **Tiramisu** (Android 13.0, API Level 33)
3. Falls noch nicht heruntergeladen, klicken Sie auf **Download**
4. Warten Sie (~1 GB Download)
5. Klicken Sie auf **Next**

**AVD benennen**:
1. Name: Belassen Sie den Standardnamen (z.B. "Pixel 7 API 33")
2. Klicken Sie auf **Finish**

**Testen**:
1. Klicken Sie auf das ▶️ **Play** Symbol neben dem Emulator
2. Warten Sie (~30-60 Sekunden beim ersten Start)
3. Android-Homescreen sollte erscheinen

✅ **Erledigt** wenn Emulator läuft

---

## 🍎 TEIL 3: iOS Development Setup (nur macOS)

### ☑️ 6. Xcode installieren

**Download**: https://apps.apple.com/de/app/xcode/id497799835

**Methode 1 - App Store (empfohlen)**:
1. Öffnen Sie den **App Store**
2. Suchen Sie nach "Xcode"
3. Klicken Sie auf **Laden** / **Installieren**
4. Warten Sie (~1-2 Stunden, 12 GB Download)

**Methode 2 - Developer Website**:
1. Gehen Sie zu https://developer.apple.com/xcode/
2. Klicken Sie auf **Download**
3. Laden Sie die `.xip` Datei herunter
4. Doppelklicken Sie zum Entpacken
5. Verschieben Sie Xcode in den **Programme** Ordner

**Nach der Installation**:
1. Öffnen Sie **Xcode**
2. Akzeptieren Sie die Lizenzvereinbarung
3. Geben Sie Ihr Passwort ein (für zusätzliche Tools)
4. Warten Sie auf Installation der Komponenten

✅ **Erledigt** wenn Xcode Welcome Screen erscheint

---

### ☑️ 7. Xcode Command Line Tools installieren

**Terminal öffnen**:
1. Drücken Sie `Cmd + Space`
2. Tippen Sie "Terminal"
3. Drücken Sie Enter

**Befehl ausführen**:
```bash
xcode-select --install
```

**Schritte**:
1. Ein Dialog erscheint
2. Klicken Sie auf **Install**
3. Akzeptieren Sie die Lizenz
4. Warten Sie (~5-10 Minuten)

**Verifizieren**:
```bash
xcode-select -p
# Sollte zeigen: /Applications/Xcode.app/Contents/Developer
```

✅ **Erledigt** wenn Pfad angezeigt wird

---

### ☑️ 8. CocoaPods installieren

**Im Terminal**:
```bash
sudo gem install cocoapods
```

**Schritte**:
1. Geben Sie Ihr Passwort ein
2. Warten Sie (~2-5 Minuten)

**Verifizieren**:
```bash
pod --version
# Sollte zeigen: 1.14.x oder höher
```

✅ **Erledigt** wenn Version angezeigt wird

---

## 🚀 TEIL 4: Glasschaden Melden App vorbereiten

### ☑️ 9. Capacitor initialisieren

**Im Terminal / PowerShell**:
```bash
cd Mobile_Glasschadenmelden
npm run capacitor:init
```

**Was passiert**:
- Konfiguriert Capacitor
- App ID: `com.glasschadenmelden.mobile`
- App Name: `MobileGlasschadenMelden`

✅ **Erledigt** wenn keine Fehler auftreten

---

### ☑️ 10a. Android Plattform hinzufügen

**Nur wenn Sie Android testen wollen**:
```bash
npm run capacitor:add:android
```

**Was passiert**:
- Erstellt `android/` Ordner
- Installiert Android-Dependencies
- Dauer: ~2-3 Minuten

✅ **Erledigt** wenn `android/` Ordner existiert

---

### ☑️ 10b. iOS Plattform hinzufügen (nur macOS)

**Nur wenn Sie iOS testen wollen**:
```bash
npm run capacitor:add:ios
```

**Was passiert**:
- Erstellt `ios/` Ordner
- Installiert iOS-Dependencies
- Installiert CocoaPods
- Dauer: ~3-5 Minuten

✅ **Erledigt** wenn `ios/` Ordner existiert

---

## 🎯 TEIL 5: App auf Gerät starten

### Android App starten

```bash
# Build und öffne Android Studio
npm run mobile:android
```

**In Android Studio**:
1. Warten Sie auf Gradle Sync (erstes Mal ~5-10 Min)
2. Wählen Sie Emulator oder Gerät oben aus
3. Klicken Sie auf ▶️ **Run**
4. Warten Sie (~30-60 Sekunden)
5. App startet!

✅ **Fertig** - App läuft auf Android!

---

### iOS App starten (nur macOS)

```bash
# Build und öffne Xcode
npm run mobile:ios
```

**In Xcode**:
1. Warten Sie auf Projekt-Laden
2. Wählen Sie Simulator (z.B. iPhone 15 Pro)
3. Klicken Sie auf ▶️ **Play**
4. Warten Sie (~30-60 Sekunden)
5. App startet!

**Falls Signing-Fehler**:
1. Projekt in Sidebar auswählen
2. Tab: **Signing & Capabilities**
3. Team auswählen (oder Account hinzufügen)

✅ **Fertig** - App läuft auf iOS!

---

## ⏱️ Zeitaufwand

| Setup | Zeit |
|-------|------|
| Node.js | ~10 Min |
| Android (komplett) | ~1.5-2 Std |
| iOS (komplett, macOS) | ~2-3 Std |
| App Build (erste Mal) | ~10-15 Min |

---

## 🐛 Häufige Probleme

### "java: command not found"
**Lösung**: PATH nicht gesetzt
- Windows: System → Umgebungsvariablen → PATH → Hinzufügen: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x\bin`

### "ANDROID_HOME not set"
**Lösung**: Variable erstellen
- Name: `ANDROID_HOME`
- Wert: `C:\Users\IhrName\AppData\Local\Android\Sdk`

### Gradle Build sehr langsam
**Normal!** Erster Build: 5-15 Min

### iOS Signing Error
**Lösung**: Apple Account in Xcode hinzufügen
- Xcode → Preferences → Accounts → + → Apple ID

---

## 📚 Hilfreiche Commands

```bash
# Browser-Test (schnellster Weg)
npm run dev

# Native Builds
npm run mobile:android    # Android Studio öffnen
npm run mobile:ios        # Xcode öffnen (macOS)

# Nur Build, kein IDE öffnen
npm run mobile:build

# Nur syncen nach Code-Änderungen
npm run capacitor:sync
```

---

## 🎉 Fertig!

Sie können jetzt:
- ✅ App im Browser testen (http://localhost:3002)
- ✅ App auf Android Emulator/Gerät testen
- ✅ App auf iOS Simulator/iPhone testen (macOS)

**Empfehlung**: Starten Sie mit Browser-Test, dann später native Builds!
