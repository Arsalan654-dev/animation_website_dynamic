# Ever After Studio API

Laravel 13 API for the Ever After Studio wedding invitation platform.

See the [root README](../README.md) for local setup, the API surface, testing, and Vercel deployment.

## Quick commands

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

```bash
php artisan test
vendor/bin/pint --format agent
```

The API is versioned at `/api/v1`. Admin routes require a Sanctum bearer token with the `admin` ability. Public invitation pages use `/api/v1/public/invitations/{slug}`.

Production deployment uses `Dockerfile.vercel`, `Caddyfile`, and `vercel.json` in this directory. The container expects runtime environment variables for the application key, external MySQL database, CORS/frontend URLs, and Vercel Blob.
