import React from "react";
import { expect, within } from "storybook/test";
import {
  seedMockGrade,
  seedMockAssignments,
  seedMockAssistantChats,
  seedMockUnit,
  clearMockData,
} from "@storybook-mocks/aws-amplify-data";
import InstructorDashboard from "./InstructorDashboard";

const mockSections = [
  {
    id: "section-1",
    name: "Spanish 101 — Period 1",
    code: "SP101",
    description:
      "Beginning conversational Spanish — vocabulary and grammar basics.",
    classSchedule: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "09:50" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "09:50" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "09:50" },
    ],
    // unit-1 is curved — exercises the "Grades (raw)" + "Grades (curved)" bars.
    curveSettings: [{ unitID: "unit-1", method: "scale-to-top" }],
  },
  {
    id: "section-2",
    name: "Spanish 102 — Period 3",
    code: "SP102",
    description: "Intermediate Spanish — continuing from Spanish 101.",
    classSchedule: [
      { dayOfWeek: 2, startTime: "11:15", endTime: "12:05" },
      { dayOfWeek: 4, startTime: "11:15", endTime: "12:05" },
    ],
  },
  { id: "section-3", name: "French 201 — Period 5", code: "FR201" },
];

const studentNames = [
  "alice",
  "bob",
  "carol",
  "dave",
  "eve",
  "frank",
  "grace",
  "heidi",
  "ivan",
  "judy",
  "karl",
  "liam",
  "maria",
];

const unitIDs = ["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"];

const mockUnits = [
  { id: "unit-1", name: "Greetings & Introductions" },
  { id: "unit-2", name: "Numbers & Time" },
  { id: "unit-3", name: "Food & Dining" },
  { id: "unit-4", name: "Travel Vocabulary" },
  { id: "unit-5", name: "Family & Relationships" },
];

const mockAssignments = [
  {
    id: "assign-1",
    sectionID: "section-1",
    unitID: "unit-1",
    dueDate: "2026-04-15",
  },
  {
    id: "assign-2",
    sectionID: "section-1",
    unitID: "unit-2",
    dueDate: "2026-04-22",
  },
  {
    id: "assign-3",
    sectionID: "section-1",
    unitID: "unit-3",
    dueDate: "2026-04-29",
  },
  {
    id: "assign-4",
    sectionID: "section-2",
    unitID: "unit-1",
    dueDate: "2026-04-15",
  },
  {
    id: "assign-5",
    sectionID: "section-2",
    unitID: "unit-2",
    dueDate: "2026-04-22",
  },
  {
    id: "assign-6",
    sectionID: "section-3",
    unitID: "unit-4",
    dueDate: "2026-05-01",
  },
  {
    id: "assign-7",
    sectionID: "section-3",
    unitID: "unit-5",
    dueDate: "2026-05-08",
  },
];

function buildMockGrades() {
  const grades = [];
  let id = 1;
  const now = Date.now();

  // Section 1 students (alice–eve)
  for (const student of studentNames.slice(0, 5)) {
    for (const unitID of unitIDs.slice(0, 3)) {
      grades.push({
        id: `grade-${id++}`,
        owner: student,
        sectionID: "section-1",
        unitID,
        accuracy: Math.round(60 + Math.random() * 40),
        complete: true,
        engagedTimeMs: Math.round((2 + Math.random() * 10) * 60000),
        _lastChangedAt: now - Math.round(Math.random() * 7 * 86400000),
      });
    }
  }

  // Section 2 students (frank–ivan) — some lower performers
  for (const student of studentNames.slice(5, 9)) {
    for (const unitID of unitIDs.slice(0, 2)) {
      if (Math.random() > 0.2) {
        grades.push({
          id: `grade-${id++}`,
          owner: student,
          sectionID: "section-2",
          unitID,
          accuracy: Math.round(50 + Math.random() * 50),
          complete: true,
          engagedTimeMs: Math.round((2 + Math.random() * 10) * 60000),
          _lastChangedAt: now - Math.round(Math.random() * 14 * 86400000),
        });
      }
    }
  }

  // Section 3 students (judy–maria) — high performers
  for (const student of studentNames.slice(9)) {
    for (const unitID of unitIDs.slice(3)) {
      grades.push({
        id: `grade-${id++}`,
        owner: student,
        sectionID: "section-3",
        unitID,
        accuracy: Math.round(80 + Math.random() * 20),
        complete: true,
        engagedTimeMs: Math.round((2 + Math.random() * 10) * 60000),
        _lastChangedAt: now - Math.round(Math.random() * 3 * 86400000),
      });
    }
  }

  // Add a flagged grade for moderation
  grades.push({
    id: `grade-${id++}`,
    owner: "dave",
    sectionID: "section-1",
    unitID: "unit-2",
    accuracy: 45,
    complete: true,
    _lastChangedAt: now - 3600000,
    moderation: {
      status: "flagged",
      flags: JSON.stringify({ hate: true }),
      checkedAt: new Date().toISOString(),
    },
  });

  return grades;
}

