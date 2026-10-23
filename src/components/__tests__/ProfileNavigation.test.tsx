import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar } from "@mui/material";
import { NextIntlClientProvider } from "next-intl";
import { ProfileAvatarLink } from "../ProfileAvatarLink";
import { SectionSettingsNavigation } from "../SectionSettingsNavigation";
import { AppFooter } from "../AppFooter";
import { AvatarDisplay } from "../Gamification/AvatarDisplay";
import { LeaderboardTable, type LeaderboardEntry } from "../Leaderboard/LeaderboardTable";
import { applyLeaderboardPrivacy } from "../../utils/leaderboardPrivacy";
import { SquadLeaderboard } from "../Gamification/SquadLeaderboard";
import common from "../../../public/locales/en/common.json";
import pages from "../../../public/locales/en/pages.json";

vi.unmock("next-intl");
vi.mock("@/i18n/navigation", () => ({
  Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }>(
    function Link({ prefetch: _prefetch, ...props }, ref) {
      return <a {...props} ref={ref} />;
    },
  ),
}));

function renderNavigation(children: React.ReactNode, locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={{ common, pages }}>
      {children}
    </NextIntlClientProvider>,
  );
}

describe("ProfileAvatarLink", () => {
  it("uses the explicit user ID instead of a customized avatar seed", () => {
    renderNavigation(<AvatarDisplay profileUsername="student-alice" seed="custom-seed" label="Alice" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/profile/student-alice");
  });

  it("links a composed avatar to an encoded user identity", () => {
    renderNavigation(
      <ProfileAvatarLink username="student/a+b" displayName="Alice">
        <span>Avatar</span>
      </ProfileAvatarLink>,
    );
    expect(screen.getByRole("link", { name: "View Alice's public profile" }))
      .toHaveAttribute("href", "/profile/student%2Fa%2Bb");
  });

  describe("leaderboard avatar privacy", () => {
    const entries: LeaderboardEntry[] = [
      { studentId: "alice", studentName: "Alice", avatarColor: "#000", totalXP: 100, level: 1, currentStreak: 0, avatarLoaded: true },
      { studentId: "bob", studentName: "Bob", avatarColor: "#000", totalXP: 50, level: 1, currentStreak: 0, avatarLoaded: true },
    ];

    it("links visible students, but never links an anonymized student", () => {
      const visible = applyLeaderboardPrivacy(entries, {
        optedOutStudentIds: new Set(["bob"]),
        currentStudentId: "alice",
      });
      renderNavigation(<LeaderboardTable entries={visible} currentStudentId="alice" />);
      expect(screen.getAllByRole("link")).toHaveLength(1);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/profile/alice");
    });
  });

  describe("squad navigation", () => {
    it("keeps squad and member links separate instead of nesting anchors", () => {
      const { container } = renderNavigation(
        <SquadLeaderboard
          squads={[{
            id: "squad-1",
            name: "Squad One",
            totalXP: 100,
            memberCount: 1,
            members: [{ studentId: "alice", avatarSeed: "custom-seed" }],
          }]}
        />,
      );
      expect(screen.getByRole("link", { name: "Squad One" })).toHaveAttribute("href", "/squad/squad-1");
      expect(screen.getByRole("link", { name: "View alice's public profile" })).toHaveAttribute("href", "/profile/alice");
      expect(container.querySelector("a a")).toBeNull();
    });
  });

  it("preserves avatar classes and initials as an Avatar root", () => {
    renderNavigation(
      <Avatar component={ProfileAvatarLink} username="student-alice" displayName="Alice">
        A
      </Avatar>,
      "fr",
    );
    const link = screen.getByRole("link", { name: "View Alice's public profile" });
    expect(link).toHaveAttribute("href", "/profile/student-alice");
    expect(link).toHaveClass("MuiAvatar-root");
    expect(link).toHaveTextContent("A");
  });

  it("does not expose a profile link without an identity", () => {
    renderNavigation(<Avatar component={ProfileAvatarLink}>?</Avatar>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("does not trigger the surrounding row action on click or keyboard activation", () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    renderNavigation(
      <div onClick={onClick} onKeyDown={onKeyDown}>
        <ProfileAvatarLink username="student-alice">A</ProfileAvatarLink>
      </div>,
    );
    const link = screen.getByRole("link");
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.keyDown(link, { key: "Enter" });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});

describe("section settings navigation", () => {
  it("exposes both settings pages as secondary links", () => {
    renderNavigation(<SectionSettingsNavigation sectionId="section-123" />);
    expect(screen.getByRole("link", { name: "AI settings" }))
      .toHaveAttribute("href", "/section/section-123/settings/ai");
    expect(screen.getByRole("link", { name: "Gamification settings" }))
      .toHaveAttribute("href", "/section/section-123/settings/gamification");
  });

  it("returns to the section from either settings page", () => {
    renderNavigation(<SectionSettingsNavigation sectionId="section-123" backToSection />, "fr");
    expect(screen.getByRole("link", { name: "Back to section" }))
      .toHaveAttribute("href", "/section/section-123");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("AppFooter", () => {
  it("exposes the privacy policy as a footer link", () => {
    renderNavigation(<AppFooter />, "fr");
    expect(screen.getByRole("contentinfo")).toContainElement(screen.getByRole("link"));
    expect(screen.getByRole("link", { name: pages.privacy.title }))
      .toHaveAttribute("href", "/privacy");
  });
});
