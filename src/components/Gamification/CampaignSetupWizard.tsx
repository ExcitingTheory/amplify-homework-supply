"use client";
/**
 * CampaignSetupWizard — 3-step dialog for instructors creating a new
 * campaign narrative when setting up a new section.
 *
 * Step 1: Confirm opt-in ("Would you like to add a campaign narrative?")
 * Step 2: Configure title, target XP, chapter order; optional AI generation
 * Step 3: Preview and create the GroupChallenge record
 *
 * @module CampaignSetupWizard
 */

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { generateClient } from "aws-amplify/data";
import { CampaignBriefing } from "./CampaignBriefing";

const client = generateClient();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CampaignSetupWizardProps {
  open: boolean;
  /** The section (cohort) to create the challenge for */
  sectionId: string;
  sectionName: string;
  /** Names of units assigned to this section — used for AI context */
  assignedUnitNames?: string[];
  onClose: () => void;
  /** Called after the GroupChallenge is successfully created */
  onCreated?: (challengeId: string) => void;
}

interface WizardConfig {
  title: string;
  setting: string;
  targetXP: number;
  chapterOrder: number;
}

const STEPS = ["Get Started", "Configure", "Preview & Create"];
const DEFAULT_TARGET_XP = 500;

// ─── AI generation helper ────────────────────────────────────────────────────

async function generateNarrative(
  sectionName: string,
  unitNames: string[],
): Promise<{ title: string; setting: string }> {
  const unitList =
    unitNames.length > 0
      ? unitNames.map((n, i) => `${i + 1}. ${n}`).join("\n")
      : "(no units yet)";

  const prompt = `You are helping an instructor create an engaging campaign narrative for an e-learning section.

Section name: "${sectionName}"
Assigned units:
${unitList}

Generate a short campaign narrative with:
1. A catchy campaign chapter title (max 8 words)
2. A setting / world description (2-3 sentences, educational but exciting)

Respond in JSON format:
{
  "title": "...",
  "setting": "..."
}`;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt, id: "wizard-gen" }],
    }),
  });

  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

  // The chat route streams text — collect it all
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  let raw = "";
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
  }

  // Extract JSON from the streamed output (may contain data: prefixes from AI SDK)
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CampaignSetupWizard({
  open,
  sectionId,
  sectionName,
  assignedUnitNames = [],
  onClose,
  onCreated,
}: CampaignSetupWizardProps) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [config, setConfig] = React.useState<WizardConfig>({
    title: "",
    setting: "",
    targetXP: DEFAULT_TARGET_XP,
    chapterOrder: 1,
  });
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setActiveStep(0);
      setConfig({ title: "", setting: "", targetXP: DEFAULT_TARGET_XP, chapterOrder: 1 });
      setAiError(null);
      setSaveError(null);
    }
  }, [open]);

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleDecline() {
    onClose();
  }

  async function handleAiSuggest() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateNarrative(sectionName, assignedUnitNames);
      setConfig((prev) => ({
        ...prev,
        title: result.title || prev.title,
        setting: result.setting || prev.setting,
      }));
    } catch {
      setAiError("AI generation failed. You can fill in the details manually.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreate() {
    if (!config.title.trim() || config.targetXP <= 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data, errors } = await (client.models as any).GroupChallenge.create({
        cohortId: sectionId,
        title: config.title.trim(),
        setting: config.setting.trim() || undefined,
        targetXP: config.targetXP,
        chapterOrder: config.chapterOrder,
        active: true,
      });
      if (errors?.length) throw new Error(errors[0]?.message || "Create failed");
      onCreated?.(data.id);
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to create campaign chapter.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isStep2Valid = config.title.trim().length > 0 && config.targetXP > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="campaign-wizard-title"
    >
      <DialogTitle id="campaign-wizard-title">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoStoriesIcon color="primary" />
          <Typography variant="h6" component="span" fontWeight={700}>
            Campaign Narrative Setup
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0 — Confirm */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Would you like to add a <strong>campaign narrative</strong> to{" "}
              <strong>{sectionName}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              A campaign narrative wraps your assignments in an engaging story.
              Students unlock chapters as they complete work and earn XP.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can skip this now and add it later from the section settings.
            </Typography>
          </Box>
        )}

        {/* Step 1 — Configure */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={
                aiLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <AutoAwesomeIcon />
                )
              }
              onClick={handleAiSuggest}
              disabled={aiLoading}
              sx={{ alignSelf: "flex-start", textTransform: "none" }}
            >
              {aiLoading ? "Generating…" : "AI Suggest narrative"}
            </Button>
            {aiError && (
              <Typography variant="caption" color="error">
                {aiError}
              </Typography>
            )}
            <TextField
              label="Chapter title"
              value={config.title}
              onChange={(e) =>
                setConfig((p) => ({ ...p, title: e.target.value }))
              }
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
              helperText='e.g. "Chapter 1: The Ancient Texts"'
            />
            <TextField
              label="Setting / story context"
              value={config.setting}
              onChange={(e) =>
                setConfig((p) => ({ ...p, setting: e.target.value }))
              }
              multiline
              rows={3}
              fullWidth
              helperText="2-3 sentences describing the narrative world. Students see this."
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Target XP"
                type="number"
                value={config.targetXP}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    targetXP: Math.max(1, parseInt(e.target.value, 10) || 0),
                  }))
                }
                required
                sx={{ flex: 1 }}
                inputProps={{ min: 1, step: 50 }}
                helperText="XP students must earn to complete this chapter"
              />
              <TextField
                label="Chapter order"
                type="number"
                value={config.chapterOrder}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    chapterOrder: Math.max(
                      1,
                      parseInt(e.target.value, 10) || 1,
                    ),
                  }))
                }
                sx={{ width: 130 }}
                inputProps={{ min: 1, step: 1 }}
              />
            </Box>
          </Box>
        )}

        {/* Step 2 — Preview */}
        {activeStep === 2 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              This is how students will see the campaign briefing:
            </Typography>
            <CampaignBriefing
              title={config.title}
              setting={config.setting || undefined}
            />
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "action.hover",
                borderRadius: 1,
                display: "flex",
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Target XP
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {config.targetXP.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Chapter
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {config.chapterOrder}
                </Typography>
              </Box>
            </Box>
            {saveError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {saveError}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep === 0 && (
          <>
            <Button onClick={handleDecline} color="inherit">
              Skip for now
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              startIcon={<AutoStoriesIcon />}
            >
              Add narrative
            </Button>
          </>
        )}
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} color="inherit">
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!isStep2Valid}
            >
              Preview
            </Button>
          </>
        )}
        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)} color="inherit" disabled={saving}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {saving ? "Creating…" : "Create chapter"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default CampaignSetupWizard;