const mockGrades = buildMockGrades();

// InstructorDashboard reads Assignment.gradeSummary / Section.studentProgress
// directly (no client-side fallback to scanning raw Grade rows), so the mock
// Assignment/Section records need those Lambda-maintained rollup fields
// computed from the same seeded grades, or the story renders all zeros.
function computeMockRollups(grades) {
  const gradeSummaryByKey = {};
  const studentProgressBySection = {};
  const activityFeedBySection = {};

  grades.forEach((g) => {
    if (!g.complete || g.accuracy == null) return;

    const key = `${g.sectionID}|${g.unitID}`;
    if (!gradeSummaryByKey[key]) gradeSummaryByKey[key] = {};
    const existing = gradeSummaryByKey[key][g.owner];
    const best = existing ? Math.max(existing.best, g.accuracy) : g.accuracy;
    gradeSummaryByKey[key][g.owner] = {
      best,
      // No section in these stories configures gradeAggregationMethod, so
      // `effective` mirrors the Lambda's default (MAX) behavior.
      effective: best,
      attempts: (existing?.attempts || 0) + 1,
      firstCompletedAt:
        existing?.firstCompletedAt ||
        new Date(g._lastChangedAt || Date.now()).toISOString(),
      totalEngagedTimeMs:
        (existing?.totalEngagedTimeMs || 0) + (g.engagedTimeMs || 0),
    };

    if (!studentProgressBySection[g.sectionID]) {
      studentProgressBySection[g.sectionID] = {};
    }
    const sectionProgress = studentProgressBySection[g.sectionID];
    if (!sectionProgress[g.owner]) {
      sectionProgress[g.owner] = { perUnitBest: {} };
    }
    const existingUnitBest = sectionProgress[g.owner].perUnitBest[g.unitID];
    if (existingUnitBest === undefined || g.accuracy > existingUnitBest) {
      sectionProgress[g.owner].perUnitBest[g.unitID] = g.accuracy;
    }

    if (!activityFeedBySection[g.sectionID]) {
      activityFeedBySection[g.sectionID] = {
        activityByDay: {},
        recentActivity: [],
      };
    }
    const feed = activityFeedBySection[g.sectionID];
    const timestamp = new Date(g._lastChangedAt || Date.now()).toISOString();
    const dateKey = timestamp.slice(0, 10);
    feed.activityByDay[dateKey] = (feed.activityByDay[dateKey] || 0) + 1;
    feed.recentActivity.push({
      owner: g.owner,
      unitID: g.unitID,
      accuracy: g.accuracy,
      timestamp,
    });
  });

  Object.values(studentProgressBySection).forEach((students) => {
    Object.values(students).forEach((data) => {
      const bests = Object.values(data.perUnitBest);
      data.averageGrade = bests.reduce((sum, v) => sum + v, 0) / bests.length;
      data.unitsCompleted = bests.length;
      data.lastActive = new Date().toISOString();
    });
  });

  Object.values(activityFeedBySection).forEach((feed) => {
    feed.recentActivity = feed.recentActivity
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-10);
  });

  return {
    gradeSummaryByKey,
    studentProgressBySection,
    activityFeedBySection,
  };
}

const { gradeSummaryByKey, studentProgressBySection, activityFeedBySection } =
  computeMockRollups(mockGrades);

const mockAssignmentsWithRollups = mockAssignments.map((assignment) => {
  const perStudentBest =
    gradeSummaryByKey[`${assignment.sectionID}|${assignment.unitID}`] || {};
  const bests = Object.values(perStudentBest).map((s) => s.effective ?? s.best);
  return {
    ...assignment,
    gradeSummary: JSON.stringify({ perStudentBest }),
    classStats:
      bests.length > 0
        ? JSON.stringify({
            avg: bests.reduce((sum, v) => sum + v, 0) / bests.length,
            min: Math.min(...bests),
            max: Math.max(...bests),
            count: bests.length,
          })
        : null,
  };
});

const mockSectionsWithRollups = mockSections.map((section) => ({
  ...section,
  studentProgress: JSON.stringify(studentProgressBySection[section.id] || {}),
  activityFeed: JSON.stringify(
    activityFeedBySection[section.id] || {
      activityByDay: {},
      recentActivity: [],
    },
  ),
}));

const mockFlaggedChats = [
  {
    id: "chat-flagged-1",
    owner: "eve",
    sectionID: "section-1",
    unitID: "unit-1",
    moderationFlag: true,
    type: "chat",
    messages: JSON.stringify([]),
  },
];

function seedData() {
  mockUnits.forEach((u) => seedMockUnit(u));
  seedMockAssignments(mockAssignmentsWithRollups);
  mockGrades.forEach((g) => seedMockGrade(g));
  seedMockAssistantChats(mockFlaggedChats);
}

