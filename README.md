# Glasschaden Melden

Professionelle Glasschaden-Verwaltung für Versicherungen und Werkstätten.

## Projektstruktur

```
Glasschadenmelden/
├── Web_Glasschadenmelden/      # Next.js Web-App (Desktop-optimiert)
├── Mobile_Glasschadenmelden/   # Next.js + Capacitor Mobile App
├── supabase/                   # Datenbank-Migrationen & Edge Functions
└── CLAUDE.md                   # Projekt-Spezifikation
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Mobile**: Capacitor (iOS/Android)
- **UI**: shadcn/ui, Framer Motion, Sonner

## Setup

### 1. Supabase Projekt erstellen

1. Erstelle ein neues Projekt auf [supabase.com](https://supabase.com)
2. Führe die Migrationen in `supabase/migrations/` aus (in Reihenfolge 001, 002, 003)

### 2. Web-App starten

```bash
cd Web_Glasschadenmelden
npm install
cp .env.example .env.local
# Füge deine Supabase Credentials in .env.local ein
npm run dev
```

### 3. Mobile-App starten

```bash
cd Mobile_Glasschadenmelden
npm install
cp .env.example .env.local
# Füge deine Supabase Credentials ein
npm run dev

# Für native Builds:
npm run mobile:build
npx cap add ios     # oder android
npx cap open ios    # oder android
```

## Rollen

- **Admin**: Versteckter Zugang via `Strg + Umschalt + A` → `/auth/system-access/x-portal-x`
- **Versicherung**: Schadenserfassung und Claim-Monitoring
- **Werkstatt**: Auftragsannahme und Daten-Korrektur

## Admin-Bootstrap

Der erste User, der sich auf der versteckten Admin-Route registriert, wird automatisch zum System-Administrator. Diese Funktion ist danach **permanent deaktiviert**.

## Lizenz

Proprietär - Alle Rechte vorbehalten.
