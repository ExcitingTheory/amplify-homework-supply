import React from "react";
import { AIFeedbackSnackbar } from "./AIFeedbackSnackbar";
import { expect, within } from "storybook/test";

// Minimal mock provider that emits awareness events
function createMockProvider(opts = {}) {
  const listeners = new Map();
  const feedbackMap = {
    observe: (fn: any) => {
      listeners.set("feedback", fn);
    },
    unobserve: (fn: any) => {
      listeners.delete("feedback");
    },
    get: () => undefined,
    toJSON: () => ({}),
  };
  return {
    awareness: {
      on: (event: any, fn: any) => {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(fn);
      },
      off: (event: any, fn: any) => {
        const fns = listeners.get(event) || [];
        listeners.set(
          event,
          fns.filter((f: any) => f !== fn),
        );
      },
      getLocalState: () => ({}),
      getStates: () => new Map(),
    },
    getMap: (name: any) => feedbackMap,
    // Simulate an AI feedback event after mount
    _emitFeedback: (blockId: any) => {
      const fns = listeners.get("change") || [];
      fns.forEach((fn: any) => fn());
    },
    ...opts,
  };
}

export default {
  title: "📓 Workbook/AI Feedback Snackbar",
  component: AIFeedbackSnackbar,
  parameters: {
    layout: "centered",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Default = {
  args: {
    provider: null,
    currentUsername: "student-alice",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const body = within(document.body);
    expect(body.queryByRole("alert")).toBeNull();
  },
};

export const WithProvider = {
  args: {
    provider: createMockProvider(),
    currentUsername: "student-alice",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const body = within(document.body);
    expect(body.queryByRole("alert")).toBeNull();
  },
};
