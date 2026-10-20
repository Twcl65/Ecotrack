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

Open the [Supabase SQL Editor](https://supabase.com/dashboard) and run the contents of `supabase/schema.sql`. This creates tables, RLS policies, and seed data.

### 4. Create an admin user

**Option A — User Management page (recommended):** After running `supabase/users.sql` and setting `SUPABASE_SERVICE_ROLE_KEY`, use **Dashboard → User Management → Add New User**. The password you set there becomes the user's login password.

**Option B — Supabase Dashboard:** In **Authentication** → **Users**, create a user with email and password.  
For username-only login in the app, use email format: `yourusername@ecotrack.local`

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
