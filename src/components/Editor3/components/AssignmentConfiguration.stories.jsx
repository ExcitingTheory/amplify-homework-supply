import React from "react";
import AssignmentConfiguration from "./AssignmentConfiguration";
import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import { expect } from 'storybook/test'

const mockUnit = {
  id: "unit-1",
  name: "Spanish AR Verbs",
  owner: "mock-user",
  _version: 1,
};

const mockSections = [
  {
    id: "section-1",
    name: "Spanish 101 — Period 1",
    code: "ABC123",
    owner: "mock-user",
  },
  {
    id: "section-2",
    name: "Spanish 102 — Period 3",
    code: "DEF456",
    owner: "mock-user",
  },
];

const mockAssignments = [
  {
    id: "assign-1",
    sectionID: "section-1",
    unitID: "unit-1",
    dueDate: "2026-05-15",
    allowRetry: true,
    owner: "mock-user",
  },
];

function withContexts(unitOverrides = {}, sectionOverrides = {}) {
  return (Story) => (
    <UnitContext.Provider value={{ unit: mockUnit, ...unitOverrides }}>
      <SectionContext.Provider
        value={{
          sections: mockSections,
          sectionMap: Object.fromEntries(mockSections.map((s) => [s.id, s])),
          assignments: mockAssignments,
          ...sectionOverrides,
        }}
      >
        <Story />
      </SectionContext.Provider>
    </UnitContext.Provider>
  );
}

export default {
  title: "✏️ Lesson Editor/Configuration/Assignment",
  component: AssignmentConfiguration,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const WithExistingAssignment = {
  decorators: [withContexts()],
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const NoAssignments = {
  decorators: [withContexts({}, { assignments: [] })],
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const NoSections = {
  decorators: [
    withContexts({}, { sections: [], sectionMap: {}, assignments: [] }),
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
