# EchoWave Agency Ltd Platform

Next.js 14 + JavaScript hybrid platform (Agency website + AI SaaS + Client/Admin portals).

## Quick Start
1. `cp .env.local.example .env.local`
2. Fill environment variables.
3. Run DB SQL from `supabase/schema.sql` in Supabase SQL editor.
4. Install and run:
   - `npm install`
   - `npm run dev`
5. Production:
   - `npm run build`
   - `npm run start`

## Implemented Modules
- Home page sections in Arabic/English with black/gold cinematic direction.
- Free quick analysis form connected to `/api/quick-analysis`.
- Payment page + Stripe checkout session + Stripe webhook.
- Admin AI tools pages and APIs (cinematic/music/content).
- Dashboard pages (`/dashboard`, `/admin/dashboard`).
- Newsletter API and Supabase schema.

## Notes
- Supabase Auth modal is scaffolded and ready for wiring.
- Horus Chat endpoint is available at `/api/horus-chat`.
- Full analysis endpoint exists at `/api/full-analysis`.
