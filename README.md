# nivguler-accessibe.github.io

Personal website hosted on GitHub Pages.

## Website

Visit the live site at: [https://nivguler-accessibe.github.io](https://nivguler-accessibe.github.io)

## Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions. Any push to the `main` branch will trigger a new deployment.

## Structure

- `index.html` - Home page: the Stable Selectors Lab hub (see below)
- `about.html` - About page
- `contact.html` - Contact page
- `styles.css` - Stylesheet

## Stable Selectors Lab (site root)

Test pages for accessFlow's stable selectors, served from the root (`index.html` is the lab hub and links to
every page, since the scanner starts from the root). On every load, `lab.js` rewrites generated tokens: CSS-module,
Next.js, styled-components and Emotion classes, state classes, React/Radix/Headless UI/Shopify/Ember/MUI ids, Vue
`data-v-*`, Angular `_nghost`/`_ngcontent`, random `data-*` values and extra wrapper `<div>`s. Stable hooks (`id`,
`data-testid`, `data-test-id`, `data-test`, `data-qa`, `data-cy`, plus the unrecognized `test-id` and
`data-automation-id`) never change. Every page is also full of accessibility issues on purpose.

All values come from a seed, so any load can be replayed. The seed is shown in the badge at the bottom right and in
`window.LAB`.

### Controls

- **Scanner:** edit `config.js` and push. The pages load it with a cache-buster, so the next scan after the
  deploy sees it. Per page: `seed` (`null` = new on every load), `seedMode` (`'time:15'` = one seed per 15 minutes, so
  desktop and mobile agree), `off` (freeze categories: `hash`, `state`, `ids`, `attrs`, `vue`, `angular`, `wrap`),
  `presets`, and page-specific options below.
- **Template tokens** (`shopify.html`): `$tpl` → `template--<14 digits>` and `$group` → `sections--<14 digits>`, one value per
  page, also inside classes and `data-section*` values (`section-$tpl__main-padding`). Category `template`.
- **Browser:** `?seed=abc`, `?off=hash,ids`, `?churn=0` (freeze all), `?swap=1`, `?count=500`, `?device=both`,
  `?presets=0`, `?badge=0`.

With the default `seedMode: 'load'`, desktop and mobile get different values, so nothing is a "cross" finding.

### Pages and expected stable values

Checked against a port of the v1 builder (`stable-selector.ts`) over several seeds; the legacy selector of every
failing element changes between seeds, and the stable values below don't.

