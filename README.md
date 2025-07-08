# Most Different Text Selector
Use embedding data from LLMs to determine the "most different" document
in relation to a set of documents.

## To-do
- [ ] Determine most different unread document based on semantic center of read
documents.
- [ ] Create test data set.

## Table of contents

<!-- toc -->

- [Scientific use case](#scientific-use-case)
- [How it works](#how-it-works)
- [Usage](#usage)
- [Further readings](#further-readings)

<!-- tocstop -->

## Scientific use case
1. When working with a corpus of texts, for instance in linguistics or
   qualitative social research, the order in which those texts are analyzed is
   essential. In qualitative social research, a common case selection strategy
   is the "most different case," i.e., a document that is most *dissimilar* to
   the ones already analyzed. However, this can be challenging, as the
   identification of which document is "most different" in itself is often not
   obvious.
2. Another issue arises when the data corpus is so large, that not all documents
   can be analyzed. In that case, a common strategy is to stop the data analysis
   once *theoretical saturation* is reached, that is the point where analyzing
   additional documents does not yield new insights. However, an intrinsic
   danger of this approach is overlooking documents that contain relevant
   information, simply because in the sequential analysis of documents, the
   researcher coincidentally only selected documents with similar information.

In both of these scenarios, an automatic identification documents "most
different" in relation to a given set of documents becomes relevant.
Effectively, it allows the efficient selection of *unread* documents most
dissimilar to the set of *already* read documents.

The `Most Different Text Selector` implements this via embeddings, the
mathematical vectors underlying LLMs.

## How it works
Embeddings have been used to [calculate the similarity of
texts](https://simonwillison.net/2023/Oct/23/embeddings/#related-content-using-embeddings),
for example to [create a list of "Related articles" for technical
documentation](https://technicalwriting.dev/ml/embeddings/overview.html#body).

Since embeddings are basically data points to determine the similarity of texts,
they can also be used to do the opposite: the identification of *dissimilar*
texts. `Most Different Text Selector` works as follows:

1. It takes a folder with Markdown documents as input
2. In each file, the YAML-frontmatter is checked for a `read` boolean key to
   determine whether the file was already read or not.
3. For each file, the embedding is determined via the [OpenAI
   API](https://platform.openai.com/docs/guides/embeddings).
4. The semantic center of all *read* documents is determined, by calculating the
   element-wise average vector of all embeddings of those documents.
5. For each *unread* document, the cosine similarity to the semantic center of
   read documents is calculated.
6. The document with the highest cosine similarity is then the "most
   different" document to be read next.

## Usage
**Requirements**
- [OpenAI API key](https://platform.openai.com/api-keys)
- [node.js](https://nodejs.org/en/download)

1. Modify values in `src/settings.ts`.
2. Run in the Terminal:

   ```bash
   npm install
   node .esbuild.mjs 
   node main.js
   ```

3. Intermediary output is saved in the file `./embeddings.json`.

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

## Further readings
- [Intro to embeddings](https://openai.com/index/introducing-text-and-code-embeddings/)
- [Using embeddings to calculate related articles](https://technicalwriting.dev/ml/embeddings/overview.html#body)
