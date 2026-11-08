/**
 * Asks the rebuildSearchBundle Lambda to build the search bundles for a unit
 * that was just published: the unit's own bundle plus a merged bundle for every
 * section that assigns it.
 *
 * Kept separate from the publish handler so the membership lookup and the
 * payload can be tested without AppSync or Lambda.
 */

import type { SectionUnits, UnitMembers } from "../rebuildSearchBundle/handler";

type Graphql = (request: {
  query: string;
  variables: Record<string, unknown>;
}) => Promise<any>;

const PAGE_LIMIT = 1000;

const LIST_UNIT_WORD_IDS = /* GraphQL */ `
  query ListUnitWordIds($unitID: ID!, $nextToken: String) {
    listUnitWords(
      filter: { unitID: { eq: $unitID } }
      limit: ${PAGE_LIMIT}
      nextToken: $nextToken
    ) {
      items {
        wordID
        deletedAt
      }
      nextToken
    }
  }
`;

const LIST_QUESTION_UNIT_IDS = /* GraphQL */ `
  query ListQuestionUnitIds($unitID: ID!, $nextToken: String) {
    listQuestionUnits(
      filter: { unitID: { eq: $unitID } }
      limit: ${PAGE_LIMIT}
      nextToken: $nextToken
    ) {
      items {
        questionID
        deletedAt
      }
      nextToken
    }
  }
`;

const LIST_UNIT_FILE_IDS = /* GraphQL */ `
  query ListUnitFileIds($unitID: ID!, $nextToken: String) {
    listUnitFiles(
      filter: { unitID: { eq: $unitID } }
      limit: ${PAGE_LIMIT}
      nextToken: $nextToken
    ) {
      items {
        fileID
        deletedAt
      }
      nextToken
    }
  }
`;

const LIST_ASSIGNMENTS_BY_UNIT = /* GraphQL */ `
  query ListAssignmentsByUnitIds($unitID: ID!, $nextToken: String) {
    listAssignments(
      filter: { unitID: { eq: $unitID } }
      limit: ${PAGE_LIMIT}
      nextToken: $nextToken
    ) {
      items {
        sectionID
      }
      nextToken
    }
  }
`;

const LIST_ASSIGNMENTS_BY_SECTION = /* GraphQL */ `
  query ListAssignmentsBySectionIds($sectionID: ID!, $nextToken: String) {
    listAssignments(
      filter: { sectionID: { eq: $sectionID } }
      limit: ${PAGE_LIMIT}
      nextToken: $nextToken
    ) {
      items {
        unitID
      }
      nextToken
    }
  }
`;

/** Follows nextToken until the list is exhausted, dropping null entries. */
async function listAll(
  graphql: Graphql,
  query: string,
  field: string,
  variables: Record<string, unknown>,
): Promise<any[]> {
  const items: any[] = [];
  let nextToken: string | null = null;
  do {
    const response: any = await graphql({
      query,
      variables: { ...variables, nextToken },
    });
    const page = response?.data?.[field];
    // A silent empty list would publish a bundle that is missing the unit's content.
    if (!page && response?.errors?.length) {
      throw new Error(`${field} failed: ${response.errors[0]?.message}`);
    }
    for (const item of page?.items ?? []) {
      if (item) items.push(item);
    }
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return items;
}

const ids = (items: any[], field: string): string[] =>
  items.filter((item) => item.deletedAt == null).map((item) => item[field]);

/** The words, questions and files the unit currently uses. */
export async function listUnitMembers(
  graphql: Graphql,
  unitId: string,
): Promise<Required<UnitMembers>> {
  const [words, questions, files] = await Promise.all([
    listAll(graphql, LIST_UNIT_WORD_IDS, "listUnitWords", { unitID: unitId }),
    listAll(graphql, LIST_QUESTION_UNIT_IDS, "listQuestionUnits", {
      unitID: unitId,
    }),
    listAll(graphql, LIST_UNIT_FILE_IDS, "listUnitFiles", { unitID: unitId }),
  ]);
  return {
    word: ids(words, "wordID"),
    question: ids(questions, "questionID"),
    file: ids(files, "fileID"),
  };
}

/** Every section that assigns the unit, with all the units each one assigns. */
export async function listSectionUnits(
  graphql: Graphql,
  unitId: string,
): Promise<SectionUnits[]> {
  const byUnit = await listAll(
    graphql,
    LIST_ASSIGNMENTS_BY_UNIT,
    "listAssignments",
    { unitID: unitId },
  );
  const sectionIds = [
    ...new Set(byUnit.map((item) => item.sectionID).filter(Boolean)),
  ] as string[];

  return Promise.all(
    sectionIds.map(async (sectionId) => {
      const assignments = await listAll(
        graphql,
        LIST_ASSIGNMENTS_BY_SECTION,
        "listAssignments",
        { sectionID: sectionId },
      );
      const unitIds = assignments.map((item) => item.unitID).filter(Boolean);
      return { sectionId, unitIds: [...new Set<string>([...unitIds, unitId])] };
    }),
  );
}

export interface SearchBundleRequest {
  source: "unit-publish";
  identityId: string;
  unitId: string;
  unitName?: string;
  members: UnitMembers;
  sections: SectionUnits[];
}

export async function buildSearchBundleRequest(
  graphql: Graphql,
  unit: { id: string; name?: string | null; identityId: string },
): Promise<SearchBundleRequest> {
  const [members, sections] = await Promise.all([
    listUnitMembers(graphql, unit.id),
    listSectionUnits(graphql, unit.id),
  ]);
  return {
    source: "unit-publish",
    identityId: unit.identityId,
    unitId: unit.id,
    unitName: unit.name ?? undefined,
    members,
    sections,
  };
}
