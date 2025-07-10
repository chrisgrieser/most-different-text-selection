import { readFileSync } from "node:fs";

//──────────────────────────────────────────────────────────────────────────────

// TEMP this file stored outside of the repo
const openaiApiKeyFile =
	"/Users/chrisgrieser/Library/Mobile Documents/com~apple~CloudDocs/Dotfolder/private dotfiles/openai-api-key.txt";

export const OPENAI_API_KEY = readFileSync(openaiApiKeyFile, "utf8");

// uses `.md` to `.txt` files in that folder (recursively)
export const INPUT_FOLDER = "/Users/chrisgrieser/Vaults/phd-data-analysis/Data/_ inbox";

export const OUTPUT_FILE = "./output.json";

export const YAML_FRONTMATTER_READ_KEY = "read";

// TODO
// export const YAML_FRONTMATTER_MOST_DIFFERENT_KEY = "novelty-score";

//──────────────────────────────────────────────────────────────────────────────
// MODELS
export const EMBEDDING_MODELS = {
	"text-embedding-3-small": {
		name: "text-embedding-3-small",
		provider: "OpenAI",
		docs: "https://platform.openai.com/docs/models/text-embedding-3-small",
		costPerToken: 0.02 / 1_000_000,
		maxInputTokens: 8192,
	},
	"text-embedding-3-large": {
		name: "text-embedding-3-large",
		provider: "OpenAI",
		docs: "https://platform.openai.com/docs/models/text-embedding-3-large",
		costPerToken: 0.13 / 1_000_000,
		maxInputTokens: 8192,
	},
};

export const MODEL_TO_USE = "text-embedding-3-small";
