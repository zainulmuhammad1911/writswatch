/**
 * Content Security Policy, in two strengths.
 *
 * The two exist because a nonce and a prerendered page cannot both be had. A
 * nonce has to be unique per response, so a page that carries one is rendered
 * per request by definition — Next says as much: pages using a nonce cannot be
 * statically generated. Putting one on the public site would throw away the
 * ISR work in Fase 10 and hand back `Cache-Control: private` on every route.
 *
 * So the strict policy goes where it actually buys something and costs
 * nothing. `/admin`, `/login` and `/api` are already rendered per request, and
 * they are the surface where an injected script would matter: a session that
 * can write to the database and read the audit trail. Those get nonces and
 * `strict-dynamic`, which means an inline script the browser did not see a
 * nonce on does not run, full stop.
 *
 * The public pages keep `'unsafe-inline'` for scripts, which is a real
 * limitation and worth naming rather than glossing: it is what lets Next's
 * prerendered bootstrap run. What makes it a defensible trade here is that
 * those pages have no HTML injection path at all. Nothing on them is rendered
 * from user input, the journal bodies go through a block parser that emits
 * React elements rather than markup (`ArticleBody`), and the one place that
 * does use `dangerouslySetInnerHTML` is the JSON-LD, which is serialised
 * through `JSON.stringify` with `<` escaped.
 *
 * `'unsafe-eval'` is gone from both in production. It is needed only by the
 * dev overlay and React Refresh, so it is added back when NODE_ENV is not
 * production, along with the websocket HMR talks over.
 */

const DEV = process.env.NODE_ENV !== "production";

/** Directives both policies share. */
function common(): string[] {
  return [
    "default-src 'self'",
    // data: for the inline SVG masks, blob: for the sharp-processed previews
    // in the media library.
    "img-src 'self' data: blob:",
    // next/font self-hosts every face it uses, so no font CDN is needed at
    // runtime. The share-image route fetches Newsreader from Google, but that
    // happens on the server at build time and CSP does not govern it.
    "font-src 'self'",
    // Inline styles are unavoidable: Framer Motion animates through the style
    // attribute, and the carousels compute transforms per card. Style
    // injection cannot execute script, which is what makes this the one
    // 'unsafe-inline' worth keeping.
    "style-src 'self' 'unsafe-inline'",
    DEV ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    // Belt to X-Frame-Options' braces, and the one browsers still honour.
    "frame-ancestors 'none'",
    "form-action 'self'",
    "frame-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
  ];
}

/** For the prerendered public pages. No nonce, so they stay cacheable. */
export function publicCsp(): string {
  return [
    ...common(),
    DEV
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
  ].join("; ");
}

/**
 * For the dashboard, the login page and the API.
 *
 * `strict-dynamic` tells the browser to ignore `'self'` and any host list in
 * `script-src` and trust only what carries the nonce, plus scripts those
 * scripts create themselves. That last part is what lets Next's bootstrap
 * pull in its own chunks.
 */
export function strictCsp(nonce: string): string {
  return [
    ...common(),
    DEV
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  ].join("; ");
}

/** 16 random bytes, base64. Regenerated for every response that needs one. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * The headers from PRD section 9, minus the CSP.
 *
 * Applied to every response rather than just the admin, because the public
 * pages are the ones an attacker can reach without credentials. The CSP is
 * attached separately: `next.config.ts` puts the public policy on the public
 * routes, and the middleware puts the strict one on everything it matches.
 */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Retired by modern browsers in favour of CSP, and actively harmful in some
  // old ones. Kept because the PRD lists it; CSP is what actually protects.
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];
