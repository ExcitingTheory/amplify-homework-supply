/**
 * Mock server actions for Storybook
 *
 * Server actions (marked "use server") cannot be imported in Storybook's
 * client environment. These stubs return plausible mock data.
 */

// --- app/actions/section ---
export async function joinSection(code) {
  return { success: true, sectionId: 'mock-section-id' };
}

export async function createSection(data) {
  return { id: 'mock-section-id', ...data };
}

export async function joinPeerReview(sectionId) {
  return { success: true };
}

export async function listSectionStudents(code) {
  return {
    success: true,
    students: [
      { id: 'student-alice-sub', email: 'alice@example.com', name: 'Alice Johnson' },
      { id: 'student-bob-sub', email: 'bob@example.com', name: 'Bob Smith' },
      { id: 'student-carol-sub', email: 'carol@example.com', name: 'Carol Davis' },
      { id: 'student-dave-sub', email: 'dave@example.com', name: 'Dave Wilson' },
    ],
  };
}

// --- app/actions/gamification ---
export async function awardXP() { return { success: true }; }
export async function recordGradeCompletion() { return { success: true }; }
export async function updateLearningMemory() { return { success: true }; }
export async function advanceSkill() { return { success: true }; }
export async function generateSkillTreeFromUnit() { return { skills: [] }; }
export async function discoverEasterEgg() { return { success: true }; }
export async function generateCampaignNarrative() { return { narrative: '' }; }
export async function rebuildLeaderboard() { return; }

// --- app/actions/generate ---
export async function generateSpeech() { return { url: '' }; }
export async function generateImage() { return { url: '' }; }

// --- app/actions/grading ---
export async function gradeDefinition() { return { answer: false, reason: 'Mock', score: 0 }; }
export async function gradeShortAnswer() { return { answer: false, reason: 'Mock', score: 0 }; }
export async function gradeImage() { return { answer: false, reason: 'Mock', description: 'Mock image', score: 0 }; }
export async function transcribeAudio() { return { answer: false, reason: 'Mock', transcript: 'Mock transcript', score: 0 }; }
export async function verifySketchImage() { return { answer: false, reason: 'Mock', accuracy: 0 }; }

// --- app/actions/chat ---
export async function chatCompletion() { return { content: 'Mock response' }; }

// --- app/actions/feedback ---
export async function summarizeFeedback() { return { summary: '', insights: [] }; }

// --- app/actions/jobs ---
export async function listJobs() { return { jobs: [], nextToken: null }; }
export async function retryJob() { return { success: true }; }
export async function cancelJob() { return { success: true }; }

// --- app/actions/moderate ---
export async function moderateContent() { return { flagged: false, categories: {} }; }
export async function moderateImage() { return { flagged: false, categories: {} }; }

// --- app/actions/moderation-notify ---
export async function notifyModerationFlagged() { return { success: true }; }

// --- app/actions/drill ---
export async function generatePracticeDrill() { return { blocks: [] }; }

// --- app/actions/embeddings ---
export async function generateEmbedding() {
  return { embedding: new Array(512).fill(0), model: 'text-embedding-3-small', dimensions: 512, tokenCount: 10 };
}
export async function generateUnitEmbeddings() { return { success: true }; }
export async function generateFileEmbeddings() { return { success: true }; }
export async function analyzeDocument() { return { success: true, status: 'completed' }; }
export async function cancelDocumentAnalysis() { return { success: true }; }

// --- app/actions/storage ---
export async function getStudentSubmissionUrl() { return { url: 'https://example.com/mock-submission.pdf' }; }

// --- app/actions/peerReview ---
export async function handleAIMention() { return { success: true }; }
export async function generateReviewSummary() { return { summary: 'Mock review summary.' }; }
export async function createPeerReviewRoom() { return { id: 'mock-peer-review-room-id', success: true }; }
export async function randomAssignPeerReview() { return { success: true, assignedCount: 4 }; }
export async function awardTopReviewerXP() { return { success: true }; }
