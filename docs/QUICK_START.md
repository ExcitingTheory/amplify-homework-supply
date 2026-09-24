# Homework Supply — Quick Start

Choose the lowest-friction path that fits your goal. The live demo and Storybook require no local setup.

## 1. Just look

- [Live demo](https://www.homework.supply) — try the application.
- [Storybook](https://excitingtheory.github.io/amplify-homework-supply) — browse the component library and interactive documentation.

## 2. Run in the cloud

Use your own AWS account for the backend. The Amplify Sandbox creates an isolated development environment with DynamoDB, Cognito, S3, Lambda, and AppSync resources; AWS credentials are never supplied by the project.

You need Node.js 20.9 or later, AWS CLI credentials or SSO configured for your account, and an available AWS region. From a local checkout or your own cloud development environment, run:

```bash
npx ampx sandbox --stream-function-logs
```

Keep the sandbox running while developing. It generates the local `amplify_outputs.json` connection configuration used by the application. This repository does not provide a devcontainer; Codespaces users must configure their own Node.js toolchain and AWS credentials.

## 3. Run locally

Use Node.js 20.9 or later, then clone and install the project:

```bash
git clone https://github.com/ExcitingTheory/amplify-homework-supply.git
cd amplify-homework-supply
nvm use
npm install
```

Create `.env.local` with the server-side OpenAI key when working on AI features:

```bash
OPENAI_API_KEY=your_key_here
```

AWS credentials are handled through SSO. Ask a maintainer for the SSO URL and profile configuration before starting a sandbox:

```bash
npx ampx sandbox --stream-function-logs
```

In another terminal, start the application. The Next.js server uses HTTPS on port 3000; the collaborative Yjs server uses port 3001 when started by the development command.

```bash
npm run dev
```

The app is available at `https://localhost:3000`. Storybook runs independently on port 6006 and does not require AWS:

```bash
npm run storybook
```

See [Developer Onboarding](./ONBOARDING.md) for environment and AWS details.

## 4. Pick a task

- [Good first issues](https://github.com/ExcitingTheory/amplify-homework-supply/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Homework Supply Project board](https://github.com/orgs/ExcitingTheory/projects/1/views/1?sliceBy%5BcolumnId%5D=Labels)
- [Contributing guide](../CONTRIBUTING.md)

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run storybook` | Storybook component explorer |
| `npm run test:unit` | Run unit tests (vitest) |
| `npm run test:integration` | Run integration tests |
| `npm run test:storybook` | Run Storybook render tests |
| `npm run e2e` | Playwright browser tests |
| `npm run sandbox:with-logs` | Amplify sandbox with logging |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Running Tests

```bash
# Unit tests
npm run test:unit

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration

# Storybook component tests
npm run test:storybook

# E2E (requires dev server + sandbox running)
npm run e2e
```

## Collaborative Editing (Yjs)

To develop with real-time collaboration features:

```bash
npm run dev:collab
```

This starts both the Yjs WebSocket server and Next.js together.

## 🌐 Key URLs

### Production Environment
- **Live Application**: <TBD: Add production URL>

### Development Resources
- **GitHub Repository**: <https://github.com/ExcitingTheory/amplify-homework-supply>
- **Documentation**: <https://excitingtheory.github.io/amplify-homework-supply/>

## 📬 Communication & Support

### Primary Contact
- **Email**: [info@homework.supply](mailto:info@homework.supply)
- **Discord**: [Join Discord](https://discord.gg/BNsTK6nvYw)

### Getting Help
- **Quick Questions**: Team chat (Discord) or email
- **Detailed Issues**: Create a GitHub issue in the repository
- **Bug Reports**: [GitHub Issues](https://github.com/ExcitingTheory/amplify-homework-supply/issues)
- **Security Issues**: info@homework.supply (see [SECURITY.md](https://github.com/ExcitingTheory/amplify-homework-supply/blob/main/SECURITY.md))