export default {
  title: "📊 Instructor Tools/Dashboard",
  component: InstructorDashboard,
  parameters: {
    layout: "fullscreen",
  },
};

export const WithSections = {
  args: {
    sections: mockSectionsWithRollups,
  },
  decorators: [
    (Story) => {
      seedData();
      return <Story />;
    },
  ],
};

export const SingleSection = {
  args: {
    sections: [mockSectionsWithRollups[0]],
  },
  decorators: [
    (Story) => {
      seedData();
      return <Story />;
    },
  ],
};

export const NoSections = {
  args: {
    sections: [],
  },
};

// Sections with assignments but no submissions yet — exercises the per-section
// "no student data available yet" empty state (validation matrix coverage).
export const NoGradeData = {
  args: {
    sections: mockSections,
  },
  decorators: [
    (Story) => {
      clearMockData();
      mockUnits.forEach((u) => seedMockUnit(u));
      seedMockAssignments(mockAssignments);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptyStates = await canvas.findAllByText(/no student data/i);
    expect(emptyStates.length).toBeGreaterThan(0);
  },
};

export const Loading = {
  args: {
    sections: mockSections,
  },
};

// ── Mobile Viewport Variants ──────────────────────────────────────────
export const MobileViewport = {
  args: {
    sections: mockSections,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => {
      seedData();
      return (
        <div style={{ width: "100%", maxWidth: "375px", margin: "0 auto" }}>
          <Story />
        </div>
      );
    },
  ],
};

export const TabletViewport = {
  args: {
    sections: mockSections,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "tablet" },
  },
  decorators: [
    (Story) => {
      seedData();
      return (
        <div style={{ width: "100%", maxWidth: "768px", margin: "0 auto" }}>
          <Story />
        </div>
      );
    },
  ],
};

export const DesktopViewport = {
  args: {
    sections: mockSections,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
  decorators: [
    (Story) => {
      seedData();
      return (
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <Story />
        </div>
      );
    },
  ],
};

export const MultiSectionMobile = {
  args: {
    sections: mockSections,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => {
      seedData();
      return (
        <div style={{ width: "100%", maxWidth: "375px", margin: "0 auto" }}>
          <Story />
        </div>
      );
    },
  ],
};

export const SingleSectionMobile = {
  args: {
    sections: [mockSections[0]],
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => {
      seedData();
      return (
        <div style={{ width: "100%", maxWidth: "375px", margin: "0 auto" }}>
          <Story />
        </div>
      );
    },
  ],
};

// Deterministic flagged content — exercises the global "Needs attention"
// panel's moderation callout plus the per-section flagged-content alert.
export const FlaggedContent = {
  args: {
    sections: [mockSections[0]],
  },
  decorators: [
    (Story) => {
      clearMockData();
      mockUnits.forEach((u) => seedMockUnit(u));
      seedMockAssignments(
        mockAssignments.filter((a) => a.sectionID === "section-1"),
      );
      seedMockGrade({
        id: "grade-flagged-1",
        owner: "dave",
        sectionID: "section-1",
        unitID: "unit-1",
        accuracy: 45,
        complete: true,
        moderation: {
          status: "flagged",
          flags: JSON.stringify({ hate: true }),
          checkedAt: new Date().toISOString(),
        },
      });
      seedMockAssistantChats([
        {
          id: "chat-flagged-1",
          owner: "eve",
          sectionID: "section-1",
          unitID: "unit-1",
          moderationFlag: true,
          type: "chat",
          messages: JSON.stringify([]),
        },
      ]);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Needs attention/i);
    const flaggedItems = await canvas.findAllByText(/flagged item/i);
    expect(flaggedItems.length).toBeGreaterThan(0);
    await canvas.findByText(/Content flagged for review/i);
  },
};

// Deterministic low performers — exercises the global "Needs attention"
// at-risk rollup and the per-section "Review all" action.
export const AtRiskStudents = {
  args: {
    sections: [mockSections[0]],
  },
  decorators: [
    (Story) => {
      clearMockData();
      mockUnits.forEach((u) => seedMockUnit(u));
      seedMockAssignments(
        mockAssignments.filter((a) => a.sectionID === "section-1"),
      );
      ["alice", "bob"].forEach((student, i) => {
        seedMockGrade({
          id: `grade-at-risk-${i}`,
          owner: student,
          sectionID: "section-1",
          unitID: "unit-1",
          accuracy: 40,
          complete: true,
        });
      });
      seedMockGrade({
        id: "grade-ok-1",
        owner: "carol",
        sectionID: "section-1",
        unitID: "unit-1",
        accuracy: 90,
        complete: true,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Needs attention/i);
    await canvas.findByText(/student(s)? at risk/i);
    const reviewButtons = await canvas.findAllByRole("link", {
      name: /Review all/i,
    });
    expect(reviewButtons.length).toBeGreaterThan(0);
  },
};
