import React from "react";
import {
  seedMockGrade,
  seedMockAssignments,
  seedMockAssistantChats,
  seedMockUnit,
} from "@storybook-mocks/aws-amplify-data";
import InstructorDashboard from "./InstructorDashboard";

const mockSections = [
  { id: "section-1", name: "Spanish 101 — Period 1", code: "SP101" },
  { id: "section-2", name: "Spanish 102 — Period 3", code: "SP102" },
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
  seedMockAssignments(mockAssignments);
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
    sections: mockSections,
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
    sections: [mockSections[0]],
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
