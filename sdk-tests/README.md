# accessFlow SDK lab

Runs the accessFlow SDK (JS, Python, Java) against this site. Each language is self-contained in its folder,
with its own `accessflow.config.json` (`"includeRemediation": false` turns remediation off).

## Secrets (git-ignored, repo-root `secrets/`)

| file | what |
|---|---|
| `npmrc` | npm registry config with the JS installation key (`@acsbe:registry=...`) |
| `pip.conf` | `[global] index-url` with the Python installation key, percent-encoded, ending `simple/` |
| `maven-settings.xml` | server `accessflow-registry` (Java installation key) + active profile with the repository URL |
| `<lang>-installation-key`, `<lang>-api-token` | raw values from the env's token page |

## Install

```bash
cd sdk-tests/js && NPM_CONFIG_USERCONFIG=../../secrets/npmrc npm install && npx playwright install chromium
cd sdk-tests/python && python3 -m venv .venv && PIP_CONFIG_FILE=../../secrets/pip.conf .venv/bin/pip install -r requirements.txt && .venv/bin/playwright install chromium
cd sdk-tests/java && mvn -q test-compile   # .mvn/maven.config points at secrets/ and a local .m2
```

Env SDK builds are pre-releases: pin the exact version (package.json, requirements.txt, pom.xml).

## Run

```bash
cd sdk-tests/js && ACCESSFLOW_SDK_API_KEY="$(<../../secrets/js-api-token)" npx playwright test
cd sdk-tests/python && ACCESSFLOW_SDK_API_KEY="$(<../../secrets/python-api-token)" .venv/bin/pytest -q
cd sdk-tests/java && ACCESSFLOW_SDK_API_KEY="$(<../../secrets/java-api-token)" mvn -q test
```

Reports: `js/test-results/accessFlow-report.json`, `python/report.json`, `java/report.json`.

## Local quirks (macOS)

- Python.org builds may lack CA certs: prefix the Python run with `SSL_CERT_FILE=$(.venv/bin/python -m certifi)`.
- The Java SDK needs Playwright Java 1.40.0, whose Chromium crashes on recent macOS. Use a newer local browser:
  `PW_CHROMIUM_PATH=<path to chrome-headless-shell> PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.
  To download 1.40's browsers, set `PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.playwright.dev`.