| Page | What it covers | Stable values |
|---|---|---|
| `single.html` | One failing element per strategy. Use it for the dismiss test | `[data-testid="cart-button"]`, `#newsletter a`, `input` (in the only form), `h2`, `[data-qa="promo"] button`, `aside.sidebar button` (`test-id` is ignored; the class beats a bare landmark, which a widget's second `aside` would break), `#site-footer a` (legacy uses a random `data-*`), `p` |
| `shop.html` | Uniqueness and anchoring | A: `[data-testid="product-card-1042"] button` / `a`. B: `#deal-1 button`. C: identical cards, no anchor → null. D: two components told apart only by hashes → null. E: same pair under ids → `#compare-left button`. F: duplicate `id="promo"` → null. G: duplicate `data-qa` → null. H: same legacy, different test ids → split (null) |
| `blog.html` | Vue: `data-v-*` everywhere, `data-cy` hooks | `[data-cy="like-post-7"]`, `[data-cy="header-search"]`; the post without `data-cy` → null |
| `dashboard.html` | Angular shell, Radix, Headless UI, React `useId`, Ember, MUI ids, `data-test-id` | `[data-test-id="user-menu-button"]`, `[data-test-id="orders-table"] button`, `#sales-chart button`; inputs with generated ids only → null |
| `signup.html` | Forms; Next.js, styled-components, Emotion | `[data-testid="email-input"]`, `[data-qa="phone-input"]`, `[data-test="country-select"]`, `div#captcha` (the engine reports the captcha container, not its input); inputs with only `name` → null |
| `twins.html` | The 1:1 guard (`match_ambiguous`) | `[data-testid="twin-a"]`, `[data-testid="twin-b"]` |
| `device.html` | Device moves (baseline) | `[data-testid="device-move-button"]`, `[data-testid="device-both-button"]` |
| `sneaky.html` | Tokens the filters miss: letters-only hashes, one-digit hashes, styled-components without its `<style>` signal, `swiper-initialized`, letters-only ids and test ids | Change on every load: expect churn |
| `wrappers.html` | 0–2 wrapper `<div>`s between a stable anchor (test id, id, the only `nav`, a stable class) and the failing element's parents. Case 5 (`#promo-zone`): a wrapper between two marked steps on some loads only, which flips a `>` join | A ` > ` chain from the anchor breaks; a descendant join holds |
| `carousel.html` | Carousels as their libraries leave the DOM after init (`carousel.js`, seeded): the active slide differs per load, so `swiper-slide-active/next/prev`, `slick-active/current`, `aria-hidden` and the active dot move; Swiper 6–8 adds duplicate slides, Swiper 9+ reorders slides, Slick adds `slick-cloned` copies; Swiper's wrapper id is random on every init. tiny-slider wraps the container and ids items `tns<N>-item<k>` (N varies per load); Owl 2 wraps items in `owl-item` with `active` / `center` / `cloned`. Clones have no lab id | State classes and random instance ids must not reach a stable value; identical slides are told apart only by content, so many nulls are expected |
| `shopify.html` | A Dawn-style product page after a template update. Only `template--<14 digits>` and `sections--<14 digits>` change (ids, `section-…-padding` classes, `data-section*`); custom elements, theme classes and app block ids stay. `config.js` freezes every other category | Values built from custom elements and theme classes hold; values using a template id churn |

The same values are in `lab-expect.json`, which the local harness checks on every run.

### Local harness

The accessFlow repo's `scripts/stable-selector-harness` runs the auditor against this folder, without scans. To pair
findings across seeds, `lab.js` gives every element `data-aflw-lab="<page>-<n>"` before anything churns. The auditor
and both selector builders ignore `data-aflw-*`, so the attribute changes no selector.

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


**Only one category churning.** `defaults.off: ['ids', 'attrs', 'vue', 'angular', 'wrap', 'state']` leaves only hash
classes changing, and so on.

## AccessFlow SDK lab (`sdk-tests/`)

Runs the accessFlow SDK (JS, Python, Java) against this site and uploads reports to an accessFlow test env.

```
sdk-tests/js       Playwright test + config (package in sdk-tests/js/node_modules)
sdk-tests/python   pytest + Playwright (venv in sdk-tests/python/.venv)
sdk-tests/java     JUnit 5 + Playwright 1.40 (Maven repo in sdk-tests/java/.m2)
secrets/           git-ignored: <lang>-api-token, <lang>-installation-key, npmrc, pip.conf, maven-settings.xml
```

Never commit anything from `secrets/`, `node_modules/`, `.venv/` or `.m2/`.

### Run locally (writes reports, no upload)

```bash
cd sdk-tests/js && ACCESSFLOW_SDK_API_KEY="$(<../../secrets/js-api-token)" npx playwright test
cd sdk-tests/python && SSL_CERT_FILE=$(.venv/bin/python -m certifi) ACCESSFLOW_SDK_API_KEY="$(<../../secrets/python-api-token)" .venv/bin/python -m pytest -q
cd sdk-tests/java && ACCESSFLOW_SDK_API_KEY="$(<../../secrets/java-api-token)" mvn -q -s ../../secrets/maven-settings.xml -Dmaven.repo.local=.m2 test
```

Reports: JS `sdk-tests/js/test-results/accessFlow-report.json`; Python and Java `report.json` in their folders.

### Upload (simulated CI)

Uploads happen only in CI. Add GitHub Actions variables to any command above. Give each language its own `GITHUB_REPOSITORY`
(e.g. `nivguler-accessibe/sdk-lab-python`): the dashboard matches issues per repo, so a second language on the same repo
updates the first one's issues instead of showing its own.

```bash
GITHUB_ACTIONS=true GITHUB_EVENT_NAME=push GITHUB_SHA=$(git rev-parse HEAD) GITHUB_REPOSITORY=nivguler-accessibe/nivguler-accessibe.github.io GITHUB_DEFAULT_BRANCH=main GITHUB_ACTOR=lab GITHUB_REF=refs/heads/<branch> GITHUB_REF_NAME=<branch> GITHUB_RUN_NUMBER=<n> GITHUB_RUN_ID=<n>
```

Expect `uploaded successfully`; the run shows on the env's CI/CD page under `<branch>`.

### Java quirks (this Mac)

- Keep Playwright 1.40.0: the SDK is compiled against it and breaks on newer versions.
- Set `PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.playwright.dev PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and
  `PW_CHROMIUM_PATH=$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-1255/*/chrome-headless-shell)`
  (Chromium 120 crashes here).

### Env SDK builds have a dead API host

SDK packages published from an `env/*` branch call `sdk-gcp--accessflow--test.acsb-test.com`, which no longer exists.
Until CI is fixed, build the SDK locally with the env's host and replace the installed packages (see `CLAUDE.md`).
