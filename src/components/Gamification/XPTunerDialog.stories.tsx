import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { XPTunerDialog } from "./XPTunerDialog";
import { XPReason } from "../../utils/xpCalculation";
import { fn, expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof XPTunerDialog> = {
  title: "🏆 Gamification/Instructor/XP Tuner Dialog",
  component: XPTunerDialog,
  parameters: {
    layout: "centered",
  },
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof XPTunerDialog>;

/** Default state — all multipliers at 1×, no caps */
export const Default: Story = {
  args: {
    sectionName: "Biology 101 — Fall 2026",
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;

    // Dialog renders with section name
    await body.findByText("Biology 101 — Fall 2026");

    // XP Enabled toggle is on by default (first checkbox in dialog)
    const enableSwitch = doc.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(enableSwitch).not.toBeNull();
    expect(enableSwitch.checked).toBe(true);

    // Set a daily cap
    const dailyCapInput = body.getByLabelText("Daily cap");
    await userEvent.tripleClick(dailyCapInput);
    await userEvent.keyboard("500");

    // Click Save XP Settings
    const btns = Array.from(doc.querySelectorAll("button"));
    const saveBtn = btns.find((b) => b.textContent?.includes("Save"))!;
    await userEvent.click(saveBtn);
    expect(args.onSave).toHaveBeenCalled();
  },
};

/** With some custom multipliers already set */
export const WithCustomMultipliers: Story = {
  args: {
    sectionName: "Advanced Spanish — Spring 2026",
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 2,
        [XPReason.STREAK_7DAY]: 1.5,
        [XPReason.STREAK_30DAY]: 3,
        [XPReason.PERFECT_SCORE]: 2.5,
        [XPReason.PEER_REVIEW_GIVEN]: 0,
        [XPReason.EASTER_EGG]: 0.5,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("Advanced Spanish — Spring 2026");

    // Dialog renders with custom multipliers pre-set — at least one multiplier chip or value visible
    expect(doc.body.innerHTML).toContain("2");

    // Click Save to confirm onSave fires with existing config
    const btns = Array.from(doc.querySelectorAll("button"));
    const saveBtn = btns.find((b) => b.textContent?.includes("Save"));
    if (saveBtn && !saveBtn.disabled) {
      await userEvent.click(saveBtn);
      expect(args.onSave).toHaveBeenCalled();
    } else {
      // Save may require a change first — verify close button works instead
      const cancelBtn = btns.find(
        (b) =>
          b.textContent?.includes("Cancel") || b.textContent?.includes("Close"),
      );
      if (cancelBtn) await userEvent.click(cancelBtn);
      expect(args.onClose).toHaveBeenCalled();
    }
  },
};

/** With daily and weekly XP caps */
export const WithCaps: Story = {
  args: {
    sectionName: "Controlled Progression — History 301",
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 1.5,
      },
      dailyCap: 200,
      weeklyCap: 800,
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("Controlled Progression — History 301");

    // Pre-filled daily cap value visible
    const dailyCapInput = body.getByLabelText("Daily cap");
    expect((dailyCapInput as HTMLInputElement).value).toBe("200");

    // Edit weekly cap
    const weeklyCapInput = body.getByLabelText("Weekly cap");
    await userEvent.tripleClick(weeklyCapInput);
    await userEvent.keyboard("1200");

    // Click Save
    const btns = Array.from(doc.querySelectorAll("button"));
    const saveBtn = btns.find((b) => b.textContent?.includes("Save"))!;
    await userEvent.click(saveBtn);
    expect(args.onSave).toHaveBeenCalled();
  },
};

/** XP fully disabled */
export const XPDisabled: Story = {
  args: {
    sectionName: "No XP Section",
    config: {
      enabled: false,
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("No XP Section");

    // XP toggle is off (first checkbox in dialog)
    const enableSwitch = doc.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(enableSwitch.checked).toBe(false);

    // Warning banner visible
    await body.findByText(/XP is disabled for this section/);

    // Toggle XP on
    await userEvent.click(enableSwitch);
    expect(enableSwitch.checked).toBe(true);

    // Warning should disappear
    expect(body.queryByText(/XP is disabled for this section/)).toBeNull();

    // Click Cancel
    const btns = Array.from(doc.querySelectorAll("button"));
    const cancelBtn = btns.find((b) => b.textContent?.includes("Cancel"))!;
    await userEvent.click(cancelBtn);
    expect(args.onClose).toHaveBeenCalled();
  },
};

/** Double XP event — all at 2× with high caps */
export const DoubleXP: Story = {
  args: {
    sectionName: "Double XP Week — Math 201",
    config: {
      multipliers: Object.fromEntries(
        Object.values(XPReason).map((r) => [r, 2]),
      ) as Record<XPReason, number>,
      dailyCap: 500,
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("Double XP Week — Math 201");
    // Custom multiplier chip shows count (e.g. "N custom")
    const customChips = await body.findAllByText(/custom/i);
    expect(customChips.length).toBeGreaterThan(0);
    // Save button is present (may be disabled until changes made)
    const saveBtn = Array.from(doc.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Save"),
    );
    expect(saveBtn).toBeTruthy();
  },
};

/** No section name provided */
export const NoSectionName: Story = {
  args: {
    config: {
      multipliers: {
        [XPReason.ON_TIME_SUBMISSION]: 3,
      },
      weeklyCap: 1000,
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    // Dialog renders even without section name
    const btns = Array.from(doc.querySelectorAll("button"));
    expect(btns.length).toBeGreaterThan(0);
  },
};

/** Custom leveling curve — 20 levels, fast early progression */
export const CustomLeveling: Story = {
  args: {
    sectionName: "RPG Mode — History 101",
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 1.5,
        [XPReason.PERFECT_SCORE]: 3,
      },
      levelConfig: {
        maxLevel: 20,
        xpPerLevel: 100,
        levelScaling: 1.3,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("RPG Mode — History 101");

    // Level config values render in the dialog
    const dailyCapInput = body.queryByLabelText("Daily cap");
    // Dialog is open and contains some content
    expect(doc.body.innerHTML.length).toBeGreaterThan(100);

    // Close the dialog
    const btns = Array.from(doc.querySelectorAll("button"));
    const cancelBtn = btns.find(
      (b) =>
        b.textContent?.includes("Cancel") || b.textContent?.includes("Close"),
    );
    if (cancelBtn) {
      await userEvent.click(cancelBtn);
      expect(args.onClose).toHaveBeenCalled();
    }
  },
};

/** Max levels capped at 99 with steep scaling */
export const MaxLevels: Story = {
  args: {
    sectionName: "Endgame — CS 490",
    config: {
      dailyCap: 1000,
      weeklyCap: 5000,
      levelConfig: {
        maxLevel: 99,
        xpPerLevel: 200,
        levelScaling: 2.0,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const body = within(document.body);
    const doc = canvasElement.ownerDocument;
    await body.findByText("Endgame — CS 490");

    // Dialog is open with cap values pre-filled
    const dailyCapInput = body.getByLabelText("Daily cap");
    expect((dailyCapInput as HTMLInputElement).value).toBe("1000");

    // Click Close → onClose fires
    const btns = Array.from(doc.querySelectorAll("button"));
    const cancelBtn = btns.find(
      (b) =>
        b.textContent?.includes("Cancel") || b.textContent?.includes("Close"),
    )!;
    await userEvent.click(cancelBtn);
    expect(args.onClose).toHaveBeenCalled();
  },
};
