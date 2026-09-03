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

## Deploying to Vercel

Connecting the repository to Vercel is not enough on its own. Two things fail
the build and one feature does not work on the platform at all.

### The build needs the Prisma client, which is not in the repository

`src/generated/` is gitignored, so a fresh clone has no client and the first
thing that happens is a compile error on every `@/generated/prisma` import.
Three scripts cover it:

| Script | Runs | Does |
|---|---|---|
| `postinstall` | any `npm install` | `prisma generate` |
| `build` | local builds | `prisma generate && next build` |
| `vercel-build` | Vercel only, in place of `build` | adds `prisma migrate deploy` |

Migrations sit in `vercel-build` rather than `build` on purpose. A deploy has
to bring the hosted database up to the schema it was built against; a local
build should not migrate the developer's database as a side effect.

### The build reads the database

`collection/[slug]` and `journal/[slug]` both use `generateStaticParams`, so
`next build` queries Postgres for the slugs. With the database unreachable the
build stops at `Failed to collect page data for /journal/[slug]` — which is
exactly what happens when the local Docker container is not running. The
hosted database therefore has to exist, be migrated, and **hold seeded content
before the first deploy**, or the build has nothing to read.

Run this once from your own machine, with the Supabase URLs live in `.env`:

```bash
npm run db:migrate && npm run db:seed
```

### Environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooler, port 6543, `?pgbouncer=true` |
| `DIRECT_URL` | Supabase session pooler, port 5432 |
| `AUTH_SECRET` | `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | the real origin, no trailing slash |

`NEXT_PUBLIC_SITE_URL` carries more than it looks. Every canonical URL,
`og:image`, sitemap entry and piece of structured data is built from it. Left
at localhost, the sitemap tells search engines to crawl a machine they cannot
reach.

NextAuth reads `AUTH_SECRET` from the environment on its own, which is why it
appears nowhere in the source. Without it, login fails.

### "Deployment Blocked: the commit author did not have contributing access"

Vercel matches the **email on the commit author** against the emails on your
Vercel account. On the Hobby plan a private repository accepts deployments
only from the account owner, so a commit whose author email Vercel does not
recognise is blocked before the build starts. The dialog offers "Upgrade to
Pro", which is not the actual fix.

It is easy to walk into. The commits here were originally authored as
`Zainul <zainul@Zainuls-MacBook-Air.local>` — git had no `user.email` set
either locally or globally and fell back to the machine's hostname, and no
such address exists on any Vercel account. Setting a real address does not
help by itself either: it has to be an address **added and verified** on the
Vercel account, under `vercel.com/account`.

Two things to know when fixing it:

- **Redeploy does not re-run the check.** Vercel keeps the verdict against
  that commit, so redeploying the same SHA stays blocked however many times
  you try. Push a new commit and the evaluation starts clean.
- **The block is specific to private repositories.** Making the repository
  public lifts it on Hobby, which is a genuine option here now that `Aset/`
  and `Brief/` are out of the history — what remains is the source and the
  photographs under `public/images/`, and the site already serves those
  publicly. `npx vercel --prod` is the other way out: deploying from the CLI
  involves no commit, so there is no author to check.

### Media upload does not work on Vercel

`api/media/route.ts` writes to `public/uploads` with `mkdir` and `writeFile`.
Vercel's filesystem is read-only apart from `/tmp`, and `/tmp` does not survive
the request. Uploads throw, and a file that did land would vanish.

Nothing else is affected: the public site, login, editing copy, and collection
and journal CRUD all work. Only adding a new image breaks. The fix is Vercel
Blob or Supabase Storage, and it is contained to that route and its delete
counterpart.

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

`lib/fixtures.ts` (the old `lib/data.ts`) now has three jobs: the seed source,
that fallback, and — since Fase 10 — the defaults the editable copy merges
over. Pages must not import it directly.

### Editable copy (Fase 10)

The dashboard stores copy as flat `(page, section, key)` rows, because that is
the shape a generic editor can render without knowing anything about the page.
Pages want nested objects. `lib/content.ts` is the seam: rows in, tree out,
merged over the fixtures.

Two rules about key names, because the tree is rebuilt from them:

- a dotted key nests — `body.0` becomes `body[0]`;
- a section whose keys are **all** integers becomes an array.

So a list inside a section that also has scalar keys must be namespaced
(`items.0.title`, not `0.title`). Getting this wrong is not a subtle failure:
the first version seeded the journal's archive tiles as `0.title`, the whole
`archive` section materialised as an array, and the build died on
`archive.items.map is not a function`.

Merging rather than replacing matters too. An editor who has never touched the
journal hero still gets a journal hero, and a key the seed never created must
not come back `undefined` and blank out an attribute. A row whose value is
blank counts as unset, so clearing a field in the dashboard restores the
default instead of rendering nothing.

The exception is `SiteSetting`: the social addresses, contact email and SEO
defaults have **no** fallback value. A cleared social URL has to mean "do not
show this card", and a built-in default would silently turn it into a link to
instagram.com's front page. Site name, tagline and description keep defaults,
because a page with no name in its `<title>` is not a trade worth making.

> The seeded social URLs are placeholders (`https://instagram.com/` and
> friends). Set the real handles in Settings before launch, or clear them.

