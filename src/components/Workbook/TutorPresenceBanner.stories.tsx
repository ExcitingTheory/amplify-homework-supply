import React from "react";
import { TutorPresenceBanner } from "./TutorPresenceBanner";
import UnitContext from "../../context/unitContext";
import { expect, within } from "storybook/test";

function withUnitContext(overrides: Record<string, any> = {}) {
  const base = {
    unit: { id: "unit-1" },
    workbookEnabled: true,
    workbook: {
      provider: { awareness: { getStates: () => new Map() } },
      hasTutorPresent: true,
      activeTutors: [
        { displayName: "Dr. García", color: "#1976d2", clientId: 1 },
        { displayName: "Prof. Smith", color: "#388e3c", clientId: 2 },
      ],
      ...overrides.workbook,
    },
    ...overrides,
  };
  return (Story: any) => (
    <UnitContext.Provider value={base as any}>
      <Story />
    </UnitContext.Provider>
  );
}

export default {
  title: "📓 Workbook/Tutor Presence Banner",
  component: TutorPresenceBanner,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const TwoTutors = {
  decorators: [withUnitContext()],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Dr\. García/);
    await canvas.findByText(/Prof\. Smith/);
    await canvas.findByText(/are here to help you/);
  },
};

export const SingleTutor = {
  decorators: [
    withUnitContext({
      workbook: {
        provider: { awareness: { getStates: () => new Map() } },
        hasTutorPresent: true,
        activeTutors: [
          { displayName: "Dr. García", color: "#1976d2", clientId: 1 },
        ],
      },
    }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Dr\. García/);
    await canvas.findByText(/is here to help you/);
  },
};

export const NoTutors = {
  decorators: [
    withUnitContext({
      workbook: {
        provider: { awareness: { getStates: () => new Map() } },
        hasTutorPresent: false,
        activeTutors: [],
      },
    }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.textContent?.trim()).toBe("");
  },
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.textContent?.trim()).toBe("");
  },
};
