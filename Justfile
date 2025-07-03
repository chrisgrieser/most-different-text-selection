set quiet := true

#───────────────────────────────────────────────────────────────────────────────

build-and-run:
    node .esbuild.mjs && node main.js

check-all:
    git hook run pre-commit -- "check-all"

check-tsc-qf:
    npx tsc --noEmit --skipLibCheck --strict && echo "Typescript OK"

init:
    git config core.hooksPath .githooks && npm install
