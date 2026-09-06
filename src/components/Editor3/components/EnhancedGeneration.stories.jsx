import React, { useState } from "react";
import { fn } from "storybook/test";
import { Box, Typography, Button } from "@mui/material";
import UnifiedGenerateModal from "./UnifiedGenerateModal";
import ImageMaskEditor from "./ImageMaskEditor";
import {
  EnhancedImageGenerator,
  EnhancedAudioGenerator,
} from "./EnhancedGenerators";
import {
  MOCK_AUDIO_URL_1,
  MOCK_IMAGE_URL_1,
} from "../../../../.storybook/__mocks__/media";

export default {
  title: "💬 AI Assistant/Content Generation",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Unified generation workflow with preview and mask editing capabilities.",
      },
    },
  },
};

// Mock image generation
const mockGenerateImage = fn(async (prompt) => {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay

  const mockImageUrl = MOCK_IMAGE_URL_1;

  return {
    url: mockImageUrl,
    preview: (
      <img
        src={mockImageUrl}
        alt="Generated"
        style={{ width: "100%", maxHeight: "600px", objectFit: "contain" }}
      />
    ),
  };
});

// Mock audio generation
const mockGenerateAudio = fn(async (prompt) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Create a simple audio element (in real app, would be generated audio)
  return {
    preview: (
      <Box>
        <Typography variant="caption" gutterBottom>
          Generated from: "{prompt}"
        </Typography>
        <audio controls style={{ width: "100%" }}>
          <source src={MOCK_AUDIO_URL_1} type="audio/mpeg" />
        </audio>
      </Box>
    ),
  };
});

export const UnifiedImageGeneration = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Image Generator
      </Button>

      <UnifiedGenerateModal
        open={open}
        onClose={() => setOpen(false)}
        onGenerate={mockGenerateImage}
        onRegenerate={mockGenerateImage}
        title="Generate Image"
        inputPlaceholder="Describe the image you want to generate..."
        type="image"
      />
    </Box>
  );
};
UnifiedImageGeneration.parameters = {
  docs: {
    description: {
      story:
        "Unified modal workflow for image generation. Shows input, loading, and preview states in one modal.",
    },
  },
};

export const UnifiedAudioGeneration = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Audio Generator
      </Button>

      <UnifiedGenerateModal
        open={open}
        onClose={() => setOpen(false)}
        onGenerate={mockGenerateAudio}
        onRegenerate={mockGenerateAudio}
        title="Generate Audio"
        inputPlaceholder="Enter text to convert to speech..."
        type="audio"
      />
    </Box>
  );
};
UnifiedAudioGeneration.parameters = {
  docs: {
    description: {
      story: "Audio generation with TTS. Same unified workflow as images.",
    },
  },
};

export const ImageMaskEditorDemo = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [maskData, setMaskData] = useState(null);

  const handleMaskComplete = (data) => {
    setMaskData(data);
    setShowEditor(false);
    console.log("Mask data:", data);
  };

  const sampleImage = MOCK_IMAGE_URL_1;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Typography variant="h5" gutterBottom>
        Image Mask Editor Demo
      </Typography>
      <Typography paragraph>
        Paint over areas you want to regenerate. The red mask indicates areas
        that will be changed.
      </Typography>

      {!showEditor ? (
        <Box>
          <img
            src={sampleImage}
            alt="Sample"
            style={{
              width: "100%",
              maxHeight: 400,
              objectFit: "contain",
              marginBottom: 16,
            }}
          />
          <Button variant="contained" onClick={() => setShowEditor(true)}>
            Edit with Mask
          </Button>

          {maskData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mask Data Available
              </Typography>
              <Typography variant="caption">
                The mask has been created and can be sent to the API for
                targeted regeneration.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ height: "80vh", width: "100%", maxWidth: 800 }}>
          <ImageMaskEditor
            imageUrl={sampleImage}
            onMaskComplete={handleMaskComplete}
            onCancel={() => setShowEditor(false)}
            width={760}
            height={500}
          />
        </Box>
      )}
    </Box>
  );
};
ImageMaskEditorDemo.parameters = {
  docs: {
    description: {
      story:
        "Interactive image mask editor. Paint areas to regenerate, use eraser to refine, zoom for detail.",
    },
  },
};

export const CompleteWorkflow = () => {
  const [step, setStep] = useState("generate");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showMaskEditor, setShowMaskEditor] = useState(false);

  const handleGenerate = async (prompt) => {
    const result = await mockGenerateImage(prompt);
    setGeneratedImage(result);
    setStep("preview");
    return {
      ...result,
      preview: (
        <Box>
          {result.preview}
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setShowMaskEditor(true)}
          >
            Edit with Mask (Regenerate Part)
          </Button>
        </Box>
      ),
    };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Typography variant="h4" gutterBottom>
        Complete Generation Workflow
      </Typography>

      {showMaskEditor && generatedImage ? (
        <Box sx={{ height: "80vh" }}>
          <ImageMaskEditor
            imageUrl={generatedImage.url}
            onMaskComplete={(maskData) => {
              console.log("Regenerating with mask:", maskData);
              setShowMaskEditor(false);
              alert("Would regenerate with mask data here");
            }}
            onCancel={() => setShowMaskEditor(false)}
          />
        </Box>
      ) : (
        <Box>
          <Button variant="contained" onClick={() => setStep("generate")}>
            Start Generation
          </Button>

          {step === "generate" && (
            <UnifiedGenerateModal
              open={true}
              onClose={() => setStep("closed")}
              onGenerate={handleGenerate}
              onRegenerate={handleGenerate}
              title="Generate Image"
              inputPlaceholder="Describe what you want to create..."
              type="image"
            />
          )}
        </Box>
      )}
    </Box>
  );
};
CompleteWorkflow.parameters = {
  docs: {
    description: {
      story:
        "Complete workflow: Generate → Preview → Mask Edit → Regenerate. Demonstrates how all components work together.",
    },
  },
};

