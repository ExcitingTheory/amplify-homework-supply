import React from "react";
import FileManager2 from "./FileManager2";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { Box, Paper, Typography } from "@mui/material";
import FilesContext, { FilesProvider } from "../../../context/fileContext";
import UnitContext from "../../../context/unitContext";
import SettingsContext from "../../../context/settingsContext";
import { EditorToastProvider } from "../context/EditorToastContext";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MOCK_JAPANESE_GRAMMAR_PDF, MOCK_VOCABULARY_LIST_PDF } from "../../../../.storybook/__mocks__/mockDocuments";
export default {
  title: "📁 Content Management/File Manager",
  component: FileManager2,
  decorators: [
    (Story) => (
      <EditorToastProvider>
        <Story />
      </EditorToastProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    // Ensure AudioPlayerProvider is available (needed for audio file waveforms)
    disableUnitContext: false,
    disableSectionContext: false,
    disableDictionaryContext: false,
    docs: {
      description: {
        component: `
Advanced file manager with virtualized list, semantic search, and document analysis.

## Features
- Virtualized file list with dynamic height measurement
- Hybrid search (keyword + semantic vector search)
- File organization by protection level (public, protected, private)
- Inline file renaming with Lexical editor
- Expandable file details with metadata editor and parsed content
- File generation (text-to-image, text-to-speech)
- Drag-and-drop upload
- Bulk selection and operations

## File Types
- **Images**: Preview, insert into editor, metadata editing
- **Audio**: Waveform preview, playlist insertion
- **PDFs**: Expandable content shows extracted vocabulary, questions, summaries, objectives, and concepts
- **Videos**: Preview and insertion

## Expanding Files
Click the expand icon (▼) next to any file to view:
- File metadata (name, description, prompt, model, variant)
- For PDFs: Parsed content in tabs (Vocabulary, Questions, Summaries, Objectives, Concepts)
- Preview, metadata, and extracted content can collapse independently.
- Long sections and review panels scroll within bounded heights.
- Images, audio, video, PDFs, and text files support previews; unsupported files retain download access.
        `,
      },
    },
  },
};

// Mock data matching schema signatures
const MOCK_DOCUMENT_ID_1 = "mock-doc-japanese-photosynthesis";
const MOCK_DOCUMENT_ID_2 = "mock-doc-french-seasons";
const MOCK_FILE_ID_PDF_1 = "mock-file-pdf-1";
const MOCK_FILE_ID_PDF_2 = "mock-file-pdf-2";
const MOCK_FILE_ID_IMAGE_1 = "mock-file-image-1";
const MOCK_FILE_ID_IMAGE_2 = "mock-file-image-2";
const MOCK_FILE_ID_AUDIO_1 = "mock-file-audio-1";
const MOCK_FILE_ID_AUDIO_2 = "mock-file-audio-2";

// Parsed content matching schema structure
const mockParsedContentJapanese = {
  vocabularyJSON: [
    {
      word: "光合成",
      definition:
        "photosynthesis - the process by which plants convert light into chemical energy",
      context: "植物は光合成によって二酸化炭素と水から糖を作ります",
      page: 1,
    },
    {
      word: "葉緑体",
      definition: "chloroplast - organelle where photosynthesis occurs",
      context: "葉緑体には光合成に必要なクロロフィルが含まれています",
      page: 1,
    },
    {
      word: "クロロフィル",
      definition: "chlorophyll - green pigment that absorbs light energy",
      context: "クロロフィルは主に青色と赤色の光を吸収します",
      page: 2,
    },
    {
      word: "二酸化炭素",
      definition:
        "carbon dioxide - gas absorbed by plants during photosynthesis",
      context: "植物は気孔から二酸化炭素を取り込みます",
      page: 2,
    },
    {
      word: "酸素",
      definition: "oxygen - gas released as a byproduct of photosynthesis",
      context: "光合成の過程で酸素が大気中に放出されます",
      page: 3,
    },
  ],
  summariesJSON: [
    {
      title: "Photosynthesis Overview",
      content:
        "Plants convert light energy into chemical energy through photosynthesis, using chlorophyll in chloroplasts to transform carbon dioxide and water into glucose and oxygen.",
      page_range: "1-3",
    },
    {
      title: "Key Components",
      content:
        "The process involves chloroplasts, chlorophyll, carbon dioxide, water, and light energy, producing glucose and releasing oxygen as a byproduct.",
      page_range: "2-4",
    },
  ],
  objectivesJSON: [
    {
      objective: "Understand the process of photosynthesis",
      bloom_level: "comprehension",
    },
    {
      objective: "Identify the role of chlorophyll in energy conversion",
      bloom_level: "knowledge",
    },
    {
      objective: "Analyze the inputs and outputs of photosynthesis",
      bloom_level: "analysis",
    },
  ],
  conceptsJSON: [
    {
      concept: "Chloroplast Structure",
      description:
        "Organelle containing chlorophyll where photosynthesis occurs",
      related_vocabulary: ["葉緑体", "クロロフィル"],
    },
    {
      concept: "Gas Exchange",
      description: "Process of CO₂ intake and O₂ release through stomata",
      related_vocabulary: ["二酸化炭素", "酸素", "気孔"],
    },
  ],
  questionsJSON: [
    {
      prompt:
        "What is the primary function of chlorophyll in photosynthesis?",
      answer:
        "Chlorophyll absorbs light energy, primarily blue and red wavelengths, which is then used to convert carbon dioxide and water into glucose.",
      hint: "Think about what happens when light hits the chloroplast.",
      questionType: "comprehension",
    },
    {
      prompt:
        "Describe the inputs and outputs of the photosynthesis process.",
      answer:
        "Inputs: carbon dioxide (CO₂), water (H₂O), and light energy. Outputs: glucose (C₆H₁₂O₆) and oxygen (O₂).",
      hint: "What goes in and what comes out?",
      questionType: "comprehension",
    },
    {
      prompt: "Why is photosynthesis important for life on Earth?",
      answer:
        "Photosynthesis produces oxygen that most organisms need to breathe and creates glucose, the foundation of food chains.",
      hint: "Think about what all living things need.",
      questionType: "synthesis",
    },
  ],
};

const mockParsedContentFrench = {
  vocabularyJSON: [
    {
      word: "le printemps",
      definition: "spring - season between winter and summer",
      context: "Au printemps, les fleurs commencent à pousser.",
      page: 1,
    },
    {
      word: "l'été",
      definition: "summer - warmest season of the year",
      context: "En été, il fait très chaud et le soleil brille.",
      page: 1,
    },
    {
      word: "l'automne",
      definition: "autumn/fall - season when leaves change color",
      context: "En automne, les feuilles tombent des arbres.",
      page: 2,
    },
    {
      word: "l'hiver",
      definition: "winter - coldest season of the year",
      context: "En hiver, il neige souvent dans les montagnes.",
      page: 2,
    },
  ],
  summariesJSON: [
    {
      title: "The Four Seasons",
      content:
        "An introduction to the four seasons in French: spring, summer, autumn, and winter, with descriptions of typical weather and activities.",
      page_range: "1-2",
    },
  ],
  objectivesJSON: [
    {
      objective: "Learn the names of the four seasons in French",
      bloom_level: "knowledge",
    },
    {
      objective: "Describe seasonal characteristics",
      bloom_level: "comprehension",
    },
  ],
  conceptsJSON: [
    {
      concept: "Seasonal Vocabulary",
      description: "French words for describing the four seasons",
      related_vocabulary: ["le printemps", "l'été", "l'automne", "l'hiver"],
    },
  ],
  questionsJSON: [
    {
      prompt: "Quelle saison vient après le printemps?",
      answer: "L'été vient après le printemps.",
      hint: "Think about the order of seasons.",
      questionType: "comprehension",
    },
    {
      prompt: "Que se passe-t-il en automne?",
      answer:
        "En automne, les feuilles changent de couleur et tombent des arbres.",
      hint: "What happens to trees in fall?",
      questionType: "comprehension",
    },
  ],
};

const seedMockData = async () => {
  console.log("[FileManager2.stories] Starting to seed mock data...");

  // Clear localStorage to reset generator filter to 'all'
  if (typeof window !== "undefined") {
    localStorage.removeItem("fileManager2_activeTab");
  }

  const { seedMockFiles, seedMockDocuments, seedMockParsedContent } =
    await import("../../../../.storybook/__mocks__/aws-amplify-data");
  const {
    MOCK_IMAGE_URL_1,
    MOCK_IMAGE_URL_2,
    MOCK_AUDIO_URL_1,
    MOCK_AUDIO_URL_2,
  } = await import("../../../../.storybook/__mocks__/media");

  const timestamp = new Date().toISOString();
  const identityId = "us-east-1:mock-identity-123";
  const owner = "mock-user-sub";

  console.log("[FileManager2.stories] Mock imports complete");

  // Seed Files
  console.log("[FileManager2.stories] Seeding files...");
  seedMockFiles([
    // PDF Files
    {
      id: MOCK_FILE_ID_PDF_1,
      name: "japanese-lesson-photosynthesis.pdf",
      path: MOCK_JAPANESE_GRAMMAR_PDF,
      mimeType: "application/pdf",
      level: "PROTECTED",
      size: 1234567,
      documentID: MOCK_DOCUMENT_ID_1,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_PDF_2,
      name: "french-seasons-vocabulary.pdf",
      path: MOCK_VOCABULARY_LIST_PDF,
      mimeType: "application/pdf",
      level: "PROTECTED",
      size: 456789,
      documentID: MOCK_DOCUMENT_ID_2,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    // Image Files
    {
      id: MOCK_FILE_ID_IMAGE_1,
      name: "cell-diagram.jpg",
      path: MOCK_IMAGE_URL_1,
      mimeType: "image/jpeg",
      level: "PUBLIC",
      size: 234567,
      metadata: JSON.stringify({
        analysis: {
          description:
            "A detailed biological diagram showing the internal structure of a plant cell, including organelles such as the nucleus, chloroplasts, mitochondria, and cell wall.",
        },
      }),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_IMAGE_2,
      name: "seasons-illustration.png",
      path: MOCK_IMAGE_URL_2,
      mimeType: "image/png",
      level: "PUBLIC",
      size: 345678,
      metadata: JSON.stringify({
        analysis: {
          description:
            "An illustration depicting the four seasons with representative landscapes and weather patterns for spring, summer, autumn, and winter.",
        },
      }),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    // Audio Files
    {
      id: MOCK_FILE_ID_AUDIO_1,
      name: "photosynthesis-pronunciation.mp3",
      path: MOCK_AUDIO_URL_1,
      mimeType: "audio/mpeg",
      level: "PROTECTED",
      size: 123456,
      duration: 12,
      metadata: JSON.stringify({
        analysis: {
          transcription:
            "Kougousei wa shokubutsu ga hikari enerugi wo riyou shite nisan katanso to mizu kara tou wo tsukuru purosesu desu.",
          description:
            "Audio pronunciation of Japanese photosynthesis vocabulary terms.",
        },
      }),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 9000000).toISOString(),
      updatedAt: new Date(Date.now() - 9000000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_AUDIO_2,
      name: "seasons-audio.mp3",
      path: MOCK_AUDIO_URL_2,
      mimeType: "audio/mpeg",
      level: "PROTECTED",
      size: 98765,
      duration: 8,
      metadata: JSON.stringify({
        analysis: {
          transcription:
            "Le printemps, l'été, l'automne, l'hiver. Les quatre saisons de l'année.",
          description: "Audio pronunciation of French seasonal vocabulary.",
        },
      }),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 2700000).toISOString(),
      updatedAt: new Date(Date.now() - 2700000).toISOString(),
    },
  ]);
  console.log("[FileManager2.stories] Files seeded");

  // Seed Documents
  console.log("[FileManager2.stories] Seeding documents...");
  seedMockDocuments([
    {
      id: MOCK_DOCUMENT_ID_1,
      filename: "japanese-lesson-photosynthesis.pdf",
      s3Key: "protected/documents/japanese-lesson-photosynthesis.pdf",
      status: "completed",
      pageCount: 8,
      fileSize: 1234567,
      mimeType: "application/pdf",
      owner,
      identityId,
      uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: MOCK_DOCUMENT_ID_2,
      filename: "french-seasons-vocabulary.pdf",
      s3Key: "protected/documents/french-seasons.pdf",
      status: "completed",
      pageCount: 4,
      fileSize: 456789,
      mimeType: "application/pdf",
      owner,
      identityId,
      uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  console.log("[FileManager2.stories] Documents seeded");

  // Seed ParsedContent
  console.log("[FileManager2.stories] Seeding parsed content...");
  seedMockParsedContent([
    {
      id: "mock-parsed-content-1",
      documentID: MOCK_DOCUMENT_ID_1,
      fileID: MOCK_FILE_ID_PDF_1,
      vocabularyJSON: JSON.stringify(mockParsedContentJapanese.vocabularyJSON),
      summariesJSON: JSON.stringify(mockParsedContentJapanese.summariesJSON),
      objectivesJSON: JSON.stringify(mockParsedContentJapanese.objectivesJSON),
      conceptsJSON: JSON.stringify(mockParsedContentJapanese.conceptsJSON),
      questionsJSON: JSON.stringify(mockParsedContentJapanese.questionsJSON),
      responseId: "chatcmpl-mock-response-1",
      modelUsed: "gpt-4",
      tokensUsed: 2500,
      processingTime: 45,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "mock-parsed-content-2",
      documentID: MOCK_DOCUMENT_ID_2,
      fileID: MOCK_FILE_ID_PDF_2,
      vocabularyJSON: JSON.stringify(mockParsedContentFrench.vocabularyJSON),
      summariesJSON: JSON.stringify(mockParsedContentFrench.summariesJSON),
      objectivesJSON: JSON.stringify(mockParsedContentFrench.objectivesJSON),
      conceptsJSON: JSON.stringify(mockParsedContentFrench.conceptsJSON),
      questionsJSON: JSON.stringify(mockParsedContentFrench.questionsJSON),
      responseId: "chatcmpl-mock-response-2",
      modelUsed: "gpt-4",
      tokensUsed: 1800,
      processingTime: 32,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  console.log("[FileManager2.stories] ParsedContent seeded");
  console.log("[FileManager2.stories] All mock data seeded successfully!");
};

const EMPTY_CONTEXT = {};

// Debug component to show files count
const FilesDebug = () => {
  const filesContext = React.useContext(FilesContext) || EMPTY_CONTEXT;
  const { files = [] } = filesContext;
  const unitContext = React.useContext(UnitContext) || EMPTY_CONTEXT;

  React.useEffect(() => {
    console.log("[FilesDebug] Files in context:", files.length, files);
    console.log("[FilesDebug] FilesContext:", filesContext);
    console.log("[FilesDebug] UnitContext:", unitContext);
  }, [files, filesContext, unitContext]);

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: "info.light",
        color: "info.contrastText",
        fontSize: "0.75rem",
      }}
    >
      📁 Files loaded: {files.length} | Session:{" "}
      {filesContext.session?.identityId ? "✓" : "✗"} | Unit:{" "}
      {unitContext.unit?.id ? "✓" : "✗"}
    </Box>
  );
};

// Wrapper to provide Lexical context and UnitContext
const FileManagerWrapper = ({ children, showDebug = false }) => {
  const initialConfig = {
    namespace: "FileManager2Story",
    onError: (error) => console.error("Lexical error:", error),
    editorState: null,
  };

  // Memoize context values to prevent recreation on every render
  const mockUnitContext = React.useMemo(
    () => ({
      unit: {
        id: "mock-unit-id",
        name: "Mock Unit",
        data: null,
      },
      session: {
        identityId: "us-east-1:mock-identity-123",
        username: "mock-user-sub",
      },
    }),
    [],
  );

  const mockSettingsContext = React.useMemo(
    () => ({
      settings: null,
    }),
    [],
  );

  return (
    <SettingsContext.Provider value={mockSettingsContext}>
      <UnitContext.Provider value={mockUnitContext}>
        <LexicalComposer initialConfig={initialConfig}>
          <Box
            sx={{
              height: "100vh",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {showDebug && <FilesDebug />}
            {/* Suspense boundary required for React.use() in FileManager2 */}
            <React.Suspense
              fallback={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <Typography>Loading files...</Typography>
                </Box>
              }
            >
              {children}
            </React.Suspense>
          </Box>
        </LexicalComposer>
      </UnitContext.Provider>
    </SettingsContext.Provider>
  );
};

export const Default = {
  loaders: [seedMockData],
  parameters: {
    layout: "fullscreen", // Remove Storybook's default padding
    initializeMockData: false,
  },
  render: () => (
    <FileManagerWrapper showDebug={true}>
      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const WithExpandedContent = {
  loaders: [seedMockData],
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
  render: () => (
    <FileManagerWrapper>
      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h6"
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          File Manager - Expanded Content Demo
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pb: 1 }}
        >
          Click the expand icon (▼) next to any file to view detailed metadata
          and parsed content. PDF files show vocabulary, questions, summaries,
          objectives, and concepts.
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const AdaptiveFileDetails = {
  ...Default,
  render: () => (
    <FileManagerWrapper>
      <Box sx={{ width: 420, maxWidth: "100%", height: "100%", minHeight: 0 }}>
        <FileManager2 />
      </Box>
    </FileManagerWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = await canvas.findByText("cell-diagram.jpg");
    const list = canvas.getByTestId("file-browser-list");
    expect(canvas.queryByTestId("file-browser-details")).toBeNull();
    expect(list.getBoundingClientRect().width).toBeGreaterThanOrEqual(418);
    await userEvent.click(file.closest("[draggable]"));
    const details = await canvas.findByTestId("file-browser-details");
    await waitFor(() => {
      expect(details.getBoundingClientRect().top)
        .toBeGreaterThanOrEqual(list.getBoundingClientRect().bottom - 1);
      expect(details.getBoundingClientRect().width).toBeGreaterThanOrEqual(418);
    });
    const selected = canvas.getAllByRole("checkbox").find((checkbox) => checkbox.checked);
    await userEvent.click(selected);
    await waitFor(() => expect(canvas.queryByTestId("file-browser-details")).toBeNull());
  },
};

export const EmptyState = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <FileManagerWrapper>
      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h6"
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          File Manager - Empty State
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const ExpandedPDFContent = {
  loaders: [seedMockData],
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
  render: () => (
    <FileManagerWrapper>
      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h6"
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          File Manager - Expanded PDF Content
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pb: 1 }}
        >
          Click the expand icon (▼) next to a PDF file to view extracted
          vocabulary, questions, summaries, objectives, and concepts in
          organized tabs.
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const CollapsibleScrollableDetails = {
  ...ExpandedPDFContent,
  loaders: [
    async () => {
      await seedMockData();
      const { seedMockParsedContent } = await import("../../../../.storybook/__mocks__/aws-amplify-data");
      seedMockParsedContent([{
        id: "mock-parsed-content-1",
        documentID: MOCK_DOCUMENT_ID_1,
        fileID: MOCK_FILE_ID_PDF_1,
        vocabularyJSON: JSON.stringify(Array.from({ length: 60 }, (_, index) => ({
          word: `Biology term ${index + 1}`,
          definition: "A definition describing this structure and its role in the cell.",
        }))),
        summariesJSON: JSON.stringify(Array.from({ length: 30 }, (_, index) => ({
          title: `Chapter summary ${index + 1}`,
          content: "Plants convert light energy into chemical energy through photosynthesis. ".repeat(8),
        }))),
        objectivesJSON: JSON.stringify(mockParsedContentJapanese.objectivesJSON),
        conceptsJSON: JSON.stringify(mockParsedContentJapanese.conceptsJSON),
        questionsJSON: JSON.stringify(mockParsedContentJapanese.questionsJSON),
      }]);
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = await canvas.findByText("japanese-lesson-photosynthesis.pdf");
    await userEvent.click(file.closest("[draggable]"));
    const preview = await canvas.findByRole("button", { name: "File preview" });
    const metadata = canvas.getByRole("button", { name: "File Metadata" });
    const extracted = canvas.getByRole("button", { name: "Extracted Content" });
    await waitFor(() => {
      const pdf = canvasElement.querySelector('.react-pdf__Page canvas');
      expect(pdf).toBeTruthy();
      expect(pdf.width).toBeGreaterThan(0);
      expect(pdf.height).toBeGreaterThan(0);
    });
    expect(canvas.getByRole("link", { name: "Download" }))
      .toHaveAttribute("href", expect.stringContaining("japanese-grammar-guide.pdf"));
    for (const section of [preview, metadata, extracted]) {
      expect(section).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(section);
      expect(section).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(section);
      expect(section).toHaveAttribute("aria-expanded", "true");
    }
    await userEvent.click(canvas.getByRole("button", { name: "Edit file metadata" }));
    const name = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "A revised biology file");
    await userEvent.click(metadata);
    await userEvent.click(metadata);
    expect(name).toHaveValue("A revised biology file");

    await userEvent.click(await canvas.findByRole("tab", { name: "Summaries" }));
    const panel = await canvas.findByRole("tabpanel");
    await waitFor(() => expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight));
    panel.scrollTop = panel.scrollHeight;
    expect(panel.scrollTop).toBeGreaterThan(0);
    expect(within(panel).getByText("Chapter summary 30")).toBeVisible();
    expect(getComputedStyle(panel).overflowY).toBe("auto");

    await userEvent.click(canvas.getByRole("tab", { name: "Vocabulary" }));
    const term = await canvas.findByText("Biology term 1");
    const scrollArea = term.closest("li").parentElement.parentElement.parentElement;
    await waitFor(() => expect(scrollArea.scrollHeight).toBeGreaterThan(scrollArea.clientHeight));
    scrollArea.scrollTop = scrollArea.scrollHeight;
    await waitFor(() => expect(canvas.getByText("Biology term 60")).toBeInTheDocument());
  },
};

export const FilePreviews = {
  ...ExpandedPDFContent,
  loaders: [
    async () => {
      await seedMockData();
      const { seedMockFiles } = await import("../../../../.storybook/__mocks__/aws-amplify-data");
      seedMockFiles([
        {
          id: "preview-text",
          name: "preview-notes.txt",
          path: "/story-mocks/japanese-lesson-photosynthesis.txt",
          mimeType: "text/plain",
          size: 1024,
          level: "PROTECTED",
          owner: "mock-user-sub",
          identityId: "us-east-1:mock-identity-123",
        },
        {
          id: "preview-video",
          name: "preview-video.mp4",
          path: "/story-mocks/326739_medium.mp4",
          mimeType: "video/mp4",
          size: 1024,
          level: "PROTECTED",
          owner: "mock-user-sub",
          identityId: "us-east-1:mock-identity-123",
        },
        {
          id: "preview-unsupported",
          name: "preview-archive.zip",
          path: "/story-mocks/archive.zip",
          mimeType: "application/zip",
          size: 1024,
          level: "PROTECTED",
          owner: "mock-user-sub",
          identityId: "us-east-1:mock-identity-123",
        },
      ]);
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectFile = async (name) => {
      const file = await canvas.findByText(name);
      await userEvent.click(file.closest("[draggable]"));
    };

    await selectFile("cell-diagram.jpg");
    await waitFor(() => {
      const image = canvas.getByRole("img", { name: "cell-diagram.jpg" });
      expect(image.naturalWidth).toBeGreaterThan(0);
    });
    await selectFile("preview-notes.txt");
    const textPreview = await canvas.findByTitle("preview-notes.txt");
    expect(textPreview).toHaveAttribute("sandbox", "");
    expect(textPreview.getAttribute("src")).toContain("japanese-lesson-photosynthesis.txt");
    await selectFile("preview-video.mp4");
    await waitFor(() => expect(canvasElement.querySelector("video")?.readyState).toBeGreaterThan(0));
    await selectFile("preview-archive.zip");
    await canvas.findByText("Preview is not available for this file type. Download the file to view it.");
    expect(canvas.getByRole("link", { name: "Download" })).toBeVisible();
    expect(canvasElement.querySelector("iframe, object, video")).toBeNull();
  },
};

export const PdfThumbnailPreview = {
  ...ExpandedPDFContent,
  loaders: [
    async () => {
      await seedMockData();
      const { getMockData, seedMockFiles } = await import("../../../../.storybook/__mocks__/aws-amplify-data");
      const { MOCK_IMAGE_URL_1 } = await import("../../../../.storybook/__mocks__/media");
      const file = getMockData("File").find((file) => file.id === MOCK_FILE_ID_PDF_1);
      seedMockFiles([{ ...file, thumbnail: MOCK_IMAGE_URL_1 }]);
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = await canvas.findByText("japanese-lesson-photosynthesis.pdf");
    await userEvent.click(file.closest("[draggable]"));
    const previewButton = canvas.getByRole("button", { name: "File preview" });
    const preview = within(previewButton.closest(".MuiAccordion-root"));
    await waitFor(() => {
      const image = preview.getByRole("img", { name: "japanese-lesson-photosynthesis.pdf" });
      expect(image.naturalWidth).toBeGreaterThan(0);
    });
    expect(canvasElement.querySelector(".react-pdf__Page")).toBeNull();
    expect(canvas.getByRole("link", { name: "Download" }))
      .toHaveAttribute("href", expect.stringContaining("japanese-grammar-guide.pdf"));
  },
};
