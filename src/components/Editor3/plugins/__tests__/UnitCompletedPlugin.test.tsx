import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));
vi.mock("../../../../context/unitContext", async () => ({
  default: (await import("react")).createContext({}),
}));
vi.mock("../../../../context/sectionContext", async () => ({
  default: (await import("react")).createContext({ assignments: [] }),
}));
vi.mock("../../../../context/gamificationContext", () => ({
  useXP: () => ({ totalXP: 0, xpLogs: [] }),
}));
vi.mock("../../../PeerReview/OpenPeerReviewButton", () => ({
  OpenPeerReviewButton: () => null,
}));
vi.mock("../../../Gamification/HomeworkXPSummary", () => ({
  HomeworkXPSummary: () => null,
}));
vi.mock("../../../Gamification/PersonalBestBanner", () => ({
  PersonalBestBanner: () => null,
}));
vi.mock("../../../../../app/actions/peerReview", () => ({
  createPeerReviewRoom: vi.fn(),
}));
vi.mock("../../../../utils/analytics", () => ({
  trackWorkbookCompleted: vi.fn(),
  trackGradeRetry: vi.fn(),
  trackPeerReviewSubmitted: vi.fn(),
}));

import UnitContext from "../../../../context/unitContext";
import UnitCompletedPlugin from "../UnitCompletedPlugin";

const setShowUnitComplete = vi.fn();

function Subject({ retryEnabled }: { retryEnabled: boolean }) {
  const defaults = React.useContext(UnitContext);
  return (
    <UnitContext.Provider
      value={{
        ...defaults,
        unit: { id: "unit-1", retryEnabled },
        name: "Biology",
        grade: { id: "grade-1", complete: true, accuracy: 100 },
        recentGrades: [],
        showUnitComplete: true,
        setShowUnitComplete,
      }}
    >
      <UnitCompletedPlugin />
    </UnitContext.Provider>
  );
}

describe("completion modal with a retained completed grade", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not allow Escape to dismiss a non-retryable completion", () => {
    render(<Subject retryEnabled={false} />);
    fireEvent.keyDown(
      screen.getByText(/unitCompletedPlugin.completionMessage/),
      { key: "Escape" },
    );
    expect(setShowUnitComplete).not.toHaveBeenCalled();
  });

  it("preserves Escape dismissal when retry is enabled", () => {
    render(<Subject retryEnabled />);
    fireEvent.keyDown(
      screen.getByText(/unitCompletedPlugin.completionMessage/),
      { key: "Escape" },
    );
    expect(setShowUnitComplete).toHaveBeenCalledWith(false);
  });
});
