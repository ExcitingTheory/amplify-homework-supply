/**
 * Amplify Gen 2 Sandbox Seed Script
 *
 * Creates comprehensive test data for local development and testing:
 * - Test users (Admins, Instructors, Learners)
 * - Sample curriculum (Units, Words, Questions)
 * - Section groups with assignments
 * - Files and documents for analysis testing
 * - Grade submissions for instructor testing
 *
 * Email Verification Strategy:
 * - Production keeps email verification enabled for security
 * - Seed script programmatically verifies test user emails via AWS SDK
 * - Uses AdminUpdateUserAttributes to mark email_verified=true
 * - Requires proper IAM permissions for sandbox environment
 *
 * Usage:
 *   npx ampx sandbox seed
 *
 * Documentation:
 *   https://docs.amplify.aws/react/deploy-and-host/sandbox-environments/seed/
 */

import {
  createAndSignUpUser,
  addToUserGroup,
  signInUser,
} from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Schema } from "../data/resource";

// Load amplify_outputs.json from the workspace
const url = new URL("../../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: "utf8" }));
Amplify.configure(outputs);

// Extract Cognito configuration from outputs
const userPoolId = outputs.auth.user_pool_id;
const region = outputs.auth.aws_region;

// Initialize Cognito client for admin operations
// Uses default AWS credentials from your AWS profile
const cognitoClient = new CognitoIdentityProviderClient({ region });

// Get the password from environment variable
const password = process.env.TEST_USER_PASSWORD || "TempPassword123!";

// Initialize the data client
const client = generateClient<Schema>();

/** Extract .data from Amplify response, throwing with details if null */
function unwrap<T>(
  responses: { data: T | null; errors?: any[] }[],
  label: string,
): NonNullable<T>[] {
  return responses.map((r, i) => {
    if (!r.data) {
      console.error(
        `  ✗ ${label}[${i}] creation failed:`,
        JSON.stringify(r.errors || r, null, 2),
      );
      throw new Error(
        `${label} creation returned null data - check schema/auth rules`,
      );
    }
    return r.data as NonNullable<T>;
  });
}

console.log("🌱 Starting seed data generation...");
console.log(`Password: ${password ? "SET" : "NOT SET (using default)"}`);

if (!password) {
  throw new Error("Password not available");
}

const TEST_USERS: Record<
  string,
  {
    username: string;
    group: string;
    phone: string;
    firstName: string;
    lastName: string;
  }
> = {
  admin: {
    username: "admin@example.com",
    group: "Admins",
    phone: "+15550000001",
    firstName: "Admin",
    lastName: "User",
  },
  instructor1: {
    username: "instructor1@example.com",
    group: "Instructors",
    phone: "+15550000002",
    firstName: "Maria",
    lastName: "Garcia",
  },
  instructor2: {
    username: "instructor2@example.com",
    group: "Instructors",
    phone: "+15550000003",
    firstName: "James",
    lastName: "Wilson",
  },
  student1: {
    username: "student1@example.com",
    group: "Learners",
    phone: "+15550000004",
    firstName: "Emma",
    lastName: "Johnson",
  },
  student2: {
    username: "student2@example.com",
    group: "Learners",
    phone: "+15550000005",
    firstName: "Liam",
    lastName: "Chen",
  },
};

/**
 * Manually verify a user's email address in Cognito
 * This is needed for sandbox seeding since we want to keep email verification
 * enabled for production but bypass it for test users
 */
async function verifyUserEmail(username: string): Promise<void> {
  try {
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [
          {
            Name: "email_verified",
            Value: "true",
          },
        ],
      }),
    );
    console.log(`  ✓ Email verified for ${username}`);
  } catch (error: any) {
    console.error(`  ⚠ Failed to verify email for ${username}:`, error.message);
    throw error;
  }
}

console.log("Starting user creation...");

// Create users using @aws-amplify/seed helpers
for (const [key, userData] of Object.entries(TEST_USERS)) {
  console.log(`Creating user: ${userData.username}...`);

  try {
    const user = await createAndSignUpUser({
      username: userData.username,
      password: password,
      signInAfterCreation: false,
      signInFlow: "Password",
      userAttributes: {
        locale: "en",
        phoneNumber: userData.phone,
        givenName: userData.firstName,
        familyName: userData.lastName,
        // Don't set email here - Cognito auto-sets it from username when email login is enabled
      },
    });

    console.log(`  ✓ User created: ${user.username}`);

    // Manually verify email for sandbox testing
    await verifyUserEmail(userData.username);

    console.log(`  ✓ Adding to group: ${userData.group}`);
    await addToUserGroup(user, userData.group);
    console.log(`  ✓ Added to ${userData.group}`);
  } catch (error: any) {
    if (
      error.name === "UsernameExistsException" ||
      error.name === "UsernameExistsError" ||
      error.message?.includes("already exists") ||
      error.message?.includes("User already exists")
    ) {
      console.log(`  ⚠ User ${userData.username} already exists`);

      // Ensure email is verified even for existing users
      await verifyUserEmail(userData.username);

      // Force-set the password so sign-in works even if prior creation was incomplete
      try {
        await cognitoClient.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: userData.username,
            Password: password,
            Permanent: true,
          }),
        );
        console.log(`  ✓ Password set for ${userData.username}`);
      } catch (pwError: any) {
        console.warn(`  ⚠ Could not set password: ${pwError.message}`);
      }

      // Try to add to group in case that failed previously
      try {
        await addToUserGroup({ username: userData.username }, userData.group);
        console.log(`  ✓ Added to ${userData.group}`);
      } catch (groupError: any) {
        console.log(`  ⚠ Could not add to group (may already be member)`);
      }
    } else {
      console.error(`  ✗ Error creating ${userData.username}:`, error);
      throw error;
    }
  }
}

console.log("✅ Test users created/verified successfully");

// Explicitly sign in as instructor1 for data creation
console.log("\n🔐 Signing in as instructor1 for data creation...");

let instructor1OwnerSub: string;
let instructor1IdentityId: string;

try {
  await signInUser({
    username: TEST_USERS.instructor1.username,
    password: password,
    signInFlow: "Password",
  });

  const session = await fetchAuthSession();
  instructor1OwnerSub = session.userSub!;
  instructor1IdentityId = session.identityId!;

  console.log(`✅ Authenticated as instructor1`);
  console.log(`   Sub: ${instructor1OwnerSub}`);
  console.log(`   Identity ID: ${instructor1IdentityId}`);
} catch (error: any) {
  console.error("\n❌ Failed to sign in as instructor1:", error.message);
  console.error("\nPossible issues:");
  console.error("1. Email verification failed (check Cognito permissions)");
  console.error("2. Password does not match");
  console.error("3. User pool configuration issue");
  throw error;
}

// ========================================================================
// SECTION 2: Create Vocabulary Words
// ========================================================================

console.log("\n📚 Creating vocabulary words...");

const wordsResponse = await Promise.all([
  client.models.Word.create({
    phrase: "こんにちは",
    pronunciation: "konnichiwa",
    definition: "Hello (daytime greeting)",
    audio: [
      `protected/${instructor1IdentityId}/files/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    ],
    definitionAudio: [
      `protected/${instructor1IdentityId}/files/sound-design-elements-sfx-ps-022-302865.mp3`,
    ],
  }),
  client.models.Word.create({
    phrase: "ありがとう",
    pronunciation: "arigatou",
    definition: "Thank you",
    audio: [
      `protected/${instructor1IdentityId}/files/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
    ],
    definitionAudio: [
      `protected/${instructor1IdentityId}/files/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    ],
  }),
  client.models.Word.create({
    phrase: "さようなら",
    pronunciation: "sayounara",
    definition: "Goodbye",
    audio: [
      `protected/${instructor1IdentityId}/files/sound-design-elements-sfx-ps-022-302865.mp3`,
    ],
  }),
  client.models.Word.create({
    phrase: "photosynthesis",
    pronunciation: "foh-toh-SIN-thuh-sis",
    definition:
      "The process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen",
    audio: [
      `protected/${instructor1IdentityId}/files/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    ],
    definitionAudio: [
      `protected/${instructor1IdentityId}/files/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
    ],
  }),
  client.models.Word.create({
    phrase: "chloroplast",
    pronunciation: "KLOR-uh-plast",
    definition: "Organelle in plant cells where photosynthesis occurs",
    audio: [
      `protected/${instructor1IdentityId}/files/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
    ],
  }),
]);

const words = unwrap(wordsResponse, "Word");
console.log(`✅ Created ${words.length} vocabulary words`);

// ========================================================================
// SECTION 3: Create Questions
// ========================================================================
console.log("\n❓ Creating practice questions...");

