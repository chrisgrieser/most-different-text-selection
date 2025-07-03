import { readFileSync } from "node:fs";

// TEMP this file stored outside of the repo
const openaiApiKeyFile =
	"/Users/chrisgrieser/Library/Mobile Documents/com~apple~CloudDocs/Dotfolder/private dotfiles/openai-api-key.txt";

export const OPENAI_API_KEY = readFileSync(openaiApiKeyFile, "utf8");

//──────────────────────────────────────────────────────────────────────────────

export const OPENAI_MODEL = "text-embedding-3-small"; // DOCS https://platform.openai.com/docs/models/text-embedding-3-small
export const DATA_FOLDER = "/Users/chrisgrieser/Vaults/phd-data-analysis/Data/_ inbox";
