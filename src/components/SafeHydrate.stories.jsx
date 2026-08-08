import React from "react";
import SafeHydrate from "./SafeHydrate";
import { expect } from 'storybook/test'

export default {
  title: "🧩 UI Components/Safe Hydrate",
  component: SafeHydrate,
  parameters: {
    layout: "centered",
  },
};

export const Default = {
  render: () => (
    <SafeHydrate>
      <div
        style={{
          padding: "2rem",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>This content is safely hydrated</h2>
        <p>SafeHydrate ensures that children only render on the client side.</p>
      </div>
    </SafeHydrate>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const WithComplexContent = {
  render: () => (
    <SafeHydrate>
      <div
        style={{
          padding: "2rem",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>Complex Content</h2>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        <button onClick={() => alert("Clicked!")}>Click Me</button>
      </div>
    </SafeHydrate>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
