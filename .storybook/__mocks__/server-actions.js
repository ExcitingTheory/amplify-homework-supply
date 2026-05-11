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
