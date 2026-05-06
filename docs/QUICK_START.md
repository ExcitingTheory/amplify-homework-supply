# Homework Supply — Quick Start

Essential links and resources for getting started with Homework Supply. Homework Supply is a platform for creating and managing interactive learning content.

## Setup Steps

### 1. Clone & Install

```bash
git clone https://github.com/ExcitingTheory/amplify-homework-supply.git
cd amplify-homework-supply
npm install
```

### 2. Environment Configuration

Create a `.env.local` file at the project root:

```bash
OPENAI_API_KEY=your_key_here
```

AWS credentials are handled via SSO — ask your team lead for the SSO URL and profile config.

### 3. Start the Amplify Sandbox (Backend)

```bash
npx ampx sandbox --stream-function-logs
```

This deploys a personal cloud sandbox with DynamoDB, Cognito, S3, and Lambda. It generates `amplify_outputs.json` automatically.

### 4. Start the Dev Server

In a separate terminal:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 5. Start Storybook (Component Development)

```bash
npm run storybook
```

Storybook runs at `http://localhost:6006`. Mocks are pre-configured — no AWS needed.

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run storybook` | Storybook component explorer |
| `npm run test:unit` | Run unit tests (vitest) |
| `npm run test:integration` | Run integration tests |
| `npm run test:storybook` | Run Storybook render tests |
| `npm run cypress:open` | Cypress E2E test runner |
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
npm run cypress:open
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
- **Email**: [info@homework.supply.com](mailto:info@homework.supply.com)
- **Discord**: [Join Discord](https://discord.gg/BNsTK6nvYw)

### Getting Help
- **Quick Questions**: Team chat (Discord) or email
- **Detailed Issues**: Create a GitHub issue in the repository
- **Bug Reports**: [GitHub Issues](https://github.com/ExcitingTheory/amplify-homework-supply/issues)
- **Security Issues**: info@homework.supply.com (see [SECURITY.md](https://github.com/ExcitingTheory/amplify-homework-supply/blob/main/SECURITY.md))

