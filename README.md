# Indonesia Wristwatch Museum

Digital museum — public website (Fase 1–6) plus an admin CMS (Fase 7–10).
Reference documents live in `Brief/`; photography lives in `Aset/`.

## Getting started

```bash
npm run dev
```

The site runs at http://localhost:3000. `/` currently renders the Fase 1
design-system reference sheet; the real Homepage replaces it in Fase 3.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 — CSS-first theme, no `tailwind.config.ts` |
| Animation | Framer Motion |
| Shader | `@paper-design/shaders-react` (LiquidMetal CTA) |
| Icons | Lucide React |
| Fonts | Newsreader + Geist via `next/font/google` |

## The database

PostgreSQL 17 runs in Docker as the container `iwm-db`. Docker Desktop is
installed at `/Applications/Docker.app`; the `docker` command is a symlink into
it, so the CLI works only while the app is running.

```bash
open -a Docker && docker start iwm-db
```

That is the whole daily routine. The container keeps its data between restarts.

If it ever needs recreating from scratch:

```bash
docker run --name iwm-db -e POSTGRES_USER=iwm -e POSTGRES_PASSWORD=iwm -e POSTGRES_DB=iwm -p 5432:5432 -d postgres:17
```

Then `npm run db:migrate && npm run db:seed`.

| Script | Does |
|---|---|
| `npm run db:migrate` | apply schema changes |
| `npm run db:seed` | load the fixtures, idempotent |
| `npm run db:studio` | browse the data in a GUI |
| `npm run db:reset` | drop everything and re-migrate |
| `npm run db:generate` | regenerate the client after a schema edit |

### Switching to Supabase

The project is `vldpimlvjxgmwpmikuci` in `ap-northeast-1`. It needs **two**
connection strings, because the two poolers do different jobs:

| Port | Mode | Used by |
|---|---|---|
| 6543 | transaction | the app (`DATABASE_URL`) |
| 5432 | session | migrations and the seed (`DIRECT_URL`) |

Port 6543 hands out a different backend per statement, so it cannot run a
migration: the advisory lock Prisma holds for the length of a migration would
be dropped straight away. `prisma.config.ts` and `prisma/seed.ts` therefore
read `DIRECT_URL`, falling back to `DATABASE_URL` when it is unset, which is
why a local Postgres needs only one line.

Both URLs are pre-filled in `.env`, commented out, with `<PASSWORD>` to
replace. Uncomment them, comment out the local `DATABASE_URL`, then
`npm run db:migrate && npm run db:seed`.

Direct connections (`db.<ref>.supabase.co:5432`) are not available on this
project; that hostname does not resolve. Pooler only.

The seed prints a generated admin password once, on first run only. Override it
with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

`.env` holds `DATABASE_URL` and `ADMIN_API_KEY` and is gitignored. `.env.example`
documents both.

### Prisma 7, not the PRD's schema block

The PRD's schema (section 8) puts `url = env("DATABASE_URL")` in the
datasource. Prisma 7 removed that: the CLI reads the connection string from
`prisma.config.ts`, and the runtime client gets it through the `pg` driver
adapter in `lib/db.ts`. The models themselves are copied from the PRD
unchanged, with one addition, `Article.coverImageAlt`, so cover alt text
survives the move off the fixtures.

The generated client lands in `src/generated/prisma` (gitignored) rather than
`node_modules`, which is also a Prisma 7 default.

## How pages read data

Pages call `lib/queries.ts`, which talks to Prisma directly. They do **not**
fetch the app's own `/api` routes.

A server component fetching its own API endpoint pays a second network round
trip, cannot be statically prerendered, and turns one query into two hops for
nothing. The API routes exist for callers that are genuinely remote: the admin
dashboard in Fase 9, and anything outside this process.

`lib/queries.ts` is also the only module that knows whether a database exists.
While `DATABASE_URL` is unset it serves `lib/fixtures.ts` and logs a warning at
startup. Once the database is live, delete the `if (!db)` branches and the
fixtures import; no signature changes.

`lib/fixtures.ts` (the old `lib/data.ts`) now has two jobs: the seed source,
and that fallback. Pages must not import it directly.

## API

Every endpoint answers `{ success, data?, error?, issues? }`.

| Route | Methods |
|---|---|
| `/api/collection` | GET (list, filter, search), POST |
| `/api/collection/[id]` | GET, PUT, DELETE |
| `/api/journal` | GET (list, filter), POST |
| `/api/journal/[id]` | GET, PUT, DELETE |
| `/api/media` | GET, POST (multipart upload) |
| `/api/media/[id]` | DELETE |
| `/api/pages` | GET (`?page=home`), PUT (upsert one or a batch) |
| `/api/settings` | GET, PUT |

`[id]` accepts a cuid or a slug, so the dashboard can use ids and a person can
use the slug from the URL.

