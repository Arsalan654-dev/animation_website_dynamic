# Ever After Studio

A dynamic wedding invitation platform: a Laravel API + React studio for designing, publishing, and managing multiple invitation websites without hardcoding a new React page for every couple.

## What is included

- **Public invitation sites** at `/i/:slug` with an envelope opening sequence, hero, story, events, gallery, countdown, venue, RSVP, and configurable optional sections.
- **Admin studio** with dashboard metrics, invitation CRUD/publish/duplicate/archive, a drag-and-drop section builder, theme tokens, animation presets, templates, media library, guest links, RSVP management, private notes, and CSV export.
- **Personal guest links** using `?guest=CODE`: the envelope is skipped, the page scrolls to RSVP, the guest code is verified, and the guest name is prefilled.
- **Six seeded themes**, animation presets, templates, two published demo invitations, sample RSVPs, and demo media.
- **Local-only demo admin**: `admin@everafter.test` / `EverAfter!2026`. These credentials are never seeded in production.

## Stack

| Layer | Technology |
| --- | --- |
| API | Laravel 13, PHP 8.3+ (local and container: 8.5), MySQL 8 / MariaDB 10.4+ locally, Postgres in production |
| Auth | Laravel Sanctum bearer tokens with the `admin` ability |
| API style | Versioned `/api/v1`, Form Requests, API Resources, policies, services |
| Frontend | React 19, Vite 8, strict TypeScript, React Router, Axios, TanStack Query |
| Forms / UI | React Hook Form + Zod, Tailwind CSS 4, Motion, GSAP, Lucide, dnd-kit |
| Production media | Vercel Blob (`MEDIA_DRIVER=vercel_blob`) |

## Repository layout

```text
backend/    Laravel API, migrations, seeders, tests, Docker/Vercel deployment
frontend/   React/Vite studio and public invitation renderer
```

## Local setup

### Requirements

- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd` (PHP 8.5 recommended)
- Composer 2
- Node.js 22+ and npm
- MySQL 8+ or MariaDB 10.4+ locally (XAMPP/MariaDB is fine); `pdo_pgsql` for production migrations against Neon

### 1. Database

Create the local databases:

```sql
CREATE DATABASE wedding_invitations CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE wedding_invitations_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

The API runs at `http://localhost:8000/api/v1`. `php artisan migrate --seed` creates the reference themes/presets/templates, the local admin, and demo invitations because demo data is enabled for `local` and `testing`.

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The studio runs at `http://localhost:5173`.

### Demo URLs

- Landing page: `http://localhost:5173/`
- Maheen & Uzair: `http://localhost:5173/i/maheen-and-uzair`
- Amara & Zayd: `http://localhost:5173/i/amara-and-zayd`
- Guest-link demo: `http://localhost:5173/i/maheen-and-uzair?guest=MAHEENVIP`
- Admin login: `http://localhost:5173/admin/login`

## Verification

```bash
cd backend
php artisan migrate:fresh --seed
php artisan test

cd ../frontend
npm test
npm run typecheck
npm run build
```

The backend feature suite covers authentication, public payloads, RSVP rules and guest codes, invitation lifecycle and authorization, sections/events/guests, themes/templates/animation presets, settings, media uploads/replacement/usage conflicts, dashboard metrics, RSVP filters/notes/delete, and CSV export.

## API overview

| Area | Endpoints |
| --- | --- |
| Public | `GET /api/v1/public/invitations/{slug}`, `GET .../guest-code/{code}`, `POST .../rsvp` |
| Auth | `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |
| Studio | `/api/v1/dashboard`, `/api/v1/settings`, `/api/v1/themes`, `/api/v1/templates`, `/api/v1/animation-presets`, `/api/v1/media` |
| Invitations | `/api/v1/invitations` plus publish, unpublish, archive, restore, duplicate, preview |
| Content | `/api/v1/invitations/{id}/sections`, `/events`, `/guests` |
| RSVPs | `/api/v1/rsvps`, `/api/v1/rsvps/export` |

Admin requests use `Authorization: Bearer <token>`. The SPA stores the token in `sessionStorage` and sends it explicitly; CORS does not use cookies (`supports_credentials=false`).

## Deploying to Vercel

The repository is designed as **two Vercel projects**:

- `frontend/` — static Vite SPA
- `backend/` — Laravel in a FrankenPHP 8.5 container-backed Vercel Service (Services is in beta on all plans)

Vercel does not host databases itself. The recommended free option is **Neon Postgres** from the Vercel Marketplace (`vercel integration add neon`), which injects `DATABASE_URL` into the backend project. The API reads `DATABASE_URL` automatically when `DB_CONNECTION=pgsql`. Any managed MySQL or Postgres database also works; keep TLS enabled and allow connections from Vercel.

Recommended tooling: Vercel CLI 65.2+ (`npm i -g vercel@latest`) and a GitHub repository containing this project.

### 1. Frontend project

Import the repository into Vercel and set the **Root Directory** to `frontend`. The included `frontend/vercel.json` sets the Vite build, `dist` output, SPA fallback, and asset caching.

Set:

```dotenv
VITE_API_URL=https://<your-api-project>.vercel.app/api/v1
```

Deploy, then use the resulting frontend origin in the backend CORS settings. `VITE_API_URL` is compiled into the SPA, so changing it requires a new frontend deployment.

### 2. Backend project

Import the same repository into a second Vercel project and set the **Root Directory** to `backend`. The included `backend/vercel.json`, `Dockerfile.vercel`, and `Caddyfile` build a FrankenPHP 8.5 container and route all requests through Laravel's `public/index.php`. The container listens on Vercel's `$PORT` and serves demo images from `backend/public/demo/`.

Add these environment variables in **Project Settings → Environment Variables**:

```dotenv
APP_NAME="Ever After Studio"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
APP_URL=https://<your-api-project>.vercel.app
FRONTEND_URL=https://<your-frontend-project>.vercel.app
CORS_ALLOWED_ORIGINS=https://<your-frontend-project>.vercel.app

LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
# Or use the individual DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD variables.
# For MySQL instead: DB_CONNECTION=mysql plus the DB_* variables and MYSQL_ATTR_SSL_CA if required.

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
SANCTUM_TOKEN_EXPIRATION=720

MEDIA_DRIVER=vercel_blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Generate `APP_KEY` once with:

```bash
cd backend
php artisan key:generate --show
```

Do not reuse the local key. Environment variable changes require a new deployment.

### 3. Prepare the production database

Run migrations and the reference-data seeders against the managed database from a trusted machine or CI job, **not** from container startup:

```bash
cd backend
vercel link
vercel env pull .env.production --environment=production
php artisan migrate --force --env=production
php artisan db:seed --force --env=production
php artisan app:create-admin --env=production
```

`vercel env pull` downloads the linked project's production variables into `.env.production` (already gitignored). `--env=production` makes Laravel load that file. Alternatively, export the same variables in your shell or CI. `db:seed` creates the six themes, animation presets, templates, and settings. Demo invitations and the local demo admin are not seeded in production. `app:create-admin` prompts for a secure password and never stores demo credentials.

To include the two demo invitations and sample RSVPs in a public demo deployment, run the demo seeder explicitly after the base seed:

```bash
SEED_DEMO_DATA=true php artisan db:seed --class=DemoDataSeeder --force --env=production
```

Local machines need the `pdo_pgsql` extension enabled to run these commands against Neon. On Windows PHP, add `extension=pdo_pgsql` to `php.ini` or run `php -d extension=pdo_pgsql artisan ...`.

Keep migrations in a release step so concurrent container instances never race each other.

### 4. Media storage

The container filesystem is ephemeral. Local uploads work in development, but production must use Vercel Blob:

1. Create a public Blob store in the backend Vercel project (Dashboard → Storage → Blob, or `vercel blob create-store`).
2. Connect it to the backend project so `BLOB_READ_WRITE_TOKEN` is injected automatically. If your CLI/workflow does not inject it, add the token manually to the production environment.
3. Set `MEDIA_DRIVER=vercel_blob` and redeploy after adding or changing the token.

Uploads are sent to Vercel's current Blob API (`https://vercel.com/api/blob`, API version 13) using `BLOB_READ_WRITE_TOKEN`, and the returned public URL is stored on the media record. Demo images in `backend/public/demo/` are served directly from the image and do not need Blob.

### 5. CORS and links

- `CORS_ALLOWED_ORIGINS` must exactly match the frontend origin (scheme + host, no trailing slash).
- `FRONTEND_URL` is used for invitation `public_url` values and guest links.
- `APP_URL` is used for backend-generated asset URLs.

### Operational notes

- Sessions and cache use the database, so they survive container restarts and are shared across instances.
- `QUEUE_CONNECTION=sync` is intentional: the app has no long-running worker requirement. If asynchronous jobs are added, use a worker/queue service and Vercel Cron for scheduled work.
- The container runs as `www-data` and Caddy binds to Vercel's `$PORT`.
- Do not run `php artisan optimize` during the image build: configuration caching would freeze build-time values instead of Vercel runtime environment variables.
- Run `php artisan migrate --force` as a separate release/CI step.

## Security notes

- Production administrators are created with `php artisan app:create-admin`; seeded demo credentials are restricted to `local`/`testing`.
- Theme tokens, animation configs, and section content are whitelisted/validated; no executable JavaScript is read from the database.
- Public RSVP submissions are rate-limited per IP + invitation (8/minute, 200/day) and validated against guest codes, deadlines, guest limits, decline rules, and custom questions.
- Login attempts are rate-limited, inactive accounts are blocked, and admin tokens carry the `admin` ability.
- Uploads are restricted by MIME type, size, and dimensions. Media deletion returns `409` with usage details while an asset is still referenced.
- CSRF/cookie auth is intentionally not used for the SPA; bearer tokens avoid cross-site cookie requirements.
- `backend/.vercelignore` and `frontend/.vercelignore` keep local `.env*` files, `vendor/`, `node_modules/`, and test artifacts out of Vercel deployment sources. Environment values belong in the Vercel project settings.

## License

Private project. All rights reserved.
