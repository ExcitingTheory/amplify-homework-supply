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

import { createAndSignUpUser, addToUserGroup, signInUser } from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { readFile } from 'node:fs/promises';
import type { Schema } from "../data/resource";

// Load amplify_outputs.json from the workspace
const url = new URL("../../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: 'utf8' }));
Amplify.configure(outputs);

// Extract Cognito configuration from outputs
const userPoolId = outputs.auth.user_pool_id;
const region = outputs.auth.aws_region;

// Initialize Cognito client for admin operations
// Uses default AWS credentials from your AWS profile
const cognitoClient = new CognitoIdentityProviderClient({ region });

// Get the password from environment variable
const password = process.env.TEST_USER_PASSWORD || 'TempPassword123!';

// Initialize the data client
const client = generateClient<Schema>();

console.log('🌱 Starting seed data generation...');
console.log(`Password: ${password ? 'SET' : 'NOT SET (using default)'}`);

if (!password) {
  throw new Error('Password not available');
}

const TEST_USERS: Record<string, { username: string; group: string }> = {
  admin: {
    username: 'admin@example.com',
    group: 'Admins',
  },
  instructor1: {
    username: 'instructor1@example.com',
    group: 'Instructors',
  },
  instructor2: {
    username: 'instructor2@example.com',
    group: 'Instructors',
  },
  student1: {
    username: 'student1@example.com',
    group: 'Learners',
  },
  student2: {
    username: 'student2@example.com',
    group: 'Learners',
  },
}

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
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      })
    );
    console.log(`  ✓ Email verified for ${username}`);
  } catch (error: any) {
    console.error(`  ⚠ Failed to verify email for ${username}:`, error.message);
    throw error;
  }
}

console.log('Starting user creation...');

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
    if (error.name === 'UsernameExistsException' || 
        error.name === 'UsernameExistsError' ||
        error.message?.includes('already exists') ||
        error.message?.includes('User already exists')) {
      console.log(`  ⚠ User ${userData.username} already exists`);
      
      // Ensure email is verified even for existing users
      await verifyUserEmail(userData.username);
      
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

console.log('✅ Test users created/verified successfully');

// Explicitly sign in as instructor1 for data creation
console.log('\n🔐 Signing in as instructor1 for data creation...');

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
  console.error('\n❌ Failed to sign in as instructor1:', error.message);
  console.error('\nPossible issues:');
  console.error('1. Email verification failed (check Cognito permissions)');
  console.error('2. Password does not match');
  console.error('3. User pool configuration issue');
  throw error;
}


// ========================================================================
// SECTION 2: Create Vocabulary Words
// ========================================================================

console.log('\n📚 Creating vocabulary words...');

const wordsResponse = await Promise.all([
  client.models.Word.create({
    phrase: 'こんにちは',
    pronunciation: 'konnichiwa',
    definition: 'Hello (daytime greeting)',
  }),
  client.models.Word.create({
    phrase: 'ありがとう',
    pronunciation: 'arigatou',
    definition: 'Thank you',
  }),
  client.models.Word.create({
    phrase: 'さようなら',
    pronunciation: 'sayounara',
    definition: 'Goodbye',
  }),
  client.models.Word.create({
    phrase: 'photosynthesis',
    pronunciation: 'foh-toh-SIN-thuh-sis',
    definition: 'The process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen',
  }),
  client.models.Word.create({
    phrase: 'chloroplast',
    pronunciation: 'KLOR-uh-plast',
    definition: 'Organelle in plant cells where photosynthesis occurs',
  }),
]);

const words = wordsResponse.map(r => r.data!);
console.log(words);
console.log(`✅ Created ${words.length} vocabulary words`);

// ========================================================================
// SECTION 3: Create Questions
// ========================================================================
console.log('\n❓ Creating practice questions...');