Status codes: 400 malformed JSON, 401 bad key, 404 missing, 405 wrong method,
409 conflict, 413 too large, 415 wrong type, 422 validation failure with
per-field `issues`, 503 database or write access not configured. Unexpected
faults return a bare 500 and log the detail rather than returning it, so a
stack trace or a Postgres error never reaches an HTTP body.

### Everything behind /admin and /api needs a session

`src/middleware.ts` gates both. A browser navigation gets `302 /login?next=…`;
an API call gets `401` in the same JSON envelope as every other endpoint, so a
fetch never has to parse an HTML login page to learn it was signed out.

**The auth config is split in two, and it has to be.** `lib/auth.config.ts` is
the Edge-safe half: cookie names, session strategy, the jwt/session callbacks,
and no providers. `lib/auth.ts` adds the credentials provider, which pulls in
bcrypt and Prisma. Middleware is bundled for Edge, so importing `lib/auth`
there fails at module load with `Native module not found: node:util/types`.
Middleware only verifies an existing JWT, which needs the secret and Web
Crypto and nothing else.

Sessions are JWTs in an httpOnly cookie, 24h. The credentials provider cannot
use database sessions, which is why the schema's `Session` model stays empty;
it is kept for an OAuth provider later.

### Roles

One matrix in `lib/rbac.ts`, consulted by both the API and the admin UI so a
permission cannot drift between where it is enforced and where it is shown.

| | collection | journal | media | pages | settings | users | audit |
|---|---|---|---|---|---|---|---|
| SUPER_ADMIN | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | read |
| ADMIN | CRUD | CRUD | CRUD | CRUD | — | — | read |
| EDITOR | CRU | CRU | CR | read | — | — | — |

`guard(request, resource)` does session, then permission, then rate limit, in
that order: throttling before authorising would let an anonymous caller burn
another user's budget.

### Rate limits

From PRD section 9, in `lib/rate-limit.ts`: login 5 per 15 min per IP, API 100
per min per user, upload 20 per min per user. A 429 carries `Retry-After` and
`X-RateLimit-*`.

Counters live in process memory. That is fine for one server and **wrong for
more than one**: each process keeps its own counters, so N instances allow N
times the limit, and serverless resets them on cold start. Swapping in Redis
means replacing the body of `hit()` and nothing else.

The login limiter counts before the password is checked, so wrong guesses
cannot buy attempts, and an unknown email is compared against a dummy bcrypt
hash at the same cost so response time does not reveal which addresses exist.

### CSRF

NextAuth's built-in token covers its own endpoints. It does not cover ours, and
a cookie-authenticated POST from another origin would otherwise work, so
`guard()` refuses any mutation whose `Sec-Fetch-Site` is cross-site, falling
back to comparing `Origin` against `Host` for clients that do not send it.

### Audit trail

`lib/audit.ts` writes a row for every create, update and delete: who, what,
which record, what changed, IP, user agent. Update records carry only the
fields that actually changed.

Writing the log never fails the operation it describes. A failed insert is
logged and swallowed, because rolling back a successful edit because the audit
table was unreachable would be a denial of service on the whole CMS. Keys that
look like passwords or tokens are redacted, and long strings truncated, so
article bodies do not fill the table.

Uploads are validated on sniffed MIME typeUploads are validated on sniffed MIME type, capped at 10MB and 8000px a side,
and stored under a generated UUID filename. A client-supplied filename is never
used as a path.

Every upload is re-encoded through sharp rather than written as received. That
proves the file really is the image its MIME type claims, drops EXIF (which
carries GPS coordinates and camera serials), and yields the dimensions for the
Media record.

### XSS

React escapes by default and `ArticleBody` parses a fixed block syntax into
real elements rather than using `dangerouslySetInnerHTML`, so no user content
reaches the DOM as markup. DOMPurify is therefore not needed; if a rich-text
editor is ever added that emits HTML, it becomes necessary and the CSP's
`unsafe-inline` on scripts should go at the same time.

## Design system

Everything lives in [`src/styles/globals.css`](src/styles/globals.css) inside a
single `@theme static` block. Tailwind's default palette and breakpoints are
cleared on purpose, so only the museum's own tokens exist and an off-palette
colour cannot slip into a component by accident.

**Colour** — `cool-white` `pure-white` `soft-grey` `graphite` `slate` `navy`
`navy-dark` `border-grey`. Target ratio: 70–80% cool/pure white, 10–15% soft
grey, 5–10% graphite/slate, no more than 5% navy. Navy is an accent; it is never
a canvas. There is **no dark mode**.

**Type** — `font-display` (Newsreader) carries storytelling and heritage;
`font-sans` (Geist) carries information and precision. Sizes ship with their own
line-height and tracking: `text-display` `text-h1` `text-h2` `text-h3`
`text-body` `text-small` `text-caption` `text-label`.