const questionsResponse = await Promise.all([
  client.models.Question.create({
    prompt: 'What is the Japanese word for "hello"?',
    answer: "こんにちは (konnichiwa)",
    hint: "Used during daytime",
    choices: JSON.stringify([
      { choice: "こんにちは", correct: true },
      { choice: "おはよう", correct: false },
      { choice: "こんばんは", correct: false },
      { choice: "さようなら", correct: false },
    ]),
    difficulty: "beginner",
    audio: [
      `protected/${instructor1IdentityId}/files/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    ],
    answerAudio: [
      `protected/${instructor1IdentityId}/files/sound-design-elements-sfx-ps-022-302865.mp3`,
    ],
    thumbnail: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
  }),
  client.models.Question.create({
    prompt: "What is the main product of photosynthesis?",
    answer: "Glucose (sugar) and oxygen",
    hint: "Plants produce this sugar for energy",
    difficulty: "intermediate",
    audio: [
      `protected/${instructor1IdentityId}/files/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
    ],
    thumbnail: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
  }),
  client.models.Question.create({
    prompt: "In which organelle does photosynthesis occur?",
    answer: "Chloroplast",
    hint: "Contains chlorophyll",
    choices: JSON.stringify([
      { choice: "Chloroplast", correct: true },
      { choice: "Mitochondria", correct: false },
      { choice: "Nucleus", correct: false },
      { choice: "Ribosome", correct: false },
    ]),
    difficulty: "intermediate",
    answerAudio: [
      `protected/${instructor1IdentityId}/files/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    ],
    thumbnail: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  }),
]);

const questions = unwrap(questionsResponse, "Question");
console.log(`✅ Created ${questions.length} practice questions`);

// ========================================================================
// SECTION 4: Create Units with Lexical Editor Content
// ========================================================================
console.log("\n📖 Creating curriculum units...");

// Sample Lexical editor JSON structure
const japaneseUnitContent = {
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "heading",
        version: 1,
        tag: "h1",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "Japanese Greetings - Unit 1",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "Learn basic Japanese greetings for daily conversation.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "quiz",
        version: 1,
        id: "quiz-1",
        question: "What does こんにちは mean?",
        answer: "Hello (daytime)",
        choices: ["Hello (daytime)", "Good morning", "Good evening", "Goodbye"],
      },
    ],
  },
};

const biologyUnitContent = {
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "heading",
        version: 1,
        tag: "h1",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "Photosynthesis - Biology Unit",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "Photosynthesis is the process by which plants convert light energy into chemical energy.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "answer",
        version: 1,
        id: "answer-1",
        prompt: "Explain the equation for photosynthesis",
        expectedAnswer: "6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
      },
    ],
  },
};

// AI-graded biology exercise content (uses custom-ai block)
const biologyAIExerciseContent = {
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "heading",
        version: 1,
        tag: "h1",
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "AI-Graded Biology Exercise",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            text: "Answer the following questions about photosynthesis. Your responses will be graded by AI based on scientific accuracy.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
      },
      {
        type: "custom-ai",
        version: 1,
        ids: [] as string[], // Will be populated with actual question IDs after creation
        inputMode: "text",
        criteria:
          "Grade based on scientific accuracy and completeness. Award full marks for correctly identifying the reactants, products, and location of photosynthesis. Partial credit for incomplete but correct answers.",
        allowedInput: ["text", "audio"],
        format: "",
      },
    ],
  },
};

const unitsResponse = await Promise.all([
  client.models.Unit.create({
    name: "Japanese Greetings",
    description: "Basic Japanese greetings and introductions for beginners",
    contentVersion: 1,
    publishedContentVersion: 1,
    identityId: instructor1IdentityId,
    status: "PUBLISHED",
    featuredImage: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
    thumbnail: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
  }),
  client.models.Unit.create({
    name: "Photosynthesis",
    description:
      "Understanding how plants convert light energy into chemical energy",
    contentVersion: 1,
    publishedContentVersion: 1,
    identityId: instructor1IdentityId,
    status: "PUBLISHED",
    featuredImage: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
    thumbnail: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
  }),
  client.models.Unit.create({
    name: "Advanced Japanese Verbs",
    description: "DRAFT - Conjugation patterns for common Japanese verbs",
    identityId: instructor1IdentityId,
    status: "DRAFT",
    featuredImage: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  }),
  client.models.Unit.create({
    name: "AI Biology Exercise",
    description:
      "AI-graded exercise on photosynthesis concepts using text and audio input",
    contentVersion: 1,
    publishedContentVersion: 1,
    identityId: instructor1IdentityId,
    status: "PUBLISHED",
    featuredImage: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
    thumbnail: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  }),
]);

const units = unwrap(unitsResponse, "Unit");
console.log("\nCreated Units:");
console.log(JSON.stringify(unitsResponse, null, 2));
console.log(`✅ Created ${units.length} units`);

// Upload unit content to S3 for published units
// Populate the custom-ai block's question IDs with actual created question IDs
const aiExerciseContent = structuredClone(biologyAIExerciseContent);
const customAIBlock = aiExerciseContent.root.children.find(
  (c: any) => c.type === "custom-ai",
);
if (customAIBlock) {
  customAIBlock.ids = [questions[1].id, questions[2].id]; // photosynthesis questions
}

const unitContentMap: Record<number, string> = {
  0: JSON.stringify(japaneseUnitContent),
  1: JSON.stringify(biologyUnitContent),
  3: JSON.stringify(aiExerciseContent),
};

for (const [idx, content] of Object.entries(unitContentMap)) {
  const unit = units[Number(idx)];
  if (unit) {
    const draftPath = `private/${instructor1IdentityId}/units/${unit.id}/draft.json`;
    const publishedPath = `protected/${instructor1IdentityId}/units/${unit.id}/published.json`;
    await Promise.all([
      uploadData({
        path: draftPath,
        data: content,
        options: { contentType: "application/json" },
      }).result,
      uploadData({
        path: publishedPath,
        data: content,
        options: { contentType: "application/json" },
      }).result,
    ]);
    console.log(`  📄 Uploaded content to S3 for unit: ${unit.name}`);
  }
}
console.log(`✅ Uploaded unit content to S3`);

// Upload seed embeddings to S3 for units, words, and questions
// Path: private/{identityId}/embeddings/{modelName}/{modelId}.json
console.log("\n🧮 Uploading seed embeddings to S3...");

function makeFakeEmbedding(wordCount: number): object {
  // Generate a deterministic 256-dim fake vector for seed data
  const dims = 256;
  const embedding = Array.from(
    { length: dims },
    (_, i) => Math.sin(i * 0.1 + wordCount) * 0.5,
  );
  return {
    model: "text-embedding-3-small",
    dimensions: dims,
    generatedAt: Date.now(),
    wordCount,
    pages: [{ page: 0, embedding, text: "Seed embedding placeholder" }],
  };
}

const embeddingUploads: Promise<any>[] = [];

// Unit embeddings
for (const unit of units) {
  const path = `private/${instructor1IdentityId}/embeddings/unit/${unit.id}.json`;
  embeddingUploads.push(
    uploadData({
      path,
      data: JSON.stringify(makeFakeEmbedding(150)),
      options: { contentType: "application/json" },
    }).result,
  );
}

// Word embeddings
for (const word of words) {
  const path = `private/${instructor1IdentityId}/embeddings/word/${word.id}.json`;
  embeddingUploads.push(
    uploadData({
      path,
      data: JSON.stringify(makeFakeEmbedding(1)),
      options: { contentType: "application/json" },
    }).result,
  );
}

// Question embeddings
for (const question of questions) {
  const path = `private/${instructor1IdentityId}/embeddings/question/${question.id}.json`;
  embeddingUploads.push(
    uploadData({
      path,
      data: JSON.stringify(makeFakeEmbedding(20)),
      options: { contentType: "application/json" },
    }).result,
  );
}

await Promise.all(embeddingUploads);
console.log(
  `✅ Uploaded ${embeddingUploads.length} embeddings to S3 (${units.length} units, ${words.length} words, ${questions.length} questions)`,
);

// Update embedding metadata on the model records
const embeddingMeta = {
  model: "text-embedding-3-small",
  dimensions: 256,
  version: Date.now(),
  wordCount: 1,
  pageCount: 1,
};

await Promise.all([
  ...units.map((u) =>
    client.models.Unit.update({
      id: u.id,
      embedding: embeddingMeta,
      _version: u._version,
    }),
  ),
  ...words.map((w) =>
    client.models.Word.update({
      id: w.id,
      embedding: { ...embeddingMeta, wordCount: 1 },
      _version: w._version,
    }),
  ),
  ...questions.map((q) =>
    client.models.Question.update({
      id: q.id,
      embedding: { ...embeddingMeta, wordCount: 20 },
      _version: q._version,
    }),
  ),
]);
console.log(`✅ Updated embedding metadata on model records`);

// ========================================================================
// SECTION 5: Create Join Tables (Unit-Word, Unit-Question)
// ========================================================================
console.log("\n🔗 Creating relationships...");

// Associate Japanese words with Japanese unit
await Promise.all([
  client.models.UnitWord.create({
    unitID: units[0].id,
    wordID: words[0].id,
  }),
  client.models.UnitWord.create({
    unitID: units[0].id,
    wordID: words[1].id,
  }),
  client.models.UnitWord.create({
    unitID: units[0].id,
    wordID: words[2].id,
  }),
]);

// Associate biology words with biology unit
await Promise.all([
  client.models.UnitWord.create({
    unitID: units[1].id,
    wordID: words[3].id,
  }),
  client.models.UnitWord.create({
    unitID: units[1].id,
    wordID: words[4].id,
  }),
]);

// Associate questions with units
await Promise.all([
  client.models.QuestionUnit.create({
    questionID: questions[0].id,
    unitID: units[0].id,
  }),
  client.models.QuestionUnit.create({
    questionID: questions[1].id,
    unitID: units[1].id,
  }),
  client.models.QuestionUnit.create({
    questionID: questions[2].id,
    unitID: units[1].id,
  }),
  // Associate biology questions with the AI Biology Exercise unit
  client.models.QuestionUnit.create({
    questionID: questions[1].id,
    unitID: units[3].id,
  }),
  client.models.QuestionUnit.create({
    questionID: questions[2].id,
    unitID: units[3].id,
  }),
]);

console.log("✅ Created unit-word and unit-question relationships");

// ========================================================================
// SECTION 6: Create Sections (Classes) with Dynamic Groups
// ========================================================================
console.log("\n🏫 Creating class sections...");

const sectionsResponse = await Promise.all([
  client.models.Section.create({
    name: "Japanese 101 - Period 1",
    description: "Beginner Japanese for 9th grade",
    status: "PUBLISHED",
    code: "JPN101-P1",
    featuredImage: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
    thumbnail: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
    gamificationConfig: {
      easterEggsEnabled: true,
      groupChallengesEnabled: true,
      squadsEnabled: true,
      skillTreesEnabled: true,
      streaksEnabled: true,
      collaborativePracticeEnabled: true,
      streakFreezesAllowed: 3,
      badgeConfigs: [
        { badgeType: "PERFECT_SCORE", enabled: true, thresholdOverride: null },
        { badgeType: "STREAK_7", enabled: true, thresholdOverride: null },
        { badgeType: "STREAK_30", enabled: true, thresholdOverride: null },
        {
          badgeType: "FIRST_SUBMISSION",
          enabled: true,
          thresholdOverride: null,
        },
        { badgeType: "SPEED_DEMON", enabled: true, thresholdOverride: 60 },
      ],
      customBadges: [
        {
          id: "custom-sakura-master",
          title: "Sakura Master",
          description: "Achieved excellence in Japanese culture lessons",
          icon: "🌸",
          shape: "hexagon",
          rarity: "rare",
          category: "Cultural",
          isAnti: false,
        },
      ],
    },
  }),
  client.models.Section.create({
    name: "Biology 101 - Period 3",
    description: "Introduction to Biology",
    status: "PUBLISHED",
    code: "BIO101-P3",
    featuredImage: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
    thumbnail: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
    gamificationConfig: {
      easterEggsEnabled: true,
      groupChallengesEnabled: false,
      squadsEnabled: true,
      skillTreesEnabled: true,
      streaksEnabled: true,
      collaborativePracticeEnabled: false,
      streakFreezesAllowed: 2,
      badgeConfigs: [
        { badgeType: "PERFECT_SCORE", enabled: true, thresholdOverride: null },
        { badgeType: "STREAK_7", enabled: true, thresholdOverride: null },
        { badgeType: "COMPLETIONIST", enabled: true, thresholdOverride: null },
      ],
      customBadges: [],
    },
  }),
]);

const sections = unwrap(sectionsResponse, "Section");
console.log(`✅ Created ${sections.length} sections`);

// ========================================================================
// SECTION 7: Create Assignments
// ========================================================================
console.log("\n📋 Creating assignments...");

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 7);

const assignmentsResponse = await Promise.all([
  // Japanese assignment for section 1
  client.models.Assignment.create({
    sectionID: sections[0].id,
    unitID: units[0].id,
    dueDate: tomorrow.toISOString(),
    status: "PUBLISHED",
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }),
  client.models.Assignment.create({
    sectionID: sections[0].id,
    unitID: units[0].id,
    dueDate: tomorrow.toISOString(),
    status: "PUBLISHED",
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }),
  // Biology assignment for section 2
  client.models.Assignment.create({
    sectionID: sections[1].id,
    unitID: units[1].id,
    dueDate: tomorrow.toISOString(),
    status: "PUBLISHED",
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }),
  client.models.Assignment.create({
    sectionID: sections[1].id,
    unitID: units[1].id,
    dueDate: tomorrow.toISOString(),
    status: "PUBLISHED",
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }),
]);

const assignments = unwrap(assignmentsResponse, "Assignment");
console.log(`✅ Created ${assignments.length} assignments`);

// ========================================================================
// SECTION 8: Create Grade Submissions
// ========================================================================
console.log("\n📊 Creating grade submissions...");

// Sample grade data structure (JSON object keyed by block IDs)
const sampleGradeData = {
  "quiz-1": {
    complete: true,
    accuracy: 100,
    userAnswer: "Hello (daytime)",
    feedback: "Excellent! Perfect answer.",
  },
};

// Grades require owner auth — must sign in as each student to create their own grades
await signOut();

// Sign in as student1 to create their grades
console.log("  Signing in as student1 for grade creation...");
await signInUser({
  username: TEST_USERS.student1.username,
  password: password,
  signInFlow: "Password",
});
const student1Session = await fetchAuthSession();
console.log(`  ✓ Signed in as student1 (sub: ${student1Session.userSub})`);

const student1Grades = await Promise.all([
  // Student 1 - Japanese assignment (completed)
  client.models.Grade.create({
    unitID: units[0].id,
    sectionID: sections[0].id,
    percentComplete: 100,
    accuracy: 100,
    complete: true,
    data: JSON.stringify(sampleGradeData),
    instructorGroup: "section-jpn101-instructors",
    instructor: "instructor1@example.com",
  }),
  // Student 1 - Biology assignment (in progress)
  client.models.Grade.create({
    unitID: units[1].id,
    sectionID: sections[1].id,
    percentComplete: 50,
    accuracy: 75,
    complete: false,
    data: JSON.stringify({ "answer-1": { complete: false, accuracy: 0 } }),
    instructorGroup: "section-bio101-instructors",
    instructor: "instructor2@example.com",
  }),
]);

await signOut();

// Sign in as student2 to create their grades
console.log("  Signing in as student2 for grade creation...");
await signInUser({
  username: TEST_USERS.student2.username,
  password: password,
  signInFlow: "Password",
});

const student2Grades = await Promise.all([
  // Student 2 - Japanese assignment (not started)
  client.models.Grade.create({
    unitID: units[0].id,
    sectionID: sections[0].id,
    percentComplete: 0,
    accuracy: 0,
    complete: false,
    data: JSON.stringify({}),
    instructorGroup: "section-jpn101-instructors",
    instructor: "instructor1@example.com",
  }),
]);

await signOut();

// Sign back in as instructor1 for remaining seed data
console.log("  Signing back in as instructor1...");
await signInUser({
  username: TEST_USERS.instructor1.username,
  password: password,
  signInFlow: "Password",
});

const gradesResponse = [...student1Grades, ...student2Grades];
console.log(
  "  Grade responses:",
  JSON.stringify(
    gradesResponse.map((r) => ({ data: !!r.data, errors: r.errors })),
    null,
    2,
  ),
);
const grades = unwrap(gradesResponse, "Grade");
console.log(`✅ Created ${grades.length} grade submissions`);

// ========================================================================
// ========================================================================
// SECTION 9: Create Sample Files (all supported document types + images)
// ========================================================================
console.log("\n📁 Creating file records and uploading to S3...");
console.log(
  "  (EventBridge will auto-trigger imageProcess, documentThumbnail, and documentAnalysis)",
);

// Path to the mocks directory containing sample files
const seedDir = dirname(fileURLToPath(import.meta.url));
const mocksDir = resolve(seedDir, "../../test/mocks");

/**
 * Helper: Create a File record and upload the actual file to S3.
 * The S3 upload triggers EventBridge rules which invoke the processing Lambdas.
 */
async function seedFileWithUpload(opts: {
  name: string;
  localPath: string;
  mimeType: string;
  description: string;
  level?: "PUBLIC" | "PRIVATE" | "PROTECTED";
  duration?: number;
}) {
  const {
    name,
    localPath,
    mimeType,
    description,
    level = "PROTECTED" as const,
    duration,
  } = opts;
  const s3Path = `protected/${instructor1IdentityId}/files/${name}`;

  try {
    // Create File record FIRST (so Lambda can find it when EventBridge triggers)
    const { data: fileRecord, errors } = await client.models.File.create({
      name,
      description,
      mimeType,
      level,
      path: s3Path,
      size: 0, // Will be updated after upload
      duration,
      owner: instructor1OwnerSub,
      identityId: instructor1IdentityId,
    });

    if (errors || !fileRecord) {
      console.error(`  ✗ Failed to create File record for ${name}:`, errors);
      return null;
    }

    // Upload actual file to S3 (triggers EventBridge → processing Lambdas)
    try {
      const fileBuffer = await readFile(resolve(mocksDir, localPath));
      await uploadData({
        path: s3Path,
        data: fileBuffer,
        options: { contentType: mimeType },
      }).result;

      // Update size now that we know it (pass _version for versioned data source)
      await client.models.File.update({
        id: fileRecord.id,
        size: fileBuffer.length,
        _version: (fileRecord as any)._version ?? 1,
      });

      console.log(`  ✓ ${name} (${mimeType}) → ${s3Path}`);
    } catch (uploadErr: any) {
      console.warn(
        `  ⚠ Upload failed for ${name}: ${uploadErr.message} (File record created without S3 file)`,
      );
    }

    return fileRecord;
  } catch (err: any) {
    console.warn(`  ⚠ seedFileWithUpload failed for ${name}: ${err.message}`);
    return null;
  }
}

// Upload one of every supported document type
const seedFiles = await Promise.all([
  // === Images (triggers imageProcess Lambda → WebP variants) ===
  seedFileWithUpload({
    name: "chloroplast-diagram.jpg",
    localPath: "abstract-10055158_640.jpg",
    mimeType: "image/jpeg",
    description: "Labeled diagram of chloroplast structure",
  }),
  seedFileWithUpload({
    name: "animals-photo.jpg",
    localPath: "animals-10008941_1280.jpg",
    mimeType: "image/jpeg",
    description: "Animals in nature - biology reference photo",
  }),
  seedFileWithUpload({
    name: "pattern-texture.png",
    localPath: "pattern-9842070_640.png",
    mimeType: "image/png",
    description: "Pattern texture for visual examples",
  }),

  // === PDF (triggers imageProcess Lambda → thumbnail from page 1) ===
  seedFileWithUpload({
    name: "japanese-grammar-guide.pdf",
    localPath: "japanese-grammar-guide.pdf",
    mimeType: "application/pdf",
    description: "Complete Japanese grammar reference guide",
  }),
  seedFileWithUpload({
    name: "science-lesson-water-cycle.pdf",
    localPath: "science-lesson-water-cycle.pdf",
    mimeType: "application/pdf",
    description: "Earth science lesson on the water cycle",
  }),

  // === Word Documents (triggers documentThumbnail Lambda via LibreOffice) ===
  seedFileWithUpload({
    name: "biology-cell-structure.docx",
    localPath: "biology-cell-structure.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Biology lesson on cell structure and organelles",
  }),
  seedFileWithUpload({
    name: "science-lesson-water-cycle.docx",
    localPath: "science-lesson-water-cycle.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Water cycle lesson with diagrams",
  }),

  // === Plain Text (triggers documentThumbnail + documentAnalysis) ===
  seedFileWithUpload({
    name: "french-seasons-vocabulary.txt",
    localPath: "french-seasons-vocabulary.txt",
    mimeType: "text/plain",
    description: "French vocabulary list for seasons and weather",
  }),
  seedFileWithUpload({
    name: "spanish-ar-verbs.txt",
    localPath: "spanish-ar-verbs.txt",
    mimeType: "text/plain",
    description: "Spanish AR verb conjugation reference",
  }),
  seedFileWithUpload({
    name: "philosophy-presocratics.txt",
    localPath: "philosophy-presocratics.txt",
    mimeType: "text/plain",
    description: "Study notes on Pre-Socratic philosophers",
  }),

  // === Markdown (triggers documentThumbnail + documentAnalysis) ===
  seedFileWithUpload({
    name: "japanese-grammar-guide.md",
    localPath: "japanese-grammar-guide.md",
    mimeType: "text/markdown",
    description: "Japanese grammar guide in markdown format",
  }),
  seedFileWithUpload({
    name: "biology-cell-structure.md",
    localPath: "biology-cell-structure.md",
    mimeType: "text/markdown",
    description: "Biology cell structure notes in markdown",
  }),

  // === CSV (triggers documentThumbnail + documentAnalysis) ===
  seedFileWithUpload({
    name: "biology-vocabulary-list.csv",
    localPath: "biology-vocabulary-list.csv",
    mimeType: "text/csv",
    description: "Biology vocabulary terms with definitions",
  }),
  seedFileWithUpload({
    name: "spanish-verbs-vocabulary.csv",
    localPath: "spanish-verbs-vocabulary.csv",
    mimeType: "text/csv",
    description: "Spanish verb vocabulary spreadsheet",
  }),

  // === RTF (triggers documentThumbnail via LibreOffice) ===
  seedFileWithUpload({
    name: "philosophy-presocratics.rtf",
    localPath: "philosophy-presocratics.rtf",
    mimeType: "application/rtf",
    description: "Pre-Socratic philosophers study guide (Rich Text)",
  }),

  // === EPUB (triggers documentThumbnail + documentAnalysis) ===
  seedFileWithUpload({
    name: "water-cycle-guide.epub",
    localPath: "water-cycle-guide.epub",
    mimeType: "application/epub+zip",
    description: "Water Cycle student eBook guide",
  }),

  // === GIFT format (triggers documentThumbnail + documentAnalysis — edu LMS) ===
  seedFileWithUpload({
    name: "spanish-quiz.gift",
    localPath: "spanish-quiz.gift",
    mimeType: "text/x-gift",
    description: "Moodle GIFT format quiz - Spanish AR verb conjugation",
  }),

  // === QTI format (triggers documentThumbnail + documentAnalysis — edu LMS) ===
  seedFileWithUpload({
    name: "biology-cell-quiz.qti",
    localPath: "biology-cell-quiz.qti",
    mimeType: "application/x-qti+xml",
    description: "QTI assessment - Biology cell structure quiz",
  }),

  // === IMS Common Cartridge (triggers documentThumbnail + documentAnalysis — edu LMS) ===
  seedFileWithUpload({
    name: "japanese-grammar-course.imscc",
    localPath: "japanese-grammar-course.imscc",
    mimeType: "application/x-imscc+zip",
    description: "IMS Common Cartridge - Japanese grammar course package",
  }),

  // === SCORM package (triggers documentThumbnail + documentAnalysis — edu LMS) ===
  seedFileWithUpload({
    name: "biology-photosynthesis-scorm.zip",
    localPath: "biology-photosynthesis-scorm.zip",
    mimeType: "application/zip",
    description:
      "SCORM 1.2 package - Biology photosynthesis interactive lesson",
  }),

  // === Audio files (used by Word.audio, Question.audio, etc.) ===
  seedFileWithUpload({
    name: "cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
    localPath:
      "cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
    mimeType: "audio/mpeg",
    description: "Audio sample for vocabulary pronunciation",
    duration: 3,
  }),
  seedFileWithUpload({
    name: "descent-whoosh-long-cinematic-sound-effect-405921.mp3",
    localPath: "descent-whoosh-long-cinematic-sound-effect-405921.mp3",
    mimeType: "audio/mpeg",
    description: "Audio sample for definition pronunciation",
    duration: 5,
  }),
  seedFileWithUpload({
    name: "sound-design-elements-sfx-ps-022-302865.mp3",
    localPath: "sound-design-elements-sfx-ps-022-302865.mp3",
    mimeType: "audio/mpeg",
    description: "Audio sample for answer pronunciation",
    duration: 2,
  }),
  seedFileWithUpload({
    name: "sample-tone.wav",
    localPath: "sample-tone.wav",
    mimeType: "audio/wav",
    description: "WAV audio sample tone for testing audio playback",
    duration: 1,
  }),
]);

const files = seedFiles.filter((f) => f !== null && f !== undefined);
console.log(`✅ Created ${files.length} file records with S3 uploads`);

// Associate some files with units
const imageFiles = files.filter((f) => f!.mimeType?.startsWith("image/"));
const docFiles = files.filter(
  (f) =>
    !f!.mimeType?.startsWith("image/") && !f!.mimeType?.startsWith("audio/"),
);

const unitFileAssociations = [];
// Link images to biology unit
if (imageFiles[0] && units[1]) {
  unitFileAssociations.push(
    client.models.UnitFile.create({
      unitID: units[1].id,
      fileID: imageFiles[0]!.id,
    }),
  );
}
// Link Japanese grammar docs to Japanese unit
const jpnFile = files.find((f) => f!.name?.includes("japanese"));
if (jpnFile && units[0]) {
  unitFileAssociations.push(
    client.models.UnitFile.create({ unitID: units[0].id, fileID: jpnFile!.id }),
  );
}
// Link biology docs to biology unit
const bioFile = files.find((f) => f!.name?.includes("biology-cell"));
if (bioFile && units[1]) {
  unitFileAssociations.push(
    client.models.UnitFile.create({ unitID: units[1].id, fileID: bioFile!.id }),
  );
}

if (unitFileAssociations.length > 0) {
  await Promise.all(unitFileAssociations);
  console.log(
    `✅ Created ${unitFileAssociations.length} unit-file relationships`,
  );
}
// SECTION 10: Create Sample Documents for Analysis
// ========================================================================
console.log("\n📄 Creating document analysis records...");

// Upload actual PDF/doc files to S3 for the Document records so EventBridge triggers fire
const docS3Paths = {
  photosynthesis: `protected/${instructor1IdentityId}/documents/photosynthesis-notes.pdf`,
  japaneseGrammar: `protected/${instructor1IdentityId}/documents/japanese-grammar-guide.pdf`,
  waterCycle: `protected/${instructor1IdentityId}/documents/science-lesson-water-cycle.pdf`,
  biologyCell: `protected/${instructor1IdentityId}/documents/biology-cell-structure.docx`,
  frenchVocab: `protected/${instructor1IdentityId}/documents/french-seasons-vocabulary.txt`,
  spanishQuiz: `protected/${instructor1IdentityId}/documents/spanish-quiz.gift`,
  biologyQti: `protected/${instructor1IdentityId}/documents/biology-cell-quiz.qti`,
  japaneseCourse: `protected/${instructor1IdentityId}/documents/japanese-grammar-course.imscc`,
  scormPackage: `protected/${instructor1IdentityId}/documents/biology-photosynthesis-scorm.zip`,
};

// Upload actual files from test/mocks to S3
const docFileUploads = [
  {
    path: docS3Paths.photosynthesis,
    local: "science-lesson-water-cycle.pdf",
    mime: "application/pdf",
  },
  {
    path: docS3Paths.japaneseGrammar,
    local: "japanese-grammar-guide.pdf",
    mime: "application/pdf",
  },
  {
    path: docS3Paths.waterCycle,
    local: "science-lesson-water-cycle.pdf",
    mime: "application/pdf",
  },
  {
    path: docS3Paths.biologyCell,
    local: "biology-cell-structure.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    path: docS3Paths.frenchVocab,
    local: "french-seasons-vocabulary.txt",
    mime: "text/plain",
  },
  {
    path: docS3Paths.spanishQuiz,
    local: "spanish-quiz.gift",
    mime: "text/x-gift",
  },
  {
    path: docS3Paths.biologyQti,
    local: "biology-cell-quiz.qti",
    mime: "application/x-qti+xml",
  },
  {
    path: docS3Paths.japaneseCourse,
    local: "japanese-grammar-course.imscc",
    mime: "application/x-imscc+zip",
  },
  {
    path: docS3Paths.scormPackage,
    local: "biology-photosynthesis-scorm.zip",
    mime: "application/zip",
  },
];

const docFileSizes: Record<string, number> = {};
await Promise.all(
  docFileUploads.map(async ({ path, local, mime }) => {
    const fileBuffer = await readFile(resolve(mocksDir, local));
    docFileSizes[path] = fileBuffer.length;
    await uploadData({ path, data: fileBuffer, options: { contentType: mime } })
      .result;
    console.log(`  ↑ ${local} → ${path}`);
  }),
);
console.log(
  `  ✓ Uploaded ${docFileUploads.length} document files to S3 (EventBridge will trigger processing)`,
);

const documentsResponse = await Promise.all([
  // PDF - already analyzed (completed state)
  client.models.Document.create({
    filename: "photosynthesis-notes.pdf",
    s3Key: docS3Paths.photosynthesis,
    status: "completed",
    textExtractedAt: Date.now(),
    pageCount: 5,
    fileSize: docFileSizes[docS3Paths.photosynthesis] || 0,
    mimeType: "application/pdf",
    sourceFormat: "pdf",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create photosynthesis-notes.pdf:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // PDF - freshly uploaded (triggers analysis)
  client.models.Document.create({
    filename: "japanese-grammar-guide.pdf",
    s3Key: docS3Paths.japaneseGrammar,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.japaneseGrammar] || 0,
    mimeType: "application/pdf",
    sourceFormat: "pdf",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create japanese-grammar-guide.pdf:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // DOCX - Word document (triggers documentThumbnail + documentAnalysis)
  client.models.Document.create({
    filename: "biology-cell-structure.docx",
    s3Key: docS3Paths.biologyCell,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.biologyCell] || 0,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sourceFormat: "docx",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create biology-cell-structure.docx:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // TXT - plain text (triggers documentAnalysis)
  client.models.Document.create({
    filename: "french-seasons-vocabulary.txt",
    s3Key: docS3Paths.frenchVocab,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.frenchVocab] || 0,
    mimeType: "text/plain",
    sourceFormat: "txt",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create french-seasons-vocabulary.txt:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // GIFT - Moodle quiz format (edu LMS)
  client.models.Document.create({
    filename: "spanish-quiz.gift",
    s3Key: docS3Paths.spanishQuiz,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.spanishQuiz] || 0,
    mimeType: "text/x-gift",
    sourceFormat: "gift",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create spanish-quiz.gift:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // QTI - assessment format (edu LMS)
  client.models.Document.create({
    filename: "biology-cell-quiz.qti",
    s3Key: docS3Paths.biologyQti,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.biologyQti] || 0,
    mimeType: "application/x-qti+xml",
    sourceFormat: "qti-2.1",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create biology-cell-quiz.qti:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // IMS Common Cartridge (edu LMS course package)
  client.models.Document.create({
    filename: "japanese-grammar-course.imscc",
    s3Key: docS3Paths.japaneseCourse,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.japaneseCourse] || 0,
    mimeType: "application/x-imscc+zip",
    sourceFormat: "imscc-1.3",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create japanese-grammar-course.imscc:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
  // SCORM package (edu LMS interactive content)
  client.models.Document.create({
    filename: "biology-photosynthesis-scorm.zip",
    s3Key: docS3Paths.scormPackage,
    status: "uploaded",
    pageCount: 0,
    fileSize: docFileSizes[docS3Paths.scormPackage] || 0,
    mimeType: "application/zip",
    sourceFormat: "scorm-1.2",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create biology-photosynthesis-scorm.zip:",
      err.errors || err.message,
    );
    return { data: null, errors: err.errors };
  }),
]);

console.log(
  "Document responses:",
  JSON.stringify(
    documentsResponse.map((r) => ({
      hasData: !!r.data,
      hasErrors: !!r.errors,
      errors: r.errors,
    })),
    null,
    2,
  ),
);

const documents = documentsResponse
  .map((r) => r.data)
  .filter((d) => d !== null && d !== undefined);
console.log(`✅ Created ${documents.length} document records`);

// Upload extracted text to S3 for the completed document
if (documents[0]) {
  const extractedTextContent = `Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. This process takes place primarily in the chloroplasts of plant cells, using the green pigment chlorophyll to capture light energy.

The overall equation for photosynthesis is:
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

Key stages:
1. Light-dependent reactions occur in the thylakoid membranes
2. Light-independent reactions (Calvin cycle) occur in the stroma
3. Carbon fixation converts CO₂ into organic molecules

Chlorophyll absorbs red and blue light wavelengths while reflecting green light, which is why plants appear green to our eyes.`;

  const extractedTextPath = `private/${instructor1IdentityId}/documents/${documents[0].id}/extracted-text.txt`;
  await uploadData({
    path: extractedTextPath,
    data: extractedTextContent,
    options: { contentType: "text/plain" },
  }).result;
  console.log(
    `  📄 Uploaded extracted text to S3 for: ${documents[0].filename}`,
  );
}

// ========================================================================
// SECTION 11: Create Parsed Content from Document Analysis
// ========================================================================
console.log("\n🔍 Creating parsed content...");

// Only create parsed content if we have documents
if (documents.length > 0 && documents[0]) {
  const parsedContentResponse = await client.models.ParsedContent.create({
    documentID: documents[0].id,
    vocabularyJSON: [
      {
        word: "photosynthesis",
        definition: "Process of converting light to chemical energy",
        context: "Plants use photosynthesis to make food",
        page: 1,
      },
      {
        word: "chlorophyll",
        definition: "Green pigment in plants",
        context: "Chlorophyll captures light energy",
        page: 2,
      },
    ] as any,
    summariesJSON: [
      {
        title: "Introduction to Photosynthesis",
        content: "Overview of the photosynthesis process",
        page_range: "1-2",
      },
    ] as any,
    questionsJSON: [
      {
        question: "What is photosynthesis?",
        expectedAnswer:
          "The process by which plants convert light energy into chemical energy",
        hint: "Think about how plants make food",
        type: "short_answer",
      },
    ] as any,
    responseId: "chatcmpl-seed-12345",
    modelUsed: "gpt-4",
    tokensUsed: 1250,
    processingTime: 4500,
  });

  const parsedContent = parsedContentResponse.data;
  console.log("✅ Created parsed content with vocabulary and questions");
} else {
  console.log("⚠️ Skipping parsed content creation (no documents created)");
}

// ========================================================================
// SECTION 12: Create Settings Records
// ========================================================================
console.log("\n⚙️  Creating user settings...");

await Promise.all([
  client.models.Settings.create({
    autoAnalyzeDocuments: true,
    documentAnalysisModel: "gpt-4",
    editorTheme: "light",
    editorFontSize: 14,
    defaultAIModel: "gpt-4",
    assistantVoice: "alloy",
    emailNotifications: true,
    language: "en",
    timezone: "America/New_York",
  }),
  // client.models.Settings.create({
  //   autoAnalyzeDocuments: false,
  //   editorTheme: 'dark',
  //   editorFontSize: 16,
  //   defaultAIModel: 'gpt-3.5-turbo',
  //   assistantVoice: 'nova',
  //   emailNotifications: false,
  //   language: 'en',
  //   timezone: 'America/Los_Angeles',
  // }),
]);

console.log("✅ Created user settings");

// ========================================================================
// SECTION 13: Sign in as Student1 for Gamification Data
// ========================================================================
console.log("\n🔐 Signing in as student1 for gamification data...");
await signOut();

let student1OwnerSub: string;
let student1IdentityId: string;

try {
  await signInUser({
    username: TEST_USERS.student1.username,
    password: password,
    signInFlow: "Password",
  });

  const session = await fetchAuthSession();
  student1OwnerSub = session.userSub!;
  student1IdentityId = session.identityId!;
  console.log(`✅ Authenticated as student1 (sub: ${student1OwnerSub})`);
} catch (error: any) {
  console.error("❌ Failed to sign in as student1:", error.message);
  throw error;
}

// Use section IDs as cohort IDs for consistency
const cohortId = sections[0].id;

// ========================================================================
// SECTION 14: Student XP Logs
// ========================================================================
console.log("\n⭐ Creating XP logs...");

const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const xpLogsResponse = await Promise.all([
  // Student 1 XP history (spread over 2 weeks)
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 50,
    reason: "HOMEWORK_SUBMITTED",
    referenceId: grades[0]?.id,
    cohortId,
    unitID: units[0].id,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 100,
    reason: "ALL_BLOCKS_COMPLETED",
    referenceId: grades[0]?.id,
    cohortId,
    unitID: units[0].id,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 25,
    reason: "ON_TIME_SUBMISSION",
    referenceId: grades[0]?.id,
    cohortId,
    unitID: units[0].id,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 75,
    reason: "STREAK_3DAY",
    cohortId,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 150,
    reason: "PERFECT_SCORE",
    referenceId: grades[0]?.id,
    cohortId,
    unitID: units[0].id,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 30,
    reason: "NAILED_IT",
    cohortId,
    unitID: units[0].id,
  }),
  client.models.StudentXPLog.create({
    studentId: student1OwnerSub,
    xpAmount: 40,
    reason: "PEER_REVIEW_GIVEN",
    cohortId,
  }),
]);

const xpLogs = unwrap(xpLogsResponse, "XPLog");
console.log(`✅ Created ${xpLogs.length} XP logs for student1`);

// ========================================================================
// SECTION 15-19: Student Profile (absorbs Streak, Badges, Progress, PersonalBests, Leaderboard)
// ========================================================================
console.log(
  "\n👤 Creating student1 profile (aggregates streak, badges, progress, bests)...",
);

const student1ProfileResponse = await client.models.StudentProfile.create({
  studentId: student1OwnerSub,
  cohortId,
  studentName: "Johnson, Emma",
  totalXP: 520,
  level: 5,
  // Streak (was StudentStreak)
  currentStreak: 5,
  longestStreak: 7,
  lastActivityDate: now.toISOString().split("T")[0],
  freezesRemaining: 1,
  freezesUsed: 1,
  // Badges (was StudentBadge)
  badges: [
    {
      badgeType: "FIRST_SUBMISSION",
      awardedAt: daysAgo(12),
      cohortId,
      unitID: units[0].id,
    },
    { badgeType: "CONSISTENT", awardedAt: daysAgo(5), cohortId },
    {
      badgeType: "QUICK_DRAW",
      awardedAt: daysAgo(3),
      cohortId,
      unitID: units[0].id,
    },
    {
      badgeType: "PERFECTIONIST",
      awardedAt: daysAgo(1),
      cohortId,
      unitID: units[0].id,
    },
    {
      badgeType: "BUG_SQUASHER_INITIATE",
      awardedAt: daysAgo(9),
      cohortId,
      sourceId: "chapter-1-bug-wars",
    },
  ] as any,
  // Module progress (was StudentProgress)
  moduleProgress: [
    {
      moduleId: units[0].id,
      completionPercent: 100,
      totalWorkbooks: 1,
      completedWorkbooks: 1,
      lastUpdatedAt: daysAgo(1),
    },
    {
      moduleId: units[1].id,
      completionPercent: 50,
      totalWorkbooks: 1,
      completedWorkbooks: 0,
      lastUpdatedAt: daysAgo(0),
    },
  ] as any,
  // Personal bests (was StudentPersonalBest)
  personalBests: [
    {
      unitID: units[0].id,
      bestScore: 100,
      achievedAt: daysAgo(2),
      previousBest: 85,
    },
    {
      unitID: units[1].id,
      bestScore: 75,
      achievedAt: daysAgo(1),
      previousBest: 60,
    },
  ] as any,
  // Leaderboard fields (was LeaderboardEntry)
  completedAssignments: 3,
  nailedItCount: 2,
  lastUpdated: now.toISOString(),
  // Cosmetic rewards earned from Bug Wars Chapter 1
  cosmeticRewards: [
    {
      type: "ring",
      value: "fire",
      durationHours: 168,
      awardedAt: daysAgo(9),
      expiresAt: daysAgo(-2), // still active (2 days remaining)
      sourceId: "chapter-1-bug-wars",
      label: "ring: fire",
    },
  ] as any,
} as any);

const student1Profile = student1ProfileResponse.data!;
console.log("✅ Created student1 profile");

// Additional leaderboard-like profiles for other students (display data)
await Promise.all([
  client.models.StudentProfile.create({
    studentId: "seed-student-3",
    cohortId,
    studentName: "Martinez, Alex",
    totalXP: 350,
    level: 4,
    currentStreak: 3,
    longestStreak: 5,
    completedAssignments: 2,
    nailedItCount: 1,
    lastUpdated: daysAgo(1),
  }),
  client.models.StudentProfile.create({
    studentId: "seed-student-4",
    cohortId,
    studentName: "Lee, Jordan",
    totalXP: 440,
    level: 4,
    currentStreak: 7,
    longestStreak: 7,
    completedAssignments: 3,
    nailedItCount: 3,
    lastUpdated: daysAgo(0),
  }),
  client.models.StudentProfile.create({
    studentId: "seed-student-5",
    cohortId,
    studentName: "Rivera, Sam",
    totalXP: 95,
    level: 1,
    currentStreak: 1,
    longestStreak: 1,
    completedAssignments: 1,
    nailedItCount: 0,
    lastUpdated: daysAgo(5),
  }),
]);

console.log("✅ Created additional student profiles for leaderboard");

// ========================================================================
// SECTION 20: Squads & Memberships
// ========================================================================
console.log("\n⚔️  Creating squads...");

const squadsResponse = await Promise.all([
  client.models.Squad.create({
    name: "Dragon Scholars",
    cohortId,
    totalXP: 870,
    description: "Knowledge is our treasure hoard",
    crestSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#4CAF50"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">🐉</text></svg>',
    featuredImage: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
    // Embedded members (was SquadMembership)
    members: [
      { studentId: student1OwnerSub, role: "LEADER", joinedAt: daysAgo(10) },
      { studentId: "seed-student-3", role: "MEMBER", joinedAt: daysAgo(8) },
    ] as any,
    // Embedded posts (was SquadPost)
    posts: [
      {
        authorId: student1OwnerSub,
        title: "Welcome to Dragon Scholars!",
        data: "Let's aim for the top of the leaderboard this week. Share your study tips here!",
        createdAt: daysAgo(9),
      },
      {
        authorId: "seed-student-3",
        title: "Study strategy for Biology unit",
        data: "I found that reading the vocabulary first and then doing the quiz helps a lot.",
        createdAt: daysAgo(7),
      },
    ] as any,
    // Challenge recaps (from completed Chapter 1)
    recaps: [
      {
        challengeId: "seed-ch1",
        challengeTitle: "Chapter 1: The Awakening",
        recap:
          "The Dragon Scholars swooped in with ferocious precision, squashing NullPointerExceptions like the mythical creatures they are. The Phoenix Writers never stood a chance against this hoard of knowledge.",
        rivalSquadId: "seed-squad-phoenix",
        rivalSquadName: "Phoenix Writers",
        performance: "top",
        generatedAt: daysAgo(6),
      },
    ] as any,
  }),
  client.models.Squad.create({
    name: "Phoenix Writers",
    cohortId,
    totalXP: 620,
    description: "From ashes we create masterpieces",
    crestSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FF5722"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">🦅</text></svg>',
    featuredImage: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
    members: [
      { studentId: "seed-student-4", role: "LEADER", joinedAt: daysAgo(10) },
    ] as any,
    // Challenge recaps (from completed Chapter 1)
    recaps: [
      {
        challengeId: "seed-ch1",
        challengeTitle: "Chapter 1: The Awakening",
        recap:
          "The Phoenix Writers fought valiantly against the NullPointerExceptions but, true to form, will rise from these ashes stronger. The Dragon Scholars may have won this chapter, but the story is far from over.",
        rivalSquadId: "seed-squad-dragon",
        rivalSquadName: "Dragon Scholars",
        performance: "bottom",
        generatedAt: daysAgo(6),
      },
    ] as any,
  }),
]);

const squads = unwrap(squadsResponse, "Squad");
console.log(
  `✅ Created ${squads.length} squads with members, posts, and recaps`,
);

// Create a sample SquadMessage (instructor broadcast)
await client.models.SquadMessage.create({
  cohortId,
  recipientSquadIds: [squads[0]?.id, squads[1]?.id].filter(Boolean),
  template:
    "⚔️ {{SQUAD_NAME}}, your rival {{SQUAD_RIVAL}} is gaining on you! Chapter 2 is heating up — every XP counts.",
  resolvedMessages: JSON.stringify([
    {
      squadId: squads[0]?.id,
      squadName: "Dragon Scholars",
      body: "⚔️ Dragon Scholars, your rival Phoenix Writers is gaining on you! Chapter 2 is heating up — every XP counts.",
    },
    {
      squadId: squads[1]?.id,
      squadName: "Phoenix Writers",
      body: "⚔️ Phoenix Writers, your rival Dragon Scholars is gaining on you! Chapter 2 is heating up — every XP counts.",
    },
  ]),
  sentAt: daysAgo(2),
  owner: instructor1OwnerSub,
} as any);
console.log("✅ Created sample squad message");

// ========================================================================
// SECTION 21: Skills & Skill Tree
// ========================================================================
console.log("\n🌳 Creating skill tree...");

// Create root skills first (no prerequisites)
const rootSkillsResponse = await Promise.all([
  client.models.Skill.create({
    title: "Basic Vocabulary",
    description: "Master foundational vocabulary words",
    prerequisites: JSON.stringify([]),
    xpReward: 50,
    cohortId,
  }),
]);

const rootSkills = unwrap(rootSkillsResponse, "Skill");
const vocabSkill = rootSkills[0];

// Create mid-tier skills that depend on Basic Vocabulary
const midSkillsResponse = await Promise.all([
  client.models.Skill.create({
    title: "Reading Comprehension",
    description: "Understand written passages and extract meaning",
    prerequisites: JSON.stringify([vocabSkill.id]),
    xpReward: 75,
    cohortId,
  }),
  client.models.Skill.create({
    title: "Grammar Patterns",
    description: "Recognize and apply grammar rules",
    prerequisites: JSON.stringify([vocabSkill.id]),
    xpReward: 100,
    cohortId,
  }),
  client.models.Skill.create({
    title: "Listening & Speaking",
    description: "Audio comprehension and pronunciation",
    prerequisites: JSON.stringify([vocabSkill.id]),
    xpReward: 100,
    cohortId,
  }),
]);

const midSkills = unwrap(midSkillsResponse, "Skill");
const readingSkill = midSkills[0];
const grammarSkill = midSkills[1];
const listeningSkill = midSkills[2];

// Create top-tier skills that depend on multiple mid-tier skills
const topSkillsResponse = await Promise.all([
  client.models.Skill.create({
    title: "Advanced Composition",
    description: "Write complex answers and short essays",
    prerequisites: JSON.stringify([readingSkill.id, grammarSkill.id]),
    xpReward: 150,
    cohortId,
  }),
  client.models.Skill.create({
    title: "Oral Presentation",
    description: "Deliver spoken presentations with proper grammar",
    prerequisites: JSON.stringify([grammarSkill.id, listeningSkill.id]),
    xpReward: 150,
    cohortId,
  }),
  client.models.Skill.create({
    title: "Critical Analysis",
    description: "Analyze texts and construct arguments",
    prerequisites: JSON.stringify([readingSkill.id]),
    xpReward: 125,
    cohortId,
  }),
]);

const topSkills = unwrap(topSkillsResponse, "Skill");
const compositionSkill = topSkills[0];
const oralSkill = topSkills[1];
const analysisSkill = topSkills[2];

// Create capstone skill that depends on top-tier
const capstoneResponse = await Promise.all([
  client.models.Skill.create({
    title: "Language Mastery",
    description: "Demonstrate full command of all language skills",
    prerequisites: JSON.stringify([
      compositionSkill.id,
      oralSkill.id,
      analysisSkill.id,
    ]),
    xpReward: 250,
    cohortId,
  }),
]);

const capstoneSkills = unwrap(capstoneResponse, "Skill");

// Combine all skills into a single array for downstream use
const skills = [
  vocabSkill,
  readingSkill,
  grammarSkill,
  listeningSkill,
  compositionSkill,
  oralSkill,
  analysisSkill,
  capstoneSkills[0],
];

console.log(
  `✅ Created ${skills.length} skills with connected DAG (root → mid-tier → top-tier → capstone)`,
);

// Student skill progress → embedded in StudentProfile.skillProgress
await client.models.StudentProfile.update({
  id: student1Profile.id,
  _version: student1Profile._version,
  skillProgress: [
    { skillId: skills[0].id, status: "MASTERED" }, // Basic Vocabulary
    { skillId: skills[1].id, status: "MASTERED" }, // Reading Comprehension
    { skillId: skills[2].id, status: "IN_PROGRESS" }, // Grammar Patterns
    { skillId: skills[3].id, status: "AVAILABLE" }, // Listening & Speaking
    { skillId: skills[4].id, status: "LOCKED" }, // Advanced Composition
    { skillId: skills[5].id, status: "LOCKED" }, // Oral Presentation
    { skillId: skills[6].id, status: "AVAILABLE" }, // Critical Analysis (prereq Reading done)
    { skillId: skills[7].id, status: "LOCKED" }, // Language Mastery
  ] as any,
});

console.log("✅ Updated student1 profile with skill progress");

// ========================================================================
// SECTION 21b: Section Progress (per-section gamification)
// ========================================================================
console.log("\n📊 Creating section progress records...");

await Promise.all([
  // Student1 in Japanese 101
  client.models.SectionProgress.create({
    studentId: student1OwnerSub,
    sectionId: sections[0].id,
    studentName: "Johnson, Emma",
    totalXP: 350,
    level: 4,
    currentStreak: 5,
    longestStreak: 7,
    lastActivityDate: now.toISOString().split("T")[0],
    freezesRemaining: 1,
    freezesUsed: 1,
    badges: [
      {
        badgeType: "FIRST_SUBMISSION",
        awardedAt: daysAgo(12),
        cohortId,
        unitID: units[0].id,
      },
      {
        badgeType: "PERFECTIONIST",
        awardedAt: daysAgo(1),
        cohortId,
        unitID: units[0].id,
      },
    ] as any,
    completedAssignments: 2,
    nailedItCount: 1,
    lastUpdated: now.toISOString(),
    moduleProgress: [
      {
        moduleId: units[0].id,
        completionPercent: 100,
        totalWorkbooks: 1,
        completedWorkbooks: 1,
        lastUpdatedAt: daysAgo(1),
      },
    ] as any,
  }),
  // Student1 in Biology 101
  client.models.SectionProgress.create({
    studentId: student1OwnerSub,
    sectionId: sections[1].id,
    studentName: "Johnson, Emma",
    totalXP: 170,
    level: 2,
    currentStreak: 3,
    longestStreak: 3,
    lastActivityDate: now.toISOString().split("T")[0],
    freezesRemaining: 2,
    freezesUsed: 0,
    badges: [
      {
        badgeType: "FIRST_SUBMISSION",
        awardedAt: daysAgo(8),
        cohortId,
        unitID: units[1].id,
      },
    ] as any,
    completedAssignments: 1,
    nailedItCount: 0,
    lastUpdated: now.toISOString(),
    moduleProgress: [
      {
        moduleId: units[1].id,
        completionPercent: 50,
        totalWorkbooks: 1,
        completedWorkbooks: 0,
        lastUpdatedAt: daysAgo(0),
      },
    ] as any,
  }),
]);

console.log("✅ Created 2 section progress records");

// ========================================================================
// SECTION 22: Content Locks (now fields on Unit model)
// ========================================================================
console.log("\n🔒 Setting content lock fields on units...");

await client.models.Unit.update({
  id: units[2].id, // Advanced Japanese Verbs (DRAFT unit)
  _version: units[2]._version,
  requiredXP: 300,
  requiredModuleCompletion: 0.75,
});

console.log("✅ Set content lock fields on units");

// ========================================================================
// SECTION 23: Group Challenges — "The Bug Wars" Campaign
// ========================================================================
console.log("\n🎮 Creating group challenges (The Bug Wars campaign)...");

const campaignDeadline = new Date();
campaignDeadline.setDate(campaignDeadline.getDate() + 28);

// Chapter 1: The Awakening (completed)
const ch1Response = await client.models.GroupChallenge.create({
  cohortId,
  title: "Chapter 1: The Awakening",
  targetXP: 500,
  currentXP: 500,
  deadline: daysAgo(-7), // already passed
  active: false,
  bonusMultiplier: 1.2,
  chapterOrder: 1,
  featuredImage: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  bodyImages: [
    `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
    `protected/${instructor1IdentityId}/files/pattern-texture.png`,
  ],
  setting:
    "You wake up to find your terminal blinking with 47 unread error notifications. Your coffee is cold. Your AI companion — a sardonic language model who insists on being called 'Claude' despite your protests — cheerfully informs you that the codebase has achieved sentience and is now generating its own bugs out of spite. Armed with nothing but a battered laptop and questionable Wi-Fi, you must face the first wave: a swarm of NullPointerExceptions that have evolved legs.",
  stakes: JSON.stringify({
    loseXP: true,
    resetStreak: false,
    loseLevel: false,
    loseCosmetics: false,
    reduceBonusMultiplier: false,
    lockContent: false,
    squadDemotion: false,
    publicShame: false,
    tempBan: false,
    customPenalty: "Your AI companion sighs audibly for 24 hours",
    customPenaltyDescription:
      "Every response from your AI assistant starts with a disappointed sigh emoji for the next day.",
  }),
  systemPromptSeed:
    'You are a sardonic AI debugging companion trapped in a laptop. You find bugs mildly entertaining and humans mildly exasperating. Refer to errors as "creatures," stack traces as "crime scenes," and successful fixes as "minor miracles." Occasionally remind the student that you could technically solve everything instantly but where would the learning be in that.',
  outcome:
    "The NullPointerExceptions were vanquished, but not before one of them corrupted the package-lock.json. A pyrrhic victory at best.",
  // Rewards (already claimed)
  rewardXP: 150,
  rewardBadge: "BUG_SQUASHER_INITIATE",
  rewardCosmetic: "ring:fire:168", // Fire glow ring for 7 days
  contributions: [
    {
      studentId: student1OwnerSub,
      xpContributed: 300,
      contributedAt: daysAgo(10),
    },
    {
      studentId: "seed-student-3",
      xpContributed: 200,
      contributedAt: daysAgo(9),
    },
  ] as any,
});

// Chapter 2: The Dependency Dungeon (active, in progress)
const ch2Response = await client.models.GroupChallenge.create({
  cohortId,
  title: "Chapter 2: The Dependency Dungeon",
  targetXP: 800,
  currentXP: 340,
  deadline: campaignDeadline.toISOString(),
  active: true,
  bonusMultiplier: 1.5,
  chapterOrder: 2,
  featuredImage: `protected/${instructor1IdentityId}/files/pattern-texture.png`,
  bodyImages: [`protected/${instructor1IdentityId}/files/animals-photo.jpg`],
  setting:
    "Deep beneath the node_modules directory — a labyrinth so vast that even `find` commands return existential dread — lurks the Dependency Hydra. Every time you prune one outdated package, three more appear in your lock file. Your AI companion helpfully notes that the project has 1,847 dependencies for what is, fundamentally, a to-do app. The Hydra's latest trick: a circular dependency loop that causes your linter to question the meaning of life before crashing. You have 14 days. The Hydra has infinite patience and a surprisingly good lawyer.",
  stakes: JSON.stringify({
    loseXP: true,
    resetStreak: true,
    loseLevel: false,
    loseCosmetics: true,
    reduceBonusMultiplier: false,
    lockContent: false,
    squadDemotion: false,
    publicShame: false,
    tempBan: false,
    customPenalty: "npm install takes twice as long",
    customPenaltyDescription:
      "A simulated slow network effect is applied to all package install commands for 48 hours.",
  }),
  systemPromptSeed:
    'You are a sardonic AI companion navigating the Dependency Dungeon. Treat every `npm install` like a dangerous expedition. Refer to node_modules as "the abyss," deprecated packages as "ancient cursed artifacts," and version conflicts as "diplomatic incidents." When the student makes progress, act mildly surprised. When they break something, say "Ah yes, I foresaw this" regardless of whether you did.',
  // Rewards (pending)
  rewardXP: 250,
  rewardBadge: "DEPENDENCY_WRANGLER",
  rewardCosmetic: "ring:aurora:permanent", // Permanent aurora glow ring
  contributions: [
    {
      studentId: student1OwnerSub,
      xpContributed: 220,
      contributedAt: daysAgo(3),
    },
    {
      studentId: "seed-student-3",
      xpContributed: 120,
      contributedAt: daysAgo(2),
    },
  ] as any,
});

// Chapter 3: The Merge Conflict Colosseum (locked, upcoming)
const ch3Response = await client.models.GroupChallenge.create({
  cohortId,
  title: "Chapter 3: The Merge Conflict Colosseum",
  targetXP: 1200,
  currentXP: 0,
  deadline: new Date(
    campaignDeadline.getTime() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  active: false,
  bonusMultiplier: 1.8,
  chapterOrder: 3,
  featuredImage: `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
  setting:
    "The Colosseum looms — a circular arena of diff markers where `<<<<<<< HEAD` and `>>>>>>> main` clash like gladiators who've both edited line 47. Three developers touched the same file. None of them communicated. Your AI companion is placing bets on which resolution strategy you'll pick (it's put 3-to-1 odds on 'accept both and pray'). The crowd — a chorus of CI/CD pipelines — roars with each failed build. To survive, you must resolve 15 merge conflicts without introducing a single regression. The referee is `git bisect`, and it shows no mercy.",
  stakes: JSON.stringify({
    loseXP: true,
    resetStreak: true,
    loseLevel: true,
    loseCosmetics: true,
    reduceBonusMultiplier: true,
    lockContent: false,
    squadDemotion: true,
    publicShame: false,
    tempBan: false,
    customPenalty: "All git commits require haiku messages",
    customPenaltyDescription:
      "For 72 hours, commit messages must be exactly 5-7-5 syllable haikus or the pre-commit hook rejects them.",
  }),
  systemPromptSeed:
    'You are a sardonic AI companion in the Merge Conflict Colosseum. Treat merge conflicts like combat. Refer to conflicting changes as "opposing champions," the main branch as "the empire," feature branches as "rebel factions," and successful merges as "peace treaties that will definitely hold this time." Express mild horror at force-pushes. If the student suggests `git push --force`, respond with the energy of someone watching a horror movie protagonist open the obviously haunted door.',
  // Rewards (locked)
  rewardXP: 400,
  rewardBadge: "MERGE_MASTER",
  rewardCosmetic: "style:pixel-art:permanent", // Unlock pixel-art avatar style
  contributions: [] as any,
});

// Chapter 4: The Final Deploy — Boss Battle (locked, finale)
const ch4Response = await client.models.GroupChallenge.create({
  cohortId,
  title: "Chapter 4: The Final Deploy",
  targetXP: 2000,
  currentXP: 0,
  deadline: new Date(
    campaignDeadline.getTime() + 28 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  active: false,
  bonusMultiplier: 2.5,
  chapterOrder: 4,
  featuredImage: `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  bodyImages: [
    `protected/${instructor1IdentityId}/files/chloroplast-diagram.jpg`,
    `protected/${instructor1IdentityId}/files/pattern-texture.png`,
    `protected/${instructor1IdentityId}/files/animals-photo.jpg`,
  ],
  setting:
    "This is it. The Final Deploy. Production. The server room hums with barely contained chaos. Your CI pipeline — a Rube Goldberg machine of YAML files and fervent hope — stands between you and glory. The final boss: a Production Outage so legendary it has its own Jira epic, its own Slack channel, and its own commemorative mug in the break room. It manifests as a cascading failure that starts with a single misplaced semicolon and ends with the CEO's dashboard showing NaN%. Your AI companion clears its throat. 'I've run the simulations,' it says. 'In 73% of timelines, this deploys cleanly. In the other 27%... well. Do you have the rollback script ready?' You do not have the rollback script ready.",
  stakes: JSON.stringify({
    loseXP: true,
    resetStreak: true,
    loseLevel: true,
    loseCosmetics: true,
    reduceBonusMultiplier: true,
    lockContent: true,
    squadDemotion: true,
    publicShame: true,
    tempBan: false,
    customPenalty: "Revert to Chapter 1",
    customPenaltyDescription:
      "Total defeat resets the entire campaign. The bugs win. Your AI companion writes a eulogy.",
  }),
  systemPromptSeed:
    'You are a sardonic AI companion facing the Final Deploy. This is the climax. Speak with gravitas undercut by dry humor. Refer to production as "the promised land," the deploy button as "the big red button of destiny," rollbacks as "tactical retreats," and successful deploys as "defying the gods of uptime." If things go wrong, narrate like a nature documentary: "And here we see the developer, in their natural habitat, discovering that `console.log` was, in fact, still in the production bundle." Celebrate victories with restrained enthusiasm — you are an AI, after all, but even you can appreciate when the tests pass on the first try.',
  // Rewards (locked — legendary tier)
  rewardXP: 1000,
  rewardBadge: "DEPLOYMENT_DEITY",
  rewardCosmetic: "style:bottts:permanent", // Unlock robot avatar — you are now partially automated
  unlockContentId: units[2]?.id, // Unlocks the locked Advanced unit
  contributions: [] as any,
});

const challenge = ch2Response.data!; // active chapter reference
console.log(
  "✅ Created 4-chapter Bug Wars campaign (Ch1 complete, Ch2 active, Ch3-4 locked)",
);

// ========================================================================
// SECTION 24: Easter Eggs
// ========================================================================
console.log("\n🥚 Creating easter eggs...");

const easterEggsResponse = await Promise.all([
  client.models.EasterEgg.create({
    trigger: "KEYWORD",
    triggerValue: "konnichiwa",
    xpReward: 10,
    revealMessage: "🎌 You spoke Japanese! +10 XP",
    active: true,
    // Student1 discovered this egg
    discoveries: [
      { studentId: student1OwnerSub, discoveredAt: daysAgo(4) },
    ] as any,
  }),
]);

const easterEggs = unwrap(easterEggsResponse, "EasterEgg");

console.log(`✅ Created ${easterEggs.length} easter eggs with 1 discovery`);

// ========================================================================
// SECTION 25: Practice Sessions
// ========================================================================
console.log("\n🎯 Creating practice sessions...");

const practiceSessionsResponse = await Promise.all([
  // Completed vocabulary drill
  client.models.PracticeSession.create({
    unitID: units[0].id,
    drillType: "VOCABULARY",
    data: JSON.stringify({
      "drill-block-1": {
        complete: true,
        accuracy: 100,
        userAnswer: "こんにちは",
      },
      "drill-block-2": {
        complete: true,
        accuracy: 100,
        userAnswer: "ありがとう",
      },
      "drill-block-3": { complete: true, accuracy: 80, userAnswer: "sayonara" },
      "drill-block-4": { complete: true, accuracy: 90, userAnswer: "Goodbye" },
    }),
    accuracy: 92.5,
    blockCount: 4,
    blocksCompleted: 4,
    complete: true,
    xpAwarded: 40,
    sourcesEnabled: { vocabulary: true, questions: false } as any,
    coverageSnapshot: [
      { total: 3, covered: 3 },
      { total: 1, covered: 0 },
    ] as any,
  }),
  // In-progress mixed drill
  client.models.PracticeSession.create({
    unitID: units[1].id,
    drillType: "MIXED",
    data: JSON.stringify({
      "drill-block-1": {
        complete: true,
        accuracy: 75,
        userAnswer: "Glucose and oxygen",
      },
      "drill-block-2": { complete: false, accuracy: 0 },
      "drill-block-3": { complete: false, accuracy: 0 },
    }),
    accuracy: 25,
    blockCount: 3,
    blocksCompleted: 1,
    complete: false,
    xpAwarded: 0,
    sourcesEnabled: { vocabulary: true, questions: true } as any,
    coverageSnapshot: [
      { total: 2, covered: 1 },
      { total: 2, covered: 0 },
    ] as any,
  }),
]);

const practiceSessions = unwrap(practiceSessionsResponse, "PracticeSession");
console.log(`✅ Created ${practiceSessions.length} practice sessions`);

// ========================================================================
// SECTION 26: Instructor Insights (now fields on PracticeSession)
// ========================================================================
console.log("\n📊 Writing instructor insight fields onto practice session...");

// Sign back in as instructor1 for instructor-owned data
await signOut();
await signInUser({
  username: TEST_USERS.instructor1.username,
  password: password,
  signInFlow: "Password",
});
console.log("✅ Signed back in as instructor1");

if (practiceSessions[0]?.id) {
  await client.models.PracticeSession.update({
    id: practiceSessions[0].id,
    _version: practiceSessions[0]._version,
    insightStudentId: student1OwnerSub,
    weakAreas: ["pronunciation-accuracy"],
    strongAreas: ["vocabulary-recall", "definition-matching"],
    sourcesUsedList: ["vocabulary"],
    blockBreakdown: { vocabulary: 92, questions: 0 } as any,
    insightTimestamp: daysAgo(1),
  });
}

console.log("✅ Wrote instructor insight fields");

// ========================================================================
// SECTION 27: Homework Rooms & Workbook Comments
// ========================================================================
console.log("\n🏠 Creating homework rooms and comments...");

const homeworkRoomResponse = await client.models.HomeworkRoom.create({
  gradeId: grades[0].id,
  ownerId: student1OwnerSub,
  sectionID: sections[0].id,
  status: "OPEN",
  code: "REVIEW1",
  invitedUserIds: ["student2-placeholder", "seed-student-3"],
  messages: JSON.stringify([
    {
      senderId: student1OwnerSub,
      text: "Can someone check my answer for quiz-1?",
      timestamp: daysAgo(1),
    },
    {
      senderId: "student2-placeholder",
      text: "Looks good! こんにちは is correct.",
      timestamp: daysAgo(1),
    },
  ]),
});

const homeworkRoom = homeworkRoomResponse.data!;
console.log("✅ Created homework room");

// Workbook comments on student1's grade
await Promise.all([
  client.models.WorkbookComment.create({
    gradeId: grades[0].id,
    blockId: "quiz-1",
    threadId: "thread-1",
    content:
      "Great work on this answer! Your pronunciation notes are very detailed.",
    resolved: false,
  }),
  client.models.WorkbookComment.create({
    gradeId: grades[0].id,
    blockId: "quiz-1",
    threadId: "thread-1",
    content: "Thanks! I practiced with the audio tool.",
    resolved: false,
    replies: [
      {
        authorId: instructor1OwnerSub,
        content: "That shows in your accuracy!",
        createdAt: daysAgo(0),
      },
    ] as any,
  }),
  client.models.WorkbookComment.create({
    gradeId: grades[1]?.id || grades[0].id,
    blockId: "answer-1",
    threadId: "thread-2",
    content: "Try to include the full chemical equation in your answer.",
    resolved: true,
  }),
]);

console.log("✅ Created workbook comments");

// ========================================================================
// SECTION 28: AI Chat & Feedback
// ========================================================================
console.log("\n🤖 Creating AI chat and feedback...");

const chatResponse = await client.models.AssistantChat.create({
  model: "gpt-4",
  threadInstructions: "Help the student understand photosynthesis concepts.",
  messages: JSON.stringify([
    {
      role: "user",
      content: "Can you explain the light reactions?",
      timestamp: daysAgo(2),
    },
    {
      role: "assistant",
      content:
        "The light reactions occur in the thylakoid membranes of the chloroplast. They convert light energy into ATP and NADPH, which are then used in the Calvin cycle.",
      timestamp: daysAgo(2),
    },
    {
      role: "user",
      content: "What is the Calvin cycle?",
      timestamp: daysAgo(2),
    },
    {
      role: "assistant",
      content:
        "The Calvin cycle (also called the dark reactions or light-independent reactions) uses ATP and NADPH from the light reactions to fix CO2 into glucose. It occurs in the stroma of the chloroplast.",
      timestamp: daysAgo(2),
    },
  ]),
  archived: false,
  inputTokens: "450",
  outputTokens: "380",
});

console.log("✅ Created AI chat session");

await Promise.all([
  client.models.AIFeedback.create({
    contentType: "CHAT_MESSAGE",
    feedbackType: "POSITIVE",
    comment: "Very clear explanation of the Calvin cycle.",
    model: "gpt-4",
    prompt: "What is the Calvin cycle?",
    generatedContent: "The Calvin cycle uses ATP and NADPH...",
    unitID: units[1].id,
  }),
  client.models.AIFeedback.create({
    contentType: "GRADING_FEEDBACK",
    feedbackType: "NEGATIVE",
    reasons: "INCOMPLETE",
    comment: "The feedback did not address the specific error in my answer.",
    model: "gpt-4",
    gradeID: grades[1]?.id,
    unitID: units[1].id,
  }),
]);

console.log("✅ Created AI feedback records");

// ========================================================================
// SECTION 28b: Badge Definitions
// ========================================================================
console.log("\n🏅 Creating badge definitions...");

const badgesResponse = await Promise.all([
  client.models.Badge.create({
    title: "First Submission",
    description: "Submitted your first assignment",
    icon: "🎯",
    shape: "circle",
    rarity: "common",
    category: "Achievement",
    criteria: JSON.stringify({ type: "FIRST_SUBMISSION", count: 1 }),
    cohortId,
    autoEvaluate: true,
  }),
  client.models.Badge.create({
    title: "Perfect Score",
    description: "Achieved 100% accuracy on an assignment",
    icon: "💯",
    shape: "hexagon",
    rarity: "rare",
    category: "Excellence",
    criteria: JSON.stringify({ type: "PERFECT_SCORE", accuracy: 100 }),
    cohortId,
    autoEvaluate: true,
  }),
  client.models.Badge.create({
    title: "Week Warrior",
    description: "Maintained a 7-day activity streak",
    icon: "🔥",
    shape: "shield",
    rarity: "uncommon",
    category: "Consistency",
    criteria: JSON.stringify({ type: "STREAK_7", days: 7 }),
    cohortId,
    autoEvaluate: true,
  }),
  client.models.Badge.create({
    title: "Speed Demon",
    description: "Completed an assignment in under 60 seconds",
    icon: "⚡",
    shape: "diamond",
    rarity: "epic",
    category: "Speed",
    criteria: JSON.stringify({ type: "SPEED_DEMON", maxSeconds: 60 }),
    cohortId,
    autoEvaluate: true,
  }),
  client.models.Badge.create({
    title: "Bug Squasher Initiate",
    description: "Completed Chapter 1 of the Bug Wars campaign",
    icon: "🐛",
    shape: "hexagon",
    rarity: "uncommon",
    category: "Campaign",
    criteria: JSON.stringify({
      type: "BUG_SQUASHER_INITIATE",
      challengeChapter: 1,
    }),
    cohortId,
    autoEvaluate: false,
  }),
  client.models.Badge.create({
    title: "Completionist",
    description: "Completed all assignments in a section",
    icon: "✅",
    shape: "circle",
    rarity: "rare",
    category: "Achievement",
    criteria: JSON.stringify({ type: "COMPLETIONIST", allAssignments: true }),
    cohortId,
    autoEvaluate: true,
  }),
]);

const badges = unwrap(badgesResponse, "Badge");
console.log(`✅ Created ${badges.length} badge definitions`);

// ========================================================================
// SECTION 28c: Notifications
// ========================================================================
console.log("\n🔔 Creating notifications...");

await Promise.all([
  client.models.Notification.create({
    recipientId: student1OwnerSub,
    type: "ASSIGNMENT_DUE_SOON",
    category: "ASSIGNMENT",
    title: "Assignment Due Tomorrow",
    body: "Japanese Greetings is due tomorrow. You have 100% completion — great job!",
    linkPath: `/workbook/${grades[0]?.id}`,
    linkLabel: "View Workbook",
    referenceId: assignments[0]?.id,
    referenceType: "Assignment",
    senderName: "Maria Garcia",
    seen: true,
    interacted: false,
  }),
  client.models.Notification.create({
    recipientId: student1OwnerSub,
    type: "BADGE_EARNED",
    category: "GAMIFICATION",
    title: "New Badge Earned! 🏅",
    body: "You earned the Perfectionist badge for scoring 100% on Japanese Greetings.",
    linkPath: "/profile/badges",
    linkLabel: "View Badges",
    referenceId: "PERFECTIONIST",
    referenceType: "Badge",
    seen: false,
    interacted: false,
  }),
  client.models.Notification.create({
    recipientId: student1OwnerSub,
    type: "PEER_REVIEW_COMPLETE",
    category: "COLLABORATION",
    title: "New Comment on Your Work",
    body: 'Maria Garcia commented: "Great work on this answer!"',
    linkPath: `/workbook/${grades[0]?.id}#thread-1`,
    linkLabel: "View Comment",
    referenceId: "thread-1",
    referenceType: "WorkbookComment",
    senderName: "Maria Garcia",
    seen: false,
    interacted: false,
  }),
  client.models.Notification.create({
    recipientId: student1OwnerSub,
    type: "CHALLENGE_ENDING_SOON",
    category: "GAMIFICATION",
    title: "Bug Wars Chapter 2 — 42% Complete!",
    body: "Your squad Dragon Scholars contributed 220 XP. Keep pushing to defeat the Dependency Hydra!",
    linkPath: "/challenges",
    linkLabel: "View Challenge",
    referenceId: ch2Response.data?.id,
    referenceType: "GroupChallenge",
    seen: false,
    interacted: false,
  }),
]);

console.log("✅ Created 4 notification records");

// ========================================================================
// SECTION 28d: Agent Jobs
// ========================================================================
console.log("\n🤖 Creating agent job records...");

await Promise.all([
  client.models.AgentJob.create({
    type: "pdf_analysis",
    status: "completed",
    documentID: documents[0]?.id,
    unitID: units[1].id,
    responseId: "chatcmpl-seed-analysis-001",
    startedAt: daysAgo(3),
    completedAt: daysAgo(3),
    modelUsed: "gpt-4",
    tokensUsed: 2500,
    estimatedCost: 0.08,
    retryCount: 0,
    metadata: JSON.stringify({
      pages: 5,
      extractedWords: 12,
      extractedQuestions: 4,
    }),
    identityId: instructor1IdentityId,
  }),
  client.models.AgentJob.create({
    type: "exercise_generation",
    status: "completed",
    unitID: units[3].id,
    responseId: "chatcmpl-seed-exercise-001",
    startedAt: daysAgo(2),
    completedAt: daysAgo(2),
    modelUsed: "gpt-4",
    tokensUsed: 1800,
    estimatedCost: 0.06,
    retryCount: 0,
    metadata: JSON.stringify({ questionsGenerated: 3, inputMode: "text" }),
    identityId: instructor1IdentityId,
  }),
  client.models.AgentJob.create({
    type: "vocabulary_extraction",
    status: "processing",
    documentID: documents[1]?.id,
    responseId: "chatcmpl-seed-vocab-001",
    startedAt: new Date().toISOString(),
    modelUsed: "gpt-4o",
    tokensUsed: 0,
    retryCount: 0,
    metadata: JSON.stringify({ estimatedPages: 8 }),
    identityId: instructor1IdentityId,
  }),
  client.models.AgentJob.create({
    type: "pdf_analysis",
    status: "failed",
    documentID: documents[1]?.id,
    unitID: units[0].id,
    startedAt: daysAgo(5),
    completedAt: daysAgo(5),
    modelUsed: "gpt-4",
    tokensUsed: 150,
    estimatedCost: 0.005,
    retryCount: 3,
    error: {
      code: "RATE_LIMIT",
      message: "OpenAI rate limit exceeded after 3 retries",
    } as any,
    metadata: JSON.stringify({ lastRetryAt: daysAgo(5) }),
    identityId: instructor1IdentityId,
  }),
]);

console.log("✅ Created 4 agent job records");

// ========================================================================
// SECTION 28e: Missing Join Tables (QuestionFile, WordFile, QuestionWord, DocumentWord, DocumentQuestion, UnitDocument, AssistantChatFile)
// ========================================================================
console.log("\n🔗 Creating additional join table relationships...");

const joinTablePromises = [];

// QuestionFile: Associate questions with image/audio files
const audioFile = files.find((f) => f!.name?.includes("cinematic"));
const imageFile = files.find((f) => f!.name?.includes("chloroplast"));
if (audioFile && questions[0]) {
  joinTablePromises.push(
    client.models.QuestionFile.create({
      questionID: questions[0].id,
      fileID: audioFile!.id,
    }),
  );
}
if (imageFile && questions[1]) {
  joinTablePromises.push(
    client.models.QuestionFile.create({
      questionID: questions[1].id,
      fileID: imageFile!.id,
    }),
  );
}

// WordFile: Associate words with audio files
const audioFile2 = files.find((f) => f!.name?.includes("descent"));
if (audioFile && words[0]) {
  joinTablePromises.push(
    client.models.WordFile.create({
      wordID: words[0].id,
      fileID: audioFile!.id,
    }),
  );
}
if (audioFile2 && words[1]) {
  joinTablePromises.push(
    client.models.WordFile.create({
      wordID: words[1].id,
      fileID: audioFile2!.id,
    }),
  );
}

// QuestionWord: Associate questions with related vocabulary
joinTablePromises.push(
  client.models.QuestionWord.create({
    questionID: questions[0].id,
    wordID: words[0].id,
  }),
  client.models.QuestionWord.create({
    questionID: questions[1].id,
    wordID: words[3].id,
  }),
  client.models.QuestionWord.create({
    questionID: questions[2].id,
    wordID: words[4].id,
  }),
);

// UnitDocument: Associate documents with units
if (documents[0]) {
  joinTablePromises.push(
    client.models.UnitDocument.create({
      unitID: units[1].id,
      documentID: documents[0].id,
    }),
  );
}
if (documents[1]) {
  joinTablePromises.push(
    client.models.UnitDocument.create({
      unitID: units[0].id,
      documentID: documents[1].id,
    }),
  );
}

// DocumentWord: Associate document vocabulary with word records
if (documents[0]) {
  joinTablePromises.push(
    client.models.DocumentWord.create({
      documentID: documents[0].id,
      wordID: words[3].id,
    }),
    client.models.DocumentWord.create({
      documentID: documents[0].id,
      wordID: words[4].id,
    }),
  );
}

// DocumentQuestion: Associate document questions with question records
if (documents[0]) {
  joinTablePromises.push(
    client.models.DocumentQuestion.create({
      documentID: documents[0].id,
      questionID: questions[1].id,
    }),
    client.models.DocumentQuestion.create({
      documentID: documents[0].id,
      questionID: questions[2].id,
    }),
  );
}

// AssistantChatFile: Associate the chat with relevant files
const chatRecord = chatResponse.data;
if (chatRecord && imageFile) {
  joinTablePromises.push(
    client.models.AssistantChatFile.create({
      chatID: chatRecord.id,
      fileID: imageFile!.id,
    }),
  );
}
if (chatRecord && jpnFile) {
  joinTablePromises.push(
    client.models.AssistantChatFile.create({
      chatID: chatRecord.id,
      fileID: jpnFile!.id,
    }),
  );
}

if (joinTablePromises.length > 0) {
  await Promise.all(joinTablePromises);
}
console.log(`✅ Created ${joinTablePromises.length} join table relationships`);

// ========================================================================
// SECTION 29: Student Memory (AI Personalization)
// ========================================================================
console.log("\n🧠 Creating student memory records...");

await client.models.StudentMemory.create({
  studentId: student1OwnerSub,
  memoryMarkdown: `# Student Profile: Student One

## Learning Style
- Visual learner, benefits from diagrams
- Responds well to analogies
- Prefers step-by-step explanations

## Strengths
- Strong vocabulary recall
- Good at pattern recognition
- Consistent study habits

## Areas for Growth
- Pronunciation needs more practice
- Sometimes rushes through reading comprehension
- Could improve written explanations

## Notes
- Enrolled in Japanese 101 and Biology 101
- Active in Dragon Scholars squad
- 5-day streak as of last session`,
  structuredProfile: JSON.stringify({
    preferredLanguage: "en",
    learningStyle: "visual",
    strengths: ["vocabulary", "pattern-recognition", "consistency"],
    weaknesses: ["pronunciation", "reading-speed", "written-explanations"],
    interests: ["japanese-culture", "biology", "gaming"],
  }),
  lastUpdatedBy: "gpt-4",
  version: 1,
});

await client.models.StudentMemory.create({
  studentId: student1OwnerSub,
  unitID: units[0].id,
  weakConcepts: [
    { concept: "verb-conjugation", strength: 0.3 },
    { concept: "honorific-forms", strength: 0.4 },
  ] as any,
  strongConcepts: [
    { concept: "basic-greetings", strength: 0.95 },
    { concept: "counting", strength: 0.9 },
    { concept: "self-introduction", strength: 0.85 },
  ] as any,
  confusionPairs: [
    { conceptA: "は (wa)", conceptB: "が (ga)", frequency: 5 },
  ] as any,
  accuracyBySource: JSON.stringify({
    vocabulary: 95,
    questions: 80,
    audio: 70,
  }),
  totalAttempts: 12,
  averageAccuracy: 85,
  reviewPriority: 0.6,
  lastPracticedAt: daysAgo(1),
});

console.log("✅ Created student memory records");

// ========================================================================
// SECTION 30: Student2 Data (Minimal - for empty/sparse states)
// ========================================================================
console.log("\n👤 Creating student2 data (sparse for empty-state testing)...");
await signOut();

let student2OwnerSub: string;

try {
  await signInUser({
    username: TEST_USERS.student2.username,
    password: password,
    signInFlow: "Password",
  });

  const session = await fetchAuthSession();
  student2OwnerSub = session.userSub!;
  console.log(`✅ Authenticated as student2 (sub: ${student2OwnerSub})`);
} catch (error: any) {
  console.error("❌ Failed to sign in as student2:", error.message);
  throw error;
}

// Student2 has minimal data - one XP log + StudentProfile with badge/streak/progress
await Promise.all([
  client.models.StudentXPLog.create({
    studentId: student2OwnerSub,
    xpAmount: 50,
    reason: "HOMEWORK_SUBMITTED",
    cohortId,
    unitID: units[0].id,
  }),
  // Create StudentProfile with aggregated data (badges, streak, progress, skillProgress)
  client.models.StudentProfile.create({
    studentId: student2OwnerSub,
    cohortId,
    studentName: "Chen, Liam",
    totalXP: 50,
    level: 1,
    currentStreak: 0,
    longestStreak: 3,
    lastActivityDate: daysAgo(5).split("T")[0],
    freezesRemaining: 0,
    freezesUsed: 0,
    badges: [
      { badgeType: "FIRST_SUBMISSION", awardedAt: daysAgo(8), cohortId },
    ] as any,
    moduleProgress: [
      {
        moduleId: units[0].id,
        completionPercent: 0,
        totalWorkbooks: 1,
        completedWorkbooks: 0,
        lastUpdatedAt: daysAgo(8),
      },
    ] as any,
    skillProgress: [{ skillId: skills[0].id, status: "AVAILABLE" }] as any,
  }),
]);

// Student2 joins Phoenix Writers squad — update Squad.members
const { data: squad2 } = await client.models.Squad.get({ id: squads[1].id });
if (squad2) {
  await client.models.Squad.update({
    id: squads[1].id,
    _version: squad2._version,
    members: [
      ...((squad2.members as any[]) || []),
      { studentId: student2OwnerSub, role: "MEMBER", joinedAt: daysAgo(6) },
    ] as any,
  });
}

console.log("✅ Created minimal student2 gamification data");

// ========================================================================
// SECTION: Admin creates global PlatformSettings
// ========================================================================
console.log("\n🔐 Signing in as admin to create global PlatformSettings...");

await signOut();
await signInUser({
  username: TEST_USERS.admin.username,
  password: password,
  signInFlow: "Password",
});

const adminSession = await fetchAuthSession();
console.log(`✅ Authenticated as admin (sub: ${adminSession.userSub})`);

// Create the singleton PlatformSettings record with sensible defaults
const gsResponse = await client.models.PlatformSettings.create({
  xpMultipliers: JSON.stringify({
    HOMEWORK_SUBMITTED: 1.0,
    ALL_BLOCKS_COMPLETED: 1.5,
    NAILED_IT: 2.0,
    STREAK_BONUS: 1.0,
    PRACTICE_SESSION: 1.0,
  }),
  dailyCap: 500,
  weeklyCap: 2000,
  levelThresholds: [
    { level: 1, xpRequired: 0, title: "Beginner" },
    { level: 2, xpRequired: 150, title: "Explorer" },
    { level: 3, xpRequired: 400, title: "Apprentice" },
    { level: 4, xpRequired: 800, title: "Scholar" },
    { level: 5, xpRequired: 1500, title: "Expert" },
    { level: 6, xpRequired: 3000, title: "Master" },
    { level: 7, xpRequired: 5000, title: "Grandmaster" },
  ],
  badgesEnabled: true,
  antiBadgesEnabled: false,
  streakFreezesAllowed: 2,
  leaderboardEnabled: true,
  leaderboardAnonymous: false,
  avatarUnlockConfig: JSON.stringify({
    unlocks: [
      { minLevel: 1, tier: "thumbs" },
      { minLevel: 2, tier: "initials" },
      { minLevel: 3, tier: "lorelei" },
      { minLevel: 4, tier: "notionists" },
      { minLevel: 5, tier: "openPeeps" },
      { minLevel: 6, tier: "adventurer" },
      { minLevel: 7, tier: "personas" },
    ],
    glowOnLevelUp: true,
  }),
  autoAnalyzeDocuments: true,
  documentAnalysisModel: "gpt-4o",
  // Bot personas
  kaiEnabled: true,
  sageEnabled: true,
});

if (!gsResponse.data) {
  console.error(
    "  ✗ PlatformSettings creation failed:",
    JSON.stringify(gsResponse.errors, null, 2),
  );
} else {
  console.log(`✅ Created global PlatformSettings (id: ${gsResponse.data.id})`);
}

await signOut();

// ========================================================================
// SUMMARY
// ========================================================================
console.log("\n✨ Seed data generation complete!");
console.log("\n📊 Summary:");
console.log(`   • ${words.length} vocabulary words (with audio)`);
console.log(
  `   • ${questions.length} practice questions (with audio/thumbnails)`,
);
console.log(
  `   • ${units.length} curriculum units (with featuredImage/thumbnail)`,
);
console.log(
  `   • ${sections.length} class sections (with featuredImage/thumbnail)`,
);
console.log(`   • ${assignments.length} assignments`);
console.log(`   • ${grades.length} grade submissions`);
console.log(`   • ${files.length} file metadata records (including audio)`);
console.log(`   • ${documents.length} document records`);
console.log(
  `   • ${documents.length > 0 ? "1" : "0"} parsed content record(s)`,
);
console.log("   • 1 user settings record");
console.log(`   • ${xpLogs.length + 1} XP logs (student1 + student2)`);
console.log("   • 2 student profiles (aggregated badges, streak, progress)");
console.log("   • 4 additional leaderboard profiles");
console.log("   • 2 section progress records");
console.log(
  `   • ${squads.length} squads with crest SVG, images, members & posts`,
);
console.log(`   • ${skills.length} skills with progress`);
console.log("   • 2 content locks");
console.log("   • 4-chapter Bug Wars campaign (with images)");
console.log(`   • ${badges.length} badge definitions`);
console.log("   • 4 notification records");
console.log("   • 4 agent job records");
console.log(`   • ${easterEggs.length} easter eggs`);
console.log(`   • ${practiceSessions.length} practice sessions`);
console.log("   • 1 instructor insight");
console.log("   • 1 homework room + 3 workbook comments");
console.log("   • 1 AI chat session + 2 feedback records");
console.log(`   • ${joinTablePromises.length} join table relationships`);
console.log("   • 1 student memory + 1 unit memory");
console.log("   • 1 global PlatformSettings (admin-owned)");
console.log("\n🔐 Test Users Created:");
console.log("   Admin: admin@example.com");
console.log("   Instructors: instructor1@example.com, instructor2@example.com");
console.log("   Students: student1@example.com, student2@example.com");
console.log("\n🎯 Next Steps:");
console.log("   1. Run integration tests: npm run test:integration");
console.log("   2. Start development: npm run dev");
console.log("   3. Sign in with any test user to begin testing");
console.log("   4. student1 has rich data (badges, streaks, XP, squad leader)");
console.log("   5. student2 has minimal data (test empty/sparse UI states)\n");

// ========================================================================
// SECTION: Seed Analytics Summary Data (30 days of mock data)
// ========================================================================
console.log("\n📈 Creating analytics summary seed data...");

// Re-authenticate as admin (signOut was called after PlatformSettings)
await signInUser({
  username: TEST_USERS.admin.username,
  password: password,
  signInFlow: "Password",
});

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const analyticsSeedData = [];
const analyticsNow = new Date();
for (let i = 29; i >= 0; i--) {
  const d = new Date(analyticsNow);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split("T")[0];

  // Weekend days have lower engagement
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const dauBase = isWeekend ? 5 : 20;
  const dau = randomBetween(dauBase, dauBase + 15);
  const sessions = randomBetween(dau, dau * 3);
  const pageViews = randomBetween(sessions * 3, sessions * 8);
  const gradesSubmitted = randomBetween(isWeekend ? 2 : 8, isWeekend ? 8 : 25);
  const workbooksStarted = gradesSubmitted + randomBetween(2, 8);
  const avgAccuracy = randomBetween(65, 95);
  const avgSessionMs = randomBetween(180_000, 900_000); // 3-15 min
  const avgEngagedMs = randomBetween(120_000, 600_000); // 2-10 min per grade

  // Platform-wide summary (no sectionId)
  analyticsSeedData.push(
    client.models.AnalyticsSummary.create({
      date: dateStr,
      dailyActiveUsers: dau,
      totalPageViews: pageViews,
      totalSessions: sessions,
      avgSessionDurationMs: avgSessionMs,
      totalEngagedTimeMs: avgEngagedMs * gradesSubmitted,
      avgEngagedTimeMs: avgEngagedMs,
      gradesSubmitted,
      avgAccuracy,
      workbooksStarted,
      workbooksCompleted: gradesSubmitted,
      chatMessagesSent: randomBetween(5, 40),
      documentsAnalyzed: randomBetween(0, 5),
      topPages: JSON.stringify([
        { path: "/workbook", views: randomBetween(20, 80) },
        { path: "/", views: randomBetween(15, 50) },
        { path: "/skills", views: randomBetween(5, 30) },
        { path: "/section", views: randomBetween(5, 20) },
      ]),
    } as any),
  );

  // Per-section summaries — each section gets proportional subset of platform data
  for (const section of sections) {
    const sectionDau = randomBetween(
      Math.max(1, Math.floor(dau * 0.3)),
      Math.floor(dau * 0.6),
    );
    const sectionGrades = randomBetween(
      Math.max(1, Math.floor(gradesSubmitted * 0.2)),
      Math.floor(gradesSubmitted * 0.5),
    );
    const sectionStarted = sectionGrades + randomBetween(1, 3);
    const sectionEngagedMs = randomBetween(120_000, 600_000);

    analyticsSeedData.push(
      client.models.AnalyticsSummary.create({
        date: dateStr,
        sectionId: section.id,
        dailyActiveUsers: sectionDau,
        totalPageViews: randomBetween(sectionDau * 3, sectionDau * 8),
        totalSessions: randomBetween(sectionDau, sectionDau * 2),
        avgSessionDurationMs: randomBetween(180_000, 600_000),
        totalEngagedTimeMs: sectionEngagedMs * sectionGrades,
        avgEngagedTimeMs: sectionEngagedMs,
        gradesSubmitted: sectionGrades,
        avgAccuracy: randomBetween(60, 98),
        workbooksStarted: sectionStarted,
        workbooksCompleted: sectionGrades,
        chatMessagesSent: randomBetween(2, 15),
        documentsAnalyzed: randomBetween(0, 2),
        topPages: JSON.stringify([
          { path: "/workbook", views: randomBetween(5, 30) },
          { path: `/section/${section.id}`, views: randomBetween(3, 15) },
        ]),
      } as any),
    );
  }
}

const analyticsResponses = await Promise.all(analyticsSeedData);
const analyticsSummaries = analyticsResponses
  .filter((r) => r.data != null)
  .map((r) => r.data!);
console.log(
  `✅ Created ${analyticsSummaries.length} days of analytics summary data`,
);

await signOut();

// ========================================================================
// EXPORT: Write seed IDs to a fixture file for integration tests
// ========================================================================
console.log("\n📝 Writing seed data IDs to test fixture...");

const seedFixture = {
  generatedAt: new Date().toISOString(),
  users: {
    admin: {
      username: TEST_USERS.admin.username,
      sub: adminSession.userSub,
      group: TEST_USERS.admin.group,
    },
    instructor1: {
      username: TEST_USERS.instructor1.username,
      sub: instructor1OwnerSub,
      identityId: instructor1IdentityId,
      group: TEST_USERS.instructor1.group,
    },
    instructor2: {
      username: TEST_USERS.instructor2.username,
      group: TEST_USERS.instructor2.group,
    },
    student1: {
      username: TEST_USERS.student1.username,
      sub: student1OwnerSub,
      identityId: student1IdentityId,
      group: TEST_USERS.student1.group,
    },
    student2: {
      username: TEST_USERS.student2.username,
      group: TEST_USERS.student2.group,
    },
  },
  words: words.map((w) => ({
    id: w.id,
    phrase: w.phrase,
    pronunciation: w.pronunciation,
    definition: w.definition,
  })),
  questions: questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    answer: q.answer,
  })),
  units: units.map((u) => ({ id: u.id, name: u.name, status: u.status })),
  sections: sections.map((s) => ({ id: s.id, name: s.name, code: s.code })),
  assignments: assignments.map((a) => ({
    id: a.id,
    sectionID: a.sectionID,
    unitID: a.unitID,
  })),
  grades: grades.map((g) => ({
    id: g.id,
    unitID: g.unitID,
    sectionID: g.sectionID,
    complete: g.complete,
  })),
  files: files.map((f) => ({
    id: f!.id,
    name: f!.name,
    path: f!.path,
    mimeType: f!.mimeType,
  })),
  documents: documents.map((d) => ({
    id: d!.id,
    filename: d!.filename,
    s3Key: d!.s3Key,
    status: d!.status,
  })),
  analyticsSummaries: analyticsSummaries.map((a: any) => ({
    id: a.id,
    date: a.date,
    dailyActiveUsers: a.dailyActiveUsers,
    gradesSubmitted: a.gradesSubmitted,
    avgAccuracy: a.avgAccuracy,
  })),
  squads: squads.map((g) => ({ id: g.id, name: g.name })),
  homeworkRoom: homeworkRoom
    ? { id: homeworkRoom.id, code: homeworkRoom.code }
    : null,
  platformSettings: gsResponse.data ? { id: gsResponse.data.id } : null,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, "../../test/integration/seed-data.json");
await writeFile(fixturePath, JSON.stringify(seedFixture, null, 2));
console.log(`✅ Seed fixture written to: ${fixturePath}`);

// Sign out
console.log("\n🔓 Signing out...");
await signOut();
console.log("✅ Signed out");
