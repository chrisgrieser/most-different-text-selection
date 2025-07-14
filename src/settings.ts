import { readFileSync } from "node:fs";

// OPENAI
const openaiApiKeyFile =
	"/Users/chrisgrieser/Library/Mobile Documents/com~apple~CloudDocs/Dotfolder/private dotfiles/openai-api-key.txt";
export const OPENAI_API_KEY = readFileSync(openaiApiKeyFile, "utf8");

// INPUT
export const INPUT_FOLDER = "/Users/chrisgrieser/Vaults/phd-data-analysis/Data/";
export const YAML_FRONTMATTER_READ_KEY = "read";

// OUTPUT
export const REPORT_FILE = "./REPORT.md";
export const WRITE_SCORE_INTO_INPUT_FILES = true;
export const YAML_FRONTMATTER_NOVELTY_SCORE_KEY = "novelty-score";

// MODEL SETTINGS
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
