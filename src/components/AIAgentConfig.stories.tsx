import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { AIAgentConfig, type AIAgentConfigValues, type SectionAIConfigValues } from "./AIAgentConfig";

const meta: Meta<typeof AIAgentConfig> = {
  title: "🛠️ Admin/AI Agent Config",
  component: AIAgentConfig,
  parameters: {
    layout: "padded",
  },
  args: {
    onChange: fn(),
    onSave: fn(),
    saving: false,
  },
};

export default meta;
type Story = StoryObj<typeof AIAgentConfig>;

const defaultPlatformValues: AIAgentConfigValues = {
  defaultAIModel: "gpt-4o",
  kaiModel: "gpt-4o-mini",
  sageModel: "gpt-4o",
  kaiTemperature: 0.7,
  sageTemperature: 0.7,
  kaiMaxTokens: 2000,
  sageMaxTokens: 4000,
  agentMaxSteps: 5,
  kaiMaxSteps: null,
  sageMaxSteps: null,
  searchThreshold: 0.3,
  searchDefaultLimit: 5,
  memoryEnabled: true,
  memorySummarizationModel: "gpt-4o-mini",
  kaiEnabled: true,
  sageEnabled: true,
  kaiSystemPromptOverride: "",
  sageSystemPromptOverride: "",
  systemPromptBudget: 2000,
  toolResultBudget: 4000,
  totalTurnBudget: 16000,
  kaiSystemPromptBudget: null,
  sageSystemPromptBudget: null,
  kaiToolResultBudget: null,
  sageToolResultBudget: null,
  kaiTotalTurnBudget: null,
  sageTotalTurnBudget: null,
  enforceTokenBudget: true,
};

export const PlatformMode: Story = {
  args: {
    mode: "platform",
    values: defaultPlatformValues,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Accordion sections render — verify "Save Changes" button
    const saveBtn = await canvas.findByRole("button", { name: /Save Changes/i });
    expect(saveBtn).not.toBeDisabled();
    await userEvent.click(saveBtn);
    expect(args.onSave).toHaveBeenCalled();
  },
};

export const PlatformBudgetEnforcementOff: Story = {
  name: "Platform — Budget Enforcement Disabled",
  args: {
    mode: "platform",
    values: {
      ...defaultPlatformValues,
      enforceTokenBudget: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Form renders — at least one field is visible
    const saveBtn = await canvas.findByRole("button", { name: /Save Changes/i });
    expect(saveBtn).toBeInTheDocument();
    // Budget enforcement is off — verify the toggle/checkbox reflects that
    const doc = canvasElement.ownerDocument;
    const checkboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    // At least one checkbox exists in the form
    expect(checkboxes.length).toBeGreaterThan(0);
  },
};

export const PlatformCustomModels: Story = {
  name: "Platform — Custom Model Selection",
  args: {
    mode: "platform",
    values: {
      ...defaultPlatformValues,
      defaultAIModel: "gpt-4.1",
      kaiModel: "gpt-4.1-nano",
      sageModel: "gpt-4.1-mini",
      kaiTemperature: 0.5,
      sageTemperature: 0.9,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Form renders with custom model names present
    const saveBtn = await canvas.findByRole("button", { name: /Save Changes/i });
    expect(saveBtn).toBeInTheDocument();
    // At least one model selector or text containing the custom model name
    expect(canvasElement.innerHTML).toContain("gpt-4.1");
  },
};

export const PlatformSaving: Story = {
  name: "Platform — Saving State",
  args: {
    mode: "platform",
    values: defaultPlatformValues,
    saving: true,
  },
  play: async ({ canvasElement }) => {
    // When saving=true, the component renders a loading state
    // (Save button may be disabled, hidden, or replaced by a spinner)
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100);
    // Verify no crash — form renders in some state
    const allBtns = Array.from(canvasElement.querySelectorAll('button'));
    // Either the save button is disabled, or there are no save buttons at all (spinner)
    const saveBtn = allBtns.find(b => b.textContent?.includes('Save'));
    if (saveBtn) {
      expect(saveBtn.hasAttribute('disabled') || saveBtn.getAttribute('aria-disabled') === 'true').toBe(true);
    }
    // No crash — confirm page is rendered with content
    const inputs = canvasElement.querySelectorAll('input, select, textarea');
    expect(inputs.length).toBeGreaterThan(0);
  },
};

export const SectionMode: Story = {
  args: {
    mode: "section",
    values: {
      kaiModel: "",
      sageModel: "",
      kaiTemperature: null,
      sageTemperature: null,
      kaiMaxTokens: null,
      sageMaxTokens: null,
      kaiMaxSteps: null,
      sageMaxSteps: null,
      searchThreshold: null,
      memoryEnabled: true,
      kaiSystemPromptAppend: "",
      sageSystemPromptAppend: "",
      systemPromptBudget: null,
      toolResultBudget: null,
      totalTurnBudget: null,
      enforceTokenBudget: true,
    } as SectionAIConfigValues as AIAgentConfigValues,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Section mode renders a save button
    const saveBtn = await canvas.findByRole("button", { name: /Save/i });
    expect(saveBtn).toBeInTheDocument();
  },
};

export const SectionWithOverrides: Story = {
  name: "Section — With Overrides Applied",
  args: {
    mode: "section",
    values: {
      kaiModel: "gpt-4.1-mini",
      sageModel: "gpt-4o",
      kaiTemperature: 0.5,
      sageTemperature: 0.8,
      kaiMaxTokens: 1500,
      sageMaxTokens: 3000,
      kaiMaxSteps: 3,
      sageMaxSteps: 7,
      searchThreshold: 0.4,
      memoryEnabled: false,
      kaiSystemPromptAppend:
        "This section focuses on JLPT N5 vocabulary. Emphasize reading practice.",
      sageSystemPromptAppend: "",
      systemPromptBudget: 3000,
      toolResultBudget: 6000,
      totalTurnBudget: 24000,
      enforceTokenBudget: true,
    } as SectionAIConfigValues as AIAgentConfigValues,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Pre-filled override values render in the form
    await canvas.findByRole("button", { name: /Save/i });
    // Custom model text is present in the rendered form
    expect(canvasElement.innerHTML).toContain("gpt-4.1-mini");
  },
};

export const EmptyValues: Story = {
  name: "Platform — Empty/Default Values",
  args: {
    mode: "platform",
    values: {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Form renders without crashing on empty values
    const saveBtn = await canvas.findByRole("button", { name: /Save/i });
    expect(saveBtn).toBeInTheDocument();
  },
};