**Spacing** — 8px grid on Tailwind's default step (`p-1`=4px … `p-48`=192px),
plus semantic section tokens: `section-sm` 64, `section` 96, `section-lg` 128,
`section-xl` 192, and gutters `gutter` 20 / `gutter-md` 40 / `gutter-lg` 64.

**Breakpoints** — `xs` 375, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1440.

**Utilities** — `shell` (max width + gutters), `gutter`, `measure` (~70ch),
`eyebrow` (the small uppercase section label), `section-y`, and
`duration-fast|base|slow`.

**Motion** — tokens in [`src/lib/motion.ts`](src/lib/motion.ts) mirror the CSS
`--duration-*` and `--ease-*` values so Framer Motion and CSS share one rhythm.
`prefers-reduced-motion` is honoured globally in `globals.css`; any *continuous*
animation (hero carousel, image trail) must also check the preference in JS and
stop, because a CSS duration override does not halt a rAF loop.

### Two things to keep in mind

- **Slate on soft-grey measures 4.27:1** — under the 4.5:1 AA threshold for
  normal text. Inside a soft-grey band, set secondary text in `graphite` rather
  than `slate`, or size it 18.66px+. Every other pairing clears AA comfortably.
- **`text-display` is pinned to 48px below a 960px viewport.** That is what
  `clamp(3rem, 5vw, 5rem)` does; the fluid range only opens up between 960px and
  1600px. Intentional, but worth knowing when checking mobile.

## Core components (Fase 2)

All in `src/components/public/`, all `"use client"`. Ported from PRD section 4
with the hard-coded hexes swapped for palette tokens — same colours, one place
to change them.

| Component | Used on | Notes |
|---|---|---|
| `CylinderCarousel` | Homepage hero | 3D cylinder, continuous rotation |
| `PerspectiveGrid` | Behind the hero | 1,600 tiles, client-only, `aria-hidden` |
| `LiquidMetalButton` | Primary CTAs | WebGL shader border, three sizes |
| `PerspectiveCarousel` | Featured Timepieces | Arrow keys; only the active slide is a tab stop |
| `PixelatedImageTrail` | Collection CTA background | Pointer trail from `/trail-images/` |
| `CollectionGrid` | `/collection` | Hover/focus reveals reference and year |
| `Header` + `SpotlightNavbar` | Site-wide | See below |
| `GooeySearch` | Header, collection page | SVG gooey morph; falls back flat on Safari |
| `Footer` | Site-wide | Nav, social, copyright |

`Header` takes `transparentOnTop` for hero-led pages (transparent until 24px of
scroll, then solid), reads the active route from `usePathname` so
`/collection/[slug]` still lights up Collection, and collapses to a full-screen
panel below 1024px. `NAV_ITEMS` is exported from it and reused by `Footer`.

`/components-preview` renders all nine with placeholder data. It is a Fase 2
scaffold — delete it once the real pages exist.

### Reduced motion

`globals.css` handles CSS transitions globally, but three components drive
motion from JavaScript and had to opt in themselves: `CylinderCarousel` and
`LiquidMetalButton` read `useReducedMotion()`, and `PixelatedImageTrail` checks
`matchMedia` and never starts its rAF loop. Any new continuous animation needs
the same treatment — a CSS override cannot stop a rAF loop or a WebGL shader.

## Project layout

```
src/
├── app/
│   ├── (public)/          # Public website — home, collection, journal, about
│   └── layout.tsx         # Root layout: fonts, metadata, viewport
├── components/
│   ├── public/            # Museum components (Fase 2)
│   └── ui/                # Shared primitives
├── lib/
│   ├── utils.ts           # cn() — clsx + tailwind-merge, IWM theme registered
│   ├── fonts.ts           # Newsreader + Geist
│   └── motion.ts          # Duration, easing, reveal variants
├── hooks/
├── types/                 # Timepiece, JournalArticle, ArchiveItem
└── styles/globals.css     # The design system
```

## Pages (Fase 3)

`src/app/(public)/layout.tsx` provides the shell: skip link, `Header`, `main`,
`Footer`. Pages do not render their own chrome.

The homepage is `src/app/(public)/page.tsx`, a server component. Its five
sections are hero, About the Museum, The Collection with three statistics,
Featured Timepieces, and the Collection CTA. All copy comes from
`pageContent.home` in `src/lib/data.ts` so the CMS can edit it later without
touching components.

`Reveal` (`src/components/ui/Reveal.tsx`) handles the scroll-in fade. It fires
once per section and renders a plain element under `prefers-reduced-motion`.

**Clearing the fixed header** is automatic. `globals.css` gives
`main:not(:has(#hero))` a top padding equal to the header height, so any page
without a full-bleed hero starts below the bar without doing anything. A
hero-led page is exempt because its hero is meant to sit *behind* the
transparent bar. Do not add a manual `pt-header` on top of this, or the page
will be padded twice.

