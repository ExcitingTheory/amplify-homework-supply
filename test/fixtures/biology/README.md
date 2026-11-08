# Biology textbook annotations

`groundTruth.ts` independently annotates the existing
[`biology-cell-structure.md`](../../mocks/biology-cell-structure.md) mock. It does
not modify the textbook, generated extraction snapshots, or Storybook data.

Run `npm run test:unit -- test/unit/biologyGroundTruth.test.ts test/unit/claimCoverage.test.ts test/unit/documentClaimEvidence.test.ts`.

The fixture provides:

- A SHA-256 pin for the original UTF-8 source bytes.
- Evidence units for every prose/definition block, retaining chapter and section
  context, including the three-item cell-theory list.
- Manually authored atomic subject/predicate/object claims with stable IDs.
- Exact source quotes and end-exclusive JavaScript UTF-16 offsets. Evidence
  currently spans the supporting paragraph, not a model-generated paraphrase.
- Explicit source caveats excluded from required recall: ATP bond-breaking
  wording and the text's unqualified aerobic-respiration claims.

These are source-grounded extraction expectations, not a claim that the source
is a scientifically exhaustive or independently verified textbook. Closing
motivational statements about the importance/progress of biology are not
required facts. Alternative valid claims and paraphrases are possible.

## Offline scoring contract

`test/support/scoreClaimCoverage.ts` accepts annotated pages, evidence units,
claims, and question-shaped output (`subject`, `field`, `answer`, `sourceText`,
`page`/`pages`, optional `sourceStart`/`sourceEnd`). For this Markdown fixture,
use one logical page containing the complete original text, and assign page 1
to every annotated unit. Do not mix PDF/DOCX page numbers or fragment-local
offsets with these Markdown offsets.

Claim credit requires **all** of:

- Subject, relationship and value match independently authored expectations.
  Matching canonicalizes case, Unicode compatibility and whitespace only.
  Alternative subjects/predicates/objects must be explicitly authored in the
  annotation's `aliases`; generated `accept[]` never grants benchmark credit.
- Correct source page and the complete exact annotated evidence quote.
  A shorter quote is accepted only when explicitly annotated in `aliases.quotes`.
- Valid source offsets, when supplied as a pair; otherwise the quote must
  locate uniquely in the source. Corpus spans are validated before scoring.

There is no fuzzy, substring-answer, prompt-only or answer-only match.
Required recall uses 171 claims; the three source-caveated claims remain
optional. Evidence coverage separately counts the 47 units with at least one
matched required claim. Touching a unit does **not** establish recall of all
claims inside it. Empty denominators return zero, not a vacuous 100%.

The tests cover wrong subjects, relationships, values, pages, offsets,
quotations, combined values, explicit aliases, duplicates and tampered
annotations. Scoring the authored expectations themselves yields 171/171:
this is scorer sanity, **not pipeline accuracy**. A controlled microscope
mock exercises omitted prose → targeted repair → rendered questions → scoring
(0/3 before simulated repair, 3/3 after). It uses authored responses to test
wiring and does not measure a model's recall improvement. No paid extraction
evaluation was run.

No PDF page numbers are asserted: these offsets refer only to the Markdown
source, not the separately generated PDF or DOCX.

This sample covers definitions, lists, quantities, historical dates, functions,
locations, and contrasting processes. It contains no tables, captions, or
genuine cross-paragraph reasoning benchmark; add independent fixtures for those
before claiming coverage of those textbook structures.
