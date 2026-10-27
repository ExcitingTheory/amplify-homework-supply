"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
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
import Alert from "@mui/material/Alert";
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
  documentAnalysisOpenAiRequestsPerMinute?: number | null;
  documentAnalysisOpenAiTokensPerMinute?: number | null;
  documentAnalysisOpenAiMaxConcurrentRequests?: number | null;
  documentAnalysisAnthropicRequestsPerMinute?: number | null;
  documentAnalysisAnthropicTokensPerMinute?: number | null;
  documentAnalysisAnthropicMaxConcurrentRequests?: number | null;
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
  error?: string | null;
  /** "platform" shows full controls, "section" shows override subset */
  mode: "platform" | "section";
}

export function AIAgentConfig({
  values,
  onChange,
  onSave,
  saving,
  error,
  mode,
}: AIAgentConfigProps) {
  const t = useTranslations("components");
  const update = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };
  const documentAnalysisLimitKeys = [
    "documentAnalysisOpenAiRequestsPerMinute",
    "documentAnalysisOpenAiTokensPerMinute",
    "documentAnalysisOpenAiMaxConcurrentRequests",
    "documentAnalysisAnthropicRequestsPerMinute",
    "documentAnalysisAnthropicTokensPerMinute",
    "documentAnalysisAnthropicMaxConcurrentRequests",
  ] as const;
  const hasInvalidDocumentAnalysisLimits =
    mode === "platform" &&
    documentAnalysisLimitKeys.some((key) => {
      const value = values[key];
      return (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value <= 0 ||
        (key.endsWith("MaxConcurrentRequests") && value > 100)
      );
    });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("aiAgentConfig.title")}
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Model Selection */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            {t("aiAgentConfig.modelSelection")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {mode === "platform" && (
              <FormControl fullWidth size="small">
                <InputLabel>{t("aiAgentConfig.defaultModel")}</InputLabel>
                <Select
                  label={t("aiAgentConfig.defaultModel")}
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
              <InputLabel>{t("aiAgentConfig.kaiModel")}</InputLabel>
              <Select
                label={t("aiAgentConfig.kaiModel")}
                value={values.kaiModel || ""}
                onChange={(e) => update("kaiModel", e.target.value || null)}
                displayEmpty
              >
                {AVAILABLE_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.label} ({m.tier})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t("aiAgentConfig.sageModel")}</InputLabel>
              <Select
                label={t("aiAgentConfig.sageModel")}
                value={values.sageModel || ""}
                onChange={(e) => update("sageModel", e.target.value || null)}
                displayEmpty
              >
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

      {mode === "platform" && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t("aiAgentConfig.documentAnalysisRateLimits")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t("aiAgentConfig.documentAnalysisRateLimitsDescription")}
              </Typography>
              {/* eslint-disable-next-line i18next/no-literal-string -- Provider trademarks are not translated. */}
              <Typography variant="subtitle2">OpenAI</Typography>
              <TextField
                label={t("aiAgentConfig.requestsPerMinuteLabel")}
                type="number"
                size="small"
                value={values.documentAnalysisOpenAiRequestsPerMinute ?? ""}
                onChange={(e) =>
                  update(
                    "documentAnalysisOpenAiRequestsPerMinute",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                helperText={t("aiAgentConfig.requestsPerMinuteHint")}
              />
              <TextField
                label={t("aiAgentConfig.tokensPerMinuteLabel")}
                type="number"
                size="small"
                value={values.documentAnalysisOpenAiTokensPerMinute ?? ""}
                onChange={(e) =>
                  update(
                    "documentAnalysisOpenAiTokensPerMinute",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 270000, step: 1 } }}
                helperText={t("aiAgentConfig.tokensPerMinuteHint")}
              />
              <TextField
                label={t("aiAgentConfig.maxConcurrentRequestsLabel")}
                type="number"
                size="small"
                value={
                  values.documentAnalysisOpenAiMaxConcurrentRequests ?? ""
                }
                onChange={(e) =>
                  update(
                    "documentAnalysisOpenAiMaxConcurrentRequests",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }}
                helperText={t("aiAgentConfig.maxConcurrentRequestsHint")}
              />
              {/* eslint-disable-next-line i18next/no-literal-string -- Provider trademarks are not translated. */}
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Anthropic
              </Typography>
              <TextField
                label={t("aiAgentConfig.requestsPerMinuteLabel")}
                type="number"
                size="small"
                value={values.documentAnalysisAnthropicRequestsPerMinute ?? ""}
                onChange={(e) =>
                  update(
                    "documentAnalysisAnthropicRequestsPerMinute",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                helperText={t("aiAgentConfig.requestsPerMinuteHint")}
              />
              <TextField
                label={t("aiAgentConfig.tokensPerMinuteLabel")}
                type="number"
                size="small"
                value={values.documentAnalysisAnthropicTokensPerMinute ?? ""}
                onChange={(e) =>
                  update(
                    "documentAnalysisAnthropicTokensPerMinute",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 270000, step: 1 } }}
                helperText={t("aiAgentConfig.tokensPerMinuteHint")}
              />
              <TextField
                label={t("aiAgentConfig.maxConcurrentRequestsLabel")}
                type="number"
                size="small"
                value={
                  values.documentAnalysisAnthropicMaxConcurrentRequests ?? ""
                }
                onChange={(e) =>
                  update(
                    "documentAnalysisAnthropicMaxConcurrentRequests",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }}
                helperText={t("aiAgentConfig.maxConcurrentRequestsHint")}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Behavior Tuning */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            {t("aiAgentConfig.behaviorTuning")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {t("aiAgentConfig.kaiTemperatureLabel")}{" "}
                {values.kaiTemperature ?? 0.7}
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
                {t("aiAgentConfig.sageTemperatureLabel")}{" "}
                {values.sageTemperature ?? 0.7}
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
              label={t("aiAgentConfig.kaiMaxTokensLabel")}
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
              label={t("aiAgentConfig.sageMaxTokensLabel")}
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
              label={t("aiAgentConfig.maxAgentStepsLabel")}
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
              helperText={t("aiAgentConfig.maxAgentStepsHint")}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Search Tuning */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            {t("aiAgentConfig.searchTuning")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {t("aiAgentConfig.similarityThresholdLabel")}{" "}
                {values.searchThreshold ?? 0.3}
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
                label={t("aiAgentConfig.defaultResultLimitLabel")}
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
          <Typography variant="subtitle1">
            {t("aiAgentConfig.conversationMemory")}
          </Typography>
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
              label={t("aiAgentConfig.enableConversationMemory")}
            />
            {mode === "platform" && (
              <FormControl fullWidth size="small">
                <InputLabel>
                  {t("aiAgentConfig.summarizationModelLabel")}
                </InputLabel>
                <Select
                  label={t("aiAgentConfig.summarizationModelLabel")}
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
          <Typography variant="subtitle1">
            {t("aiAgentConfig.tokenBudgets")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              {t("aiAgentConfig.tokenBudgetsDescription")}
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
              label={t("aiAgentConfig.enforceTokenBudget")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: -2 }}
            >
              {t("aiAgentConfig.enforceTokenBudgetNote")}
            </Typography>
            <TextField
              label={t("aiAgentConfig.systemPromptBudgetLabel")}
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
              helperText={t("aiAgentConfig.systemPromptBudgetHint")}
            />
            <TextField
              label={t("aiAgentConfig.toolResultBudgetLabel")}
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
              helperText={t("aiAgentConfig.toolResultBudgetHint")}
            />
            <TextField
              label={t("aiAgentConfig.totalTurnBudgetLabel")}
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
              helperText={t("aiAgentConfig.totalTurnBudgetHint")}
            />
            {mode === "platform" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>
                  {t("aiAgentConfig.perPersonaOverrides")}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={t("aiAgentConfig.kaiSystemPromptLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
                  />
                  <TextField
                    label={t("aiAgentConfig.sageSystemPromptLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={t("aiAgentConfig.kaiToolResultLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
                  />
                  <TextField
                    label={t("aiAgentConfig.sageToolResultLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={t("aiAgentConfig.kaiTotalTurnLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
                  />
                  <TextField
                    label={t("aiAgentConfig.sageTotalTurnLabel")}
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
                    placeholder={t("aiAgentConfig.useDefaultPlaceholder")}
                    helperText={t("aiAgentConfig.tokensUnit")}
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
            <Typography variant="subtitle1">
              {t("aiAgentConfig.personaToggles")}
            </Typography>
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
                label={t("aiAgentConfig.enableKai")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={values.sageEnabled ?? true}
                    onChange={(e) => update("sageEnabled", e.target.checked)}
                  />
                }
                label={t("aiAgentConfig.enableSage")}
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
              ? t("aiAgentConfig.sectionSpecificInstructions")
              : t("aiAgentConfig.promptOverrides")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label={
                mode === "section"
                  ? t("aiAgentConfig.kaiInstructionsAppend")
                  : t("aiAgentConfig.kaiSystemPromptOverride")
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
                  ? t("aiAgentConfig.sageInstructionsAppend")
                  : t("aiAgentConfig.sageSystemPromptOverride")
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
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || hasInvalidDocumentAnalysisLimits}
        >
          {saving ? t("aiAgentConfig.saving") : t("aiAgentConfig.saveChanges")}
        </Button>
      </Box>
    </Box>
  );
}
