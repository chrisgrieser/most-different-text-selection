import { exec } from "node:child_process";
import { writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import cliProgress from "cli-progress";
import {
	EMBEDDING_MODELS,
	INPUT_FOLDER,
	MODEL_TO_USE,
	OPENAI_API_KEY,
	REPORT_FILE,
	YAML_FRONTMATTER_READ_KEY,
} from "src/settings";

//──────────────────────────────────────────────────────────────────────────────

type EmbeddingInfo = {
	embedding: number[];
	alreadyRead: boolean;
	relPath: string;
};

//──────────────────────────────────────────────────────────────────────────────

async function requestEmbeddingForFile(
	filepath: string,
): Promise<{ embedding: number[]; cost: number; docAlreadyRead: boolean }> {
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
	if (!response.ok) throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);

	const data = await response.json();
	const embedding = data.data[0].embedding;
	const cost = data.usage.total_tokens * model.costPerToken;
	return { embedding, cost, docAlreadyRead };
}

/** Also displays a cli progress bar while running */
async function getEmbedsForAllFilesInFolder(folder: string): Promise<{
	embedsForAllFiles: EmbeddingInfo[];
	totalCost: number;
}> {
	const files = (await readdir(folder, { recursive: true })).filter((file) =>
		file.endsWith(".md"),
	);

	const model = EMBEDDING_MODELS[MODEL_TO_USE];
	console.info(`Request embeddings from ${model.provider} (${model.name})…`);
	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(files.length, 0);

	let totalCost = 0;
	const embeddingsForAllFiles: EmbeddingInfo[] = [];
	for (const file of files) {
		const absPath = INPUT_FOLDER + "/" + file;
		const { cost, embedding, docAlreadyRead } = await requestEmbeddingForFile(absPath);
		if (cost) totalCost += cost;
		embeddingsForAllFiles.push({
			embedding: embedding,
			alreadyRead: docAlreadyRead,
			relPath: file,
		});
		bar.increment();
	}

	bar.stop();
	return { embedsForAllFiles: embeddingsForAllFiles, totalCost };
}

function elemwiseAvgVector(vectors: number[][]): number[] {
	console.info("Calculating elementwise average vector…");
	if (vectors.length === 0) return [];
	const dimensions = vectors[0].length;

	const avg: number[] = new Array(dimensions).fill(0);
	for (const vec of vectors) {
		for (let d = 0; d < dimensions; d++) {
			avg[d] += vec[d];
		}
	}
	return avg.map((val) => val / vectors.length);
}

function allCosineDistances(
	docs: EmbeddingInfo[],
	toVector: number[],
): { [relPath: string]: number } {
	console.info("Calculating cosine distances…");

	function cosineSimilarity(a: number[], b: number[]): number {
		console.assert(a.length === b.length, "Vectors must have the same length");
		const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
		const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
		const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
		console.assert(normA !== 0 && normB !== 0, "Cannot use zero vector");
		return dotProduct / (normA * normB);
	}

	const distances: { [relPath: string]: number } = {};
	for (const doc of docs) {
		distances[doc.relPath] = cosineSimilarity(doc.embedding, toVector);
	}
	return distances;
}

//──────────────────────────────────────────────────────────────────────────────

async function main() {
	const { embedsForAllFiles, totalCost } = await getEmbedsForAllFilesInFolder(INPUT_FOLDER);

	// calculate semantic center of read docs
	const readDocs = embedsForAllFiles.filter((doc) => doc.alreadyRead);
	const readDocsEmbeds = readDocs.map((doc) => doc.embedding);
	if (readDocsEmbeds.length === 0) throw new Error("None of the input documents were read.");
	const centerOfReadDocs = elemwiseAvgVector(readDocsEmbeds);

	// calculate distance of unread docs to semantic center
	const unreadDocsEmbeds = embedsForAllFiles.filter((doc) => !doc.alreadyRead);
	const distances = allCosineDistances(unreadDocsEmbeds, centerOfReadDocs);

	// readability/interpretability: normalize to 0-100 and flip, for easier
	const noveltyScores: { [relPath: string]: number } = {};
	for (const [relPath, distance] of Object.entries(distances)) {
		if (distance < 0) {
			const err =
				"Expected all distances to be positive (which cosine distances of LLM embeddings usually are).";
			throw new Error(err);
		}
		noveltyScores[relPath] = (1 - distance) * 100;
	}

	// write report
	const listOfUnread = Object.entries(noveltyScores)
		.map(([relPath, score]) => ({ relPath, score }))
		.sort((a, b) => b.score - a.score)
		.map((doc) => `- [${doc.score.toFixed(1)}] ${doc.relPath.replace(".md", "")}`);
	const listOfRead = readDocs.map((doc) => "- " + doc.relPath.replace(".md", ""));
	const model = EMBEDDING_MODELS[MODEL_TO_USE];
	const isoDateLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
		.toISOString()
		.slice(0, 19)
		.replace("T", " ");

	const report = [
		"# Report",
		"",
		"## Novelty scores of unread documents",
		...listOfUnread,
		"",
		"## Read documents",
		...listOfRead,
		"",
		"## Metadata",
		`- Input folder: \`${INPUT_FOLDER}\``,
		"- Read documents: " + readDocsEmbeds.length,
		"- Unread documents: " + unreadDocsEmbeds.length,
		`- Provider: ${model.name} (${model.provider})`,
		"- Total cost: $" + totalCost.toFixed(5), // needs this many digits to display anything
		"- Creation date: " + isoDateLocal,
	];
	writeFileSync(REPORT_FILE, report.join("\n"));

	// finish
	console.info("Done.");
	if (process.platform === "darwin") exec(`open -R '${REPORT_FILE}'`);
}

//──────────────────────────────────────────────────────────────────────────────
main();
