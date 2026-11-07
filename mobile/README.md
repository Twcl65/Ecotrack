# ECOTRACK Mobile (Expo SDK 54)

Resident and driver mobile app connected to the same Supabase backend as the web dashboard.

**Expo SDK 54** — use the latest **Expo Go** for general development. Remote push notifications
require an ECOTRACK development or production build.

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

## Push notifications

Remote push notifications do not work in Expo Go on SDK 53 and later. Install the ECOTRACK
development build on a physical device to test them:

```bash
eas build --profile development --platform android
npx expo start --dev-client
```

Install the generated APK on the device, then open ECOTRACK from the development build.
The local `google-services.json` is intentionally excluded from Git. Register it as a secret
EAS file variable from the `mobile` directory before building:

```bash
eas env:create --environment development --name GOOGLE_SERVICES_JSON --type file --visibility secret --value ./google-services.json
```

Repeat for `preview` or `production` if you build those profiles. Configure Android FCM v1
service-account credentials in EAS (`eas credentials --platform android`) before expecting
remote delivery. For announcements, select **Staff** to notify drivers and administrators or
**All Residents** to notify resident accounts; barangay-scoped announcements are not currently
sent as pushes.
For backend delivery, apply [`../supabase/push-notifications.sql`](../supabase/push-notifications.sql),
deploy the `send-push` Supabase Edge Function, and configure the `push_events` database webhook
and `PUSH_WEBHOOK_SECRET` as described in that SQL file.

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
