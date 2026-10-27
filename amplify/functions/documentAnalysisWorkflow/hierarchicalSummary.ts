type PageSummarySource = {
  page: number;
  summariesJSON?: unknown[];
  questionsJSON?: Array<Record<string, unknown>>;
  vocabularyJSON?: unknown[];
};

export function buildPageSummaryItems(
  pages: PageSummarySource[],
): Array<Record<string, unknown>> {
  return pages.flatMap<Record<string, unknown>>((page) => {
    const summaries = (page.summariesJSON ?? []).flatMap<
      Record<string, unknown>
    >((value) => {
      if (value === null || typeof value !== "object") return [];
      const summary = value as Record<string, unknown>;
      if (
        typeof summary.title !== "string" ||
        typeof summary.content !== "string"
      ) {
        return [];
      }
      const pageRange =
        typeof summary.pageRange === "string"
          ? summary.pageRange
          : typeof summary.page_range === "string"
            ? summary.page_range
            : `Page ${page.page}`;
      return [
        {
          type: "page-summary",
          title: summary.title,
          content: summary.content,
          pageRange,
        },
      ];
    });
    if (summaries.length > 0) return summaries;

    const facts = (page.questionsJSON ?? []).map((question) => ({
      prompt: question.prompt,
      answer: question.answer,
      subject: question.subject,
      field: question.field,
      sourceText: question.sourceText,
    }));
    const vocabulary = (page.vocabularyJSON ?? []).map((value) => {
      if (value === null || typeof value !== "object") return value;
      const entry = value as Record<string, unknown>;
      return {
        word: entry.word ?? entry.term,
        definition: entry.definition,
        context: entry.context,
      };
    });
    return facts.length > 0 || vocabulary.length > 0
      ? [
          {
            type: "page-evidence",
            title: `Page ${page.page}`,
            pageRange: `Page ${page.page}`,
            facts,
            vocabulary,
          },
        ]
      : [];
  });
}
