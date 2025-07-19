set quiet := true

#───────────────────────────────────────────────────────────────────────────────

# has streaming output
run:
    npx tsx ./src/main.ts

novelty-scores-from-report:
    #!/usr/bin/env zsh
    scores=$(rg --only-matching --pcre2 --no-line-number '(?<=\[)[\d.]+(?=\])' REPORT.md)
    [[ "$OSTYPE" == "darwin"* ]] && echo "$scores" | pbcopy
    echo "$scores"

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
