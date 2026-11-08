import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionStatus } from "./ConnectionStatus";
import UnitContext from "../../context/unitContext";

vi.mock("../../context/unitContext", async () => {
  const React = await import("react");
  return { default: React.createContext({}) };
});

describe("ConnectionStatus", () => {
  it.each([
    [false, false, "Offline"],
    [true, false, "Syncing..."],
    [true, true, "Connected"],
  ])("shows status without copying a code", (isConnected, isSynced, label) => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(
      <UnitContext.Provider
        value={{ workbookEnabled: true, workbook: { provider: {}, isConnected, isSynced } }}
      >
        <ConnectionStatus showLabel={false} />
      </UnitContext.Provider>,
    );

    fireEvent.click(screen.getByLabelText(label));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByRole("button")).toBeNull();
    vi.unstubAllGlobals();
  });
});