const questionsResponse = await Promise.all([
    client.models.Question.create({
      prompt: 'What is the Japanese word for "hello"?',
      answer: 'こんにちは (konnichiwa)',
      hint: 'Used during daytime',
      choices: JSON.stringify([
        { choice: 'こんにちは', correct: true },
        { choice: 'おはよう', correct: false },
        { choice: 'こんばんは', correct: false },
        { choice: 'さようなら', correct: false },
      ]),
      difficulty: 'beginner',
    }),
    client.models.Question.create({
      prompt: 'What is the main product of photosynthesis?',
      answer: 'Glucose (sugar) and oxygen',
      hint: 'Plants produce this sugar for energy',
      difficulty: 'intermediate',
    }),
    client.models.Question.create({
      prompt: 'In which organelle does photosynthesis occur?',
      answer: 'Chloroplast',
      hint: 'Contains chlorophyll',
      choices: JSON.stringify([
        { choice: 'Chloroplast', correct: true },
        { choice: 'Mitochondria', correct: false },
        { choice: 'Nucleus', correct: false },
        { choice: 'Ribosome', correct: false },
      ]),
      difficulty: 'intermediate',
    }),
]);

const questions = questionsResponse.map(r => r.data!);
console.log(questions);
console.log(`✅ Created ${questions.length} practice questions`);

// ========================================================================
// SECTION 4: Create Units with Lexical Editor Content
// ========================================================================
console.log('\n📖 Creating curriculum units...');

// Sample Lexical editor JSON structure
const japaneseUnitContent = {
    root: {
      children: [
        {
          type: 'heading',
          tag: 'h1',
          children: [{ type: 'text', text: 'Japanese Greetings - Unit 1' }],
        },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Learn basic Japanese greetings for daily conversation.' },
          ],
        },
        {
          type: 'quiz',
          id: 'quiz-1',
          question: 'What does こんにちは mean?',
          answer: 'Hello (daytime)',
          choices: ['Hello (daytime)', 'Good morning', 'Good evening', 'Goodbye'],
        },
      ],
    },
  };

const biologyUnitContent = {
    root: {
      children: [
        {
          type: 'heading',
          tag: 'h1',
          children: [{ type: 'text', text: 'Photosynthesis - Biology Unit' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Photosynthesis is the process by which plants convert light energy into chemical energy.'
            },
          ],
        },
        {
          type: 'answer',
          id: 'answer-1',
          prompt: 'Explain the equation for photosynthesis',
          expectedAnswer: '6CO2 + 6H2O + light energy → C6H12O6 + 6O2',
        },
      ],
    },
  };

const unitsResponse = await Promise.all([
    client.models.Unit.create({
      name: 'Japanese Greetings',
      description: 'Basic Japanese greetings and introductions for beginners',
      data: JSON.stringify(japaneseUnitContent), // Convert to string
      status: 'PUBLISHED',
    }),
    client.models.Unit.create({
      name: 'Photosynthesis',
      description: 'Understanding how plants convert light energy into chemical energy',
      data: JSON.stringify(biologyUnitContent), // Convert to string
      status: 'PUBLISHED',
    }),
    client.models.Unit.create({
      name: 'Advanced Japanese Verbs',
      description: 'DRAFT - Conjugation patterns for common Japanese verbs',
      data: null,
      status: 'DRAFT',
    }),
]);

const units = unitsResponse.map(r => r.data!);
console.log('\nCreated Units:');
console.log(JSON.stringify(unitsResponse, null, 2));
console.log(`✅ Created ${units.length} units`);

// ========================================================================
// SECTION 5: Create Join Tables (Unit-Word, Unit-Question)
// ========================================================================
console.log('\n🔗 Creating relationships...');

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
]);

console.log('✅ Created unit-word and unit-question relationships');

// ========================================================================
// SECTION 6: Create Sections (Classes) with Dynamic Groups
// ========================================================================
console.log('\n🏫 Creating class sections...');

