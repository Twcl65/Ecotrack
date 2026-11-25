# ECOTRACK

Smart waste management platform for Jasaan LGU — built with **Next.js** and **Supabase**.

## Features

- Landing page matching the ECOTRACK design (hero, stats, services, login modal)
- Supabase authentication (Administrator Login)
- Live stats from Supabase (`site_metrics`, `feature_cards`)
- Protected dashboard route

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The **service role key** is required for User Management to create login accounts with passwords. Find it in Supabase Dashboard → **Settings** → **API** → `service_role` (keep this secret; never expose it in client code).

### 3. Set up the database

Open the [Supabase SQL Editor](https://supabase.com/dashboard) and run `supabase/schema.sql`, followed by `supabase/users.sql` and `supabase/push-notifications.sql`. These scripts create the tables, RLS policies, seed data, signup trigger, and push event queue. Then run `supabase/monthly-collection-reports.sql`, `supabase/driver-garbage-collections.sql`, and `supabase/driver-collection-reporting.sql` to enable driver-submitted sack/kg totals in the admin Collection Report. Each schedule can have separate Input Collection and Calculate Collection records; only Input Collection contributes to the daily report totals. Run `supabase/vehicles.sql` and `supabase/vehicle-operations.sql` for the fleet, GPS odometer tracking, and driver maintenance requests and alerts. For immediate push delivery, deploy `supabase/functions/send-push` and configure the Database Webhook as described at the top of `supabase/push-notifications.sql`.

### 4. Create an admin user

**Option A — User Management page (recommended):** After running `supabase/users.sql` and setting `SUPABASE_SERVICE_ROLE_KEY`, use **Dashboard → User Management → Add New User**. The password you set there becomes the user's login password.

**Option B — Supabase Dashboard:** In **Authentication** → **Users**, create a user with email and password.  
For username-only login in the app, use email format: `yourusername@ecotrack.local`

### Password recovery setup

In Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**, allow the web callback URL for each deployed site (for example, `http://localhost:3000/auth/callback` and `https://your-site.example.com/auth/callback`) and the mobile deep link `ecotrack://reset-password`. Password reset emails must use Supabase's confirmation URL so the recovery code is returned to the app. Configure a production SMTP provider in Supabase for dependable email delivery.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mobile App (Expo)

The `mobile/` folder contains the ECOTRACK resident & driver app (Expo + React Native), connected to the same Supabase project.

```bash
cd mobile
npm install
cp .env.example .env   # add same Supabase URL + anon key as web
npm start
```

See `mobile/README.md` for details.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components (Navbar, Hero, Login modal, etc.)
├── lib/supabase/     # Supabase client utilities
└── types/            # TypeScript types
supabase/
└── schema.sql        # Database schema + seed data
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL)
- Lucide React icons
