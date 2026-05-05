import React from "react";
import { seedMockWords, seedMockUnit } from "@storybook-mocks/aws-amplify-data";
import { TabProvider } from "../context/tabContext";
import { DictionaryEditor2 } from "./DictionaryEditor2";

const mockWords = [
  {
    id: "word-1",
    phrase: "hablar",
    definition: "to speak, to talk",
    pronunciation: "ah-BLAR",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "word-2",
    phrase: "comer",
    definition: "to eat",
    pronunciation: "ko-MER",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "word-3",
    phrase: "vivir",
    definition: "to live",
    pronunciation: "bee-BEER",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "word-4",
    phrase: "estudiar",
    definition: "to study",
    pronunciation: "es-too-dee-AR",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "word-5",
    phrase: "escribir",
    definition: "to write",
    pronunciation: "es-kree-BEER",
    owner: "mock-user",
    _version: 1,
  },
];

const mockUnit = {
  id: "unit-1",
  name: "Spanish AR Verbs",
  description: "Regular -AR verb conjugation practice",
  owner: "mock-user",
  _version: 1,
};

const tabContextValue = {
  activeTab: "dictionary",
  setActiveTab: () => {},
  focusItem: null,
  setFocusItem: () => {},
  itemRefs: { current: {} },
  registerItemRef: () => {},
  unregisterItemRef: () => {},
  scrollToItem: () => {},
};

function seedDictionaryData() {
  seedMockUnit(mockUnit, { words: mockWords });
  seedMockWords(mockWords);
}

export default {
  title: "� Content Management/Dictionary Editor",
  component: DictionaryEditor2,
  parameters: {
    layout: "fullscreen",
    nextRouter: { pathname: "/unit/unit-1", query: { id: "unit-1" } },
  },
  decorators: [
    (Story) => {
      seedDictionaryData();
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
