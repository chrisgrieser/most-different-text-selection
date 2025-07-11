set quiet := true

#───────────────────────────────────────────────────────────────────────────────

# run in terminal, due to the progress bar
build-and-run:
    node .esbuild.mjs && node main.js

[macos]
open-input-folder:
    #!/usr/bin/env zsh
    input_folder=$(node --eval "console.log(require('./src/settings.ts').INPUT_FOLDER)")
    open "$input_folder"

check-all:
    git hook run pre-commit -- "check-all"

check-tsc-qf:
    npx tsc --noEmit --skipLibCheck --strict && echo "Typescript OK"

init:
    git config core.hooksPath .githooks && npm install
