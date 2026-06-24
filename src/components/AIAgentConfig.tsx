"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const AVAILABLE_MODELS = [
  { id: "gpt-4o", label: "GPT-4o", tier: "premium" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", tier: "standard" },
  { id: "gpt-4.1", label: "GPT-4.1", tier: "premium" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", tier: "standard" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", tier: "budget" },
];

export interface AIAgentConfigValues {
  // Model selection
  defaultAIModel?: string;
  kaiModel?: string;
  sageModel?: string;
  // Behavior
  kaiTemperature?: number | null;
  sageTemperature?: number | null;
  kaiMaxTokens?: number | null;
  sageMaxTokens?: number | null;
  agentMaxSteps?: number | null;
  kaiMaxSteps?: number | null;
  sageMaxSteps?: number | null;
  // Search
  searchThreshold?: number | null;
  searchDefaultLimit?: number | null;
  // Memory
  memoryEnabled?: boolean;
  memorySummarizationModel?: string;
  // Persona toggles
  kaiEnabled?: boolean;
  sageEnabled?: boolean;
  // Prompt overrides
  kaiSystemPromptOverride?: string;
  sageSystemPromptOverride?: string;
  // Token budgets
  systemPromptBudget?: number | null;
  toolResultBudget?: number | null;
  totalTurnBudget?: number | null;
  kaiSystemPromptBudget?: number | null;
  sageSystemPromptBudget?: number | null;
  kaiToolResultBudget?: number | null;
  sageToolResultBudget?: number | null;
  kaiTotalTurnBudget?: number | null;
  sageTotalTurnBudget?: number | null;
  // Enforcement toggle
  enforceTokenBudget?: boolean;
}

export interface SectionAIConfigValues {
  kaiModel?: string;
  sageModel?: string;
  kaiTemperature?: number | null;
  sageTemperature?: number | null;
  kaiMaxTokens?: number | null;
  sageMaxTokens?: number | null;
  kaiMaxSteps?: number | null;
  sageMaxSteps?: number | null;
  searchThreshold?: number | null;
  memoryEnabled?: boolean;
  kaiSystemPromptAppend?: string;
  sageSystemPromptAppend?: string;
  // Token budgets (section-level overrides)
  systemPromptBudget?: number | null;
  toolResultBudget?: number | null;
  totalTurnBudget?: number | null;
  // Enforcement toggle (section-level override)
  enforceTokenBudget?: boolean;
}

interface AIAgentConfigProps {
  /** Current config values */
  values: AIAgentConfigValues;
  /** Called with updated values on change */
  onChange: (values: AIAgentConfigValues) => void;
  /** Called when save is triggered */
  onSave: () => void;
  /** Whether save is in progress */
  saving?: boolean;
  /** "platform" shows full controls, "section" shows override subset */
  mode: "platform" | "section";
}

