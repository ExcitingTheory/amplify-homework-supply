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
import { readFile } from "node:fs/promises";
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
  }),
  client.models.Word.create({
    phrase: "ありがとう",
    pronunciation: "arigatou",
    definition: "Thank you",
  }),
  client.models.Word.create({
    phrase: "さようなら",
    pronunciation: "sayounara",
    definition: "Goodbye",
  }),
  client.models.Word.create({
    phrase: "photosynthesis",
    pronunciation: "foh-toh-SIN-thuh-sis",
    definition:
      "The process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen",
  }),
  client.models.Word.create({
    phrase: "chloroplast",
    pronunciation: "KLOR-uh-plast",
    definition: "Organelle in plant cells where photosynthesis occurs",
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
  }),
  client.models.Question.create({
    prompt: "What is the main product of photosynthesis?",
    answer: "Glucose (sugar) and oxygen",
    hint: "Plants produce this sugar for energy",
    difficulty: "intermediate",
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
    children: [
      {
        type: "heading",
        tag: "h1",
        children: [{ type: "text", text: "Japanese Greetings - Unit 1" }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Learn basic Japanese greetings for daily conversation.",
          },
        ],
      },
      {
        type: "quiz",
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
    children: [
      {
        type: "heading",
        tag: "h1",
        children: [{ type: "text", text: "Photosynthesis - Biology Unit" }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Photosynthesis is the process by which plants convert light energy into chemical energy.",
          },
        ],
      },
      {
        type: "answer",
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
    children: [
      {
        type: "heading",
        tag: "h1",
        children: [{ type: "text", text: "AI-Graded Biology Exercise" }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Answer the following questions about photosynthesis. Your responses will be graded by AI based on scientific accuracy.",
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
  }),
  client.models.Unit.create({
    name: "Photosynthesis",
    description:
      "Understanding how plants convert light energy into chemical energy",
    contentVersion: 1,
    publishedContentVersion: 1,
    identityId: instructor1IdentityId,
    status: "PUBLISHED",
  }),
  client.models.Unit.create({
    name: "Advanced Japanese Verbs",
    description: "DRAFT - Conjugation patterns for common Japanese verbs",
    identityId: instructor1IdentityId,
    status: "DRAFT",
  }),
  client.models.Unit.create({
    name: "AI Biology Exercise",
    description:
      "AI-graded exercise on photosynthesis concepts using text and audio input",
    contentVersion: 1,
    publishedContentVersion: 1,
    identityId: instructor1IdentityId,
    status: "PUBLISHED",
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
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }),
  client.models.Section.create({
    name: "Biology 101 - Period 3",
    description: "Introduction to Biology",
    status: "PUBLISHED",
    code: "BIO101-P3",
    readableGroups: ["section-bio101-instructors", "section-bio101-learners"],
    writableGroups: ["section-bio101-instructors"],
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
// SECTION 9: Create Sample Files
// ========================================================================
console.log("\n📁 Creating file metadata records...");

const filesResponse = await Promise.all([
  client.models.File.create({
    name: "sample-audio.mp3",
    description: "Sample audio pronunciation",
    mimeType: "audio/mpeg",
    level: "PUBLIC",
    path: "public/audio/sample-audio.mp3",
    size: 52480,
    duration: 3500, // 3.5 seconds
    owner: instructor1OwnerSub,
    identityId: instructor1IdentityId,
  }),
  client.models.File.create({
    name: "chloroplast-diagram.jpg",
    description: "Labeled diagram of chloroplast structure",
    mimeType: "image/jpeg",
    level: "PUBLIC",
    path: "public/images/chloroplast-diagram.jpg",
    size: 245760,
    owner: instructor1OwnerSub,
    identityId: instructor1IdentityId,
  }),
  client.models.File.create({
    name: "student-recording.mp3",
    description: "Student pronunciation practice",
    mimeType: "audio/mpeg",
    level: "PROTECTED",
    path: "protected/us-east-1:student1-identity-id/recordings/recording-1.mp3",
    size: 87040,
    duration: 5200,
    owner: instructor1OwnerSub,
    identityId: instructor1IdentityId,
  }),
]);

const files = filesResponse
  .map((r) => r.data)
  .filter((f) => f !== null && f !== undefined);
console.log(`✅ Created ${files.length} file metadata records`);

// Associate files with units (only if files were created)
if (files.length >= 2) {
  await Promise.all([
    client.models.UnitFile.create({
      unitID: units[0].id,
      fileID: files[0]!.id,
    }),
    client.models.UnitFile.create({
      unitID: units[1].id,
      fileID: files[1]!.id,
    }),
  ]);

  console.log("✅ Created unit-file relationships");
} else {
  console.log(
    "⚠️ Skipping unit-file relationships (insufficient files created)",
  );
}
// SECTION 10: Create Sample Documents for Analysis
// ========================================================================
console.log("\n📄 Creating document analysis records...");

const documentsResponse = await Promise.all([
  client.models.Document.create({
    filename: "photosynthesis-notes.pdf",
    s3Key: "public/documents/photosynthesis-notes.pdf",
    status: "completed",
    extractedText: "Photosynthesis is the process by which plants...",
    pageCount: 5,
    fileSize: 524288,
    mimeType: "application/pdf",
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
  client.models.Document.create({
    filename: "japanese-grammar.pdf",
    s3Key: "public/documents/japanese-grammar.pdf",
    status: "uploaded",
    pageCount: 0,
    fileSize: 1048576,
    mimeType: "application/pdf",
    uploadedAt: new Date().toISOString(),
    owner: instructor1OwnerSub,
    readableGroups: ["section-jpn101-instructors", "section-jpn101-learners"],
    writableGroups: ["section-jpn101-instructors"],
  }).catch((err) => {
    console.error(
      "  ✗ Failed to create japanese-grammar.pdf:",
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
// SECTION 20: Guilds & Memberships
// ========================================================================
console.log("\n⚔️  Creating guilds...");

const guildsResponse = await Promise.all([
  client.models.Guild.create({
    name: "Dragon Scholars",
    cohortId,
    totalXP: 870,
    description: "Knowledge is our treasure hoard",
    // Embedded members (was GuildMembership)
    members: [
      { studentId: student1OwnerSub, role: "LEADER", joinedAt: daysAgo(10) },
      { studentId: "seed-student-3", role: "MEMBER", joinedAt: daysAgo(8) },
    ] as any,
    // Embedded posts (was GuildPost)
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
  }),
  client.models.Guild.create({
    name: "Phoenix Writers",
    cohortId,
    totalXP: 620,
    description: "From ashes we create masterpieces",
    members: [
      { studentId: "seed-student-4", role: "LEADER", joinedAt: daysAgo(10) },
    ] as any,
  }),
]);

const guilds = unwrap(guildsResponse, "Guild");
console.log(`✅ Created ${guilds.length} guilds with members and posts`);

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
// SECTION 23: Group Challenges (Campaign absorbed into GroupChallenge)
// ========================================================================
console.log("\n🎮 Creating group challenges...");

const deadline = new Date();
deadline.setDate(deadline.getDate() + 14);

const challengeResponse = await client.models.GroupChallenge.create({
  cohortId,
  title: "Week 3 Sprint: 1000 XP Together",
  targetXP: 1000,
  currentXP: 520,
  deadline: deadline.toISOString(),
  active: true,
  bonusMultiplier: 1.5,
  // Campaign narrative fields (absorbed from Campaign model)
  setting:
    "An ancient library where each unit is a floor to explore. Students are scholars seeking the Tome of Mastery.",
  stakes:
    "Complete all units before the semester ends to unlock the secret final chapter.",
  systemPromptSeed:
    'You are a wise librarian guiding students through the Knowledge Quest. Refer to units as "floors" and grades as "scrolls of proof".',
  // Embedded contributions (absorbed from GroupChallengeContribution)
  contributions: [
    {
      studentId: student1OwnerSub,
      xpContributed: 320,
      contributedAt: daysAgo(2),
    },
    {
      studentId: "seed-student-3",
      xpContributed: 200,
      contributedAt: daysAgo(1),
    },
  ] as any,
});

const challenge = challengeResponse.data!;
console.log("✅ Created group challenge with contributions");

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
  client.models.EasterEgg.create({
    trigger: "UI_INTERACTION",
    triggerValue: "click-logo-5-times",
    xpReward: 25,
    revealMessage:
      "🎉 You found the secret! Persistent clicking pays off. +25 XP",
    active: true,
  }),
  client.models.EasterEgg.create({
    trigger: "SUBMISSION_QUALITY",
    triggerValue: "perfect-score-3-in-row",
    xpReward: 50,
    badgeId: "EASTER_EGG_HUNTER",
    revealMessage: "🏆 Three perfect scores in a row! You're on fire! +50 XP",
    active: true,
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
- Active in Dragon Scholars guild
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

// Student2 joins Phoenix Writers guild — update Guild.members
const { data: guild2 } = await client.models.Guild.get({ id: guilds[1].id });
if (guild2) {
  await client.models.Guild.update({
    id: guilds[1].id,
    _version: guild2._version,
    members: [
      ...((guild2.members as any[]) || []),
      { studentId: student2OwnerSub, role: "MEMBER", joinedAt: daysAgo(6) },
    ] as any,
  });
}

console.log("✅ Created minimal student2 gamification data");

// ========================================================================
// SUMMARY
// ========================================================================
console.log("\n✨ Seed data generation complete!");
console.log("\n📊 Summary:");
console.log(`   • ${words.length} vocabulary words`);
console.log(`   • ${questions.length} practice questions`);
console.log(`   • ${units.length} curriculum units`);
console.log(`   • ${sections.length} class sections`);
console.log(`   • ${assignments.length} assignments`);
console.log(`   • ${grades.length} grade submissions`);
console.log(`   • ${files.length} file metadata records`);
console.log(`   • ${documents.length} document records`);
console.log(
  `   • ${documents.length > 0 ? "1" : "0"} parsed content record(s)`,
);
console.log("   • 1 user settings record");
console.log(`   • ${xpLogs.length + 1} XP logs (student1 + student2)`);
console.log("   • 2 student profiles (aggregated badges, streak, progress)");
console.log("   • 4 additional leaderboard profiles");
console.log(`   • ${guilds.length} guilds with embedded members & posts`);
console.log(`   • ${skills.length} skills with progress`);
console.log("   • 2 content locks");
console.log("   • 1 campaign + 1 group challenge");
console.log(`   • ${easterEggs.length} easter eggs`);
console.log(`   • ${practiceSessions.length} practice sessions`);
console.log("   • 1 instructor insight");
console.log("   • 1 homework room + 3 workbook comments");
console.log("   • 1 AI chat session + 2 feedback records");
console.log("   • 1 student memory + 1 unit memory");
console.log("\n🔐 Test Users Created:");
console.log("   Admin: admin@example.com");
console.log("   Instructors: instructor1@example.com, instructor2@example.com");
console.log("   Students: student1@example.com, student2@example.com");
console.log("\n🎯 Next Steps:");
console.log("   1. Run integration tests: npm run test:integration");
console.log("   2. Start development: npm run dev");
console.log("   3. Sign in with any test user to begin testing");
console.log("   4. student1 has rich data (badges, streaks, XP, guild leader)");
console.log("   5. student2 has minimal data (test empty/sparse UI states)\n");

// Sign out
console.log("\n🔓 Signing out...");
await signOut();
console.log("✅ Signed out");
