# Amplify Backend Guide

Changes under `amplify/` are production/infrastructure changes and require user confirmation. Schema changes require explicit permission; never deploy them automatically.

- Treat `data/resource.ts` as the model and authorization source of truth. Do not infer fields from old docs or generated output.
- Verify `_version` per model before using it in client or Lambda inputs. It exists only where the schema declares it.
- Preserve owner and group authorization behavior. Do not duplicate an owner constraint in subscription filters.
- Lambda updates that use optimistic concurrency must first query the current `_version` and send it with the mutation.
- Keep secrets in Amplify/AWS secret management; never expose keys to frontend code or logs.
- Prefer existing backend constructs and function patterns. Avoid adding arbitrary CloudFormation dependencies between related data stacks.
- For a new sandbox, use `npm run sandbox:bootstrap`; the phased bootstrap exists because a single full first deploy can exceed CloudFormation operation limits. Do not run sandbox/deploy/delete commands without explicit approval.
- After a deployed schema or subscription change, restart the Next.js development server; subscription changes are not reliably hot-reloaded.

Validate functions with their nearest unit test and TypeScript project. A local typecheck does not authorize or replace an infrastructure deployment.
