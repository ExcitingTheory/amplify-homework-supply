import React from "react";
import {
  seedMockGrade,
  seedMockAssignments,
} from "@storybook-mocks/aws-amplify-data";
import InstructorDashboard from "./InstructorDashboard";

const mockSections = [
  { id: "section-1", name: "Spanish 101 — Period 1" },
  { id: "section-2", name: "Spanish 102 — Period 3" },
  { id: "section-3", name: "French 201 — Period 5" },
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

function buildMockGrades() {
  const grades = [];
  let id = 1;

  // Section 1 students (alice–eve)
  for (const student of studentNames.slice(0, 5)) {
    for (const assign of mockAssignments.filter(
      (a) => a.sectionID === "section-1",
    )) {
      grades.push({
        id: `grade-${id++}`,
        owner: student,
        assignmentID: assign.id,
        unitID: assign.unitID,
        accuracy: Math.round(60 + Math.random() * 40),
        complete: true,
      });
    }
  }

  // Section 2 students (frank–ivan) — some missing submissions
  for (const student of studentNames.slice(5, 9)) {
    for (const assign of mockAssignments.filter(
      (a) => a.sectionID === "section-2",
    )) {
      if (Math.random() > 0.2) {
        grades.push({
          id: `grade-${id++}`,
          owner: student,
          assignmentID: assign.id,
          unitID: assign.unitID,
          accuracy: Math.round(50 + Math.random() * 50),
          complete: true,
        });
      }
    }
  }

  // Section 3 students (judy–maria) — high performers
  for (const student of studentNames.slice(9)) {
    for (const assign of mockAssignments.filter(
      (a) => a.sectionID === "section-3",
    )) {
      grades.push({
        id: `grade-${id++}`,
        owner: student,
        assignmentID: assign.id,
        unitID: assign.unitID,
        accuracy: Math.round(80 + Math.random() * 20),
        complete: true,
      });
    }
  }

  return grades;
}

// Use a fixed seed so stories are deterministic
const mockGrades = buildMockGrades();

function seedData() {
  seedMockAssignments(mockAssignments);
  mockGrades.forEach((g) => seedMockGrade(g));
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
