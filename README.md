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

The shared pages use `js/auth.js` for the active Supabase session and access
token; no local-only login state is trusted.

## Phase 2 authentication

Authentication uses Supabase Auth. `js/auth.js` restores the Supabase session,
listens for expiry/logout changes, and sends the access token to the Express
API. Passwords are never written to `profiles`; roles are stored in `profiles`
with the Auth user UUID as the primary key. Normal registration supports only
`student`, `landlord`, and `agent`. Admin is assigned only by a trusted operator.

Set `CAMPUSNEST_SUPABASE_URL` and `CAMPUSNEST_SUPABASE_ANON_KEY` in the browser
configuration (`js/supabase-config.js`). Set `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in the server environment. Never expose the service
role key to the browser. Run the additive `schema.sql` migration in Supabase.

In Supabase Authentication > URL Configuration, add the deployed site URL and
`https://your-site.example/password-reset.html` as a redirect URL. Enable email
provider authentication. The reset screen requests a Supabase recovery email;
the link returns to `password-reset.html`, where the new password is saved.

To create the first admin, create a user in Supabase Authentication, then run
this in the SQL editor using that user's UUID (never accept this from the app):

```sql
insert into profiles (id, name, email, role)
values ('AUTH_USER_UUID', 'CampusNest Admin', 'admin@example.com', 'admin');
```

The Express middleware validates every bearer token with Supabase and loads the
matching profile before applying `requireStudent`, `requireLandlord`,
`requireAgent`, or `requireAdmin`. Profile routes always use the authenticated
user's UUID, and role updates are blocked by the database trigger.

## Phase 3 property listings and images

Landlords and agents use their protected dashboard to create, edit, view, and
delete their own listings. Server validation controls property fields and
ownership; new and edited listings are always returned to `pending`. Public
property routes return approved listings only. Students and visitors cannot
create or modify properties.

Run the Phase 3 additions in `schema.sql`. They add the property fields and
`property_images` metadata table, ownership indexes, RLS policies, and a public
Supabase Storage bucket named `property-images`. The bucket is public for
approved image URLs, while uploads/deletes require a path beginning with the
authenticated user's UUID. The application uploads files under
`user-id/property-id/` and never uses the service-role key in the browser.

The dashboard accepts JPG, PNG, and WebP files up to 5 MB each, previews them,
uploads multiple files in order, and supports deleting existing images. Set the
bucket to public (or replace public URLs with signed URLs in the API) and ensure
the Storage policies from `schema.sql` are applied.

Test with `npm start`: register and log in one account for each normal role,
load/update `/api/users/profile`, log out, request a reset email, and verify
that no token gets returned by the API. Also verify that no token returns 401,
student access to admin routes returns 403, and profile updates containing
`role: "admin"` do not change the role.

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