const sectionsResponse = await Promise.all([
    client.models.Section.create({
      name: 'Japanese 101 - Period 1',
      description: 'Beginner Japanese for 9th grade',
      status: 'PUBLISHED',
      code: 'JPN101-P1',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    client.models.Section.create({
      name: 'Biology 101 - Period 3',
      description: 'Introduction to Biology',
      status: 'PUBLISHED',
      code: 'BIO101-P3',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
]);

const sections = sectionsResponse.map(r => r.data!);
console.log(`✅ Created ${sections.length} sections`);

// ========================================================================
// SECTION 7: Create Assignments
// ========================================================================
console.log('\n📋 Creating assignments...');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 7);

const assignmentsResponse = await Promise.all([
    // Japanese assignment for section 1
    client.models.Assignment.create({
      sectionID: sections[0].id,
      unitID: units[0].id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    client.models.Assignment.create({
      sectionID: sections[0].id,
      unitID: units[0].id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    // Biology assignment for section 2
    client.models.Assignment.create({
      sectionID: sections[1].id,
      unitID: units[1].id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
    client.models.Assignment.create({
      sectionID: sections[1].id,
      unitID: units[1].id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
  ]);

const assignments = assignmentsResponse.map(r => r.data!);
console.log(`✅ Created ${assignments.length} assignments`);

// ========================================================================
// SECTION 8: Create Grade Submissions
// ========================================================================
console.log('\n📊 Creating grade submissions...');

// Sample grade data structure (JSON object keyed by block IDs)
const sampleGradeData = {
    'quiz-1': {
      complete: true,
      accuracy: 100,
      userAnswer: 'Hello (daytime)',
      feedback: 'Excellent! Perfect answer.',
    },
  };

const gradesResponse = await Promise.all([
    // Student 1 - Japanese assignment (completed)
    client.models.Grade.create({
      unitID: units[0].id,
      sectionID: sections[0].id,
      percentComplete: 100,
      accuracy: 100,
      complete: true,
      data: sampleGradeData,
      owner: 'student1@example.com',
      instructorGroup: 'section-jpn101-instructors',
      instructor: 'instructor1@example.com',
    }),
    // Student 1 - Biology assignment (in progress)
    client.models.Grade.create({
      unitID: units[1].id,
      sectionID: sections[1].id,
      percentComplete: 50,
      accuracy: 75,
      complete: false,
      data: { 'answer-1': { complete: false, accuracy: 0 } },
      owner: 'student1@example.com',
      instructorGroup: 'section-bio101-instructors',
      instructor: 'instructor2@example.com',
    }),
    // Student 2 - Japanese assignment (not started)
    client.models.Grade.create({
      unitID: units[0].id,
      sectionID: sections[0].id,
      percentComplete: 0,
      accuracy: 0,
      complete: false,
      data: {},
      owner: 'student2@example.com',
      instructorGroup: 'section-jpn101-instructors',
      instructor: 'instructor1@example.com',
    }),
  ]);

const grades = gradesResponse.map(r => r.data!);
console.log(`✅ Created ${grades.length} grade submissions`);

// ========================================================================
// ========================================================================
// SECTION 9: Create Sample Files
// ========================================================================
console.log('\n📁 Creating file metadata records...');

const filesResponse = await Promise.all([
    client.models.File.create({
      name: 'sample-audio.mp3',
      description: 'Sample audio pronunciation',
      mimeType: 'audio/mpeg',
      level: 'PUBLIC',
      path: 'public/audio/sample-audio.mp3',
      size: 52480,
      duration: 3500, // 3.5 seconds
      owner: instructor1OwnerSub,
      identityId: instructor1IdentityId,
    }),
    client.models.File.create({
      name: 'chloroplast-diagram.jpg',
      description: 'Labeled diagram of chloroplast structure',
      mimeType: 'image/jpeg',
      level: 'PUBLIC',
      path: 'public/images/chloroplast-diagram.jpg',
      size: 245760,
      owner: instructor1OwnerSub,
      identityId: instructor1IdentityId,
    }),
    client.models.File.create({
      name: 'student-recording.mp3',
      description: 'Student pronunciation practice',
      mimeType: 'audio/mpeg',
      level: 'PROTECTED',
      path: 'protected/us-east-1:student1-identity-id/recordings/recording-1.mp3',
      size: 87040,
      duration: 5200,
      owner: instructor1OwnerSub,
      identityId: instructor1IdentityId,
    }),
  ]);

const files = filesResponse.map(r => r.data).filter(f => f !== null && f !== undefined);
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

  console.log('✅ Created unit-file relationships');
} else {
  console.log('⚠️ Skipping unit-file relationships (insufficient files created)');
}
// SECTION 10: Create Sample Documents for Analysis
// ========================================================================
console.log('\n📄 Creating document analysis records...');

const documentsResponse = await Promise.all([
    client.models.Document.create({
      filename: 'photosynthesis-notes.pdf',
      s3Key: 'public/documents/photosynthesis-notes.pdf',
      status: 'completed',
      extractedText: 'Photosynthesis is the process by which plants...',
      pageCount: 5,
      fileSize: 524288,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      owner: instructor1OwnerSub,
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }).catch(err => {
      console.error('  ✗ Failed to create photosynthesis-notes.pdf:', err.errors || err.message);
      return { data: null, errors: err.errors };
    }),
    client.models.Document.create({
      filename: 'japanese-grammar.pdf',
      s3Key: 'public/documents/japanese-grammar.pdf',
      status: 'uploaded',
      pageCount: 0,
      fileSize: 1048576,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      owner: instructor1OwnerSub,
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }).catch(err => {
      console.error('  ✗ Failed to create japanese-grammar.pdf:', err.errors || err.message);
      return { data: null, errors: err.errors };
    }),
  ]);

console.log('Document responses:', JSON.stringify(documentsResponse.map(r => ({
  hasData: !!r.data,
  hasErrors: !!r.errors,
  errors: r.errors
})), null, 2));

const documents = documentsResponse.map(r => r.data).filter(d => d !== null && d !== undefined);
console.log(`✅ Created ${documents.length} document records`);

// ========================================================================
// SECTION 11: Create Parsed Content from Document Analysis
// ========================================================================
console.log('\n🔍 Creating parsed content...');

// Only create parsed content if we have documents
if (documents.length > 0 && documents[0]) {
  const parsedContentResponse = await client.models.ParsedContent.create({
    documentID: documents[0].id,
    vocabularyJSON: [
        {
          word: 'photosynthesis',
          definition: 'Process of converting light to chemical energy',
          context: 'Plants use photosynthesis to make food',
          page: 1,
        },
        {
          word: 'chlorophyll',
          definition: 'Green pigment in plants',
          context: 'Chlorophyll captures light energy',
          page: 2,
        },
      ],
      summariesJSON: [
        {
          title: 'Introduction to Photosynthesis',
          content: 'Overview of the photosynthesis process',
          page_range: '1-2',
        },
      ],
      questionsJSON: [
        {
          question: 'What is photosynthesis?',
          expectedAnswer: 'The process by which plants convert light energy into chemical energy',
          hint: 'Think about how plants make food',
          type: 'short_answer',
        },
      ],
      responseId: 'chatcmpl-seed-12345',
      modelUsed: 'gpt-4',
      tokensUsed: 1250,
      processingTime: 4500,
  });

  const parsedContent = parsedContentResponse.data;
  console.log('✅ Created parsed content with vocabulary and questions');
} else {
  console.log('⚠️ Skipping parsed content creation (no documents created)');
}

// ========================================================================
// SECTION 12: Create Settings Records
// ========================================================================
console.log('\n⚙️  Creating user settings...');

await Promise.all([
    client.models.Settings.create({
      autoAnalyzeDocuments: true,
      documentAnalysisModel: 'gpt-4',
      editorTheme: 'light',
      editorFontSize: 14,
      defaultAIModel: 'gpt-4',
      assistantVoice: 'alloy',
      emailNotifications: true,
      language: 'en',
      timezone: 'America/New_York',
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

console.log('✅ Created user settings');

// ========================================================================
// SUMMARY
// ========================================================================
console.log('\n✨ Seed data generation complete!');
console.log('\n📊 Summary:');
console.log(`   • ${words.length} vocabulary words`);
console.log(`   • ${questions.length} practice questions`);
console.log(`   • ${units.length} curriculum units`);
console.log(`   • ${sections.length} class sections`);
console.log(`   • ${assignments.length} assignments`);
console.log(`   • ${grades.length} grade submissions`);
console.log(`   • ${files.length} file metadata records`);
console.log(`   • ${documents.length} document records`);
console.log(`   • ${documents.length > 0 ? '1' : '0'} parsed content record(s)`);
console.log('   • 1 user settings record');
console.log('\n🔐 Test Users Created:');
console.log('   Admin: admin@example.com');
console.log('   Instructors: instructor1@example.com, instructor2@example.com');
console.log('   Students: student1@example.com, student2@example.com');
console.log('\n🎯 Next Steps:');
console.log('   1. Run integration tests: npm run test:integration');
console.log('   2. Start development: npm run dev');
console.log('   3. Sign in with any test user to begin testing\n');

// Sign out
console.log('\n🔓 Signing out...');
await signOut();
console.log('✅ Signed out');
