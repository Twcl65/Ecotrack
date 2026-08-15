# ECOTRACK Mobile (Expo SDK 54)

Resident and driver mobile app connected to the same Supabase backend as the web dashboard.

**Expo SDK 54** — requires the latest **Expo Go** from the Play Store / App Store.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Add your Supabase credentials to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use the same values as the web app's `.env.local` (public keys only).

## Run

```bash
npm start
```

Then press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go.

## Features (Resident)

- Welcome / onboarding screen
- Login & register (Supabase Auth)
- Dashboard with next collection card & quick actions
- Collection schedule (calendar + list from `collection_schedules`)
- Submit complaint (writes to `complaints` table)
- Announcements (from `announcements` table)
- Notifications (derived from schedules + announcements)
- Profile & logout

## Login

One app for both roles. After sign-in, routing is automatic:

| Role | Destination |
|------|-------------|
| Resident | Resident tab dashboard |
| Driver | Driver placeholder screen (full UI next) |
| Admin | Resident UI (use web dashboard for admin tasks) |

Sign in with the **email and password** created in User Management on the website, or register as a new resident.

## Project structure

```
mobile/
├── app/                 # Expo Router screens
├── components/          # Shared UI
├── constants/theme.ts   # ECOTRACK colors
├── context/AuthContext  # Session + profile
└── lib/                 # Supabase + data helpers
```
