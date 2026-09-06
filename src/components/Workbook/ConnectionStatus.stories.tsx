import React from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import UnitContext from "../../context/unitContext";
import { expect, within } from "storybook/test";

const baseContext = {
  unit: { id: "unit-1", name: "Test Unit" },
  grade: { id: "grade-1" },
  workbookEnabled: true,
  workbook: {
    provider: { awareness: { getStates: () => new Map() } },
    joinCode: "ABC-123",
  },
};

function withUnitContext(overrides = {}) {
  return (Story: any) => (
    <UnitContext.Provider value={{ ...baseContext, ...overrides } as any}>
      <Story />
    </UnitContext.Provider>
  );
}

export default {
  title: "📓 Workbook/Connection Status",
  component: ConnectionStatus,
  parameters: {
    layout: "centered",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Connected = {
  decorators: [withUnitContext()],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.querySelector(".MuiChip-root")).toBeTruthy();
  },
};

export const ConnectedMedium = {
  args: { size: "medium" },
  decorators: [withUnitContext()],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.querySelector(".MuiChip-sizeMedium")).toBeTruthy();
  },
};

export const NoLabel = {
  args: { showLabel: false },
  decorators: [withUnitContext()],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.querySelector(".MuiChip-root")).toBeTruthy();
  },
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.textContent?.trim()).toBe("");
  },
};
