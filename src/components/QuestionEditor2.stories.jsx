import React from "react";
import {
  seedMockQuestions,
  seedMockUnit,
} from "@storybook-mocks/aws-amplify-data";
import { TabProvider } from "../context/tabContext";
import { QuestionEditor2 } from "./QuestionEditor2";

const mockQuestions = [
  {
    id: "question-1",
    prompt: 'What is the correct conjugation of "hablar" for "yo"?',
    hint: "Regular -AR verb pattern",
    answer: "hablo",
    type: "short-answer",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "question-2",
    prompt: 'Translate: "We eat lunch at noon."',
    hint: 'Use the verb "comer"',
    answer: "Nosotros comemos el almuerzo al mediodía.",
    type: "short-answer",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "question-3",
    prompt: "Which of the following is a regular -IR verb?",
    hint: "Look at the verb ending",
    answer: "vivir",
    type: "multiple-choice",
    choices: JSON.stringify(["hablar", "comer", "vivir", "ser"]),
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "question-4",
    prompt: "Fill in the blank: Ellos _____ (escribir) una carta.",
    hint: "Third person plural -IR conjugation",
    answer: "escriben",
    type: "short-answer",
    owner: "mock-user",
    _version: 1,
  },
];

const mockUnit = {
  id: "unit-1",
  name: "Spanish Verb Practice",
  description: "Verb conjugation questions",
  owner: "mock-user",
  _version: 1,
};

const tabContextValue = {
  activeTab: "questions",
  setActiveTab: () => {},
  focusItem: null,
  setFocusItem: () => {},
  itemRefs: { current: {} },
  registerItemRef: () => {},
  unregisterItemRef: () => {},
  scrollToItem: () => {},
};

function seedQuestionData() {
  seedMockUnit(mockUnit, { questions: mockQuestions });
  seedMockQuestions(mockQuestions);
}

export default {
  title: "📁 Content Management/Question Editor",
  component: QuestionEditor2,
  parameters: {
    layout: "fullscreen",
    nextRouter: { pathname: "/unit/unit-1", query: { id: "unit-1" } },
  },
  decorators: [
    (Story) => {
      seedQuestionData();
      return (
        <TabProvider value={tabContextValue}>
          <Story />
        </TabProvider>
      );
    },
  ],
};

export const Default = {};

export const Empty = {
  decorators: [
    (Story) => (
      <TabProvider value={tabContextValue}>
        <Story />
      </TabProvider>
    ),
  ],
  parameters: {
    initializeMockData: false,
  },
};
