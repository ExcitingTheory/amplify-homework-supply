import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOnboardingEmitter } from "../../.storybook/code/onboarding-events";
import { initializeTaskCompletion } from "../../.storybook/code/task-completion";

const storyId = "🧩-ui-components-section-assigner--default";
const emitter = getOnboardingEmitter();
let cleanupTaskCompletion: (() => void) | undefined;

describe("task completion with portaled select options", () => {
  beforeEach(() => {
    emitter.reset();
    emitter.setPersona("instructor");
    emitter.setMode("tutorial");
    window.history.replaceState({}, "", `/?id=${encodeURIComponent(storyId)}`);
    document.body.innerHTML = `
      <button data-tour="due-date-picker"></button>
      <div data-tour="unit-selector">
        <div
          id="section-selector"
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
          aria-controls="section-listbox"
        ></div>
      </div>
      <ul id="section-listbox" role="listbox">
        <li role="option">Biology 101</li>
      </ul>
      <button data-tour="create-assignment-button"></button>
    `;
    cleanupTaskCompletion = initializeTaskCompletion();
  });

  afterEach(() => {
    cleanupTaskCompletion?.();
    cleanupTaskCompletion = undefined;
    emitter.reset();
    document.body.innerHTML = "";
  });

  it("counts choosing a portaled section option in the assignment sequence", () => {
    document
      .querySelector('[data-tour="due-date-picker"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document
      .querySelector('[role="option"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      emitter.isTaskCompleted("instructor-create-assignment", "instructor"),
    ).toBe(false);

    document
      .querySelector('[data-tour="create-assignment-button"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(
      emitter.isTaskCompleted("instructor-create-assignment", "instructor"),
    ).toBe(true);
  });
});
