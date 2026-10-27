/**
 * A small in-memory GraphQL schema for the recycle bin tests, answering the
 * introspection query the handler uses to learn a model's fields.
 */

type Wrap = "list" | "required";

interface FieldSpec {
  name: string;
  /** SCALAR, ENUM or OBJECT */
  kind: "SCALAR" | "ENUM" | "OBJECT";
  type: string;
  wrap?: Wrap[];
}

export interface TypeSpec {
  fields?: FieldSpec[];
  inputFields?: string[];
}

export const scalar = (name: string, type = "String", wrap?: Wrap[]): FieldSpec => ({
  name,
  kind: "SCALAR",
  type,
  wrap,
});
export const object = (name: string, type: string, wrap?: Wrap[]): FieldSpec => ({
  name,
  kind: "OBJECT",
  type,
  wrap,
});

function typeRef(field: FieldSpec) {
  let ref: any = { kind: field.kind, name: field.type, ofType: null };
  for (const wrapper of field.wrap ?? []) {
    ref = { kind: wrapper === "list" ? "LIST" : "NON_NULL", name: null, ofType: ref };
  }
  return ref;
}

/** The fields every model has, as the API adds them. */
export const modelBase = (): FieldSpec[] => [
  scalar("id", "ID", ["required"]),
  scalar("createdAt", "AWSDateTime", ["required"]),
  scalar("updatedAt", "AWSDateTime", ["required"]),
];

export const SCHEMA: Record<string, TypeSpec> = {
  Unit: {
    fields: [
      scalar("owner"),
      scalar("name"),
      scalar("_version", "Int"),
      scalar("deletedAt", "AWSDateTime"),
      scalar("deletedBy"),
      scalar("tags", "String", ["list"]),
      // A custom type nested in the record
      object("settings", "UnitSettings"),
      // A relation to another model, and a connection of related models
      object("section", "Section"),
      object("unitFiles", "ModelUnitFileConnection"),
      ...modelBase(),
    ],
  },
  UnitSettings: { fields: [scalar("mode"), object("palette", "UnitPalette")] },
  UnitPalette: { fields: [scalar("primary")] },
  Section: { fields: [scalar("name"), ...modelBase()] },
  ModelUnitFileConnection: { fields: [scalar("nextToken")] },
  CreateUnitInput: {
    inputFields: ["id", "owner", "name", "_version", "deletedAt", "deletedBy", "tags", "settings"],
  },

  Document: {
    fields: [
      scalar("owner"),
      scalar("filename"),
      scalar("deletedAt", "AWSDateTime"),
      scalar("deletedBy"),
      ...modelBase(),
    ],
  },
  CreateDocumentInput: { inputFields: ["id", "owner", "filename", "deletedAt", "deletedBy"] },

  ParsedContent: {
    fields: [
      scalar("owner"),
      scalar("documentID", "ID", ["required"]),
      object("document", "Document"),
      scalar("chunkIndex", "Int"),
      scalar("chunkCount", "Int"),
      object("questionsJSON", "QuestionEntry", ["list"]),
      ...modelBase(),
    ],
  },
  QuestionEntry: { fields: [scalar("prompt"), scalar("answer"), scalar("page", "Int")] },
  CreateParsedContentInput: {
    inputFields: ["id", "owner", "documentID", "chunkIndex", "chunkCount", "questionsJSON"],
  },

  DocumentQuestion: {
    fields: [
      scalar("owner"),
      scalar("documentID", "ID", ["required"]),
      scalar("questionID", "ID", ["required"]),
      scalar("page", "Int"),
      scalar("sourceText"),
      scalar("entryKey"),
      scalar("deletedAt", "AWSDateTime"),
      ...modelBase(),
    ],
  },
  CreateDocumentQuestionInput: {
    inputFields: ["id", "owner", "documentID", "questionID", "page", "sourceText", "entryKey", "deletedAt"],
  },
  DocumentWord: {
    fields: [
      scalar("owner"),
      scalar("documentID", "ID", ["required"]),
      scalar("wordID", "ID", ["required"]),
      scalar("page", "Int"),
      scalar("deletedAt", "AWSDateTime"),
      ...modelBase(),
    ],
  },
  CreateDocumentWordInput: {
    inputFields: ["id", "owner", "documentID", "wordID", "page", "deletedAt"],
  },
  File: {
    fields: [
      scalar("owner"),
      scalar("name"),
      scalar("documentID"),
      scalar("deletedAt", "AWSDateTime"),
      scalar("deletedBy"),
      ...modelBase(),
    ],
  },
  WordFile: {
    fields: [scalar("owner"), scalar("fileID"), scalar("wordID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  QuestionFile: {
    fields: [scalar("owner"), scalar("fileID"), scalar("questionID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  AssistantChatFile: {
    fields: [scalar("owner"), scalar("fileID"), scalar("chatID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  UnitFile: {
    fields: [scalar("owner"), scalar("unitID"), scalar("fileID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  UnitWord: {
    fields: [scalar("owner"), scalar("unitID"), scalar("wordID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  QuestionUnit: {
    fields: [scalar("owner"), scalar("unitID"), scalar("questionID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
  UnitDocument: {
    fields: [scalar("owner"), scalar("documentID"), scalar("unitID"), scalar("deletedAt", "AWSDateTime"), ...modelBase()],
  },
};

/** Answers the recycle bin's `__type` query from SCHEMA. */
export function introspectionResult(name: string): { __type: unknown } {
  const spec = SCHEMA[name];
  if (!spec) return { __type: null };
  return {
    __type: {
      fields: spec.fields?.map((field) => ({ name: field.name, type: typeRef(field) })) ?? null,
      inputFields: spec.inputFields?.map((fieldName) => ({ name: fieldName })) ?? null,
    },
  };
}
