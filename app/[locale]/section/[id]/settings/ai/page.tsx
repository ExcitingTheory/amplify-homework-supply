"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { AIAgentConfig, type SectionAIConfigValues } from "@/components/AIAgentConfig";

export default function SectionAISettingsPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const client = React.useMemo(() => getAmplifyClient(), []);

  const [section, setSection] = React.useState<any>(null);
  const [values, setValues] = React.useState<SectionAIConfigValues>({});
  const [saving, setSaving] = React.useState(false);

  // Load section + hydrate aiConfig
  React.useEffect(() => {
    if (!sectionId || !client?.models?.Section) return;

    const sub = client.models.Section.observeQuery({
      filter: { id: { eq: sectionId } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const s = items?.find((i: any) => i?.id === sectionId);
        if (!s) return;
        setSection(s);

        const ai =
          s.aiConfig && typeof s.aiConfig === "string"
            ? JSON.parse(s.aiConfig)
            : s.aiConfig || {};
        setValues({
          kaiModel: ai.kaiModel || "",
          sageModel: ai.sageModel || "",
          kaiTemperature: ai.kaiTemperature ?? null,
          sageTemperature: ai.sageTemperature ?? null,
          kaiMaxTokens: ai.kaiMaxTokens ?? null,
          sageMaxTokens: ai.sageMaxTokens ?? null,
          kaiMaxSteps: ai.kaiMaxSteps ?? null,
          sageMaxSteps: ai.sageMaxSteps ?? null,
          searchThreshold: ai.searchThreshold ?? null,
          memoryEnabled: ai.memoryEnabled ?? true,
          kaiSystemPromptAppend: ai.kaiSystemPromptAppend || "",
          sageSystemPromptAppend: ai.sageSystemPromptAppend || "",
          systemPromptBudget: ai.systemPromptBudget ?? null,
          toolResultBudget: ai.toolResultBudget ?? null,
          totalTurnBudget: ai.totalTurnBudget ?? null,
        });
      },
      error: (err: any) =>
        console.warn("[SectionAISettings] subscription error:", err),
    });

    return () => sub.unsubscribe();
  }, [sectionId, client]);

  const handleSave = React.useCallback(async () => {
    if (!section?.id || !client?.models?.Section) return;
    setSaving(true);
    try {
      // Build clean aiConfig JSON — omit empty/null values
      const aiConfig: Record<string, any> = {};
      if (values.kaiModel) aiConfig.kaiModel = values.kaiModel;
      if (values.sageModel) aiConfig.sageModel = values.sageModel;
      if (values.kaiTemperature != null)
        aiConfig.kaiTemperature = values.kaiTemperature;
      if (values.sageTemperature != null)
        aiConfig.sageTemperature = values.sageTemperature;
      if (values.kaiMaxTokens != null)
        aiConfig.kaiMaxTokens = values.kaiMaxTokens;
      if (values.sageMaxTokens != null)
        aiConfig.sageMaxTokens = values.sageMaxTokens;
      if (values.kaiMaxSteps != null)
        aiConfig.kaiMaxSteps = values.kaiMaxSteps;
      if (values.sageMaxSteps != null)
        aiConfig.sageMaxSteps = values.sageMaxSteps;
      if (values.searchThreshold != null)
        aiConfig.searchThreshold = values.searchThreshold;
      if (values.memoryEnabled != null)
        aiConfig.memoryEnabled = values.memoryEnabled;
      if (values.kaiSystemPromptAppend)
        aiConfig.kaiSystemPromptAppend = values.kaiSystemPromptAppend;
      if (values.sageSystemPromptAppend)
        aiConfig.sageSystemPromptAppend = values.sageSystemPromptAppend;
      if (values.systemPromptBudget != null)
        aiConfig.systemPromptBudget = values.systemPromptBudget;
      if (values.toolResultBudget != null)
        aiConfig.toolResultBudget = values.toolResultBudget;
      if (values.totalTurnBudget != null)
        aiConfig.totalTurnBudget = values.totalTurnBudget;

      await client.models.Section.update({
        id: section.id,
        _version: section._version,
        aiConfig: JSON.stringify(aiConfig),
      });
    } catch (err) {
      console.error("[SectionAISettings] Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [section, client, values]);

  return (
    <Box sx={{ maxWidth: "60rem", margin: "2rem auto", padding: "0 1rem" }}>
      <Typography variant="h5" gutterBottom>
        Section AI Settings
      </Typography>
      {section ? (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {section.name} — Override platform AI defaults for this section
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Loading section...
        </Typography>
      )}

      {section && (
        <AIAgentConfig
          values={values as any}
          onChange={setValues as any}
          onSave={handleSave}
          saving={saving}
          mode="section"
        />
      )}
    </Box>
  );
}
