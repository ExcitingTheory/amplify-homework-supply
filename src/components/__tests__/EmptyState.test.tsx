import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

vi.mock("@/i18n/navigation", () => ({
  Link: React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }
  >(function Link({ prefetch: _prefetch, ...props }, ref) {
    return <a data-locale-link="true" {...props} ref={ref} />;
  }),
}));

describe("EmptyState link CTA", () => {
  it("routes root-relative hrefs through the locale-aware link", () => {
    render(<EmptyState title="Empty" ctaLabel="Go" ctaHref="/squads" />);
    const link = screen.getByRole("link", { name: "Go" });
    expect(link).toHaveAttribute("href", "/squads");
    expect(link).toHaveAttribute("data-locale-link", "true");
  });

  it("renders a plain anchor for absolute URLs", () => {
    render(
      <EmptyState
        title="Empty"
        ctaLabel="Docs"
        ctaHref="https://example.com/docs"
      />,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).not.toHaveAttribute("data-locale-link");
  });

  it("renders a button-like link and fires onCtaClick without an href", () => {
    const onCtaClick = vi.fn();
    render(<EmptyState title="Empty" ctaLabel="Do it" onCtaClick={onCtaClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Do it" }));
    expect(onCtaClick).toHaveBeenCalledTimes(1);
  });

  it("omits the CTA when no label is provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
