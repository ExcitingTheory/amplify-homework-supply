/**
 * Tests for GroupChallengeCard, SquadCrest, SquadLeaderboard components
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// File-local next-intl mock (overrides test/setup.ts): appends interpolation
// values as JSON so assertions can verify both the message key and its data.
vi.mock("next-intl", () => {
  const format = (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key;
  const createT = () => {
    const t = (key: string, values?: Record<string, unknown>) =>
      format(key, values);
    t.rich = (key: string, values?: Record<string, unknown>) =>
      format(key, values);
    t.markup = (key: string, values?: Record<string, unknown>) =>
      format(key, values);
    t.raw = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createT(),
    useLocale: () => "en",
    useMessages: () => ({}),
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

/** Text matcher for `key {"name":value,...}` output that checks a subset of the values. */
const withValues =
  (key: string, expected: Record<string, unknown>) => (content: string) => {
    if (!content.startsWith(`${key} `)) return false;
    try {
      const values = JSON.parse(content.slice(key.length + 1));
      return Object.entries(expected).every(([k, v]) => values[k] === v);
    } catch {
      return false;
    }
  };

import { GroupChallengeCard } from "../GroupChallengeCard";
import { SquadCrest } from "../SquadCrest";
import { SquadLeaderboard } from "../SquadLeaderboard";

// ============================================================================
// GroupChallengeCard
// ============================================================================

describe("GroupChallengeCard", () => {
  it("renders challenge title and progress", () => {
    render(
      <GroupChallengeCard
        title="Weekly Sprint"
        targetXP={1000}
        currentXP={600}
        active={true}
      />,
    );
    expect(screen.getByText("Weekly Sprint")).toBeDefined();
    expect(
      screen.getByText(
        withValues("groupChallengeCard.xpProgress", {
          currentXP: "600",
          targetXP: "1,000",
        }),
      ),
    ).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "60",
    );
  });

  it('shows "Goal Reached!" chip when target met', () => {
    render(
      <GroupChallengeCard
        title="Finish Line"
        targetXP={500}
        currentXP={500}
        active={false}
      />,
    );
    expect(screen.getByText("groupChallengeCard.goalReached")).toBeDefined();
  });

  it("shows bonus multiplier chip", () => {
    render(
      <GroupChallengeCard
        title="Challenge"
        targetXP={100}
        currentXP={50}
        active={true}
        bonusMultiplier={2}
      />,
    );
    expect(
      screen.getByText(
        withValues("groupChallengeCard.bonusMultiplier", {
          bonusMultiplier: 2,
        }),
      ),
    ).toBeDefined();
  });

  it("shows deadline info", () => {
    // 30-minute buffer keeps the remaining time safely above 2 full days
    const future = new Date(Date.now() + 2 * 86400000 + 1800000).toISOString();
    render(
      <GroupChallengeCard
        title="Timed Challenge"
        targetXP={100}
        currentXP={0}
        active={true}
        deadline={future}
      />,
    );
    // Should show days remaining (days + hours variant, not hours-only or expired)
    const text = screen.getByText(
      withValues("groupChallengeCard.daysHoursLeft", { days: 2 }),
    );
    expect(text).toBeDefined();
  });

  it("handles 0 targetXP without division error", () => {
    render(
      <GroupChallengeCard
        title="Empty Challenge"
        targetXP={0}
        currentXP={0}
        active={true}
      />,
    );
    expect(screen.getByText("0%")).toBeDefined();
  });
});

// ============================================================================
// SquadCrest
// ============================================================================

describe("SquadCrest", () => {
  it("renders squad initials", () => {
    render(<SquadCrest squadId="g1" squadName="Alpha Squad" />);
    expect(screen.getByText("AS")).toBeDefined();
  });

  it("renders squad name when showName is true", () => {
    render(<SquadCrest squadId="g1" squadName="Beta Team" showName />);
    expect(screen.getByText("Beta Team")).toBeDefined();
  });

  it("hides squad name when showName is false", () => {
    render(<SquadCrest squadId="g1" squadName="Beta Team" showName={false} />);
    expect(screen.queryByText("Beta Team")).toBeNull();
  });

  it("shows XP when provided", () => {
    render(<SquadCrest squadId="g1" squadName="Test" totalXP={1500} />);
    expect(screen.getByText("1,500 XP")).toBeDefined();
  });

  it("generates single initial for single-word name", () => {
    render(<SquadCrest squadId="g1" squadName="Phoenix" />);
    expect(screen.getByText("P")).toBeDefined();
  });
});

// ============================================================================
// SquadLeaderboard
// ============================================================================

describe("SquadLeaderboard", () => {
  const squads = [
    { id: "g1", name: "Alpha", totalXP: 500, memberCount: 3 },
    { id: "g2", name: "Beta", totalXP: 300, memberCount: 4 },
    { id: "g3", name: "Gamma", totalXP: 100, memberCount: 2 },
  ];

  it("renders all squads", () => {
    render(<SquadLeaderboard squads={squads} />);
    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();
    expect(screen.getByText("Gamma")).toBeDefined();
  });

  it("shows empty state", () => {
    render(<SquadLeaderboard squads={[]} />);
    expect(screen.getByText("squadLeaderboard.emptyTitle")).toBeDefined();
  });

  it('highlights student squad with "My Squad" chip', () => {
    render(<SquadLeaderboard squads={squads} mySquadId="g2" />);
    expect(screen.getByText("squadLeaderboard.mySquad")).toBeDefined();
  });

  it("shows member count text", () => {
    render(<SquadLeaderboard squads={squads} />);
    expect(
      screen.getByText(
        withValues("squadLeaderboard.memberCount", { count: 3 }),
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        withValues("squadLeaderboard.memberCount", { count: 4 }),
      ),
    ).toBeDefined();
  });

  it("shows rank emojis for top 3", () => {
    render(<SquadLeaderboard squads={squads} />);
    expect(screen.getByText("🥇")).toBeDefined();
    expect(screen.getByText("🥈")).toBeDefined();
    expect(screen.getByText("🥉")).toBeDefined();
  });
});
