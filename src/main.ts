import { exec } from "node:child_process";
import { writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";
import cliProgress from "cli-progress";
import {
	EMBEDDING_MODELS,
	EMBEDDING_OUTPUT_FILE,
	INPUT_FOLDER,
	MODEL_TO_USE,
	OPENAI_API_KEY,
	YAML_FRONTMATTER_READ_KEY,
} from "src/settings";

//──────────────────────────────────────────────────────────────────────────────

type EmbeddingInfo = {
	embedding: number[];
	docAlreadyRead: boolean;
	relPath: string;
};

//──────────────────────────────────────────────────────────────────────────────

async function requestEmbeddingForFile(
	filepath: string,
): Promise<{ embedding: number[]; cost: number; docAlreadyRead: boolean } | undefined> {
	if (!OPENAI_API_KEY) {
		console.error("Please set your OpenAI API key in the settings.ts file.");
		process.exit(1);
	}

	const model = EMBEDDING_MODELS[MODEL_TO_USE];

	const fileRaw = await readFile(filepath, "utf-8");
	const [frontmatter, fileContent] = fileRaw.match(/^---\n(.*?)\n---\n(.*)/s) || ["", fileRaw];
	const tokensPerChar = 4; // rule of thumb: 1 token ~= 4 English chars
	const maxLength = model.maxInputTokens * tokensPerChar;
	const docAlreadyRead =
		frontmatter
			.split("\n")
			.find((line) => line.startsWith(YAML_FRONTMATTER_READ_KEY + ":"))
			?.trim()
			.endsWith("true") || false;

	// DOCS https://platform.openai.com/docs/guides/embeddings
	const response = await fetch("https://api.openai.com/v1/embeddings", {
		method: "POST",
		headers: {
			authorization: "Bearer " + OPENAI_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			input: fileContent.slice(0, maxLength),
			model: model.name,
		}),
	});
	if (!response.ok) {
		console.error(`OpenAI error: ${response.status} ${await response.text()}`);
		return;
	}

	const data = await response.json();
	const embedding = data.data[0].embedding;
	const cost = data.usage.total_tokens * model.costPerToken;
	return { embedding, cost, docAlreadyRead };
}

/** Also displays a cli progress bar while running */
async function getEmeddingsForAllFilesInFolder(folder: string): Promise<{
	embeddingsForAllFiles: EmbeddingInfo[];
	totalCost: number;
}> {
	const files = (await readdir(folder, { recursive: true })).filter(
		(file) => file.endsWith(".md") || file.endsWith(".txt"),
	);

	console.info(`1. Request embeddings from ${EMBEDDING_MODELS[MODEL_TO_USE].name}…`);
	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(files.length, 0);

	let totalCost = 0;
	const embeddingsForAllFiles: EmbeddingInfo[] = [];
	for (const file of files) {
		const absPath = INPUT_FOLDER + "/" + file;
		const { cost, embedding, docAlreadyRead } = (await requestEmbeddingForFile(absPath)) || {};
		if (cost) totalCost += cost;
		if (!embedding || !docAlreadyRead) continue;
		embeddingsForAllFiles.push({
			embedding: embedding,
			docAlreadyRead: docAlreadyRead,
			relPath: file,
		});
		bar.increment();
	}

	bar.stop();
	console.info("");
	return { embeddingsForAllFiles, totalCost };
}

function elemwiseAvgVector(vectors: number[][]): number[] {
	if (vectors.length === 0) return [];
	const dimensions = vectors[0].length;

	console.info("2. Calculating semantic center of read documents…");
	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(vectors.length, 0);

	const avg = new Array(dimensions).fill(0);

	for (const vec of vectors) {
		for (let d = 0; d < dimensions; d++) {
			avg[d] += vec[d];
		}
		bar.increment();
	}

	const avgVec = avg.map((val) => val / vectors.length);
	bar.stop();
	return avgVec;
}

//──────────────────────────────────────────────────────────────────────────────

async function main() {
	const { embeddingsForAllFiles, totalCost } = await getEmeddingsForAllFilesInFolder(INPUT_FOLDER);

	// calculate semantic center of read docs
	const readDocsEmbeddings = embeddingsForAllFiles
		.filter((e) => e.docAlreadyRead)
		.map((e) => e.embedding);
	if (readDocsEmbeddings.length === 0) {
		console.error("None of the input documents were read.");
		process.exit(1);
	}
	const semanticCenterOfReadDocs = elemwiseAvgVector(readDocsEmbeddings);

	// unread docs
	const unreadDocs = embeddingsForAllFiles.filter((e) => !e.docAlreadyRead);

	// write to file
	const model = EMBEDDING_MODELS[MODEL_TO_USE];
	const data = {
		semanticCenterOfReadDocs: semanticCenterOfReadDocs,
		unreadDocs: unreadDocs,
		info: {
			inputFolder: INPUT_FOLDER,
			provider: model.provider,
			model: model.name,
			totalCostDollar: totalCost.toFixed(5),
			creationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
		},
	};
	writeFileSync(EMBEDDING_OUTPUT_FILE, JSON.stringify(data, null, 2));

	// finish
	console.info("Done.");
	if (process.platform === "darwin") exec(`open -R '${EMBEDDING_OUTPUT_FILE}'`);
}

//──────────────────────────────────────────────────────────────────────────────
await main();
