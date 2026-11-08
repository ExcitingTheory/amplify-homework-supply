import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthContext from "@/context/authContext";
import AdminRouteGuard from "../../app/[locale]/admin/_components/AdminRouteGuard";
import { canAccessAdminArea } from "../../app/[locale]/admin/_components/adminAccess";

describe("canAccessAdminArea", () => {
  it("defaults to Admins only", () => {
    expect(canAccessAdminArea(["Admins"])).toBe(true);
    expect(canAccessAdminArea(["Instructors"])).toBe(false);
    expect(canAccessAdminArea(["Moderators"])).toBe(false);
    expect(canAccessAdminArea(["Learners"])).toBe(false);
    expect(canAccessAdminArea([])).toBe(false);
    expect(canAccessAdminArea(undefined)).toBe(false);
  });

  it("lets instructors into staff routes without opening anything else", () => {
    expect(canAccessAdminArea(["Instructors"], "staff")).toBe(true);
    expect(canAccessAdminArea(["Admins"], "staff")).toBe(true);
    expect(canAccessAdminArea(["Moderators"], "staff")).toBe(false);
    expect(canAccessAdminArea(["Learners"], "staff")).toBe(false);
  });
});

describe("AdminRouteGuard", () => {
  const renderGuard = (
    groups: string[] | undefined,
    access?: "admins" | "staff",
  ) =>
    render(
      <AuthContext.Provider value={{ session: groups ? { groups } : undefined } as any}>
        <AdminRouteGuard access={access}>
          <p>secret tools</p>
        </AdminRouteGuard>
      </AuthContext.Provider>,
    );

  it("blocks instructors by default", () => {
    renderGuard(["Instructors"]);
    expect(screen.queryByText("secret tools")).toBeNull();
    expect(screen.getByText("This page is restricted to admins.")).toBeInTheDocument();
  });

  it("admits admins by default", () => {
    renderGuard(["Admins"]);
    expect(screen.getByText("secret tools")).toBeInTheDocument();
  });

  it("admits instructors on staff routes but still blocks learners and anonymous users", () => {
    const instructor = renderGuard(["Instructors"], "staff");
    expect(screen.getByText("secret tools")).toBeInTheDocument();
    instructor.unmount();

    const learner = renderGuard(["Learners"], "staff");
    expect(screen.queryByText("secret tools")).toBeNull();
    learner.unmount();

    renderGuard(undefined, "staff");
    expect(screen.queryByText("secret tools")).toBeNull();
  });
});
