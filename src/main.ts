import { exec } from "node:child_process";
import { writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
// @ts-expect-error due to missing types
import cliProgress from "cli-progress";
import {
	DATA_FOLDER,
	EMBEDDING_MODELS,
	EMBEDDING_OUTPUT_FILE,
	MODEL_TO_USE,
	OPENAI_API_KEY,
	YAML_FRONTMATTER_READ_KEY,
} from "./settings";

//──────────────────────────────────────────────────────────────────────────────

async function requestEmbeddingForFile(
	filepath: string,
): Promise<{ embedding?: number[]; cost?: number; read?: boolean }> {
	const model = EMBEDDING_MODELS[MODEL_TO_USE];

	const fileRaw = await readFile(filepath, "utf-8");
	const [frontmatter, fileContent] = fileRaw.match(/^---\n(.*?)\n---\n(.*)/s) || ["", fileRaw];
	const maxLength = model.maxInputTokens * 4; // rule of thumb: 1 token ~= 4 English chars
	const fileWasRead =
		frontmatter
			.split("\n")
			.find((line) => line.startsWith(YAML_FRONTMATTER_READ_KEY + ":"))
			?.trim()
			.endsWith("true") || false;

	// DOCS https://platform.openai.com/docs/guides/embeddings
	const response = await fetch("https://api.openai.com/v1/embeddings", {
		method: "POST",
		headers: { authorization: "Bearer " + OPENAI_API_KEY, "Content-Type": "application/json" },
		body: JSON.stringify({ input: fileContent.slice(0, maxLength), model: model.name }),
	});
	if (!response.ok) {
		console.error(`OpenAI error: ${response.status} ${await response.text()}`);
		return {};
	}

	const data = await response.json();
	const embedding = data.data[0].embedding;
	const cost = data.usage.total_tokens * model.costPerToken;
	return { embedding: embedding, cost: cost, read: fileWasRead };
}

//──────────────────────────────────────────────────────────────────────────────

async function run() {
	if (!OPENAI_API_KEY) {
		console.error("Please set your OpenAI API key in the plugin settings.");
		process.exit(1);
	}

	const files = (await readdir(DATA_FOLDER, { recursive: true })).filter(
		(file) => file.endsWith(".md") || file.endsWith(".txt"),
	);

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(files.length, 0);

	let totalCost = 0;
	const embeddingsForAllFiles: { embedding: number[]; read: boolean; relPath: string }[] = [];
	for (const file of files) {
		const absPath = DATA_FOLDER + "/" + file;
		const { cost, embedding, read } = await requestEmbeddingForFile(absPath);
		if (cost) totalCost += cost;
		if (!embedding) continue;
		embeddingsForAllFiles.push({ embedding: embedding, read: read || false, relPath: file });
		bar.increment();
	}

	bar.stop();

	const model = EMBEDDING_MODELS[MODEL_TO_USE];
	const data = {
		embeddings: embeddingsForAllFiles,
		info: {
			location: DATA_FOLDER,
			provider: model.provider,
			model: model.name,
			totalCostDollar: totalCost.toFixed(5),
			creationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
		},
	};
	writeFileSync(EMBEDDING_OUTPUT_FILE, JSON.stringify(data, null, 2));

	// reveal file if on macOS
	if (process.platform === "darwin") exec(`open -R '${EMBEDDING_OUTPUT_FILE}'`);
}
run();
