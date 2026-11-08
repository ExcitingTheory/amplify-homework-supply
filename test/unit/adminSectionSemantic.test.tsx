import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../app/[locale]/admin/_components/adminSemanticSearch", () => ({
  useAdminSemanticSearch: () => ({
    hits: [{ id: "sem-1", title: "Introductory Life Science", score: 0.9 }],
    searching: false,
    source: "platform",
  }),
}));

import AdminSectionSelect, {
  ALL_SECTIONS_ID,
  type SectionListFn,
} from "../../app/[locale]/admin/_components/AdminSectionSelect";

describe("AdminSectionSelect semantic hits", () => {
  it("lists semantic matches first, de-duplicated against scanned results", async () => {
    const user = userEvent.setup();
    const list: SectionListFn = async () => ({
      data: [
        { id: "a", name: "Algebra", code: "ALG" },
        { id: "sem-1", name: "Biology 101", code: "B101" },
      ],
      nextToken: null,
    });
    const onChange = vi.fn();
    render(
      <AdminSectionSelect
        value={ALL_SECTIONS_ID}
        onChange={onChange}
        listSections={list}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Section" });
    await user.clear(input);
    await user.type(input, "plants");

    // Semantic hit is shown even though "plants" matches no section text, and
    // it takes its label from the scanned record when that is known.
    const option = await screen.findByRole("option", { name: /Biology 101/ });
    expect(screen.queryByRole("option", { name: /Algebra/ })).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(1);

    await user.click(option);
    expect(onChange).toHaveBeenCalledWith("sem-1");
  });
});
