# CampusNest Frontend

A complete, polished frontend for CampusNest — verified student housing for
DELSU Abraka and FUPRE. Vanilla HTML/CSS/JS (no build step), designed to sit
in front of your existing Express + Supabase backend and `schema.sql`.

## What's included

| Page | Purpose |
|---|---|
| `index.html` | Landing page — hero, trust features, featured listings, campus explorer |
| `browse.html` | Search + filter sidebar, property grid |
| `property.html` | Full listing detail, gallery, agent contact form |
| `login.html` / `register.html` | Auth, with student vs. agent/landlord role toggle |
| `dashboard-student.html` | Saved favorites |
| `dashboard-landlord.html` | Manage listings, add-property form |
| `dashboard-admin.html` | Approval queue (verify/reject pending listings) |

Shared code lives in `css/styles.css` and `js/*.js`.

## Design system

- **Colors:** navy `#1E3A8A` (trust/primary), emerald `#10B981` (verified),
  marigold gold `#F0A202` (accent), on a cool paper background.
- **Type:** Fraunces (display/headlines), Inter (UI/body), IBM Plex Mono
  (prices, stats, badges) — loaded from Google Fonts in `styles.css`.
- **Signature element:** the rotated circular "Verified" stamp (`.stamp` in
  CSS) — used on the hero photo and every verified listing, since
  verification is the core trust promise of the product.

All tokens (colors, spacing, radius, shadows) are CSS custom properties at
the top of `css/styles.css` — change them once, they apply everywhere.

## Wiring to your real backend

The frontend calls a small set of endpoints defined in **`js/api.js`**
(`ENDPOINTS` object at the top). Right now they point at:

```
GET  /api/properties          (filters as query params: campus, property_type, minPrice, maxPrice, q)
GET  /api/properties/:id
GET  /api/properties/mine     (landlord's own listings — you may need to add this route)
POST /api/favorites/:id       (toggle)
GET  /api/favorites
POST /api/users/login
POST /api/users/register
GET  /api/admin/properties?status=pending
PATCH /api/admin/properties/:id   (body: { approval_status })
```

**Adjust the paths in `ENDPOINTS` to match your actual `backend/routes/*.js`
files** — I built this from screenshots of your schema and route files, so a
couple of field/route names are my best guess (e.g. whether "campus" is a
real column or something you derive from location text).

Every API call in `api.js` fails **gracefully**: if a request errors or
returns nothing (e.g. before you've seeded listings, or before a route is
finished), the UI falls back to realistic sample data instead of showing a
broken or empty page. Once your backend returns real data, the fallback
stops being used automatically — nothing to switch off by hand.

Auth is stubbed in `js/auth.js` (`localStorage`-based session). If you're
using Supabase Auth directly from the client, swap the internals of
`Auth.login()` / `Auth.getToken()` for a Supabase session — the rest of the
pages just call `Auth.isLoggedIn()`, `Auth.getToken()`, `Auth.getRole()`, so
nothing else needs to change.

## Data shape expected per property

```js
{
  id, title, price, property_type, bedrooms,
  campus, area, amenities: string[],
  verification_status: 'verified' | 'pending' | 'rejected',
  images: string[],
  owner_name
}
```

Match this in your API responses (or adjust `js/property-card.js` /
`js/property-detail.js`) and everything renders correctly.

## Running it

Drop these files where your Express server serves static assets (it already
does — `app.use(express.static(...))` in `server.js`), or open `index.html`
directly for a quick look. No build step, no npm install needed for the
frontend itself.
