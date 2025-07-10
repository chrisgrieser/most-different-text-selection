# Most Different Text Selector
Use embedding data from LLMs to determine the "most different" document
in relation to a set of documents.

## To-do
- [ ] Create test data set.
- [ ] Write distance as novelty score back into YAML frontmatter of unread
documents.

## Table of contents

<!-- toc -->

- [Use case](#use-case)
	* [Scientific use case](#scientific-use-case)
	* [Non-scientific use cases](#non-scientific-use-cases)
- [How it works](#how-it-works)
- [Usage](#usage)
- [Constraints](#constraints)
- [Privacy](#privacy)
- [Further readings](#further-readings)
- [Credits](#credits)
	* [Recommended citation](#recommended-citation)
	* [About the developer](#about-the-developer)

<!-- tocstop -->

## Use case

### Scientific use case
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

The results are of course not perfect, but dependent on the model provided by
OpenAI. In addition, there is a certain opaqueness to the results, since the
interpretation of the ~1000 embeddings dimensions is not clear. However, a
perfect identification of "most differentness," however it may look, is not
needed: For the purpose of an efficient selection of the next document, the
*baseline for comparison is the random selection of the next text*. And as
imperfect as the embedding-based approach may be, it is certainly far better
than randomly choosing the next document.

### Non-scientific use cases
Even though `Most Different Text Selector` was designed with the above
scientific use case in mind, the general idea can also be applied elsewhere:
- Read later apps suggesting which article to read next.
- Legal work with a large amount of documents in the discovery phase.
- Recommendation systems geared toward novelty instead of similarity. ("similar
to what you liked" vs "Want to try something new?")

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
5. For each *unread* document, the distance (cosine similarity) to the semantic
   center of read documents is calculated.
6. The unread documents will be ranked by the shortest distance, that is a being
   the most dissimilar. For simplicity for non-technical users, that ranking is
   translated into a `novelty-score` which is saved in the YAML frontmatter of
   the unread documents.

`Most Different Text Selector` is written in TypeScript instead of Python, to
make potential future implementation as [Obsidian](http://obsidian.md) plugin
possible, e.g., to complement qualitative analysis with
[Quadro](https://github.com/chrisgrieser/obsidian-quadro).

## Usage
**Requirements**
- [OpenAI API key](https://platform.openai.com/api-keys)
- [node.js](https://nodejs.org/en/download)
- Documents saved as Markdown files in a folder.
- `read` boolean key in the YAML frontmatter indicating whether the document was
  read or unread.

1. Modify values in `src/settings.ts`.
2. Run in the Terminal:

   ```bash
   npm install
   node .esbuild.mjs 
   node main.js
   ```

3. Intermediary output is saved in the file `./embeddings.json`.
4. The ranking of the "most differentness" is saved in the YAML frontmatter of
   the unread documents under the key `novelty-score`.

> [!TIP]
> **Shift of semantic center**
> After reading a sufficient number of documents, the semantic center of read
> documents will shift, resulting in outdated novelty scores for the unread
> documents. It is thus recommended to re-run the analysis once in a while.

## Constraints
**Number of documents**  
There is a rate limit for OpenAI embeddings of 100 requests per day with the
`text-embedding-3-small` in the free tier. If you already paid for your OpenAI
account in the past, you are automatically placed in a higher tier, with much
more requests per day.
- [Info on the placement in tiers](https://platform.openai.com/docs/guides/rate-limits/usage-tiers)
- [Rate Limit for the model](https://platform.openai.com/docs/models/text-embedding-3-small)
- [Usage limits info](https://platform.openai.com/settings/organization/limits)
(your usage tier is noted at the top of the page)

**Document size**  
The current OpenAI models for embeddings have a [maximum input size of 8192
tokens,](https://github.com/chrisgrieser/most-different-text-selection) which
are about 32,000 characters of English text. Documents longer than that will be
automatically truncated by `Most Different Text Selector`.

## Privacy
All input documents are sent to OpenAI, so be sure to not include sensitive data
in the input folder.

## Further readings
- [Intro to embeddings](https://openai.com/index/introducing-text-and-code-embeddings/)
- [Using embeddings to calculate related articles](https://technicalwriting.dev/ml/embeddings/overview.html#body)

## Credits

### Recommended citation
Please cite this software project as (APA):

```txt
Grieser, C. (2025). Most Different Text Selector [Computer software]. 
https://github.com/chrisgrieser/most-different-text-selection
```

### About the developer
In my day job, I am a sociologist studying the social mechanisms underlying the
digital economy. For my PhD project, I investigate the governance of the app
economy and how software ecosystems manage the tension between innovation and
compatibility. If you are interested in this subject, feel free to get in touch.

- [Website](https://chris-grieser.de/)
- [Mastodon](https://pkm.social/@pseudometa)
- [ResearchGate](https://www.researchgate.net/profile/Christopher-Grieser)
- [LinkedIn](https://www.linkedin.com/in/christopher-grieser-ba693b17a/)
