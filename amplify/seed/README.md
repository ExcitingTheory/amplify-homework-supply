# Amplify Sandbox Seeding

Official Amplify Gen 2 approach to create test users and seed data.

## Quick Start

```bash
# 1. Set a private seed secret (never commit or print it)
npx ampx sandbox secret set TEST_USER_PASSWORD_SEED
# Use a unique random value. The seed derives a different password per user.

# 2. Start sandbox
npx ampx sandbox

# 3. Seed the database (in a separate terminal while sandbox is running)
npx ampx sandbox seed
```

To reseed the local sandbox without Thoth:

```bash
npm run sandbox:seed:no-thoth
```

This loads the usual `.env.test` settings, then forces `SEED_THOTH_MODE=off`.
It still wipes the target backend's data before recreating the non-Thoth data,
so previously seeded Thoth records are removed rather than preserved.

## What Gets Created

The seed script ([seed.ts](./seed.ts)) creates:

### **Test Users** (via `@aws-amplify/seed`)
- `admin@example.com` → Admins group
- `instructor1@example.com` → Instructors group
- `instructor2@example.com` → Instructors group
- `student1@example.com` → Learners group
- `student2@example.com` → Learners group

Each user receives a unique password derived from the private
`TEST_USER_PASSWORD_SEED`; individual passwords are never logged or displayed.

### **Sample Data**
- **5 vocabulary words** (Japanese + Biology terms)
- **3 practice questions** (with choices and answers)
- **3 curriculum units** (Japanese, Biology, Draft unit)
- **2 class sections** (JPN101-P1, BIO101-P3)
- **4 assignments** (with due dates)
- **3 grade submissions** (completed, in-progress, not started)
- **3 file metadata records** (audio, images, protected files)
- **2 documents** (PDFs for analysis testing)
- **1 parsed content** (extracted vocabulary/questions)
- **User settings** (preferences for test users)

### Section metadata and defaults

The Japanese and Biology sections include fictional school names and addresses,
campuses, buildings, rooms, and recurring meeting times in `America/Los_Angeles`.
When Thoth seeding is enabled, its section demonstrates a location without a
building or room. Term dates are calculated from the UTC seed date: the current
six-month semester for Japanese, four-month trimester for Biology, and
three-month quarter for Thoth.

Japanese inherits the platform's outside-date work policy. Biology allows
outside-date work but flags it for instructor review; Thoth explicitly accepts
it. Platform settings default to accepting outside-date work and provide the
demo school, main campus, and learning center as location defaults, leaving the
room unset.

The student1 profile's check-in context is serialized for AppSync's `AWSJSON`
input. Its creation and skill-progress update are checked before reporting
success; failures print the GraphQL errors and stop the seed.

## Integration Tests

### Thoth extraction captures

Live Thoth output is saved to `test/fixtures/thoth/runs/` **before** scoring.
Each run gets its own timestamped file, including runs that fail the extraction
gate. These files retain the six parsed-content lists for local mocks and
rescoring; they are not validated snapshots.

The default seed mode replays `test/fixtures/thoth/parsed-content.snapshot.json`
when present, otherwise the latest capture whose source SHA-256 matches the PDF.
Replayed captures still go through the quality gate. Set `SEED_THOTH_MODE=live`
explicitly to pay for fresh analysis, or `SEED_THOTH_MODE=off` to skip Thoth.
`SEED_THOTH_ALLOW_PARTIAL=1` allows a capture that fails the gate to seed records,
but does not promote it to a validated snapshot.

The seed sets the platform LLM-extraction default to NLP-only, then gives the
original PDF owner an explicit LLM override so the existing Thoth benchmark
continues to exercise the LLM path. It also seeds
`test/fixtures/thoth/nlp-extraction-exercise.json` as a second document owned by
an account with an explicit NLP-only override. The report is written to
`test/integration/thoth/nlp-extraction-report.json`. Snapshot mode replays the
NLP exercise's cached analysis when available; the first run performs the
exercise live and saves a snapshot after its deterministic fact, vocabulary,
definition, and page-coverage gate passes. Use `SEED_THOTH_MODE=live` to rerun
both paths.

Do not run the seed just to rescore or recover an extraction: it wipes sandbox
data before seeding. Import a captured run into the scorer or mock instead.

To discard cached analysis, delete only the captured JSON files in
`test/fixtures/thoth/runs/` and `test/fixtures/thoth/parsed-content.snapshot.json`
if present. Update any mocks importing those files. Preserve the source PDF,
raw extracted text, and ground truth. With no capture or validated snapshot,
the default mode performs fresh analysis; failed quality gates still preserve
the new output for diagnosis.

After seeding, run integration tests:

```bash
# Configure the same private seed for local test tooling without committing it.
export TEST_USER_PASSWORD_SEED='your-private-random-seed'

# Run tests
npm run test:integration
```

## Resetting Data

```bash
# Clear all data and reseed
npx ampx sandbox delete
npx ampx sandbox
npx ampx sandbox seed
```

## Documentation

- [Amplify Seed Documentation](https://docs.amplify.aws/react/deploy-and-host/sandbox-environments/seed/)
- [@aws-amplify/seed API](https://www.npmjs.com/package/@aws-amplify/seed)