**Header transparency** is driven by the hero, not a pixel offset. Put
`id={HERO_SENTINEL_ID}` on a full-bleed hero and the bar stays transparent until
that element clears the header, via IntersectionObserver. Pages without a hero
fall back to a 24px scroll threshold automatically.

## Collection pages (Fase 4)

`/collection` is a server component whose header and metadata come from
`pageContent.collection`. The interactive part is `CollectionBrowser`, wrapped
in Suspense because it reads `useSearchParams`.

**Filtering** is two-level, matching the brief's tab list. The top row picks a
dimension (All / Brand / Era / Type) and a second row appears with that
dimension's values, derived from the data rather than hard-coded. Selecting a
dimension clears the others, so a filter can never be left active behind a
collapsed row. All state lives in the URL (`?q=`, `?brand=`, `?era=`, `?type=`),
so a filtered view is linkable, survives the back button, and catches the
header search box's `?q=` fallback. Helpers live in `lib/data.ts`:
`filterTimepieces`, `eraOf`, and the derived `brands` / `eras` / `types`.

`/collection/[slug]` prerenders all twelve entries via `generateStaticParams`.
The gallery's lightbox is a native `<dialog>` opened with `showModal()`, which
brings a real focus trap and Escape handling instead of a hand-rolled one.
Prev/next wraps at both ends.

## Journal pages (Fase 5)

`/journal` is one server component with five sections: hero, featured article,
stories list, From the Archive (2x2), and the closing CTA. All copy lives in
`pageContent.journal`; the featured piece and the story list come from
`featuredArticle` and `storyArticles` in `lib/data.ts`, derived from the
`featured` flag rather than hard-coded.

`/journal/[slug]` prerenders all four articles. Related articles rotate from
the current one and wrap, so every article always has three.

## About page (Fase 6)

`/about` is one long scrollable page built from `src/content/about.ts`. Each of
the six sections is a data object (number, title, headline, paragraphs, image,
optional further-reading link), so the page component holds layout and nothing
else.

Text and photograph swap sides on every other section, which gives the page a
rhythm rather than a single column of images down one edge. Section padding is
64px on mobile and 128px from `lg` up, inside the design system's 128-192px
band for major sections.

`AboutToc` is the sticky table of contents, desktop only. It tracks the active
section with an IntersectionObserver whose `rootMargin` puts the observation
line just below the fixed header, so the highlight moves when a section reaches
the top of the reading area rather than when it first appears. Every section
carries `scroll-mt-header` so anchor jumps clear the fixed bar.

Where a section covers ground a journal article covers in depth (The Beginning,
Preservation, Vision), it stays at the level of principle and links to the
article instead of repeating it.

### Article bodies are not HTML

The four full articles (roughly 870-950 words each) live in
`src/content/journal.ts`, kept out of `lib/data.ts` because they are the fields
most likely to become a rich-text column in Fase 7.

They use a deliberately tiny block syntax parsed by `ArticleBody`: `## ` for a
section heading, `> ` for a pulled quote, blank lines between paragraphs.

This is **not** `dangerouslySetInnerHTML`, and that is the point. Once article
bodies come from the CMS they are user input, and rendering them as raw HTML
would hand any editor an XSS vector on the public site. `ArticleBody` parses a
fixed set of blocks into real React elements, so nothing in the string can
become markup. If richer formatting is needed later, extend the parser rather
than opening an HTML passthrough.

### CollectionGrid was rewritten

The Fase 2 version was the PRD's TeamRevealGrid port: two columns on mobile,
with the active cell growing taller than its neighbours. That reads oddly across
twelve items (rows come out uneven), and the brief asks for something simpler:
one large photograph, minimal metadata, 3/2/1 columns. Cells are now uniform,
every cell is a real `<Link>`, and hover does an image zoom plus a "View" bar.
The nested `overflow-y-auto` scroll container is gone.

### Content is placeholder

Nine of the twelve entries were read straight off the dial and are reliable.
Three are not: `tudor-submariner-snowflake-9411`, `cartier-tank-louis-78086`
and `heuer-autavia-2446` come from photographs with no legible branding, so
their brand, model, reference and year are informed guesses. Movement, case
size and material are unverified throughout. There is a warning at the top of
`data.ts` naming the three.

## Note on location

The project lives on `/Volumes/Careta`, an APFS volume on the internal SSD.

It was previously on an exFAT external drive, where three things broke: the
Turbopack cache corrupted on every second build, `fs.access()` returned EPERM
for every path so `next build` refused to start, and macOS `._` AppleDouble
sidecars poisoned the `next/image` cache so the optimizer served 4KB sidecars
instead of images. All three are gone. If the project is ever moved back to a
non-APFS volume, expect them to return.
