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

## Integration Tests

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
