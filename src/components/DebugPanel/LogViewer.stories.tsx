/**
 * Storybook stories for LogViewer component
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within, fn } from "storybook/test";
import { LogViewer } from "./LogViewer";
import { LogEntry } from "../../utils/debug/DebugLogger";

const meta: Meta<typeof LogViewer> = {
  title: "🛠️ Developer Tools/Debug Panel/Log Viewer",
  component: LogViewer,
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

const mockLogs: LogEntry[] = [
  {
    timestamp: Date.now() - 10000,
    level: "info",
    message: "Application initialized",
    stack: null,
  },
  {
    timestamp: Date.now() - 9000,
    level: "log",
    message: "DataStore starting sync...",
    stack: null,
  },
  {
    timestamp: Date.now() - 8000,
    level: "info",
    message: "User authenticated: user@example.com",
    stack: null,
  },
  {
    timestamp: Date.now() - 7000,
    level: "debug",
    message: 'Fetching unit data: {"unitId": "unit-123"}',
    stack: null,
  },
  {
    timestamp: Date.now() - 6000,
    level: "warn",
    message: "Slow query detected: DataStore.observeQuery took 1200ms",
    stack: null,
  },
  {
    timestamp: Date.now() - 5000,
    level: "log",
    message: "Rendering Editor3 component",
    stack: null,
  },
  {
    timestamp: Date.now() - 4000,
    level: "error",
    message: "Failed to load audio file: audio-123.mp3",
    stack:
      "Error: Network timeout\n  at fetch (http://localhost:3000/api/files)\n  at async loadAudio",
  },
  {
    timestamp: Date.now() - 3000,
    level: "warn",
    message: "Memory usage high: 85% of heap used",
    stack: null,
  },
  {
    timestamp: Date.now() - 2000,
    level: "info",
    message: "Auto-save completed successfully",
    stack: null,
  },
  {
    timestamp: Date.now() - 1000,
    level: "log",
    message: "Component tree updated: 12 components registered",
    stack: null,
  },
];

const errorLogs: LogEntry[] = [
  {
    timestamp: Date.now() - 5000,
    level: "error",
    message: 'TypeError: Cannot read property "id" of undefined',
    stack:
      'TypeError: Cannot read property "id" of undefined\n  at Component.render\n  at page.tsx:42',
  },
  {
    timestamp: Date.now() - 4000,
    level: "error",
    message: "Network request failed: POST /api/save",
    stack: "Error: ECONNREFUSED\n  at fetch\n  at async saveData",
  },
  {
    timestamp: Date.now() - 3000,
    level: "error",
    message: "Authentication token expired",
    stack: "Error: 401 Unauthorized\n  at validateToken\n  at checkAuth",
  },
];

const manyLogs: LogEntry[] = Array.from({ length: 200 }, (_, i) => ({
  timestamp: Date.now() - i * 100,
  level: (["log", "info", "warn", "error", "debug"] as const)[i % 5],
  message: `Log entry ${200 - i}: ${["Processing", "Rendering", "Fetching", "Saving", "Loading"][i % 5]} data...`,
  stack:
    i % 10 === 0
      ? `Stack trace for log ${200 - i}\n  at function${i}\n  at caller${i}`
      : null,
}));

export const Default: Story = {
  args: {
    logs: mockLogs,
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify initial log entries render
    await canvas.findByText("Application initialized");

    // Search for a specific log
    const searchInput = canvas.getByPlaceholderText("Search logs...");
    await userEvent.type(searchInput, "audio");
    await canvas.findByText("Failed to load audio file: audio-123.mp3");
    // Other logs no longer shown
    expect(canvas.queryByText("Application initialized")).toBeNull();

    // Clear search
    await userEvent.clear(searchInput);
    await canvas.findByText("Application initialized");

    // Verify warn-level log is present
    await canvas.findByText(
      "Slow query detected: DataStore.observeQuery took 1200ms",
    );

    // Click clear button
    const clearBtn = canvas.getByRole("button");
    await userEvent.click(clearBtn);
    expect(args.onClear).toHaveBeenCalled();
  },
};

export const Empty: Story = {
  args: {
    logs: [],
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("No logs captured yet");
  },
};

export const ErrorsOnly: Story = {
  args: {
    logs: errorLogs,
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // All three error messages visible
    await canvas.findByText(
      'TypeError: Cannot read property "id" of undefined',
    );
    await canvas.findByText("Network request failed: POST /api/save");
    await canvas.findByText("Authentication token expired");
    // Error count chip shown
    const chips = canvasElement.querySelectorAll(".MuiChip-root");
    expect(chips.length).toBeGreaterThan(0);
  },
};

export const ManyLogs: Story = {
  args: {
    logs: manyLogs,
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Count chip shows correct total
    await canvas.findByText(/200 \/ 200 shown/);
    // Search to narrow down
    const searchInput = canvas.getByPlaceholderText("Search logs...");
    await userEvent.type(searchInput, "Processing");
    const shownChip = await canvas.findByText(/\d+ \/ 200 shown/);
    expect(shownChip).toBeInTheDocument();
  },
};

export const NoAutoScroll: Story = {
  args: {
    logs: mockLogs,
    onClear: () => console.log("Clear logs"),
    autoScroll: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Application initialized");
    await canvas.findByText("Auto-save completed successfully");
  },
};

export const WithStackTraces: Story = {
  args: {
    logs: [
      {
        timestamp: Date.now() - 3000,
        level: "error",
        message: "Unhandled Promise Rejection",
        stack: `Error: Failed to fetch
  at fetch (http://localhost:3000/api/data)
  at async loadData (http://localhost:3000/utils/api.js:42:12)
  at async Component.componentDidMount (http://localhost:3000/pages/unit.tsx:128:5)`,
      },
      {
        timestamp: Date.now() - 2000,
        level: "error",
        message: "React Error Boundary caught",
        stack: `Error: Cannot render null component
  at Component.render (http://localhost:3000/components/Editor.tsx:85:20)
  at renderWithHooks
  at updateFunctionComponent`,
      },
      {
        timestamp: Date.now() - 1000,
        level: "warn",
        message: "Deprecated API usage detected",
        stack: `Warning: Using legacy context API
  at ContextProvider (http://localhost:3000/context/unit.js:15:8)
  at App (http://localhost:3000/pages/_app.js:22:10)`,
      },
    ],
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both error messages render
    await canvas.findByText("Unhandled Promise Rejection");
    await canvas.findByText("React Error Boundary caught");
    // Stack traces visible in the log entry
    await canvas.findByText(/at fetch/);
  },
};

export const MixedLevels: Story = {
  args: {
    logs: [
      {
        timestamp: Date.now() - 6000,
        level: "debug" as const,
        message: "Debug: Component mounted",
        stack: null,
      },
      {
        timestamp: Date.now() - 5000,
        level: "log" as const,
        message: "Log: Regular operation",
        stack: null,
      },
      {
        timestamp: Date.now() - 4000,
        level: "info" as const,
        message: "Info: User action completed",
        stack: null,
      },
      {
        timestamp: Date.now() - 3000,
        level: "warn" as const,
        message: "Warning: Performance issue",
        stack: null,
      },
      {
        timestamp: Date.now() - 2000,
        level: "error" as const,
        message: "Error: Operation failed",
        stack: "Error stack...",
      },
      {
        timestamp: Date.now() - 1000,
        level: "debug" as const,
        message: "Debug: Cleanup executed",
        stack: null,
      },
    ],
    onClear: fn(),
    autoScroll: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // All levels render initially
    await canvas.findByText("Debug: Component mounted");
    await canvas.findByText("Warning: Performance issue");
    await canvas.findByText("Error: Operation failed");

    // Verify all log levels rendered
    await canvas.findByText("Log: Regular operation");
    await canvas.findByText("Info: User action completed");
    await canvas.findByText("Debug: Cleanup executed");
  },
};