export function AIAgentConfig({
  values,
  onChange,
  onSave,
  saving,
  mode,
}: AIAgentConfigProps) {
  const update = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        AI Agent Configuration
      </Typography>

      {/* Model Selection */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Model Selection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {mode === "platform" && (
              <FormControl fullWidth size="small">
                <InputLabel>Default Model</InputLabel>
                <Select
                  label="Default Model"
                  value={values.defaultAIModel || "gpt-4o"}
                  onChange={(e) => update("defaultAIModel", e.target.value)}
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.label} ({m.tier})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Kai Model</InputLabel>
              <Select
                label="Kai Model"
                value={values.kaiModel || ""}
                onChange={(e) => update("kaiModel", e.target.value || null)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>
                    {mode === "section"
                      ? "Use platform default"
                      : "Use default model"}
                  </em>
                </MenuItem>
                {AVAILABLE_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.label} ({m.tier})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Sage Model</InputLabel>
              <Select
                label="Sage Model"
                value={values.sageModel || ""}
                onChange={(e) => update("sageModel", e.target.value || null)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>
                    {mode === "section"
                      ? "Use platform default"
                      : "Use default model"}
                  </em>
                </MenuItem>
                {AVAILABLE_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.label} ({m.tier})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Behavior Tuning */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Behavior Tuning</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Kai Temperature: {values.kaiTemperature ?? 0.7}
              </Typography>
              <Slider
                value={values.kaiTemperature ?? 0.7}
                onChange={(_, v) => update("kaiTemperature", v as number)}
                min={0}
                max={1.5}
                step={0.1}
                marks={[
                  { value: 0, label: "0" },
                  { value: 0.7, label: "0.7" },
                  { value: 1.5, label: "1.5" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                Sage Temperature: {values.sageTemperature ?? 0.7}
              </Typography>
              <Slider
                value={values.sageTemperature ?? 0.7}
                onChange={(_, v) => update("sageTemperature", v as number)}
                min={0}
                max={1.5}
                step={0.1}
                marks={[
                  { value: 0, label: "0" },
                  { value: 0.7, label: "0.7" },
                  { value: 1.5, label: "1.5" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            <TextField
              label="Kai Max Tokens"
              type="number"
              size="small"
              value={values.kaiMaxTokens ?? 2000}
              onChange={(e) =>
                update(
                  "kaiMaxTokens",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 100, max: 8000 } }}
            />
            <TextField
              label="Sage Max Tokens"
              type="number"
              size="small"
              value={values.sageMaxTokens ?? 4000}
              onChange={(e) =>
                update(
                  "sageMaxTokens",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 100, max: 8000 } }}
            />
            <TextField
              label="Max Agent Steps"
              type="number"
              size="small"
              value={values.agentMaxSteps ?? 5}
              onChange={(e) =>
                update(
                  "agentMaxSteps",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 1, max: 10 } }}
              helperText="Maximum tool-calling rounds per conversation turn"
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Search Tuning */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Search Tuning</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Similarity Threshold: {values.searchThreshold ?? 0.3}
              </Typography>
              <Slider
                value={values.searchThreshold ?? 0.3}
                onChange={(_, v) => update("searchThreshold", v as number)}
                min={0.1}
                max={0.9}
                step={0.05}
                marks={[
                  { value: 0.1, label: "0.1" },
                  { value: 0.3, label: "0.3" },
                  { value: 0.9, label: "0.9" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            {mode === "platform" && (
              <TextField
                label="Default Result Limit"
                type="number"
                size="small"
                value={values.searchDefaultLimit ?? 5}
                onChange={(e) =>
                  update(
                    "searchDefaultLimit",
                    e.target.value ? parseInt(e.target.value, 10) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 1, max: 20 } }}
              />
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Memory */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Conversation Memory</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.memoryEnabled ?? true}
                  onChange={(e) => update("memoryEnabled", e.target.checked)}
                />
              }
              label="Enable conversation memory"
            />
            {mode === "platform" && (
              <FormControl fullWidth size="small">
                <InputLabel>Summarization Model</InputLabel>
                <Select
                  label="Summarization Model"
                  value={values.memorySummarizationModel || "gpt-4o-mini"}
                  onChange={(e) =>
                    update("memorySummarizationModel", e.target.value)
                  }
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Token Budgets */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Token Budgets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Control how many tokens are allocated to each part of an agent
              turn. Lower budgets reduce cost; higher budgets allow richer
              context.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={values.enforceTokenBudget ?? true}
                  onChange={(e) =>
                    update("enforceTokenBudget", e.target.checked)
                  }
                />
              }
              label="Enforce token budgets"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
              When enabled, the agent will truncate system prompts and tool
              results to their budget limits, and abort multi-step turns that
              exceed the total turn budget.
            </Typography>
            <TextField
              label="System Prompt Budget"
              type="number"
              size="small"
              value={values.systemPromptBudget ?? 2000}
              onChange={(e) =>
                update(
                  "systemPromptBudget",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 500, max: 8000 } }}
              helperText="Max tokens for Tier 1 context in system prompt (default: 2000)"
            />
            <TextField
              label="Tool Result Budget"
              type="number"
              size="small"
              value={values.toolResultBudget ?? 4000}
              onChange={(e) =>
                update(
                  "toolResultBudget",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 500, max: 16000 } }}
              helperText="Max tokens per tool result returned to model (default: 4000)"
            />
            <TextField
              label="Total Turn Budget"
              type="number"
              size="small"
              value={values.totalTurnBudget ?? 16000}
              onChange={(e) =>
                update(
                  "totalTurnBudget",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
              slotProps={{ htmlInput: { min: 2000, max: 64000 } }}
              helperText="Max total tokens consumed per agent turn across all steps (default: 16000)"
            />
            {mode === "platform" && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ mt: 1, fontWeight: 600 }}
                >
                  Per-Persona Overrides
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Kai System Prompt"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.kaiSystemPromptBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "kaiSystemPromptBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 500, max: 8000 } }}
                    placeholder="Use default"
                  />
                  <TextField
                    label="Sage System Prompt"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.sageSystemPromptBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "sageSystemPromptBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 500, max: 8000 } }}
                    placeholder="Use default"
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Kai Tool Result"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.kaiToolResultBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "kaiToolResultBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 500, max: 16000 } }}
                    placeholder="Use default"
                  />
                  <TextField
                    label="Sage Tool Result"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.sageToolResultBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "sageToolResultBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 500, max: 16000 } }}
                    placeholder="Use default"
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Kai Total Turn"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.kaiTotalTurnBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "kaiTotalTurnBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 2000, max: 64000 } }}
                    placeholder="Use default"
                  />
                  <TextField
                    label="Sage Total Turn"
                    type="number"
                    size="small"
                    fullWidth
                    value={values.sageTotalTurnBudget ?? ""}
                    onChange={(e) =>
                      update(
                        "sageTotalTurnBudget",
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    slotProps={{ htmlInput: { min: 2000, max: 64000 } }}
                    placeholder="Use default"
                  />
                </Stack>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Persona Toggles (platform only) */}
      {mode === "platform" && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Persona Toggles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.kaiEnabled ?? true}
                    onChange={(e) => update("kaiEnabled", e.target.checked)}
                  />
                }
                label="Enable Kai (student tutor bot)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={values.sageEnabled ?? true}
                    onChange={(e) => update("sageEnabled", e.target.checked)}
                  />
                }
                label="Enable Sage (instructor assistant bot)"
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Prompt Overrides */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            {mode === "section"
              ? "Section-Specific Instructions"
              : "Prompt Overrides"}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label={
                mode === "section"
                  ? "Kai instructions (appended to system prompt)"
                  : "Kai System Prompt Override"
              }
              multiline
              minRows={3}
              maxRows={8}
              size="small"
              value={
                (mode === "section"
                  ? (values as any).kaiSystemPromptAppend
                  : values.kaiSystemPromptOverride) || ""
              }
              onChange={(e) =>
                update(
                  mode === "section"
                    ? "kaiSystemPromptAppend"
                    : "kaiSystemPromptOverride",
                  e.target.value || null,
                )
              }
            />
            <TextField
              label={
                mode === "section"
                  ? "Sage instructions (appended to system prompt)"
                  : "Sage System Prompt Override"
              }
              multiline
              minRows={3}
              maxRows={8}
              size="small"
              value={
                (mode === "section"
                  ? (values as any).sageSystemPromptAppend
                  : values.sageSystemPromptOverride) || ""
              }
              onChange={(e) =>
                update(
                  mode === "section"
                    ? "sageSystemPromptAppend"
                    : "sageSystemPromptOverride",
                  e.target.value || null,
                )
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}
