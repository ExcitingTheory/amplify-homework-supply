import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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
};

export const PlatformSaving: Story = {
  name: "Platform — Saving State",
  args: {
    mode: "platform",
    values: defaultPlatformValues,
    saving: true,
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
};

export const EmptyValues: Story = {
  name: "Platform — Empty/Default Values",
  args: {
    mode: "platform",
    values: {},
  },
};
