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
 * Usage:
 *   npx ampx sandbox --seed
 * 
 * Documentation:
 *   https://docs.amplify.aws/react/deploy-and-host/sandbox-environments/seed/
 */

import { readFile } from 'fs/promises';

import {
  addToUserGroup,
  createAndSignUpUser,
} from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import {
  TEST_USERS,
  SignInParams,
} from '../../test/integratiopn/shared.ts';

// this is used to get the amplify_outputs.json file as the file will not exist until sandbox is created
const url = new URL("../../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: "utf8" }));
Amplify.configure(outputs);
/**
 * Main seed function - executes in sandbox environment after backend deployment
 * 
 * @param client - Amplify Gen 2 data client with full schema access
 */
export async function seed(client: any): Promise<void> {
  console.log('🌱 Starting seed data generation...');

  for (const newUser of Object.values(TEST_USERS)) {
    // npx ampx sandbox secret set password
    const username: SignInParams['username'] = newUser.username;
    const password = process.env.TEST_USER_PASSWORD!;
    // Delete existing user if they exist (clean slate)
    const user = await createAndSignUpUser({
      username: username,
      password: password,
      signInAfterCreation: false,
      signInFlow: "Password",
      userAttributes: {
        locale: "en",
      },
    });

    await addToUserGroup(user, newUser?.group || '');


    console.log(`   Added to group: ${newUser?.group || ''}`);
  }
  console.log('✅ Test users created successfully');

  // ========================================================================
  // SECTION 2: Create Vocabulary Words
  // ========================================================================

  console.log('\n📚 Creating vocabulary words...');

  const words = await Promise.all([
    client.models.Word.create({
      phrase: 'こんにちは',
      pronunciation: 'konnichiwa',
      definition: 'Hello (daytime greeting)',
      owner: 'instructor1@example.com',
    }),
    client.models.Word.create({
      phrase: 'ありがとう',
      pronunciation: 'arigatou',
      definition: 'Thank you',
      owner: 'instructor1@example.com',
    }),
    client.models.Word.create({
      phrase: 'さようなら',
      pronunciation: 'sayounara',
      definition: 'Goodbye',
      owner: 'instructor1@example.com',
    }),
    client.models.Word.create({
      phrase: 'photosynthesis',
      pronunciation: 'foh-toh-SIN-thuh-sis',
      definition: 'The process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen',
      owner: 'instructor2@example.com',
    }),
    client.models.Word.create({
      phrase: 'chloroplast',
      pronunciation: 'KLOR-uh-plast',
      definition: 'Organelle in plant cells where photosynthesis occurs',
      owner: 'instructor2@example.com',
    }),
  ]);

  console.log(`✅ Created ${words.length} vocabulary words`);

  // ========================================================================
  // SECTION 3: Create Questions
  // ========================================================================
  console.log('\n❓ Creating practice questions...');

  const questions = await Promise.all([
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
      owner: 'instructor1@example.com',
    }),
    client.models.Question.create({
      prompt: 'What is the main product of photosynthesis?',
      answer: 'Glucose (sugar) and oxygen',
      hint: 'Plants produce this sugar for energy',
      difficulty: 'intermediate',
      owner: 'instructor2@example.com',
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
      owner: 'instructor2@example.com',
    }),
  ]);

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

  const units = await Promise.all([
    client.models.Unit.create({
      number: 1,
      name: 'Japanese Greetings',
      description: 'Basic Japanese greetings and introductions for beginners',
      data: japaneseUnitContent,
      status: 'PUBLISHED',
      timeLimitSeconds: 1800, // 30 minutes
      owner: 'instructor1@example.com',
      isDraft: false,
      publishedAt: new Date().toISOString(),
    }),
    client.models.Unit.create({
      number: 2,
      name: 'Photosynthesis',
      description: 'Understanding how plants convert light energy into chemical energy',
      data: biologyUnitContent,
      status: 'PUBLISHED',
      timeLimitSeconds: 2400, // 40 minutesAMPLIFY_SANDBOX_ID='toast' npm run test 2>&1 | tail -50AMPLIFY_SANDBOX_ID='toast' npm run test 2>&1 | tail -50
      owner: 'instructor2@example.com',
      isDraft: false,
      publishedAt: new Date().toISOString(),
    }),
    client.models.Unit.create({
      number: 3,
      name: 'Advanced Japanese Verbs',
      description: 'DRAFT - Conjugation patterns for common Japanese verbs',
      data: null,
      status: 'DRAFT',
      owner: 'instructor1@example.com',
      isDraft: true,
    }),
  ]);

  console.log(`✅ Created ${units.length} units`);

  // ========================================================================
  // SECTION 5: Create Join Tables (Unit-Word, Unit-Question)
  // ========================================================================
  console.log('\n🔗 Creating relationships...');

  // Associate Japanese words with Japanese unit
  await Promise.all([
    client.models.UnitWord.create({
      unitID: units[0].data.id,
      wordID: words[0].data.id,
      owner: 'instructor1@example.com',
    }),
    client.models.UnitWord.create({
      unitID: units[0].data.id,
      wordID: words[1].data.id,
      owner: 'instructor1@example.com',
    }),
    client.models.UnitWord.create({
      unitID: units[0].data.id,
      wordID: words[2].data.id,
      owner: 'instructor1@example.com',
    }),
  ]);

  // Associate biology words with biology unit
  await Promise.all([
    client.models.UnitWord.create({
      unitID: units[1].data.id,
      wordID: words[3].data.id,
      owner: 'instructor2@example.com',
    }),
    client.models.UnitWord.create({
      unitID: units[1].data.id,
      wordID: words[4].data.id,
      owner: 'instructor2@example.com',
    }),
  ]);

  // Associate questions with units
  await Promise.all([
    client.models.QuestionUnit.create({
      questionID: questions[0].data.id,
      unitID: units[0].data.id,
      owner: 'instructor1@example.com',
    }),
    client.models.QuestionUnit.create({
      questionID: questions[1].data.id,
      unitID: units[1].data.id,
      owner: 'instructor2@example.com',
    }),
    client.models.QuestionUnit.create({
      questionID: questions[2].data.id,
      unitID: units[1].data.id,
      owner: 'instructor2@example.com',
    }),
  ]);

  console.log('✅ Created unit-word and unit-question relationships');

  // ========================================================================
  // SECTION 6: Create Sections (Classes) with Dynamic Groups
  // ========================================================================
  console.log('\n🏫 Creating class sections...');

  const sections = await Promise.all([
    client.models.Section.create({
      name: 'Japanese 101 - Period 1',
      description: 'Beginner Japanese for 9th grade',
      status: 'PUBLISHED',
      code: 'JPN101-P1',
      owner: 'instructor1@example.com',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    client.models.Section.create({
      name: 'Biology 101 - Period 3',
      description: 'Introduction to Biology',
      status: 'PUBLISHED',
      code: 'BIO101-P3',
      owner: 'instructor2@example.com',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
  ]);

  console.log(`✅ Created ${sections.length} sections`);

  // ========================================================================
  // SECTION 7: Create Assignments
  // ========================================================================
  console.log('\n📋 Creating assignments...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);

  const assignments = await Promise.all([
    // Japanese assignment for section 1
    client.models.Assignment.create({
      sectionID: sections[0].data.id,
      unitID: units[0].data.id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      owner: 'instructor1@example.com',
      learner: 'student1@example.com',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    client.models.Assignment.create({
      sectionID: sections[0].data.id,
      unitID: units[0].data.id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      owner: 'instructor1@example.com',
      learner: 'student2@example.com',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
    // Biology assignment for section 2
    client.models.Assignment.create({
      sectionID: sections[1].data.id,
      unitID: units[1].data.id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      owner: 'instructor2@example.com',
      learner: 'student1@example.com',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
    client.models.Assignment.create({
      sectionID: sections[1].data.id,
      unitID: units[1].data.id,
      dueDate: tomorrow.toISOString(),
      status: 'PUBLISHED',
      owner: 'instructor2@example.com',
      learner: 'student3@example.com',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
  ]);

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

  const grades = await Promise.all([
    // Student 1 - Japanese assignment (completed)
    client.models.Grade.create({
      unitID: units[0].data.id,
      sectionID: sections[0].data.id,
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
      unitID: units[1].data.id,
      sectionID: sections[1].data.id,
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
      unitID: units[0].data.id,
      sectionID: sections[0].data.id,
      percentComplete: 0,
      accuracy: 0,
      complete: false,
      data: {},
      owner: 'student2@example.com',
      instructorGroup: 'section-jpn101-instructors',
      instructor: 'instructor1@example.com',
    }),
  ]);

  console.log(`✅ Created ${grades.length} grade submissions`);

  // ========================================================================
  // SECTION 9: Create Sample Files
  // ========================================================================
  console.log('\n📁 Creating file metadata records...');

  const files = await Promise.all([
    client.models.File.create({
      name: 'sample-audio.mp3',
      description: 'Sample audio pronunciation',
      mimeType: 'audio/mpeg',
      level: 'PUBLIC',
      path: 'public/audio/sample-audio.mp3',
      size: 52480,
      duration: 3500, // 3.5 seconds
      owner: 'instructor1@example.com',
      identityId: 'us-east-1:instructor1-identity-id',
    }),
    client.models.File.create({
      name: 'chloroplast-diagram.jpg',
      description: 'Labeled diagram of chloroplast structure',
      mimeType: 'image/jpeg',
      level: 'PUBLIC',
      path: 'public/images/chloroplast-diagram.jpg',
      size: 245760,
      owner: 'instructor2@example.com',
      identityId: 'us-east-1:instructor2-identity-id',
    }),
    client.models.File.create({
      name: 'student-recording.mp3',
      description: 'Student pronunciation practice',
      mimeType: 'audio/mpeg',
      level: 'PROTECTED',
      path: 'protected/us-east-1:student1-identity-id/recordings/recording-1.mp3',
      size: 87040,
      duration: 5200,
      owner: 'student1@example.com',
      identityId: 'us-east-1:student1-identity-id',
    }),
  ]);

  console.log(`✅ Created ${files.length} file metadata records`);

  // Associate files with units
  await Promise.all([
    client.models.UnitFile.create({
      unitID: units[0].data.id,
      fileID: files[0].data.id,
      owner: 'instructor1@example.com',
    }),
    client.models.UnitFile.create({
      unitID: units[1].data.id,
      fileID: files[1].data.id,
      owner: 'instructor2@example.com',
    }),
  ]);

  console.log('✅ Created unit-file relationships');

  // ========================================================================
  // SECTION 10: Create Sample Documents for Analysis
  // ========================================================================
  console.log('\n📄 Creating document analysis records...');

  const documents = await Promise.all([
    client.models.Document.create({
      filename: 'photosynthesis-notes.pdf',
      s3Key: 'public/documents/photosynthesis-notes.pdf',
      status: 'completed',
      extractedText: 'Photosynthesis is the process by which plants...',
      pageCount: 5,
      fileSize: 524288,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      owner: 'instructor2@example.com',
      readableGroups: ['section-bio101-instructors', 'section-bio101-learners'],
      writableGroups: ['section-bio101-instructors'],
    }),
    client.models.Document.create({
      filename: 'japanese-grammar.pdf',
      s3Key: 'public/documents/japanese-grammar.pdf',
      status: 'uploaded',
      pageCount: 0,
      fileSize: 1048576,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      owner: 'instructor1@example.com',
      readableGroups: ['section-jpn101-instructors', 'section-jpn101-learners'],
      writableGroups: ['section-jpn101-instructors'],
    }),
  ]);

  console.log(`✅ Created ${documents.length} document records`);

  // ========================================================================
  // SECTION 11: Create Parsed Content from Document Analysis
  // ========================================================================
  console.log('\n🔍 Creating parsed content...');

  const parsedContent = await client.models.ParsedContent.create({
    documentID: documents[0].data.id,
    vocabularyJSON: JSON.stringify([
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
    ]),
    summariesJSON: JSON.stringify([
      {
        title: 'Introduction to Photosynthesis',
        content: 'Overview of the photosynthesis process',
        page_range: '1-2',
      },
    ]),
    questionsJSON: JSON.stringify([
      {
        question: 'What is photosynthesis?',
        expectedAnswer: 'The process by which plants convert light energy into chemical energy',
        hint: 'Think about how plants make food',
        type: 'short_answer',
      },
    ]),
    responseId: 'chatcmpl-seed-12345',
    modelUsed: 'gpt-4',
    tokensUsed: 1250,
    processingTime: 4500,
    owner: 'instructor2@example.com',
  });

  console.log('✅ Created parsed content with vocabulary and questions');

  // ========================================================================
  // SECTION 12: Create Settings Records
  // ========================================================================
  console.log('\n⚙️  Creating user settings...');

  await Promise.all([
    client.models.Settings.create({
      owner: 'instructor1@example.com',
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
    client.models.Settings.create({
      owner: 'student1@example.com',
      autoAnalyzeDocuments: false,
      editorTheme: 'dark',
      editorFontSize: 16,
      defaultAIModel: 'gpt-3.5-turbo',
      assistantVoice: 'nova',
      emailNotifications: false,
      language: 'en',
      timezone: 'America/Los_Angeles',
    }),
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
  console.log('   • 1 parsed content record');
  console.log('   • 2 user settings records');
  console.log('\n🔐 Test Users Created:');
  console.log('   Admin: admin@example.com ');
  console.log('   Instructors: instructor1@example.com, instructor2@example.com ');
  console.log('   Students: student1-3@example.com ');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Run integration tests: npm test');
  console.log('   2. Start development: npm run dev');
  console.log('   3. Sign in with any test user to begin testing\n');
}
