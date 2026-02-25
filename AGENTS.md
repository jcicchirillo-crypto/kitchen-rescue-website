## Cursor Cloud specific instructions

### Project overview

Kitchen Rescue is a commercial kitchen pod rental booking system. It consists of:

- **Express API** (`api/server.js`): Node.js backend serving the marketing site, booking flow, and admin API. Run with `npm run dev` (uses nodemon for hot-reload). Port 3000.
- **Marketing site** (`public/`): Vanilla HTML/CSS/JS pages served statically by Express.
- **Admin dashboard** (`admin/`): React 18 + Vite + Tailwind SPA. Must be built (`cd admin && npm run build`) before it can be served at `/admin/`. The build output goes to `admin/build/`.

### Running the dev server

```
npm run dev
```

This starts nodemon on `api/server.js`. The server gracefully degrades when external service credentials are missing (Supabase, Stripe, email, QuickBooks, OpenAI, Pexels). Without Supabase, it falls back to file-based storage (`bookings.json`). Without Stripe, payments are simulated.

### Key URLs (dev)

- Main site: http://localhost:3000
- Availability checker: http://localhost:3000/availability.html
- Booking flow: http://localhost:3000/booking-checklist.html
- Admin dashboard: http://localhost:3000/admin/

### Lint / Test

No ESLint, Prettier, or test frameworks are configured. There are no automated tests.

### Admin dashboard rebuild

If you modify files under `admin/src/`, rebuild with:

```
cd admin && npm install && npm run build
```

The Express server serves the pre-built `admin/build/` directory; there is no Vite dev server integration.

### Gotchas

- The project specifies `engines.node: "20.x"` in `package.json`, but works fine on Node 22.
- `api/server.js` is a single large file (~2500 lines). Changes require nodemon restart (automatic).
- The admin build output directory is `admin/build/`, not `admin/dist/` (configured via `vite.config.js`).