### Caching and revalidation

Every page in the `(public)` group is regenerated at most once an hour
(`revalidate = 3600` in the group layout). The hour is the backstop, not the
mechanism: each write route in `/api` calls `revalidatePath` for the pages its
change can appear on (`lib/revalidate.ts`), so a published edit is live on the
next request. A rename revalidates both slugs, since the old address has a
cached page of its own.

`/collection` is the one dynamic route, because it reads `searchParams`. That
costs it CDN caching — it answers `Cache-Control: private, no-cache` where the
others answer `s-maxage=3600, stale-while-revalidate` — which is the price of
filtering in Postgres rather than in the browser. Partial prerendering
(`cacheComponents`) would give back a cacheable shell; the page is already
structured for it, since `searchParams` is awaited inside the Suspense
boundary rather than in the page.

## Admin dashboard (Fase 9)

`/admin`, behind the login. The sidebar is built on the server from the
signed-in role, so a link a role cannot use is never rendered; every page then
calls `requirePermission` again, because a hidden link is not a control.

| Page | What it does |
|---|---|
| `/admin` | totals, quick actions, ten most recent audit records |
| `/admin/collection` | table with search and status filter, inline publish/featured toggles |
| `/admin/collection/new`, `/[id]` | full form: identification, specs, words, photographs, visibility |
| `/admin/journal` | table with search and status filter |
| `/admin/journal/new`, `/[id]` | title, auto slug, category, excerpt, body, cover picker, tags, publish date |
| `/admin/pages` | PageContent rows per page, grouped by section, preview link |
| `/admin/media` | grid, drag-and-drop upload, folder filter, in-use warning on delete |
| `/admin/settings` | site details and SEO defaults; Users tab for SUPER_ADMIN |
| `/admin/audit` | full trail, filterable by action and record type |

Admin pages read Prisma directly, like the public ones. Forms and toggles go
through `/api` via `lib/api-client.ts`, which is what those routes are for.

### The editor is not a WYSIWYG, deliberately

`RichTextField` is a textarea over the same block syntax `ArticleBody` parses
(`## ` heading, `> ` quote, blank line between paragraphs), with a live
preview rendered by the real public component.

A visual editor emits HTML. Rendering editor HTML on the public site would
mean `dangerouslySetInnerHTML`, a DOMPurify dependency, and keeping
`unsafe-inline` in the CSP permanently. The trade is a slightly less familiar
editing surface for a public site with no HTML injection path at all. If a
WYSIWYG becomes a requirement, all three of those follow.

### Image ordering uses buttons, not just drag

`ImageManager` supports dragging, but the up/down/primary controls are the real
interface. Drag-and-drop alone is unreachable by keyboard and invisible to a
screen reader.

### Deactivate, not delete

Users are soft-disabled via `User.active` (added in Fase 9; not in the PRD
schema, though its dashboard spec asks for "deactivate"). An account that
authored articles or wrote audit rows cannot be hard-deleted without taking
that history with it, and the API says so rather than just refusing. Sign-in
rejects an inactive account the same way it rejects a wrong password.

