/**
 * Mock server actions for Storybook
 *
 * Server actions (marked "use server") cannot be imported in Storybook's
 * client environment. These stubs return plausible mock data.
 */

// --- app/actions/section ---
export async function joinSection(code) {
  return { success: true, sectionId: "mock-section-id" };
}

export async function createSection(data) {
  return { id: "mock-section-id", ...data };
}

export async function copyGamificationSettings(
  sourceSectionId,
  targetSectionId,
) {
  return { success: true };
}

export async function joinPeerReview(sectionId) {
  return { success: true };
}

export async function listSectionStudents(code) {
  return {
    success: true,
    students: [
      {
        id: "student-alice-sub",
        email: "alice@example.com",
        name: "Alice Johnson",
      },
      { id: "student-bob-sub", email: "bob@example.com", name: "Bob Smith" },
      {
        id: "student-carol-sub",
        email: "carol@example.com",
        name: "Carol Davis",
      },
      {
        id: "student-dave-sub",
        email: "dave@example.com",
        name: "Dave Wilson",
      },
    ],
  };
}

// --- app/actions/collaborator ---
export async function grantCollaboratorAccess() {
  return { success: true };
}
export async function revokeCollaboratorAccess() {
  return { success: true };
}
export async function listUnitCollaborators() {
  return { collaborators: [] };
}
export async function searchInstructors() {
  return { instructors: [] };
}

// --- app/actions/gamification ---
export async function awardXP() {
  return { success: true };
}
export async function recordGradeCompletion() {
  return { success: true };
}
export async function updateLearningMemory() {
  return { success: true };
}
export async function advanceSkill() {
  return { success: true };
}
export async function generateSkillTreeFromUnit() {
  return { skills: [] };
}
export async function discoverEasterEgg() {
  return { success: true };
}
export async function generateCampaignNarrative() {
  return { narrative: "" };
}
export async function rebuildLeaderboard() {
  return;
}

// --- app/actions/generate ---
export async function generateSpeech() {
  return { url: "" };
}
export async function generateImage() {
  return { url: "" };
}

// --- app/actions/grading ---
export async function gradeDefinition() {
  return { answer: false, reason: "Mock", score: 0 };
}
export async function gradeShortAnswer() {
  return { answer: false, reason: "Mock", score: 0 };
}
export async function gradeImage() {
  return { answer: false, reason: "Mock", description: "Mock image", score: 0 };
}
export async function transcribeAudio() {
  return {
    answer: false,
    reason: "Mock",
    transcript: "Mock transcript",
    score: 0,
  };
}
export async function verifySketchImage() {
  return { answer: false, reason: "Mock", accuracy: 0 };
}

// --- app/actions/chat ---
export async function chatCompletion() {
  return { content: "Mock response" };
}

// --- app/actions/feedback ---
export async function summarizeFeedback() {
  return { summary: "", insights: [] };
}

// --- app/actions/jobs ---
export async function listJobs(filter) {
  const jobs = [
    {
      id: "job-1",
      type: "document_analysis",
      status: "completed",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      startedAt: new Date(Date.now() - 3500000).toISOString(),
      completedAt: new Date(Date.now() - 3400000).toISOString(),
      resourceName: "Chapter1.pdf",
    },
    {
      id: "job-2",
      type: "media_transcode",
      status: "processing",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      startedAt: new Date(Date.now() - 1700000).toISOString(),
      completedAt: null,
      resourceName: "lecture.mp4",
    },
    {
      id: "job-3",
      type: "agent_job",
      status: "failed",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      startedAt: new Date(Date.now() - 7100000).toISOString(),
      completedAt: new Date(Date.now() - 7000000).toISOString(),
      error: { message: "Timeout after 300s" },
      resourceName: "Generate quiz",
    },
    {
      id: "job-4",
      type: "document_analysis",
      status: "queued",
      createdAt: new Date(Date.now() - 600000).toISOString(),
      startedAt: null,
      completedAt: null,
      resourceName: "Notes.pdf",
    },
  ];
  if (filter?.type) return jobs.filter((j) => j.type === filter.type);
  if (filter?.status) return jobs.filter((j) => j.status === filter.status);
  return jobs;
}
export async function retryJob() {
  return { success: true };
}
export async function cancelJob() {
  return { success: true };
}

// --- app/actions/moderate ---
export async function moderateContent() {
  return { flagged: false, categories: {} };
}
export async function moderateImage() {
  return { flagged: false, categories: {} };
}

// --- app/actions/moderation-notify ---
export async function notifyModerationFlagged() {
  return { success: true };
}

// --- app/actions/drill ---
export async function generatePracticeDrill() {
  return {
    blocks: [
      {
        type: "quiz",
        instruction: "What is the powerhouse of the cell?",
        sourceItemId: "drill-question-1",
        sourceType: "question",
        choices: [
          { choice: "Mitochondria", correct: true },
          { choice: "Nucleus", correct: false },
          { choice: "Ribosome", correct: false },
        ],
      },
      {
        type: "answer",
        instruction: "Define photosynthesis in your own words.",
        sourceItemId: "drill-word-1",
        sourceType: "vocabulary",
        expectedAnswer:
          "The process by which plants convert light energy into chemical energy.",
      },
    ],
  };
}

// --- app/actions/embeddings ---
export async function generateEmbedding() {
  return {
    embedding: new Array(384).fill(0),
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
    tokenCount: 10,
  };
}
export async function generateUnitEmbeddings() {
  return { success: true };
}
export async function generateFileEmbeddings() {
  return { success: true };
}
export async function analyzeDocument() {
  return { success: true, status: "completed" };
}
export async function cancelDocumentAnalysis() {
  return { success: true };
}

// --- app/actions/storage ---
export async function getStudentSubmissionUrl() {
  return { url: "https://example.com/mock-submission.pdf" };
}

// --- app/actions/forkUnit ---
export async function forkUnit(unitId, username, identityId) {
  return { success: true, id: "mock-forked-unit-id" };
}

// --- app/actions/collaborator ---
export async function listSharedWithMe() {
  return { units: [] };
}
export async function listCommunityUnits() {
  return { units: [] };
}

// --- app/actions/peerReview ---
export async function handleAIMention() {
  return { success: true };
}
export async function generateReviewSummary() {
  return { summary: "Mock review summary." };
}
export async function createPeerReviewRoom() {
  return { id: "mock-peer-review-room-id", success: true };
}
export async function randomAssignPeerReview() {
  return { success: true, assignedCount: 4 };
}
export async function awardTopReviewerXP() {
  return { success: true };
}