export const FeatureDocumentation = () => (
  <Box sx={{ p: 3, maxWidth: 1000 }}>
    <Typography variant="h3" gutterBottom>
      Enhanced Generation Features
    </Typography>

    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
      🎨 UnifiedGenerateModal
    </Typography>
    <Typography paragraph>
      A single modal that handles the entire generation workflow:
    </Typography>
    <ul>
      <li>
        <strong>Input Mode:</strong> Enter description/prompt
      </li>
      <li>
        <strong>Generating Mode:</strong> Shows loading indicator
      </li>
      <li>
        <strong>Preview Mode:</strong> Display generated content with prompt
        shown
      </li>
      <li>
        <strong>Cancel Confirmation:</strong> Confirms before discarding work
      </li>
      <li>
        <strong>Edit & Regenerate:</strong> Modify and regenerate from preview
      </li>
    </ul>

    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
      ✂️ ImageMaskEditor
    </Typography>
    <Typography paragraph>
      Select specific areas of images to regenerate:
    </Typography>
    <ul>
      <li>
        <strong>Brush Tool:</strong> Paint red mask over areas to change
      </li>
      <li>
        <strong>Eraser Tool:</strong> Remove parts of the mask
      </li>
      <li>
        <strong>Adjustable Brush Size:</strong> Slider from 5-100px
      </li>
      <li>
        <strong>Undo/Redo:</strong> Full history support
      </li>
      <li>
        <strong>Zoom & Pan:</strong> Zoom buttons and Shift+drag to pan
      </li>
      <li>
        <strong>Clear Mask:</strong> Start over with one click
      </li>
    </ul>

    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
      🔄 Integrated Workflow
    </Typography>
    <Typography paragraph>How components work together:</Typography>
    <ol>
      <li>User opens UnifiedGenerateModal</li>
      <li>Enters prompt and clicks Generate</li>
      <li>Modal shows loading state</li>
      <li>Generated content appears in preview</li>
      <li>User can regenerate entirely or click "Edit with Mask"</li>
      <li>ImageMaskEditor opens for precise selection</li>
      <li>User paints mask over areas to change</li>
      <li>Clicks "Apply Mask & Regenerate"</li>
      <li>API receives mask data for targeted regeneration</li>
      <li>New image generated with only masked areas changed</li>
    </ol>

    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
      💡 Benefits
    </Typography>
    <ul>
      <li>Single modal reduces UI complexity</li>
      <li>Seamless transitions between states</li>
      <li>Cancel confirmation prevents accidental data loss</li>
      <li>Mask editing enables precise regeneration</li>
      <li>Saves API costs by regenerating only what needs to change</li>
      <li>Better UX with preview and edit in same flow</li>
    </ul>

    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
      🎯 Use Cases
    </Typography>
    <ul>
      <li>Generating educational images for lessons</li>
      <li>Creating custom illustrations</li>
      <li>Iterating on designs with targeted changes</li>
      <li>Fixing specific parts of generated images</li>
      <li>Creating audio for language learning</li>
      <li>Generating speech in multiple voices</li>
    </ul>
  </Box>
);
FeatureDocumentation.parameters = {
  docs: {
    description: {
      story:
        "Complete documentation of enhanced generation features and workflows.",
    },
  },
};
import { expect, userEvent, within } from "storybook/test";

UnifiedImageGeneration.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // Button to open generator is present and clickable
  const openBtn = await canvas.findByRole("button", {
    name: /Open Image Generator/i,
  });
  expect(openBtn).not.toBeDisabled();
  await userEvent.click(openBtn);
  // After clicking, the modal should open — look in document.body for MUI Dialog portal
  const body = within(canvasElement.ownerDocument.body);
  await body.findByText(/Generate Image/i);
};

UnifiedAudioGeneration.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const openBtn = await canvas.findByRole("button", {
    name: /Open Audio Generator/i,
  });
  expect(openBtn).not.toBeDisabled();
  await userEvent.click(openBtn);
  const body = within(canvasElement.ownerDocument.body);
  await body.findByText(/Generate Audio/i);
};

ImageMaskEditorDemo.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // Image renders before editor is opened
  const img = await canvas.findByRole("img", { name: /Sample/i });
  expect(img).not.toBeNull();
  // Edit with Mask button opens the canvas editor
  const editBtn = await canvas.findByRole("button", {
    name: /Edit with Mask/i,
  });
  await userEvent.click(editBtn);
  // Canvas element should now be in the DOM
  const maskCanvas = canvasElement.querySelector("canvas");
  expect(maskCanvas).not.toBeNull();
};

CompleteWorkflow.play = async ({ canvasElement }) => {
  // Component renders the workflow UI without crashing
  expect(canvasElement.innerHTML.length).toBeGreaterThan(100);
  // At least one button exists in the workflow
  const btns = canvasElement.querySelectorAll("button");
  expect(btns.length).toBeGreaterThan(0);
};

FeatureDocumentation.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // All feature sections render — verify heading text
  await canvas.findByText(/Enhanced Generation Features/i);
  // Benefit/use-case sections render
  expect(canvasElement.textContent).toMatch(/Mask/i);
  expect(canvasElement.textContent).toMatch(/Workflow/i);
};
