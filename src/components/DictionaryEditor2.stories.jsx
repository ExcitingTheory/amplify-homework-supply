import React from "react";
import {
  seedMockWords,
  seedMockUnit,
  clearMockData,
} from "@storybook-mocks/aws-amplify-data";
import { TabProvider } from "../context/tabContext";
import { DictionaryEditor2 } from "./DictionaryEditor2";
import { expect, within } from "storybook/test";

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

export default {
  title: "📁 Content Management/Dictionary Editor",
  component: DictionaryEditor2,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit(mockUnit, { words: mockWords });
      seedMockWords(mockWords);
    },
  ],
  parameters: {
    layout: "fullscreen",
    nextRouter: { pathname: "/unit/unit-1", query: { id: "unit-1" } },
    unitId: "unit-1",
    initializeMockData: false,
  },
  decorators: [
    (Story) => (
      <TabProvider value={tabContextValue}>
        <Story />
      </TabProvider>
    ),
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("hablar");
  },
};

export const Empty = {
  loaders: [
    async () => {
      clearMockData();
    },
  ],
  parameters: {
    unitId: "unit-1",
    initializeMockData: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

const csvImportedWords = [
  {
    id: "csv-1",
    phrase: "bonjour",
    definition: "hello, good morning",
    pronunciation: "bohn-ZHOOR",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-2",
    phrase: "merci",
    definition: "thank you",
    pronunciation: "mair-SEE",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-3",
    phrase: "au revoir",
    definition: "goodbye",
    pronunciation: "oh ruh-VWAR",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-4",
    phrase: "s'il vous plaît",
    definition: "please",
    pronunciation: "seel voo PLEH",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-5",
    phrase: "excusez-moi",
    definition: "excuse me",
    pronunciation: "ex-kew-zay-MWAH",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-6",
    phrase: "oui",
    definition: "yes",
    pronunciation: "WEE",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-7",
    phrase: "non",
    definition: "no",
    pronunciation: "NOHN",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-8",
    phrase: "comment allez-vous",
    definition: "how are you (formal)",
    pronunciation: "koh-MAHN tah-lay VOO",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-9",
    phrase: "je ne comprends pas",
    definition: "I don't understand",
    pronunciation: "zhuh nuh kohn-PRAHN pah",
    owner: "mock-user",
    _version: 1,
  },
  {
    id: "csv-10",
    phrase: "parlez-vous anglais",
    definition: "do you speak English",
    pronunciation: "par-lay VOO ahn-GLEH",
    owner: "mock-user",
    _version: 1,
  },
];

const csvImportUnit = {
  id: "unit-csv",
  name: "French Basics (CSV Import)",
  description: "Vocabulary imported from CSV file",
  owner: "mock-user",
  _version: 1,
};

export const BulkImported = {
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit(csvImportUnit, { words: csvImportedWords });
      seedMockWords(csvImportedWords);
    },
  ],
  parameters: {
    unitId: "unit-csv",
    initializeMockData: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("bonjour");
  },
};
