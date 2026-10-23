import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import FileListClient from "../../app/[locale]/admin/files/FileListClient";

const sampleFiles = [
  {
    id: "file-orphaned",
    name: "unlinked-upload.pdf",
    description: "An uploaded handout that is no longer linked to content.",
    mimeType: "application/pdf",
    path: "protected/admin-1/unlinked-upload.pdf",
    size: 12_582_912,
    thumbnail: null,
    generated: false,
    documentID: null,
    owner: "admin-1",
    createdAt: "2026-09-18T12:00:00.000Z",
    updatedAt: "2026-09-18T12:00:00.000Z",
    orphaned: true,
  },
  {
    id: "file-image",
    name: "cell-diagram.png",
    description: "A generated diagram used in a published lesson.",
    mimeType: "image/png",
    path: "public/images/cell-diagram.png",
    size: 438_272,
    thumbnail: "data:image/png;base64,",
    generated: true,
    documentID: null,
    owner: "instructor-42",
    createdAt: "2026-09-17T09:30:00.000Z",
    updatedAt: "2026-09-17T09:30:00.000Z",
    moderation: {
      status: "flagged",
      flags: "Needs review",
      checkedAt: "2026-09-17T10:00:00.000Z",
    },
    orphaned: false,
  },
  {
    id: "file-audio",
    name: "vocabulary-pronunciation.mp3",
    description: "Pronunciation audio attached to a vocabulary set.",
    mimeType: "audio/mpeg",
    path: "protected/instructor-42/vocabulary-pronunciation.mp3",
    size: 2_097_152,
    thumbnail: "data:image/png;base64,",
    generated: false,
    documentID: null,
    owner: "instructor-42",
    createdAt: "2026-09-16T15:45:00.000Z",
    updatedAt: "2026-09-16T15:45:00.000Z",
    moderation: { status: "approved" },
    embedding: { model: "text-embedding-3-small" },
    orphaned: false,
  },
];

const meta = {
  title: "🛠️ Admin/Files",
  component: FileListClient,
  parameters: {
    layout: "fullscreen",
    mockAuth: {
      user: {
        attributes: { sub: "admin-1", email: "admin@example.com" },
      },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins"],
      },
    },
    nextjs: { navigation: { pathname: "/admin/files" } },
  },
  args: { initialFiles: sampleFiles },
} satisfies Meta<typeof FileListClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StorageHealth: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "File List Maintenance" });
    await expect(canvas.getByText("unlinked-upload.pdf")).toBeVisible();
    await expect(canvas.getByText("cell-diagram.png")).toBeVisible();

    await userEvent.type(
      canvas.getByPlaceholderText("Search files..."),
      "unlinked",
    );
    await expect(canvas.getByText("unlinked-upload.pdf")).toBeVisible();
    await expect(canvas.queryByText("cell-diagram.png")).not.toBeInTheDocument();
  },
};

export const EmptyInventory: Story = {
  args: { initialFiles: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No files found.")).toBeVisible();
  },
};
