# AGENTS.md

## Cursor Cloud specific instructions

### Tech Stack
- **Backend:** Laravel 12, PHP 8.4, SQLite (default DB, cache, queue, session)
- **Frontend:** Vue 3 + Inertia.js v2, TypeScript, Tailwind CSS 4, Vite 7
- **Testing:** PHPUnit 11

### System Dependencies (pre-installed in VM snapshot)
- PHP 8.4 (via `ppa:ondrej/php`) with extensions: mbstring, xml, sqlite3, curl, zip, bcmath, intl, dom, fileinfo
- Composer 2.x at `/usr/local/bin/composer`
- Node.js 22 (via nvm)
- SQLite3

### Running the Application
- **Full dev environment:** `composer dev` (starts Laravel server on :8000, queue worker, log viewer, and Vite HMR concurrently via `npx concurrently`)
- **Laravel server only:** `php artisan serve`
- **Vite dev server only:** `npm run dev`
- The app uses SQLite — no external database server needed. The file is at `database/database.sqlite`.

### First-time Setup (after fresh clone)
If `.env` does not exist: `cp .env.example .env && php artisan key:generate`
If `database/database.sqlite` does not exist: `touch database/database.sqlite && php artisan migrate --force`

### Lint
- **PHP:** `vendor/bin/pint --test` (or `vendor/bin/pint` to auto-fix)
- **JS/Vue/TS:** `npx eslint .` (or `npm run lint` to auto-fix)
- **Formatting:** `npm run format:check` (or `npm run format` to auto-fix)

### Tests
- `php artisan test` (PHPUnit)
- Feature tests require `public/build/manifest.json` — run `npm run build` first if it's missing.

### Build
- `npm run build` — production build (writes to `public/build/`)

### Gotchas
- The `composer dev` script uses `npx concurrently` to run 4 processes. If one fails, `--kill-others` stops them all.
- The feature test (`ExampleTest`) hits `/` and expects a 200 response, which requires a Vite manifest. Always `npm run build` before running `php artisan test`.
- The repo has pre-existing ESLint and Pint style issues — these are not regressions.
