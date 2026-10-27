/**
 * Field lists for the recycle bin, read from the API's own schema so that an
 * archive holds every stored field of a record and unarchiving only sends
 * fields the create mutation accepts. Nothing here is hand-maintained, so a new
 * model field is archived without a change to the recycle bin.
 */

/** Runs a GraphQL document and returns its `data`. */
export type RunGraphql = (
  query: string,
  variables?: Record<string, unknown>,
) => Promise<any>;

interface TypeRef {
  kind: string;
  name: string | null;
  ofType: TypeRef | null;
}

interface IntrospectedType {
  fields: Array<{ name: string; type: TypeRef }>;
  inputFields: Array<{ name: string }>;
}

const TYPE_QUERY = /* GraphQL */ `
  query RecycleBinType($name: String!) {
    __type(name: $name) {
      fields {
        name
        type {
          kind name
          ofType { kind name ofType { kind name ofType { kind name } } }
        }
      }
      inputFields { name }
    }
  }
`;

/** Custom types nest this deep at most; a relation back to a model is skipped. */
const MAX_DEPTH = 3;

const typeCache = new Map<string, Promise<IntrospectedType>>();
const selectionCache = new Map<string, Promise<string>>();
const inputCache = new Map<string, Promise<ReadonlySet<string>>>();

/** Forgets what was learned about the schema (for tests). */
export function clearSchemaCache(): void {
  typeCache.clear();
  selectionCache.clear();
  inputCache.clear();
}

function memoize<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = load().catch((error) => {
    // Do not keep a failure: the next call asks again
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

function introspect(run: RunGraphql, name: string): Promise<IntrospectedType> {
  return memoize(typeCache, name, async () => {
    const data = await run(TYPE_QUERY, { name });
    const type = data?.__type;
    if (!type) throw new Error(`Type ${name} is not in the schema`);
    return { fields: type.fields ?? [], inputFields: type.inputFields ?? [] };
  });
}

function namedType(ref: TypeRef): { kind: string; name: string | null } {
  let current = ref;
  while (current.ofType) current = current.ofType;
  return { kind: current.kind, name: current.name };
}

/** A model type has the timestamps and id the API adds to every model. */
function isModelType(type: IntrospectedType): boolean {
  const names = new Set(type.fields.map((field) => field.name));
  return names.has("id") && names.has("createdAt") && names.has("updatedAt");
}

async function buildSelection(run: RunGraphql, typeName: string, depth: number): Promise<string> {
  const type = await introspect(run, typeName);
  const parts: string[] = [];

  for (const field of type.fields) {
    const { kind, name } = namedType(field.type);
    if (kind === "SCALAR" || kind === "ENUM") {
      parts.push(field.name);
      continue;
    }
    if (kind !== "OBJECT" || !name || name.endsWith("Connection") || depth >= MAX_DEPTH) continue;

    // A relation to another model is not part of this record
    if (isModelType(await introspect(run, name))) continue;
    const nested = await buildSelection(run, name, depth + 1);
    if (nested) parts.push(`${field.name} { ${nested} }`);
  }
  return parts.join(" ");
}

/** Every stored field of a model, as a GraphQL selection (without relations). */
export function modelSelection(run: RunGraphql, modelName: string): Promise<string> {
  return memoize(selectionCache, modelName, () => buildSelection(run, modelName, 0));
}

/** The fields the create mutation for a model accepts. */
export function createInputFields(run: RunGraphql, modelName: string): Promise<ReadonlySet<string>> {
  return memoize(inputCache, modelName, async () => {
    const type = await introspect(run, `Create${modelName}Input`);
    return new Set(type.inputFields.map((field) => field.name));
  });
}

/** A copy of `record` holding only the fields in `allowed`. */
export function pickInputFields(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => allowed.has(key)));
}
