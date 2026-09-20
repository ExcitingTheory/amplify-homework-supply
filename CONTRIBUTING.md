# Contributing to Homework Supply

Thank you for helping improve Homework Supply. The project is an e-learning platform built with Next.js, AWS Amplify Gen 2, Material UI, Lexical, and AI-assisted learning tools.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) in issues, pull requests, reviews, and other project spaces.

## Ways To Contribute

Contributions are welcome across the project, including:

- UI and UX components built with React and Material UI
- Storybook documentation and interaction coverage
- AI prompts, feedback workflows, and Phoenix observability
- Localization, accessibility, and assistive-technology support
- Unit, integration, Storybook, performance, and end-to-end testing
- Developer, API, and user documentation
- Bug reports, feature proposals, and community support
- Performance, security, CI/CD, and infrastructure improvements
- Incremental TypeScript migration and stronger type safety

## Before You Start

- Use Node.js 20.9 or later. This is the minimum required by the installed Next.js version.
- Install dependencies with `npm install`.
- Read [Developer Onboarding](docs/ONBOARDING.md) for environment and AWS access details.
- Never commit credentials or `.env` files. Backend and AI work may require access provided by a maintainer.
- For a focused contribution, run only the services needed for the change.

```bash
npm run dev       # Next.js and local Yjs collaboration services
npm run storybook # Storybook on port 6006
```

Do not deploy Amplify resources from a contribution branch unless a maintainer has explicitly coordinated the infrastructure change.

## Development Workflow

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/amplify-homework-supply.git
   cd amplify-homework-supply
   ```

2. Create a focused branch:

   ```bash
   git checkout -b feature/descriptive-name
   ```

3. Make the smallest coherent change and add appropriate coverage.
4. Run the narrowest relevant checks, then any broader checks required by the affected area.
5. Commit using a concise [Conventional Commit](https://www.conventionalcommits.org/) message and push your branch.
6. Open a pull request against `main`, complete the template, and link related issues.

Keep unrelated formatting, generated files, dependency updates, and refactors out of the pull request.

## Engineering Standards

### TypeScript And Code Style

- New components and other new production modules must use TypeScript and define explicit public interfaces.
- The repository is undergoing a gradual TypeScript migration, and legacy JavaScript remains. Improve nearby types when that work is necessary for the change, but do not turn a focused contribution into an unrelated bulk conversion.
- Do not introduce `any`. When an external boundary cannot be typed precisely, use `unknown` and narrow it.
- Follow nearby patterns and the repository ESLint configuration. The project does not currently define a Prettier configuration.
- Prefer meaningful names and self-explanatory code. Comment only where intent or constraints are not evident from the implementation.

### Components And State

- For substantial components, define the TypeScript prop interface and list the applicable Storybook variants before implementing the layout. Confirm uncertain fields against a real call site, schema, or canonical mock.
- Keep view components deterministic and prop-driven. When a feature needs context, subscriptions, routing, or other global state, separate that work into a thin container or wrapper and pass typed values and callbacks to the view.
- Existing components do not all follow this split. Prefer moving touched code toward it without forcing unrelated rewrites.
- Use existing React contexts for shared application data. Do not create duplicate Amplify subscriptions for data already owned by a provider.
- Extract custom hooks when stateful behavior is reusable, independently testable, or meaningfully simplifies the component. Avoid one-off hook abstractions that only move code elsewhere.
- Follow the established Material UI design language and preserve keyboard, screen-reader, responsive, loading, empty, and error behavior.
- Put user-facing text behind the existing internationalization system.

### Storybook

- Every new component or layout variant must include a corresponding `.stories.tsx` file.
- Cover every applicable state, including empty, loading, error, success, responsive, and interaction states. Do not invent states the component cannot enter.
- Use Storybook loaders and repository mocks for data setup. Add `play` coverage for important user interactions.
- Keep mock objects structure-only and limited to fields the story exercises. Reuse fixture builders or canonical mocks instead of embedding large raw OpenAI or API responses.
- Treat story titles as stable identifiers because onboarding tasks may reference generated story IDs.

### Data, APIs, And AI

- Type, validate, test, and document API boundaries and failure behavior.
- Keep OpenAI and AWS credentials in server-side secret management; never expose them to browser code.
- Verify the model definition in `amplify/data/resource.ts` before relying on fields, authorization, or optimistic-versioning behavior.
- For AI behavior changes, include representative evaluation cases and consider their observability and failure modes.

## Testing

This repository uses Vitest for unit, integration, and Storybook browser tests, and Playwright for end-to-end tests. It does not use Jest.

Run checks appropriate to the change:

```bash
npm run test:unit -- <path>                 # Focused unit test
npm run test:integration                    # Integration tests
npm run test:storybook -- --run <path>      # Focused Storybook test
npm run e2e -- <spec>                       # End-to-end test
npm run typecheck                           # Strict TypeScript projects
npm run lint                                # ESLint
```

Start with a focused check. Broaden validation when the change affects shared contracts, providers, routing, build configuration, or infrastructure. Do not hide runtime errors or make tests pass with arbitrary waits.

## Issues And Security

For bugs, include reproduction steps, expected and actual behavior, environment details, and relevant logs or screenshots. Explain the user problem and constraints for feature requests rather than prescribing only one implementation.

Do not open a public issue for a suspected vulnerability. Follow the private reporting process in our [Security Policy](SECURITY.md).

## Pull Requests

- Explain what changed, why it changed, and how it was verified.
- Keep the pull request focused and link related issues.
- Include screenshots or recordings for visible UI changes.
- Update documentation, translations, tests, and stories when the affected behavior requires them.
- Make learner-facing language encouraging and age-appropriate.
- Address review feedback and ensure required checks pass before merge.

## License

By contributing, you agree that your contributions are licensed under the same license as the project.