Three lockouts are refused: changing your own role, deactivating your own
account, and demoting or disabling the last active super admin.

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

`src/proxy.ts` gates both. A browser navigation gets `302 /login?next=…`;
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

## SEO (Fase 10)

`lib/seo.tsx` holds it all. Two rules run through it. Descriptions come from
the record, never from a template with the record's name dropped into it,
because a result reading "Rolex Submariner — a timepiece from the collection"
tells a reader nothing the title did not. And structured data only states what
the database holds: no invented dates, no placeholder authors, no prices on
objects that are not for sale.

- **Metadata** — `pageMetadata()` gives every route a canonical path, an Open
  Graph block that agrees with it, and a Twitter card. Canonicals are paths;
  `metadataBase` makes them absolute, so the host is configured once, in
  `NEXT_PUBLIC_SITE_URL`. **Left at localhost on a deploy, the sitemap tells
  search engines to crawl a machine they cannot reach.**
- **Filtered views** — `/collection?brand=Rolex` canonicalises to
  `/collection`. It is a view of a page that is already indexed.
- **Structured data** — `Museum` on the homepage (with `@id`, which every
  other page's data points back at), `CollectionPage` + `ItemList` on the
  listing, `AboutPage`, `Blog` + `BlogPosting` on the journal, `Article` on a
  piece, `ItemPage` + `CreativeWork` on a timepiece, and `BreadcrumbList` on
  both detail routes.
- **A timepiece is a `CreativeWork`, not a `Product`** — nothing here is for
  sale, and `Product` invites the price, availability and review fields that
  would have to be either omitted or fabricated. `creator` is the
  manufacturer; `dateCreated` is emitted only when the record has a year.
- **`Museum` carries no address or opening hours** — the about page says
  plainly that there is no building, and structured data implying one would be
  a lie told to a search engine.
- **Articles are credited to the museum** — they are unsigned on the site, so
  inventing a byline would put a name in Google's index that appears nowhere
  in the writing.
- **`sitemap.xml`** is generated from the database, so a timepiece published
  this morning is listed this morning. Only published records appear, because
  a URL that 404s is how a sitemap loses a crawler's trust.
- **`robots.txt`** disallows `/admin`, `/api/` and `/login`. That is
  housekeeping, not security — `src/proxy.ts` is what protects them.
- **Share image** — `app/opengraph-image.tsx` generates the default card at
  build time. Satori cannot see the fonts `next/font` self-hosts, so
  Newsreader is fetched once per build (requesting the CSS without a
  User-Agent makes Google serve TrueType, which Satori can parse); if the
  fetch fails the card still renders in the fallback sans rather than failing
  the build.

One trap worth recording: Next merges metadata **one field at a time**. A page
returning its own `openGraph` block replaces the layout's outright, so the
first version of this shipped every page with no `og:image` at all, even
though the root layout set one. The share image is now resolved inside
`pageMetadata()`, which is the only place that cannot be forgotten.

## Loading and error states (Fase 10)

`not-found.tsx` (404) and `error.tsx` (500) share one frame,
`components/public/ErrorScreen.tsx`: a rule, a label, a display heading, one
paragraph of plain explanation, then real routes out. No illustration, and no
apology in a voice the rest of the site never uses.

- The 404 echoes the requested path, because almost every 404 is a typo or a
  stale link and seeing the address back is what tells a visitor which.
- The 500 shows `error.digest` and not `error.message`. The digest is the hash
  Next also writes to the server log, so a report is traceable; the message
  would be a stack trace on the page in development and a generic string in
  production either way.
- There are two 404s. `(public)/not-found.tsx` handles a page that called
  `notFound()`; the root `not-found.tsx` handles a URL matching no route at
  all and brings its own header and footer through `SiteChrome`, because an
  unmatched URL is the one page a visitor most needs navigation on.
- `getActiveIndex` returns -1 when no nav item matches. It used to fall back
  to Home, which marked a link `aria-current="page"` on the error page and
  told a screen reader the 404 was the homepage.
- **Icons** are both file conventions in `src/app/` and there is no `icons`
  block in `generateMetadata`. Next emits both links itself, each with a
  content hash on the URL, which is the point: stating `icons` replaced them
  with bare paths — the same field-level override that dropped `og:image` —
  and a bare `/favicon.ico` carries no hash, so a browser that cached the
  previous icon keeps serving it. `app/apple-icon.png` is 180x180, flattened
  onto cool-white because iOS composites a transparent touch icon onto black.
  Browsers still probe `/apple-touch-icon.png` on their own and get a 404;
  that request is browser-initiated and harmless.
- **`app/favicon.ico` is generated**, by `scripts/make-favicon.py` (needs
  `pip install pillow`), from `public/images/favicon-source.png` — the brand
  mark, byte for byte the same file as `Aset/LOGO/Pavicon.png`, which is why
  the tracked copy under `public/` matters now that `Aset/` is gitignored.
  Before this it was still `create-next-app`'s placeholder: a black circle
  with a white triangle, belonging to no brand at all.

  Three decisions are baked into the script. The mark sits on an opaque
  cool-white ground, not a transparent one, because `#132155` is close to
  invisible against a dark tab strip. Each of the four sizes is rendered from
  the full-resolution crop with its own fill, alpha gamma and unsharp amount,
  rather than downscaled from one large icon — a straight Lanczos reduction to
  16px turns the roof line, the dial and the two columns into one grey smudge,
  since every stroke lands on a fraction of a pixel. And the payloads are BMP,
  not PNG: Turbopack's image processor cannot read a PNG-payload ICO and fails
  the build with nothing more specific than "Processing image failed".

  16px is an impression of the mark rather than a reading of it. That is the
  limit of the canvas for artwork carrying a building, a dial and three
  columns, and browsers only reach for it on 1x displays. A legible 16px
  would need a simplified glyph drawn for that size.

### Why there is only one skeleton

`CollectionGridSkeleton` is the only one, and only `/collection` uses it, as
the fallback of the Suspense boundary around the filtered results.

A `loading.tsx` on a **prerendered** route is actively harmful, and this was
measured rather than assumed. It wraps a Suspense boundary around HTML that
was already finished, so the served document holds the skeleton in place and
the real content in a `<div hidden id="S:0">` at the end of the body, waiting
for an inline script to move it. The page's own JSON-LD ends up inside that
hidden div. Anything that does not run scripts sees a page of grey boxes and
no structured data. Four `loading.tsx` files were written and then deleted for
exactly this reason; `/collection` keeps its inner boundary because it is
genuinely dynamic, and its heading, filter bar and JSON-LD stay outside it.

The skeleton reserves the same space as the real grid, is announced once
(`role="status"`, shapes `aria-hidden`) rather than as twenty empty boxes, and
its pulse stops under `motion-reduce` while the layout stays reserved.

## `src/proxy.ts`, not `src/middleware.ts`

Next 16 renamed the file convention and deprecated the old name, which printed
a warning on every build. The contract is unchanged: same default export, same
`config.matcher`, same Edge runtime. Verified after the rename — the gate still
answers `307 /login?next=…` on `/admin/*` and `401 {"success":false}` on
`/api/*`, the CSP scoping is untouched, and a write through the gated API still
lands and audits.

`npx @next/codemod@canary middleware-to-proxy .` reports "0 modified" here. It
only renames a function literally named `middleware`, and this one is an
anonymous default export wrapped by NextAuth's `auth()`, so there is no
identifier for it to find. The rename was done by hand.

## Content Security Policy

Two policies, both built in `lib/csp.ts`.

| | Routes | `script-src` |
|---|---|---|
| Strict | `/admin`, `/login`, `/api` (via `src/proxy.ts`) | `'self' 'nonce-…' 'strict-dynamic'` |
| Public | everything else (via `next.config.ts`) | `'self' 'unsafe-inline'` |

### Why two

A nonce and a prerendered page cannot both be had. A nonce must be unique per
response, so a page carrying one is rendered per request by definition — Next
says as much: pages using a nonce cannot be statically generated. Putting one
on the public site would undo the ISR work above and return
`Cache-Control: private` on every route.

So the strict policy goes where it buys something and costs nothing. The
dashboard, the login page and the API are already rendered per request, and
they are the surface where an injected script would matter: a session that can
write to the database and read the audit trail. Under `strict-dynamic` the
browser ignores `'self'` and any host list entirely and runs only what carried
the nonce, plus what those scripts create themselves — which is how Next's
bootstrap still loads its own chunks.

The public pages keep `'unsafe-inline'` for scripts. That is a real limitation
and worth naming rather than glossing: it is what lets Next's prerendered
bootstrap run. What makes it defensible here is that those pages have no HTML
injection path at all. Nothing is rendered from user input, journal bodies go
through a block parser that emits React elements rather than markup
(`ArticleBody`), and the one `dangerouslySetInnerHTML` is the JSON-LD, which
is serialised through `JSON.stringify` with `<` escaped.

### What else changed

- **`'unsafe-eval'` is gone in production**, from both policies. Only the dev
  overlay and React Refresh need it, so it comes back when `NODE_ENV` is not
  production, along with the websocket HMR talks over.
- **The Google Fonts hosts are gone.** `next/font` self-hosts every face; the
  only thing that fetches from Google is the share-image route, on the server
  at build time, where CSP does not apply.
- **Added**: `frame-src 'none'`, `worker-src`, `manifest-src`, `media-src`.
- **`style-src` keeps `'unsafe-inline'`** and will. Framer Motion animates
  through the style attribute and the carousels compute a transform per card.
  Style injection cannot execute script, which is what makes this the one
  `'unsafe-inline'` worth keeping.

### Two traps worth recording

A response must never carry two CSP headers. Browsers enforce each policy they
are sent independently, so two policies quietly become their intersection — so
`next.config.ts` scopes the public policy to `/((?!admin|login|api/).*)`.
`/api/auth/*` therefore gets no CSP at all; its responses are JSON, where the
policy governs nothing.

The nonce has to reach the renderer, not just the browser. The proxy sets
it on the **request** headers as well as the response, and Next reads it back
out of there to stamp its own script tags. Verified: on `/login` and every
admin page, all 25–36 script tags carry a nonce, the document's nonce equals
the header's, and none are bare.

## Performance and accessibility (Fase 10)

Measured on a production build (`next build && next start`), not estimated.

### Images

| Asset | Before | After |
|---|---|---|
| Hero carousel card (×14) | 125 KB JPEG, 1400×2000 raw | 20.4 KB AVIF at 640w |
| Header/footer mark, every page | 277 KB PNG | 2.2 KB AVIF |
| Same mark on `/login` and `/admin` | 277 KB PNG served raw | 2.2 KB AVIF |
| Homepage about photograph | 110 KB JPEG | 41 KB AVIF |

The carousel was the worst of it: fourteen `<img>` tags serving 1400px
photographs into ~300px cards in the first viewport, about 1.7 MB. They now go
through `next/image` with explicit dimensions (not `fill` — a filled image
needs a positioned parent, which a 3D-transformed grid cell is not) and
`sizes`, which is what decides the encoded width.

**React 19 emits a `rel=preload` for every non-lazy image it renders on the
server.** Marking all fourteen `loading="eager"` put fourteen image fetches in
the head; the homepage had 21 image preloads. Six are `priority` now, the other
eight are lazy, and all fourteen still load — 7 preloads including the mark.

#### Which six, and why it is not the front four

The first attempt preloaded indices 0–3, which was a guess, and the guess was
wrong. Lighthouse then reported `lcp-discovery-insight` at 0: the element the
browser was measuring LCP against was `carousel/8.jpg`, and it was lazy.

So the on-screen area of every card was measured with the rotation paused at
its rest angle:

| Index | On-screen area | Was |
|---|---|---|
| 7 | 585,336 px² | lazy |
| 1 | 51,677 px² | eager |
| 13 | 51,677 px² | lazy |
| 0 | 46,905 px² | eager |
| 12 | 12,478 px² | lazy |
| 2 | 7,549 px² | eager |
| 3 | 0 px² | eager, wasted |
| everything else | 0 px² | lazy |

Index 7 sits at 180°. The card is translated toward the camera rather than away
from it, so perspective scales it into the largest box on the page — eleven
times the area of the card actually facing the viewer. `backface-visibility:
hidden` means nobody can see it. Chrome measured LCP against it anyway, which
is how an invisible photograph came to decide the homepage's LCP.

`frontFacingIndices()` in `CylinderCarousel.tsx` now returns exactly the set
with non-zero area — `{0, 1, 2, n-2, n-1, round(n/2)}` — and index 7 alone gets
`fetchPriority="high"`. Next passes that prop through to both the `<img>` and
the preload it emits, and a `rel=preload as=image` without it is queued at Low
priority, so marking all six would only have put them back in a tie.

### Lighthouse

Run against a production build (`next build && next start`), desktop preset,
Lighthouse 13.4.1:

| Category | Score |
|---|---|
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP 0.3s, LCP 0.8s, TBT 0ms, CLS 0, Speed Index 0.5s. Total 987 KB over 59
requests.

The first run scored **Performance 92, SEO 92** and had two real findings.

- `lcp-discovery-insight` scored 0 — see "Which six, and why it is not the
  front four" above. LCP was 1.8s; it is now 0.8s.
- `link-text` flagged the homepage's "MORE INFORMATION" button. That audit
  reads the **visible** text, not the accessible name, so the `aria-label`
  added for screen readers did nothing for it. The label is now "About the
  collection": it names its destination, differs from the section eyebrow
  above it, and the `aria-label` is gone, since a descriptive label is its own
  accessible name and a duplicate that does not match the visible text is
  what WCAG 2.5.3 warns about.

Both runs of the audit were done by hand and need a Chromium browser, which
this machine does not have. To repeat them:

```bash
npm run build && npm run start
```

```bash
npx -y lighthouse http://localhost:3000 --view --preset=desktop
```

What is left is four items that together move the score by nothing and are
not worth the complexity: 13 KB of render-blocking CSS (50ms, and FCP already
scores 1), 47 KB of unused JavaScript inside React and framer-motion, 14 KB of
`Array.prototype.at`-era polyfills in a framework chunk, and a
network-dependency-tree insight that scores 0 for any chain at all and carries
no weight.

### Fonts

Lighthouse does not score font weight, and fonts were the largest single
resource category on the page: **303 KB across three files, more than all 25
images.** Two of the three were Newsreader.

`next/font` splits Google fonts by `unicode-range` and preloads only the latin
faces, so the three that actually cross the wire are Newsreader normal (128.8
KB), Newsreader italic (144.5 KB) and Geist (28.6 KB).

**The italic face was preloaded on all 44 routes and rendered on 4.** Asking
for `style: ["normal", "italic"]` in one call puts both faces in every
document head; italics appear only in journal pull quotes. It is now a second
`Newsreader({ style: ["italic"], preload: false })` instance behind its own
`--font-display-italic` token, used by the `<blockquote>` in `ArticleBody` and
nowhere else. Verified: the homepage fetches 2 font files and the italic face
reports `status: "unloaded"`; the article page fetches it on demand, 144 KB,
and the quote computes to `Newsreader` italic. That is **144.5 KB off every
page except the four articles.**

One knob left, and it is a design decision rather than a fix. `axes: ["opsz"]`
on Newsreader more than doubles the file:

| | Newsreader normal, latin | italic |
|---|---|---|
| with `opsz` | 128.8 KB | 144.5 KB |
| without | 56.8 KB | 63.0 KB |

72 KB for the optical-size axis. It is not decorative — `font-optical-sizing:
auto` is on by default, so the 58px hero really is drawn with thinner hairlines
and sharper serifs than a scaled-up 16px cut would be, which is the editorial
look the brief asked for. It stays until somebody decides the trade is wrong.

### JavaScript

| Route | Initial JS (gzipped) |
|---|---|
| `/` | 257 KB |
| `/collection` | 249 KB |
| `/journal`, `/about`, detail routes | ~250 KB |

`@paper-design/shaders-react` is the only WebGL dependency and the only thing
worth splitting: a 54 KB chunk for `LiquidMetalButton`, which appears five
screens down the homepage. It is now a `next/dynamic` import gated on
`useInView`, so the chunk is not requested until the button is within 300px of
the viewport, and the ring paints flat in the shader's base colour from the
first frame — which is also what anyone without a WebGL context now sees,
instead of a bare white pill.

The remaining ~250 KB is React, the Next runtime and framer-motion, which
drives reveals, the header and both carousels.

### Scroll performance, and why it was fine on a Mac

The site loaded fast everywhere and scrolled badly on Windows. Lighthouse said
nothing about it, because the score measures loading and this is a compositing
problem: the work happens on frames the user is scrolling through, long after
the page is interactive.

Two causes, both of them free on Apple silicon and expensive elsewhere. macOS
reaches the GPU through Metal over unified memory, so a large layer costs
nothing to hand over. Chrome on Windows goes through ANGLE to Direct3D, where a
large layer is a real memory copy, and on integrated graphics the frames it
drops are the scroll frames.

**Nothing paused when it left the screen.** Both hero animations are
`infinite`, and they ran for as long as the page was open. Measured on a
1280x720 viewport:

| Animation | Element | Notes |
|---|---|---|
| `iwm-grid-drift` | 2225 x 661 = **1,470,262 px²** | `preserve-3d`, plus `scale(2)`, so it rasterises at roughly four times that, and holds 1,600 tile divs that each own a colour transition |
| `iwm-cylinder-spin` | 14 children in 3D | one of them the near-camera card measured at **585,336 px²** |

The homepage is about 5,000px tall. A reader at the footer was still paying for
both, every frame, while scrolling. `useIsOffScreen` now pauses them with
`animation-play-state`, which holds the current angle so coming back up resumes
rather than snapping to 0deg. Nobody can see a paused animation that is off
screen, so this costs nothing visually.

**The direction of that hook's default matters more than the hook.**
framer-motion's `useInView` starts `false` and turns `true` once the observer
reports — pause first, run later. That freezes the hero whenever the observer
never speaks: JavaScript disabled, a hydration failure, or the Claude Code
preview pane, which reports `visibilityState: "hidden"` and fires no
IntersectionObserver at all. The first attempt here used `useInView` and the
animations were `paused` forever in the pane, which is how the flaw surfaced.
`useIsOffScreen` reports off-screen only as a positive observation, so the CSS
default of running survives every one of those cases. Verified: in the pane,
with `IntersectionObserver` provably not firing, both animations still report
`running`.

**A viewport-wide `backdrop-filter` on the fixed header.** It carried
`backdrop-blur-md` once scrolled, with `backdrop-filter` in the transition list
as well, so the compositor re-read the strip of page behind the bar and blurred
it again on every scroll frame — and recomputed the blur repeatedly while the
transition ran. The background is 90% opaque, so the blur was only smearing the
remaining 10%. It is gone, and the transition is narrowed to
`background-color,border-color`. The nav pill keeps its own `backdrop-blur-sm`:
a few hundred pixels wide rather than viewport-wide, over a lighter 80%
background, so it earns what the bar did not.

Two smaller things went with it. `PixelatedImageTrail` transitioned `left` and
`top` for a 1.3s slide, with `will-change: left, top` — layout properties, so
layout and paint ran every frame for up to fourteen live trail elements. It
animates `transform` now, which stays on the compositor; `left`/`top` place the
element once and never change. And `PerspectiveCarousel` had a permanent
`will-change-transform` on every slide, which is the one thing `will-change`
should never be, since framer-motion promotes the element while it animates and
releases it afterwards.

`PerspectiveCarousel`'s `filter: blur(2px)` on inactive captions was left
alone. It has no autoplay, so it never runs while scrolling, and it is a small
text node — the cost is real but it is not this bug, and the focus-pull is
deliberate.

What was not verified here: that the pause engages on scroll. The preview pane
fires no IntersectionObserver, so the only way to see it is a real browser. In
DevTools on the machine that was janky:

```js
const el = [...document.querySelectorAll('*')]
  .find(e => getComputedStyle(e).animationName === 'iwm-grid-drift');
setInterval(() => console.log(Math.round(scrollY),
  getComputedStyle(el).animationPlayState), 500);
```

Scroll past the hero and it should read `paused`.

### HTML and headers

Documents are 14–21 KB gzipped. One stylesheet (12 KB gzipped), three font
preloads, `display: swap` on both faces. Static chunks answer
`max-age=31536000, immutable`; ISR pages `s-maxage=3600,
stale-while-revalidate`; no `X-Powered-By`.

### Contrast

Measured, not eyeballed:

| | cool-white | pure-white | soft-grey |
|---|---|---|---|
| graphite | 16.26 | 17.47 | 14.84 |
| slate | 4.68 | 5.03 | **4.27** |
| navy | 13.50 | 14.51 | 12.33 |

Graphite on cool-white passes AAA at any size. Slate on soft-grey is the one
pairing under AA, and the note in `globals.css` says to use graphite for
secondary text in a soft-grey band.

Non-text contrast (WCAG 1.4.11, 3:1 for anything identifying a control) is a
separate measurement, and `border-grey` fails it at 1.26:1. Dividers and card
edges stay `border-grey` — a rule between two paragraphs conveys nothing a
reader needs to perceive — but form controls now use a new
`--color-border-strong` (`#7e868d`, 3.44:1 on cool-white), and focus adds a
ring rather than only darkening the border by a pixel.

### Accessibility fixes made in this phase

- Every page: exactly one `h1`, no skipped heading levels, verified from the
  served HTML. Collection cards became `h2` (styled at h3 size) — they sit
  directly under the page `h1` with no section heading between.
- `GooeySearch` had `outline: none` on a focusable pill and its input, so
  keyboard focus was invisible. Focus rings are drawn at a 3px offset in navy,
  measured against the cool-white page behind the pill rather than the
  graphite pill itself.
- Its input is now `type="search"` with `role="combobox"`,
  `aria-controls`/`aria-expanded` wired to the results listbox. Result chips
  answer Space as well as Enter.
- Footer nav links measured 38×18 at 375px. Each is its own 44px row now; the
  pitch replaces the gap, so the column reads the same.
- `prefers-reduced-motion` is honoured by all 25 animated components. CSS
  cannot stop a `requestAnimationFrame` loop or a WebGL shader, so those use
  `useReducedMotion()` — the shader is set to speed 0, which still paints.
- No horizontal scroll at 375px: `document.documentElement.scrollWidth` is
  375, and `window.scrollX` stays 0 after `scrollTo({left: 500})`.

### What was not verified, and how to

- **Only the Chromium-based in-app browser was tested.** Firefox, Safari and
  Edge were not. The CSS in the production bundle uses `:has()`, `@property`
  (69 declarations, Tailwind v4's own, guarded by `@supports`), `color-mix()`,
  `oklab()`, `dvh`, `overflow-x: clip` and `tan()` in a transform, which puts
  the floor at roughly **Chrome/Edge 111+, Safari 16.4+, Firefox 128+** — all
  mid-2024 or earlier. `backdrop-filter` ships with its `-webkit-` prefix.
- **Motion is still unverifiable in the preview pane**, which reports
  `visibilityState: "hidden"` and so freezes `requestAnimationFrame`,
  IntersectionObserver, ResizeObserver and Suspense hydration. Carousel
  rotation, the shader, the count-up and the filter-bar pending hairline were
  reviewed in code, not watched. Filter clicks were verified by URL — every
  combination returns correctly filtered HTML — rather than by clicking, since
  the frozen pane lays interactive elements out at 0×0.

### What was verified end to end

- Insert a timepiece straight into Postgres → `/collection` reports 13,
  `?brand=Probe` reports "1 of 13"; delete it → back to 12. No rebuild.
- Change `PageContent` rows → the homepage's About headline and the About
  page's Vision headline both follow.
- Write `seo.description` in Settings → it becomes the homepage's meta
  description. Clear `social.youtube` → the card disappears and no
  youtube.com link remains.
- Force a render failure → the 500 page renders with digest `207304744`, and
  that same digest appears in the server log.

## Note on location

The project lives on `/Volumes/Careta`, an APFS volume on the internal SSD.

It was previously on an exFAT external drive, where three things broke: the
Turbopack cache corrupted on every second build, `fs.access()` returned EPERM
for every path so `next build` refused to start, and macOS `._` AppleDouble
sidecars poisoned the `next/image` cache so the optimizer served 4KB sidecars
instead of images. All three are gone. If the project is ever moved back to a
non-APFS volume, expect them to return.
