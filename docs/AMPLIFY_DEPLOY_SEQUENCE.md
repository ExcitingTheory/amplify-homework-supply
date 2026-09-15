# Amplify deploy sequencing for large schema stacks

## Problem

The sandbox deploy of the full Amplify schema occasionally fails with AppSync control-plane throttling during nested-stack and resolver creation. The failure pattern is consistent with AppSync rate limiting on concurrent `CreateResolver` and `CreateFunction` operations, even when the nested stacks themselves have been partially throttled.

This is not a circular-dependency bug in the normal sense. The code keeps the dependency graph safe by never adding an artificial edge between two model stacks that are in the same connected component of the schema relation graph.

## Safety rule

The deployment logic intentionally only adds an artificial dependency when two model stacks belong to different connected components:

- same component: do not chain
- different component: safe to throttle

This avoids conflicts with CDK-inferred cross-stack references created by real `hasMany`, `hasOne`, `belongsTo`, and `manyToMany` relations.

### Intra-stack throttle (same model, same nested stack)

The cross-component rule above has a blind spot: a single model's own resolvers and functions all live in one nested stack (one connected component), so they were never chained against each other and fired every `CreateResolver` / `CreateFunction` call for that model concurrently. This was the source of residual 429s on resources like `AssistantChatownerResolver`, `AssistantChatembeddingResolver`, and `DocumentwritableGroupsResolver`.

To fix this, the deploy logic also chains same-typed control-plane resources **within** each nested stack, collapsing each stack's burst from ~N simultaneous calls down to one at a time. This is provably acyclic because it:

- adds **no cross-stack edges**, so it cannot conflict with relation-inferred nested-stack dependencies; and
- only chains resources of the **same type** (`Resolver`↔`Resolver`, `FunctionConfiguration`↔`FunctionConfiguration`), which never depend on one another. A resolver's dependency on its own pipeline functions is cross-type and is left untouched.

## Sequence tuning knobs

The deploy logic in [amplify/backend.ts](../amplify/backend.ts) reads three environment overrides:

- `AMPLIFY_MODEL_WAVE_SIZE` — nested-stack creation cadence (cross-component only)
- `AMPLIFY_RESOLVER_WAVE_SIZE` — resolver/function creation cadence (cross-component only)
- `AMPLIFY_INTRA_STACK_WAVE_SIZE` — same-model resolver/function creation cadence (within a single nested stack)

The defaults are intentionally conservative:

```bash
AMPLIFY_MODEL_WAVE_SIZE=1
AMPLIFY_RESOLVER_WAVE_SIZE=1
AMPLIFY_INTRA_STACK_WAVE_SIZE=1
```

This reduces the create burst to a near-serial cadence while still respecting the graph-safe ordering rule.

## Why this is the right mitigation

The earlier 2- and 3-step wave sizes still produced the same AppSync 429 pattern, which indicates the issue is a burst ceiling rather than a mild scheduling issue. Lowering the effective wave to 1 reduces peak concurrency without creating any circular dependency conflicts.

## Recommended deploy procedure

When retrying a large sandbox deploy, use:

```bash
AMPLIFY_MODEL_WAVE_SIZE=1 AMPLIFY_RESOLVER_WAVE_SIZE=1 AMPLIFY_INTRA_STACK_WAVE_SIZE=1 npx ampx sandbox
```

If the deploy still hits AppSync throttling:

1. inspect the latest stack events with CloudFormation
2. confirm the failing resource types are `AWS::AppSync::Resolver` and `AWS::AppSync::FunctionConfiguration`
3. keep the same graph-safe rule and continue reducing concurrency in small increments
4. if needed, fall back to a bootstrap-phase deploy strategy instead of a monolithic from-scratch deploy

## Related files

- [amplify/backend.ts](../amplify/backend.ts)
- [amplify/custom/dataStackWaveOrder/resource.ts](../amplify/custom/dataStackWaveOrder/resource.ts)
- [amplify/data/resource.ts](../amplify/data/resource.ts)

## Notes

This sequence is a deploy mitigation, not a schema fix. It reduces pressure on the AppSync control plane while preserving correct dependency ordering.
