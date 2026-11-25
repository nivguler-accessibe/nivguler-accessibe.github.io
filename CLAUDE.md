# nivguler-accessibe.github.io — instructions

Public GitHub Pages site (anything pushed to `main` is served). Two labs: the Stable Selectors Lab (site root, see
README) and the accessFlow SDK lab (`sdk-tests/`, see README "AccessFlow SDK lab").

## Rules

- Secrets live only in `secrets/` (git-ignored). Never print, echo, copy into tracked files or commit a token or key.
  Read them inline: `ACCESSFLOW_SDK_API_KEY="$(<secrets/js-api-token)"`.
- Ask before committing or pushing. Keep SDK test code minimal; no new tooling.
- Don't print whole reports; summarize them (rule count, which rules have which fields, totals).

## SDK lab: install from an env

Each env's token page gives, per SDK: API token, installation key, download URL (Artifact Registry).
- npm: `secrets/npmrc` copied to `.npmrc`; scoped `@acsbe:registry=https://<url>/` + `//<url>/:username=_json_key_base64`,
  `_password=<JS installation key as is>` (already double base64).
- pip: `--index-url "https://_json_key_base64:<key percent-encoded>@<url>simple/" --extra-index-url https://pypi.org/simple`;
  pin the exact pre-release (`==x.y.z.devN`).
- Maven: `secrets/maven-settings.xml` (server `accessflow-registry`, user `_json_key_base64`, key as is).
- An env publishes the SDK only when CircleCI is re-run on the env branch with `DEPLOY_SDK=true`.

## SDK lab: local build with the env host (dead-host workaround)

From the accessFlow PR worktree (`~/Documents/git/accessFlow-wt-<KEY>/src/accessflow-sdk`):
1. In `sdk.config.ts`, replace only the host `sdk-gcp--accessflow--test.acsb-test.com` with `<ws>--accessflow--test.acsb-test.com`.
2. `npx tsc -p . && npm run copy:assets` (needs `../auditor/dist`; if building it, `npm run build:auditor` writes
   the bundle and then hangs: kill rollup once `auditor.js` exists. Don't use `npm run build`, it runs that step).
3. Binary: `npx pkg dist/src/engine/main.js --targets node18-macos-arm64 --output bin/aflow-core-macos-arm64 --compress Brotli --no-bytecode --public --public-packages '*'`, then `codesign -s - -f bin/aflow-core-macos-arm64`.
4. JS: `rsync -a --delete dist/ <lab>/sdk-tests/js/node_modules/@acsbe/accessflow-sdk/dist/`.
5. Python: copy the binary into `sdk-tests/python/.venv/lib/python*/site-packages/accessflow_sdk/bin/`; that package's
   `checksums.py` must say `DEVELOPMENT_MODE_NO_CHECKSUM`, and `sdk_config.py` must have the env host.
6. Java: `npm run copy:java-assets && (cd java && mvn -q -DskipTests clean package)`, then in `sdk-tests/java`:
   `mvn -q -Dmaven.repo.local=.m2 install:install-file -Dfile=<worktree>/src/accessflow-sdk/java/target/accessflow-sdk-<v>.jar -DgroupId=com.acsbe -DartifactId=accessflow-sdk -Dversion=<version in pom.xml> -Dpackaging=jar`.
7. Revert `sdk.config.ts`; the worktree must be clean.

## Current state

- Env `ac-3852-sdk` (task AC-3852, PR acsbe/accessFlow#1611). Task notes: `~/Documents/git/_tasks/AC-3852/`.
- Installed SDKs are local builds of PR head 37c0b5f86 (originals kept as `dist.orig`, `*.orig`).

- Uploads: give each language its own `GITHUB_REPOSITORY`; issues are matched per repo (rule + selector), so a
  second language on the same repo only updates the first one's issues.
