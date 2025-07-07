# Most different text selection
Use embedding data from LLMs to determine the most different text in a given
corpus.

## To-do
- [ ] Calculate semantic center (= element-wise average of embedding vectors)
- [ ] Determine "most simila" and "most different" document based on semantic
center of read documents.
- [ ] Create test data set.

## Usage
1. Get an OpenAI API key.
2. Modify values in `src/settings.ts`.
3. Run in the Terminal:

   ```bash
   npm install
   node .esbuild.mjs 
   node main.js
   ```

4. Output is stored in the file `./embeddings.json`.

> [!NOTE]
> There is a rate limit for OpenAI embeddings of 100 requests per day with the
> `text-embedding-3-small` in the free tier. If you already paid for your OpenAI
> account in the past, you are automatically placed in a higher tier, with much
> more requests per day.
>
> - [Info on the placement in tiers](https://platform.openai.com/docs/guides/rate-limits/usage-tiers)
> - [Rate Limit for the model](https://platform.openai.com/docs/models/text-embedding-3-small)
> - [Usage limits
>   info](https://platform.openai.com/settings/organization/limits) (your usage
>   tier is noted at the top of the page)

## Readings
- [Intro to embeddings](https://openai.com/index/introducing-text-and-code-embeddings/)
