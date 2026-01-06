# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CLAUDE IMPLEMENTATION GUIDE: GLASSCHADEN MELDEN (ULTIMATE & ADAPTIVE)

Du agierst als Lead-Entwickler für das Projekt "Glasschaden melden". Dieses Dokument ist das verbindliche Lastenheft. Du hast die Freiheit, die Architektur zu optimieren, solange diese Anforderungen und Logiken strikt eingehalten werden.

## 1. PLATTFORM-DEFINITION & STRUKTUR

Das Projekt wird in zwei parallelen Ordnern entwickelt, um Web- und Mobile-Spezifikationen optimal zu trennen:

**Web_Glasschadenmelden**: Fokus auf die Desktop-Webapplikation mit maximaler Platzausnutzung.

**Mobile_Glasschadenmelden**: Fokus auf die Handy- und Tablet-App (iOS/Android via PWA/Capacitor).

**WICHTIG**: Beide Plattformen greifen auf dasselbe Supabase-Backend zu, müssen jedoch in ihren jeweiligen Ordnern unabhängig voneinander lauffähig und optimiert sein.

### Layout-Philosophie (Web)

- **Full-Width**: KEIN zentriertes Design mit Rändern auf Desktop. Die Webapp nutzt den maximal verfügbaren Platz (Fluid/Full-Width Layout).
- **Desktop-Optimierung**: Dashboards und Tabellen sind breitflächig ausgelegt.

### Layout-Philosophie (Mobile)

- **Touch-Ready**: Native-ähnliche Erfahrung auf Smartphones und Tablets. Keine unnötigen Desktop-Elemente.

## 2. ROLLEN & DASHBOARD-ISOLATION (STRIKT)

Jede Rolle hat ein isoliertes Dashboard, geschützt durch Supabase Row Level Security (RLS).

### 2.1 Admin (Hidden)

- **Zugang**: Globaler Key-Listener `Strg + Umschalt + A` -> Login Modal -> Route `/auth/system-access/x-portal-x`.
- **Bootstrapping**: Falls kein Admin existiert, wird der erste Registrierende auf dieser Route Admin. Danach permanente Sperrung dieser Logik.
- **Features**: Globaler Audit-Log, User-Management, Finanz-Monitor (alle Provisionen).

### 2.2 Versicherung (Auftraggeber)

- **Registrierung**: Firma, Adresse, Ansprechpartner, E-Mail, PW, Telefon, Bankname, IBAN.
- **Dashboard**: Schadenserfassung (Wizard), Monitoring eigener Claims.

### 2.3 Werkstatt (Auftragnehmer)

- **Registrierung**: Multi-Location Support. Ein Hauptaccount verwaltet mehrere Standorte.
- **Standort-Daten**: Werkstattname, Adresse, Ansprechpartner, Telefonnummer.
- **Dashboard**: Auftragsannahme, Korrektur-Modus, Provisions-Monitor (Zahlungen an Versicherung).

## 3. DATEN-SCHEMA & SCHADENSERFASSUNG

### 3.1 Erfassungsfelder (Versicherung)

- **Kundendetails**: Vorname, Nachname, Telefon, Versicherung (Name), Vers-Nr, Selbstbeteiligung.
- **Beweise**: Pflicht-Upload von Monitor-Fotos/Dateien (alle relevanten Daten als Foto).
- **Schadensdetails**: Datum, Schadensart (Steinschlag, Riss, Austausch etc.).
- **Fahrzeugdetails**: Fahrzeugdaten (Marke/Modell), Kennzeichen, Fahrgestellnummer / VIN (17-Stellen Regex Check: kein I, O, Q).

### 3.2 Provisions- & Korrekturlogik

- **Werkstatt** bestätigt Daten-Korrektheit der Versicherungsangaben.
- **Korrektur**: Falls nötig, editiert die Werkstatt Daten -> Automatischer Eintrag in `audit_log` (JSONB: old_val, new_val, actor, timestamp).
- **Abrechnung**: Dashboard-Visualisierung der fälligen Provisionen (Werkstatt zahlt an Versicherung).

## 4. TECHNISCHE EXZELLENZ & LOGIK

- **GitHub**: Automatischer Push an https://github.com/hanneswrnr/Glasschaden-Melden.git.
- **Code-Regel**: Generiere IMMER den VOLLSTÄNDIGEN Code der Dateien.
- **VIN-Validator**: Einhaltung von ISO 3779 (Ausschluss I, O, Q).
- **Chat-Cleanup**: Automatisierte Löschung der `claim_messages` exakt 14 Tage nach Abschluss (status: completed).
- **Soft-Delete**: `is_archived` Flag statt physischer Löschung für Claims.
- **Image Pipeline**: Clientseitige WebP-Kompression (< 2MB) vor Upload.

## 5. UI/UX FEATURES (DIE 20 VERBESSERUNGEN)

1. **Zod Env Validation**: API-Key Check beim Start.
2. **Global Error Boundary**: Kein App-Crash, nur freundliche Fehler-UI.
3. **Sonner Toasts**: Globales Benachrichtigungssystem.
4. **Skeleton States**: Animierte Platzhalter bei Ladezeiten.
5. **Optimistic UI**: Sofortiges Feedback bei Statusänderungen.
6. **Rate Limiting**: Schutz für Admin-Login.
7. **Form Persistence**: Lokaler Draft-Speicher für Formulare.
8. **PWA Manifest**: Installierbar auf Homescreens.
9. **Security Headers**: CSP, HSTS & X-Frame-Options.
10. **Command Palette**: `Strg + K` für globale Suche (VIN, Kennzeichen, Name).
11. **Responsive Design Tokens**: Adaptive Layout-Grids.
12. **Database Indexing**: Schnelle Suche auf VIN/Kennzeichen.
13. **Type-Safe API**: Vollständige TS-Abdeckung von DB bis UI.
14. **Audit Metadata**: Logging von IP/User-Agent.
15. **DSGVO Ready**: Export- & Löschlogik vorbereitet.
16. **Auto-Focus Logic**: Intelligente Cursor-Steuerung in Wizards.
17. **Connectivity Monitor**: Anzeige von Offline-Zuständen.
18. **Custom Modal System**: Keine nativen Browser-Alerts.
19. **GitHub Actions**: CI-Checks für Code-Qualität.
20. **Self-Healing Auth**: Auto-Refresh von Sessions.

## 6. SYSTEMARCHITEKTUR (ORDNERSTRUKTUR)

Die Arbeit erfolgt parallel in:

- `/Web_Glasschadenmelden` (Next.js App Router für Webapp)
- `/Mobile_Glasschadenmelden` (Optimiertes Frontend für Mobile/Capacitor)

Innerhalb dieser Ordner:

- `app/(dashboard)/[role]` -> Dashboard-Bereiche.
- `lib/validation` -> Zentrale Zod-Schemas.
- `components/shared` -> Chat, Palette, Audit-Komponenten.
- `supabase/functions` -> Cron-Jobs (gemeinsam genutzt).

## 7. DESIGN TOKENS & PLATZ-MANAGEMENT

- **Full-Width (Web)**: Nutze `max-w-full` oder sehr breite `max-w-[1920px]`.
- **Adaptive Grids**: Auf Desktop 3-4 Spalten (Widgets), auf Mobile 1 Spalte.
- **Farben**: Primär Indigo-600, Text Slate-900, Erfolg Emerald-500.
- **Interaktion**: framer-motion für Layout-Animationen.

---

**Hinweis**: Du hast die Freiheit, technische Details zu optimieren, solange die strategischen Ziele gewahrt bleiben.
