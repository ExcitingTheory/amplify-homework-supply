/**
 * OpenCollaborationRooms Storybook Stories
 *
 * @module OpenCollaborationRooms.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OpenCollaborationRooms } from "./OpenCollaborationRooms";
import type { OpenRoom } from "./OpenCollaborationRooms";
import { expect, within } from "storybook/test";

// ============================================================================
// Mock data
// ============================================================================

const mockSectionStudents = {
  "student-alice": { preferredName: "Alice Chen", name: "Alice Chen" },
  "student-bob": { preferredName: "Bob Kim", name: "Bob Kim" },
  "student-carol": { preferredName: "Carol Tanaka", name: "Carol Tanaka" },
  "student-dave": { preferredName: "Dave Müller", name: "Dave Müller" },
  "instructor-smith": { preferredName: "Prof. Smith", name: "Prof. Smith" },
};

const mockUnits = {
  "unit-jp-1": { name: "Unit 1 — Greetings" },
  "unit-jp-2": { name: "Unit 2 — Numbers" },
  "unit-jp-3": { name: "Unit 3 — Colors" },
};

const mockGrades = [
  { id: "grade-alice-1", owner: "student-alice", unitID: "unit-jp-1" },
  { id: "grade-bob-1", owner: "student-bob", unitID: "unit-jp-1" },
  { id: "grade-carol-1", owner: "student-carol", unitID: "unit-jp-2" },
  { id: "grade-dave-1", owner: "student-dave", unitID: "unit-jp-2" },
];

const peerReviewRooms: OpenRoom[] = [
  {
    id: "room-alice-1",
    gradeId: "grade-alice-1",
    ownerId: "student-alice", // owner = grade owner → peer review
    code: "ABC123",
    status: "OPEN",
    invitedUserIds: ["student-bob"],
    createdAt: new Date("2026-05-10T10:00:00Z").toISOString(),
  },
  {
    id: "room-carol-1",
    gradeId: "grade-carol-1",
    ownerId: "student-carol",
    code: "XYZ789",
    status: "IN_REVIEW",
    invitedUserIds: ["student-dave"],
    createdAt: new Date("2026-05-10T11:00:00Z").toISOString(),
  },
];

const tutoringRooms: OpenRoom[] = [
  {
    id: "room-tutor-1",
    gradeId: "grade-bob-1",
    ownerId: "instructor-smith", // owner ≠ grade owner → tutoring
    code: "TUTR01",
    status: "OPEN",
    invitedUserIds: ["student-bob"],
    createdAt: new Date("2026-05-10T09:00:00Z").toISOString(),
  },
];

const allRooms = [...peerReviewRooms, ...tutoringRooms];

const noop = async () => {};

// ============================================================================
// Stories
// ============================================================================

const meta: Meta<typeof OpenCollaborationRooms> = {
  title: "🤝 Peer Review/Open Collaboration Rooms",
  component: OpenCollaborationRooms,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof OpenCollaborationRooms>;

export const InstructorView: Story = {
  args: {
    rooms: allRooms,
    grades: mockGrades,
    units: mockUnits,
    sectionStudents: mockSectionStudents,
    sectionId: "section-jpn-101",
    isInstructor: true,
    onJoinRoom: (id) => console.log("Join room", id),
    onAssignPeerReview: async (gradeId, ownerId, reviewerIds) =>
      console.log("Assign", { gradeId, ownerId, reviewerIds }),
    onRandomAssign: async (unitId) => console.log("Random assign", unitId),
    onAwardTopReviewer: async (unitId) =>
      console.log("Award top reviewer", unitId),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Alice Chen/);
    await canvas.findByText(/ABC123/);
  },
};

export const StudentView: Story = {
  args: {
    rooms: peerReviewRooms,
    grades: mockGrades,
    units: mockUnits,
    sectionStudents: mockSectionStudents,
    sectionId: "section-jpn-101",
    isInstructor: false,
    onJoinRoom: (id) => console.log("Join room", id),
    onAssignPeerReview: noop,
    onRandomAssign: noop,
    onAwardTopReviewer: noop,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Alice Chen/);
  },
};

export const OnlyTutoringRooms: Story = {
  args: {
    rooms: tutoringRooms,
    grades: mockGrades,
    units: mockUnits,
    sectionStudents: mockSectionStudents,
    sectionId: "section-jpn-101",
    isInstructor: true,
    onJoinRoom: (id) => console.log("Join room", id),
    onAssignPeerReview: noop,
    onRandomAssign: noop,
    onAwardTopReviewer: noop,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/TUTR01/);
  },
};

export const EmptyRooms: Story = {
  args: {
    rooms: [],
    grades: mockGrades,
    units: mockUnits,
    sectionStudents: mockSectionStudents,
    sectionId: "section-jpn-101",
    isInstructor: true,
    onJoinRoom: (id) => console.log("Join room", id),
    onAssignPeerReview: noop,
    onRandomAssign: noop,
    onAwardTopReviewer: noop,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(50);
  },
};
