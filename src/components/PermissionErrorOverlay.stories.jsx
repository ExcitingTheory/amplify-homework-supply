import React from "react";
import PermissionErrorOverlay from "./PermissionErrorOverlay";
import { I18nextProvider } from "react-i18next";
import i18n from "../../.storybook/i18next";
import { expect, userEvent, within } from "storybook/test";

export default {
  title: "🧩 UI Components/Permission Error Overlay",
  component: PermissionErrorOverlay,
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "A modal overlay that displays when a user tries to access content they don't have permission to view. Shows an error message and provides navigation options to go back or return home.",
      },
    },
  },
};

/**
 * Default permission error for a unit
 */
export const UnitPermissionError = {
  args: {
    open: true,
    resourceType: "unit",
    message: null,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

/**
 * Permission error with custom message
 */
export const CustomMessage = {
  args: {
    open: true,
    resourceType: "unit",
    message:
      "You do not have permission to access this unit. Only the owner or instructors can view unpublished units.",
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await body.findByText(/You do not have permission/);
  },
};

/**
 * Permission error for a section
 */
export const SectionPermissionError = {
  args: {
    open: true,
    resourceType: "section",
    message: "You are not enrolled in this section.",
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await body.findByText("You are not enrolled in this section.");
  },
};

/**
 * Permission error for an assignment
 */
export const AssignmentPermissionError = {
  args: {
    open: true,
    resourceType: "assignment",
    message: "This assignment is not available to you.",
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await body.findByText("This assignment is not available to you.");
  },
};

/**
 * Closed state (for testing toggle)
 */
export const ClosedState = {
  args: {
    open: false,
    resourceType: "unit",
    message: null,
  },
  play: async ({ canvasElement }) => {
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  },
};

/**
 * Interactive example with toggle
 */
export const Interactive = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Trigger Permission Error
      </button>
      <PermissionErrorOverlay
        open={open}
        resourceType="unit"
        message="You do not have permission to access this unit."
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

Interactive.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await canvas.findByText("Trigger Permission Error");
};
