import { readdir, readFile } from "node:fs/promises";
import { DATA_FOLDER, OPENAI_API_KEY, OPENAI_MODEL } from "./settings";

async function getEmbeddingForFile(filepath: string): Promise<number[] | undefined> {
	if (!OPENAI_API_KEY) {
		console.error("Please set your OpenAI API key in the plugin settings.");
		return;
	}

	const fileRaw = await readFile(filepath, "utf-8");
	const fileWithoutFrontmatter = fileRaw.replace(/---\n.*---\n/s, "")

	// DOCS https://platform.openai.com/docs/guides/embeddings
	const response = await fetch("https://api.openai.com/v1/embeddings", {
		method: "POST",
		headers: {
			// biome-ignore lint/style/useNamingConvention: not by me
			Authorization: "Bearer " + OPENAI_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ input: fileWithoutFrontmatter, model: OPENAI_MODEL }),
	});
	if (!response.ok) {
		console.error(`OpenAI error: ${response.status} ${await response.text()}`);
		return;
	}

	const embedding = (await response.json()).data[0].embedding;
	console.log("🪚 embedding:", JSON.stringify(embedding, null, 2));
	return embedding;
}

//──────────────────────────────────────────────────────────────────────────────

async function run() {
	const textFiles = (await readdir(DATA_FOLDER, { recursive: true }))
		.filter((f) => f.endsWith(".md") || f.endsWith(".txt"))
		.map((f) => DATA_FOLDER + "/" + f);

	getEmbeddingForFile(textFiles[0]);
}
run();
