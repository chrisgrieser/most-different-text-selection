import { exec } from "node:child_process";
import fs from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
	EMBEDDING_MODELS,
	INPUT_FOLDER,
	MODEL_TO_USE,
	OPENAI_API_KEY,
	REPORT_FILE,
	SKIP_UNREAD_DOCS_ALREADY_WITH_SCORE,
	WRITE_SCORE_INTO_INPUT_FILES,
	YAML_FRONTMATTER_NOVELTY_SCORE_KEY,
	YAML_FRONTMATTER_READ_KEY,
} from "src/settings";

//──────────────────────────────────────────────────────────────────────────────

type EmbeddingInfo = {
	embedding: number[];
	alreadyRead: boolean;
	relPath: string;
};

type NoveltyScore = {
	relPath: string;
	score: number;
};

const frontmatterRegex = /^---\n(.*?)\n---\n(.*)$/s;

//──────────────────────────────────────────────────────────────────────────────

async function requestEmbeddingForFile(
	filepath: string,
): Promise<{ embedding: number[]; cost: number; docAlreadyRead: boolean } | undefined> {
	if (!OPENAI_API_KEY) throw new Error("Please set your OpenAI API key in the settings.ts file.");

	const model = EMBEDDING_MODELS[MODEL_TO_USE];

	const fileRaw = fs.readFileSync(filepath, "utf-8");
	const [_, frontmatter, fileContent] = fileRaw.match(frontmatterRegex) || ["", "", fileRaw];
	const tokensPerChar = 3.8; // rule of thumb: 1 token ~= 4 English chars
	const maxLength = model.maxInputTokens * tokensPerChar;

	const docAlreadyHasScore = frontmatter
		.split("\n")
		.some((line) => line.startsWith(YAML_FRONTMATTER_NOVELTY_SCORE_KEY + ":"));
	if (docAlreadyHasScore && SKIP_UNREAD_DOCS_ALREADY_WITH_SCORE) return;
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
	// don't throw error, just skip this file (e.g., when document is too long)
	if (!response.ok) {
		console.error(`OpenAI error: ${response.status} – ${filepath}`);
		console.error(await response.text());
		return;
	}

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
	if (files.length === 0) throw new Error("No markdown files found in input folder.");

	const model = EMBEDDING_MODELS[MODEL_TO_USE];
	console.info(`Request embeddings from ${model.provider} (${model.name})…`);

	let totalCost = 0;
	const embeddingsForAllFiles: EmbeddingInfo[] = [];
	for (const file of files) {
		const absPath = path.resolve(INPUT_FOLDER) + "/" + file;
		const { cost, embedding, docAlreadyRead } = (await requestEmbeddingForFile(absPath)) || {};
		if (!embedding || docAlreadyRead === undefined) continue;
		if (cost) totalCost += cost;
		embeddingsForAllFiles.push({
			embedding: embedding,
			alreadyRead: docAlreadyRead,
			relPath: file,
		});
		process.stdout.write(`\r${embeddingsForAllFiles.length}/${files.length} files`);
	}

	console.info("");
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

function allCosineDistances(docs: EmbeddingInfo[], toVector: number[]): NoveltyScore[] {
	console.info("Calculating cosine distances…");

	function cosineSimilarity(a: number[], b: number[]): number {
		if (a.length !== b.length) throw new Error("Vectors must have the same length");
		const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
		const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
		const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
		if (normA === 0 || normB === 0) throw new Error("Cannot use zero vector");
		return dotProduct / (normA * normB);
	}

	return docs.map((doc) => ({
		relPath: doc.relPath,
		score: cosineSimilarity(doc.embedding, toVector),
	}));
}

function writeReport(
	noveltyScores: NoveltyScore[],
	readDocs: EmbeddingInfo[],
	totalCost: number,
): void {
	const listOfUnread = noveltyScores
		.sort((a, b) => b.score - a.score)
		.map((doc) => {
			const score = doc.score.toFixed(1);
			const displayPath = doc.relPath.replace(".md", "");
			const absPath = encodeURI(`file://${path.resolve(INPUT_FOLDER)}/${doc.relPath}`);
			return `- [${score}] [${displayPath}](${absPath})`;
		});
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
		`- Input folder: [${INPUT_FOLDER}](file://${path.resolve(INPUT_FOLDER)})`,
		"- Read documents: " + listOfRead.length,
		"- Unread documents: " + listOfUnread.length,
		`- Provider: ${model.name} (${model.provider})`,
		"- Total cost: $" + totalCost.toFixed(5), // needs this many digits to display anything
		"- Creation date: " + isoDateLocal,
	];

	fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
	fs.writeFileSync(REPORT_FILE, report.join("\n"));
}

function writeScoresIntoInputFiles(noveltyScores: NoveltyScore[]): void {
	console.info("Writing novelty scores into input files…");
	const scoreKey = YAML_FRONTMATTER_NOVELTY_SCORE_KEY;
	const scoreRegex = new RegExp(`^${scoreKey}: *([\\d.]+)$`, "m");

	for (const { relPath, score } of noveltyScores) {
		const absPath = path.resolve(INPUT_FOLDER) + "/" + relPath;
		const fileRaw = fs.readFileSync(absPath, "utf-8");
		const [_, frontmatter, fileContent] = fileRaw.match(frontmatterRegex) || ["", "", fileRaw];

		const hasScore = frontmatter.match(scoreRegex);
		const newFrontmatter = hasScore
			? frontmatter.replace(scoreRegex, `${scoreKey}: ${score.toFixed(1)}`)
			: frontmatter + `\n${scoreKey}: ${score.toFixed(1)}`;
		fs.writeFileSync(absPath, `---\n${newFrontmatter}\n---\n${fileContent}`);
	}
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
	if (distances.some((noveltyScore) => noveltyScore.score < 0)) {
		throw new Error(
			"Expected all distances to be positive (which cosine distances of LLM embeddings usually are).",
		);
	}

	// readability: normalize to 0-100 and flip
	const noveltyScores = distances.map((noveltyScore) => ({
		relPath: noveltyScore.relPath,
		score: (1 - noveltyScore.score) * 100,
	}));

	// OUTPUT
	writeReport(noveltyScores, readDocs, totalCost);
	if (WRITE_SCORE_INTO_INPUT_FILES) writeScoresIntoInputFiles(noveltyScores);
	console.info("Done.");
	if (process.platform === "darwin") exec(`open '${REPORT_FILE}'`);
}

//──────────────────────────────────────────────────────────────────────────────
main();
