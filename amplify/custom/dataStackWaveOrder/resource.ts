/**
 * Computes which Data models are structurally isolated (no hasMany/hasOne/
 * belongsTo/manyToMany relation to any other model) by parsing the schema
 * source. Only stacks for isolated models are safe to chain arbitrarily to
 * throttle AppSync 429s during nested-stack creation — chaining models that
 * participate in a relation risks conflicting with the cross-stack
 * dependency CDK infers automatically from that relation, which caused a
 * CloudFormation "Circular dependency between resources" failure previously.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_DECL_RE = /^\s{4}(\w+):\s*a\s*$/;
const RELATION_RE = /a\.(?:hasMany|hasOne|belongsTo|manyToMany)\(\s*"(\w+)"/g;

/**
 * Returns the set of model names that have zero relation fields pointing
 * to (or from) any other model in amplify/data/resource.ts.
 *
 * Only `Key: a` declarations immediately followed by `.model({` are treated
 * as models — `a.mutation()`/`a.query()` custom operations use the same
 * `Key: a` syntax but must never be counted here (callers may delete
 * "isolated" entries from the schema object outright).
 */
export function findIsolatedModelNames(): Set<string> {
  const schemaPath = path.resolve(__dirname, "../../data/resource.ts");
  const source = fs.readFileSync(schemaPath, "utf-8");
  const lines = source.split("\n");

  const allModels = new Set<string>();
  const relatedModels = new Set<string>();
  let currentModel: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const declMatch = lines[i].match(MODEL_DECL_RE);
    if (declMatch) {
      let next = i + 1;
      while (next < lines.length && lines[next].trim() === "") next++;
      if (lines[next]?.trim().startsWith(".model(")) {
        currentModel = declMatch[1];
        allModels.add(currentModel);
      } else {
        // Inside a.mutation()/a.query()/a.subscription() — not a model.
        currentModel = null;
      }
      continue;
    }
    if (!currentModel) continue;

    let match: RegExpExecArray | null;
    RELATION_RE.lastIndex = 0;
    while ((match = RELATION_RE.exec(lines[i]))) {
      relatedModels.add(currentModel);
      relatedModels.add(match[1]);
    }
  }

  const isolated = new Set<string>();
  for (const model of allModels) {
    if (!relatedModels.has(model)) isolated.add(model);
  }
  return isolated;
}

/** Extracts the model name from a nested stack construct id like "Unit.NestedStack". */
export function modelNameFromStackId(stackId: string): string | null {
  const match = stackId.match(/^(\w+)\.NestedStack$/);
  return match ? match[1] : null;
}

/**
 * Returns a map of every model name to a connected-component id, where two
 * models share a component iff there is a path of hasMany/hasOne/belongsTo/
 * manyToMany relations between them. Isolated models (see above) are each
 * their own singleton component.
 *
 * Safe to add an artificial `addDependency` edge between two nested stacks
 * ONLY when their models fall in different components — same-component
 * models may have a real CDK-inferred cross-stack dependency in either
 * direction, and an artificial edge could conflict with it (circular
 * dependency). Cross-component pairs can never have such a conflict by
 * definition (no relation path connects them).
 */
export function computeModelComponents(): Map<string, string> {
  const schemaPath = path.resolve(__dirname, "../../data/resource.ts");
  const source = fs.readFileSync(schemaPath, "utf-8");
  const lines = source.split("\n");

  const parent = new Map<string, string>();
  const find = (m: string): string => {
    let root = m;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = m;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const ensure = (m: string): void => {
    if (!parent.has(m)) parent.set(m, m);
  };

  let currentModel: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const declMatch = lines[i].match(MODEL_DECL_RE);
    if (declMatch) {
      let next = i + 1;
      while (next < lines.length && lines[next].trim() === "") next++;
      if (lines[next]?.trim().startsWith(".model(")) {
        currentModel = declMatch[1];
        ensure(currentModel);
      } else {
        currentModel = null;
      }
      continue;
    }
    if (!currentModel) continue;

    let match: RegExpExecArray | null;
    RELATION_RE.lastIndex = 0;
    while ((match = RELATION_RE.exec(lines[i]))) {
      ensure(match[1]);
      union(currentModel, match[1]);
    }
  }

  const components = new Map<string, string>();
  for (const model of parent.keys()) components.set(model, find(model));
  return components;
}
