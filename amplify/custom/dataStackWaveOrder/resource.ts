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

const MODEL_DECL_RE = /^\s{2}(\w+):\s*a\s*$/;
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

/**
 * Splits all models into `numPhases` cumulative sets for a multi-phase
 * bootstrap deploy, staying under CloudFormation's per-operation resource
 * cap on a from-scratch deploy of this schema's full model set.
 *
 * A connected component (see computeModelComponents) is NEVER split across
 * phases — models within a component may structurally depend on each other
 * (join tables, relation fields), so they must all exist by the time any
 * one of them is deployed. Components are greedily bin-packed by model
 * count into `numPhases` roughly-equal buckets (largest-first), then each
 * returned set is the CUMULATIVE union of all buckets up to and including
 * that phase — phase K's schema is a strict superset of phase K-1's, so
 * later phases only ever ADD models, never remove ones already deployed.
 *
 * Returns an array of length `numPhases`; element i (0-indexed) is the set
 * of model names to include when deploying phase i+1.
 */
export function computeBootstrapPhases(numPhases: number): Set<string>[] {
  if (numPhases < 1) {
    throw new Error("computeBootstrapPhases: numPhases must be >= 1");
  }

  const modelComponents = computeModelComponents();
  const membersByComponent = new Map<string, string[]>();
  for (const [model, componentId] of modelComponents) {
    if (!membersByComponent.has(componentId)) {
      membersByComponent.set(componentId, []);
    }
    membersByComponent.get(componentId)!.push(model);
  }

  const componentsBySizeDesc = [...membersByComponent.values()].sort(
    (a, b) => b.length - a.length,
  );

  const buckets: string[][] = Array.from({ length: numPhases }, () => []);
  const bucketSizes = new Array(numPhases).fill(0);
  for (const component of componentsBySizeDesc) {
    let smallestIdx = 0;
    for (let i = 1; i < numPhases; i++) {
      if (bucketSizes[i] < bucketSizes[smallestIdx]) smallestIdx = i;
    }
    buckets[smallestIdx].push(...component);
    bucketSizes[smallestIdx] += component.length;
  }

  const cumulative: Set<string>[] = [];
  const running = new Set<string>();
  for (const bucket of buckets) {
    for (const model of bucket) running.add(model);
    cumulative.push(new Set(running));
  }
  return cumulative;
}
