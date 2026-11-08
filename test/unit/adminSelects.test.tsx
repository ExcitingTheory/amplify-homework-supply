import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSelect from "../../app/[locale]/admin/_components/AdminSelect";
import AdminSectionSelect, {
  ALL_SECTIONS_ID,
  searchSectionPage,
  type SectionListFn,
} from "../../app/[locale]/admin/_components/AdminSectionSelect";

function makeSections(count: number, prefix = "Section") {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${prefix}-${i}`,
    name: `${prefix} ${i}`,
    code: `CODE${i}`,
  }));
}

/** Serves `all` in pages of `pageLength`, emulating AppSync nextToken paging. */
function pagedList(all: ReturnType<typeof makeSections>, pageLength: number) {
  return vi.fn<SectionListFn>(async ({ nextToken }) => {
    const start = nextToken ? Number(nextToken) : 0;
    const end = start + pageLength;
    return {
      data: all.slice(start, end),
      nextToken: end < all.length ? String(end) : null,
    };
  });
}

describe("AdminSelect", () => {
  const options = [
    { value: "all", label: "All Words" },
    { value: "missing_audio", label: "Missing Audio" },
    { value: "flagged", label: "Flagged" },
  ];

  it("shows the selected label and filters options as the user types", async () => {
    const user = userEvent.setup();
    render(
      <AdminSelect
        label="Filter"
        value="all"
        options={options}
        onChange={vi.fn()}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Filter" });
    expect(input).toHaveValue("All Words");

    await user.clear(input);
    await user.type(input, "audio");
    expect(
      await screen.findByRole("option", { name: "Missing Audio" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Flagged" })).toBeNull();
  });

  it("reports the selected option value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdminSelect
        label="Filter"
        value="all"
        options={options}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Filter" }));
    await user.click(await screen.findByRole("option", { name: "Flagged" }));
    expect(onChange).toHaveBeenCalledWith("flagged");
  });

  it("preserves numeric option values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdminSelect
        label="Date Range"
        value={7}
        options={[
          { value: 7, label: "Last 7 days" },
          { value: 30, label: "Last 30 days" },
        ]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Date Range" }));
    await user.click(
      await screen.findByRole("option", { name: "Last 30 days" }),
    );
    expect(onChange).toHaveBeenCalledWith(30);
  });
});

describe("searchSectionPage", () => {
  it("matches case-insensitively on name and code across pages", async () => {
    const all = [
      ...makeSections(120, "Filler"),
      { id: "bio", name: "AP Biology", code: "XYZ" },
      { id: "chem", name: "Chemistry", code: "bio-lab" },
    ];
    const list = pagedList(all, 50);

    const page = await searchSectionPage({ list, query: "BIO" , pageSize: 25});

    expect(page.options.map((o) => o.id)).toEqual(["bio", "chem"]);
    expect(page.nextToken).toBeNull();
  });

  it("stops scanning once a full page of matches is collected", async () => {
    const list = pagedList(makeSections(500), 100);

    const page = await searchSectionPage({ list, query: "", pageSize: 25 });

    expect(list).toHaveBeenCalledTimes(1);
    expect(page.options).toHaveLength(100);
    expect(page.nextToken).toBe("100");
  });

  it("resumes from the continuation token", async () => {
    const list = pagedList(makeSections(30), 10);
    const first = await searchSectionPage({
      list,
      query: "",
      pageSize: 5,
    });
    const second = await searchSectionPage({
      list,
      query: "",
      nextToken: first.nextToken,
      pageSize: 5,
    });
    expect(first.options[0].id).toBe("id-Section-0");
    expect(second.options[0].id).toBe("id-Section-10");
  });

  it("bounds the scan and still returns a token when matches are sparse", async () => {
    const list = pagedList(makeSections(100), 10);

    const page = await searchSectionPage({
      list,
      query: "no-such-section",
      maxPages: 3,
    });

    expect(list).toHaveBeenCalledTimes(3);
    expect(page.options).toEqual([]);
    expect(page.nextToken).toBe("30");
  });

  it("throws when the request fails without data", async () => {
    const list: SectionListFn = async () => ({ data: null, errors: [{}] });
    await expect(searchSectionPage({ list, query: "" })).rejects.toThrow();
  });
});

describe("AdminSectionSelect", () => {
  it("searches as the user types and reports the chosen section id", async () => {
    const user = userEvent.setup();
    const list = pagedList(
      [
        ...makeSections(10, "Math"),
        { id: "bio-1", name: "Biology 101", code: "B101" },
      ],
      5,
    );
    const onChange = vi.fn();
    render(
      <AdminSectionSelect
        value={ALL_SECTIONS_ID}
        onChange={onChange}
        listSections={list}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Section" });
    expect(input).toHaveValue("All Sections (Platform)");

    await user.clear(input);
    await user.type(input, "biolo");

    const option = await screen.findByRole("option", { name: /Biology 101/ });
    expect(screen.queryByRole("option", { name: /Math 1/ })).toBeNull();
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("bio-1");
  });

  it("loads further pages on demand", async () => {
    const user = userEvent.setup();
    const list = pagedList(makeSections(120), 50);
    render(
      <AdminSectionSelect
        value={ALL_SECTIONS_ID}
        onChange={vi.fn()}
        listSections={list}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Section" }));
    await screen.findByRole("option", { name: /Section 49/ });
    expect(screen.queryByRole("option", { name: /Section 50/ })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Load more sections" }),
    );

    expect(
      await screen.findByRole("option", { name: /Section 99/ }),
    ).toBeInTheDocument();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls[1][0].nextToken).toBe("50");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <AdminSectionSelect
        value={ALL_SECTIONS_ID}
        onChange={vi.fn()}
        listSections={pagedList(makeSections(3), 10)}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Section" });
    await user.clear(input);
    await user.type(input, "zzz");
    expect(await screen.findByText("No sections found")).toBeInTheDocument();
  });
});
