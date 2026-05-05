import React from "react";
import ConfigurationManager from "./ConfigurationManager";
import UnitContext from "../../../context/unitContext";
import FilesContext from "../../../context/fileContext";
import SettingsContext from "../../../context/settingsContext";

const mockUnit = {
  id: "unit-1",
  name: "Spanish AR Verbs",
  description: "Regular verb conjugation practice",
  featuredImage: null,
  owner: "mock-user",
  _version: 1,
};

function withContexts(overrides = {}) {
  return (Story) => (
    <UnitContext.Provider value={{ unit: { ...mockUnit, ...overrides.unit } }}>
      <FilesContext.Provider
        value={{ session: { identityId: "mock-identity" } }}
      >
        <SettingsContext.Provider
          value={{
            settings: { id: "settings-1", metadata: "{}" },
            isLoading: false,
            updateSettings: async () => {},
            ...overrides.settings,
          }}
        >
          <Story />
        </SettingsContext.Provider>
      </FilesContext.Provider>
    </UnitContext.Provider>
  );
}

export default {
  title: "✏️ Lesson Editor/Configuration/Manager",
  component: ConfigurationManager,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Default = {
  decorators: [withContexts()],
};

export const WithFeaturedImage = {
  decorators: [
    withContexts({
      unit: {
        featuredImage: "public/images/featured-biology.jpg",
      },
    }),
  ],
};
