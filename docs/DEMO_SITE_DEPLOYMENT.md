# Demo site deployment (demo.homework.supply)

The demo site runs the same code as production but is configured differently so visitors can sign in as seeded users. This page lists exactly what differs and the steps to deploy, seed, and reset it.

> Items marked **Confirm** could not be verified from the repository (they depend on the Amplify console setup). Fill them in after checking, and delete the marker.

## What differs from production

| Concern | Production | Demo |
| --- | --- | --- |
| Code | `main` | **Confirm:** same `main` build on a separate Amplify branch/app, or a dedicated demo branch |
| Backend | Production backend (real users) | Its own backend (own Cognito user pool, DynamoDB tables). Never share it with production |
| `NEXT_PUBLIC_DEMO_QUICK_LOGIN` | unset | `true` (shows the "Try a demo account" card and enables `/api/dev/quick-login`) |
| `TEST_USER_PASSWORD_SEED` | unset | set to a private random value (derives each seeded user's password) |
| Data | Real user data | Disposable seeded data; wiped on every re-seed |

Everything else (`amplify.yml`, build commands, backend pipeline deploy) is shared.

## How the demo login works

- [AmplifyAuthenticator.jsx](../src/components/AmplifyAuthenticator.jsx) shows a two-column layout (demo user card + normal sign-in) when [/api/dev/quick-login](../app/api/dev/quick-login/route.ts) returns users. With no users it shows only the normal sign-in form.
- The route is enabled when `NODE_ENV === "development"` **or** `NEXT_PUBLIC_DEMO_QUICK_LOGIN === "true"`. Otherwise it returns 404.
- Selecting a user makes the route return that user's password, derived from `TEST_USER_PASSWORD_SEED` by [test/devCredentials.ts](../test/devCredentials.ts). The browser then signs in with it.
- The user list in the route must stay in sync with `TEST_USERS` in [amplify/seed/seed.ts](../amplify/seed/seed.ts).

Security consequence: anyone who can reach the demo site can obtain these users' passwords. Only enable the flag on a deployment whose backend holds nothing but disposable demo data, and never reuse the seed value from production or from another environment.

## Environment variables (Amplify console, demo branch only)

Set these under **Hosting > Environment variables**, scoped to the demo branch:

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_QUICK_LOGIN` | `true` | Inlined at **build time**; changing it requires a new build |
| `TEST_USER_PASSWORD_SEED` | random secret | Must exactly match the value used when seeding |

**Confirm:** `TEST_USER_PASSWORD_SEED` is read at request time by the API route. Amplify Hosting exposes console variables to the build, not automatically to the SSR runtime. If the picker shows nothing on the deployed demo and the route returns a "TEST_USER_PASSWORD_SEED is required" error (HTTP 500), the variable is not reaching the runtime and the build needs to write it into the server environment. See [Amplify: environment variables for Next.js SSR](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html). Changing [amplify.yml](../amplify.yml) requires explicit approval.

## Deploy

1. Merge/push to the demo branch. Amplify runs `amplify.yml`: backend `pipeline-deploy` via `scripts/deploy-bootstrap.mjs`, then `npm run build`.
2. Confirm the build used the env vars above (they must be set before the build starts).
3. First deploy of a brand-new demo backend: seed it (next section) before testing login.

## Seed (or reset) the demo backend

The seed script reads `amplify_outputs.json` from the repo root, so it targets whatever backend that file describes. It **wipes every DynamoDB table of the target API first**, then recreates users, groups, curriculum, sections, grades, and chat data.

1. Back up your local `amplify_outputs.json` (it normally points at your personal sandbox).
2. Generate outputs for the demo backend (needs AWS credentials for the account hosting it):

   ```bash
   npx ampx generate outputs --app-id <AMPLIFY_APP_ID> --branch <demo-branch>
   ```

3. Confirm the generated file points at the demo backend, not production (check `auth.user_pool_id` and `data.url` against the Amplify console).
4. Seed with the same secret set on the demo branch:

   ```bash
   export TEST_USER_PASSWORD_SEED='<same value as the demo branch>'
   npx ampx sandbox seed
   ```

   **Confirm:** `ampx sandbox seed` may require a running sandbox. If it refuses, run the script directly with `npx tsx amplify/seed/seed.ts` using the same environment and AWS credentials.
5. Restore your own `amplify_outputs.json`.
6. Verify: open the demo site signed out and confirm the "Try a demo account" card lists Admin, Instructor and Student users, then sign in as one.

Re-run steps 2-5 whenever demo data should be reset, or after rotating `TEST_USER_PASSWORD_SEED` (update the Amplify variable, rebuild, and re-seed so Cognito passwords match).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| No demo card, only sign-in form | `NEXT_PUBLIC_DEMO_QUICK_LOGIN` not set at build time, or `/api/dev/quick-login` returns an error (check the network tab) |
| Card shows but sign-in fails | Seed secret on the branch differs from the one used to seed, or the backend was never seeded |
| Route returns 500 "TEST_USER_PASSWORD_SEED is required" | Variable not available to the SSR runtime (see **Confirm** above) |
| Route returns 404 | Flag not enabled for this build |
| User list differs from seeded users | Route's `QUICK_LOGIN_USERS` and seed `TEST_USERS` drifted |

## Related files

- [AmplifyAuthenticator.jsx](../src/components/AmplifyAuthenticator.jsx)
- [app/api/dev/quick-login/route.ts](../app/api/dev/quick-login/route.ts)
- [amplify/seed/seed.ts](../amplify/seed/seed.ts) and [amplify/seed/README.md](../amplify/seed/README.md)
- [AMPLIFY_DEPLOY_SEQUENCE.md](./AMPLIFY_DEPLOY_SEQUENCE.md)
