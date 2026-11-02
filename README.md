# nivguler-accessibe.github.io

Personal website hosted on GitHub Pages.

## Website

Visit the live site at: [https://nivguler-accessibe.github.io](https://nivguler-accessibe.github.io)

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. Any push to the `main` branch will trigger a new deployment.

## Structure

- `index.html` - Home page
- `about.html` - About page
- `contact.html` - Contact page
- `styles.css` - Stylesheet

## Stable Selectors Lab (`/stable/`)

Test pages for accessFlow's stable selectors. On every load, `stable/lab.js` rewrites generated tokens: CSS-module,
Next.js, styled-components and Emotion classes, state classes, React/Radix/Headless UI/Shopify/Ember/MUI ids, Vue
`data-v-*`, Angular `_nghost`/`_ngcontent`, random `data-*` values and extra wrapper `<div>`s. Stable hooks (`id`,
`data-testid`, `data-test-id`, `data-test`, `data-qa`, `data-cy`, plus the unrecognized `test-id` and
`data-automation-id`) never change. Every page is also full of accessibility issues on purpose.

All values come from a seed, so any load can be replayed. The seed is shown in the badge at the bottom right and in
`window.LAB`.

### Controls

- **Scanner:** edit `stable/config.js` and push. The pages load it with a cache-buster, so the next scan after the
  deploy sees it. Per page: `seed` (`null` = new on every load), `seedMode` (`'time:15'` = one seed per 15 minutes, so
  desktop and mobile agree), `off` (freeze categories: `hash`, `state`, `ids`, `attrs`, `vue`, `angular`, `wrap`),
  `presets`, and page-specific options below.
- **Browser:** `?seed=abc`, `?off=hash,ids`, `?churn=0` (freeze all), `?swap=1`, `?count=500`, `?device=both`,
  `?presets=0`, `?badge=0`.

With the default `seedMode: 'load'`, desktop and mobile get different values, so nothing is a "cross" finding.

### Pages and expected stable values

Checked against a port of the v1 builder (`stable-selector.ts`) over several seeds; the legacy selector of every
failing element changes between seeds, and the stable values below don't.

| Page | What it covers | Stable values |
|---|---|---|
| `single.html` | One failing element per strategy. Use it for the dismiss test | `[data-testid="cart-button"]`, `#newsletter a`, `input` (in the only form), `h2`, `[data-qa="promo"] button`, `aside button` (`test-id` is ignored), `#site-footer a` (legacy uses a random `data-*`), `p` |
| `shop.html` | Uniqueness and anchoring | A: `[data-testid="product-card-1042"] button` / `a`. B: `#deal-1 button`. C: identical cards, no anchor → null. D: two components told apart only by hashes → null. E: same pair under ids → `#compare-left button`. F: duplicate `id="promo"` → null. G: duplicate `data-qa` → null. H: same legacy, different test ids → split (null) |
| `blog.html` | Vue: `data-v-*` everywhere, `data-cy` hooks | `[data-cy="like-post-7"]`, `[data-cy="header-search"]`; the post without `data-cy` → null |
| `dashboard.html` | Angular shell, Radix, Headless UI, React `useId`, Ember, MUI ids, `data-test-id` | `[data-test-id="user-menu-button"]`, `[data-test-id="orders-table"] button`, `#sales-chart button`; inputs with generated ids only → null |
| `signup.html` | Forms; Next.js, styled-components, Emotion | `[data-testid="email-input"]`, `[data-qa="phone-input"]`, `[data-test="country-select"]`, `#captcha input`; inputs with only `name` → null |
| `twins.html` | The 1:1 guard (`match_ambiguous`) | `[data-testid="twin-a"]`, `[data-testid="twin-b"]` |
| `device.html` | Device moves (baseline) | `[data-testid="device-move-button"]`, `[data-testid="device-both-button"]` |
| `sneaky.html` | Tokens the filters miss: letters-only hashes, one-digit hashes, styled-components without its `<style>` signal, `swiper-initialized`, letters-only ids and test ids | Change on every load: expect churn |
| `heavy.html` | Time budget: `count` rows × 3 failing elements (default 2500) | `#row-N button` / `input` / `a` until the budget runs out, then `time_budget` |

### Recipes

**Match after churn (steps 1 and 3).** Scan, then scan again. With the default random seed every legacy selector on
`single`, `shop`, `dashboard` and `signup` changes, so failing elements with a stable value should count as
`matched_stable` and the rest as `churned` + `created`. Set `defaults.seed` to a string for a scan with no churn at all.

**Dismissal carried over.** Dismiss an issue on `single.html` (for example the cart button), rescan; the issue keeps
its dismissal and gets a `latestLegacySelector`.

**Ambiguity (`match_ambiguous`), on `twins.html`.**
1. Scan with `twins: { seed: 'one', swap: false }`. Two audits: A (`twin-a`), B (`twin-b`).
2. Set `seed: 'two'`, scan. Both legacy selectors change → 2 × `matched_stable`. A and B now have a `latestLegacySelector`.
3. Set `swap: true` (keep `seed: 'two'`), scan. Each button keeps the other's legacy selector but takes the other's test
   id, so each entry fits one audit by `latestLegacySelector` and the other by `stableSelector` → `match_ambiguous`,
   both churn and are created again.

To reset, set `seed` to a new string and `swap: false`.

**Device move.** Scan with `device: { deviceMove: 'desktop', seedMode: 'time:15' }`, then with `deviceMove: 'both'`.

**Time budget.** Scan `heavy.html`; raise `count` if `builder_over_budget` stays 0.

**Only one category churning.** `defaults.off: ['ids', 'attrs', 'vue', 'angular', 'wrap', 'state']` leaves only hash
classes changing, and so on.
