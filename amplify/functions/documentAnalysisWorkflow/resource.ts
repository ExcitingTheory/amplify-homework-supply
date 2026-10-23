import { defineFunction, secret } from "@aws-amplify/backend";

export const documentAnalysisWorkflowHandler = defineFunction({
  timeoutSeconds: 900,
  memoryMB: 1536,
  resourceGroupName: "data",
  environment: {
    OPENAI_API_KEY: secret("OPENAI_API_KEY"),
    PHOENIX_COLLECTOR_ENDPOINT: secret("PHOENIX_COLLECTOR_ENDPOINT"),
    ANTHROPIC_API_KEY_PARAMETER:
      process.env.ANTHROPIC_API_KEY_PARAMETER || "",
    ANTHROPIC_API_KEY_KMS_KEY_ARN:
      process.env.ANTHROPIC_API_KEY_KMS_KEY_ARN || "",
    VERIFIER_ANTHROPIC_MODEL:
      process.env.VERIFIER_ANTHROPIC_MODEL || "claude-sonnet-5-5",
  },
});
