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
    isConnected: true,
    isSynced: true,
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

export const Offline = {
  args: { showLabel: false },
  decorators: [
    withUnitContext({
      workbook: { ...baseContext.workbook, isConnected: false, isSynced: false },
    }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(within(canvasElement).getByLabelText("Offline")).toBeTruthy();
  },
};

export const Syncing = {
  decorators: [
    withUnitContext({
      workbook: { ...baseContext.workbook, isSynced: false },
    }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(within(canvasElement).getByLabelText("Syncing...")).toBeTruthy();
  },
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(canvasElement.textContent?.trim()).toBe("");
  },
};
