/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SwitchField,
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { Settings } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function SettingsCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    owner: "",
    identityId: "",
    autoAnalyzeDocuments: false,
    documentAnalysisModel: "",
    editorTheme: "",
    editorFontSize: "",
    defaultAIModel: "",
    assistantVoice: "",
    emailNotifications: false,
    webhookNotifications: false,
    language: "",
    timezone: "",
    metadata: "",
    updatedAt: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [autoAnalyzeDocuments, setAutoAnalyzeDocuments] = React.useState(
    initialValues.autoAnalyzeDocuments
  );
  const [documentAnalysisModel, setDocumentAnalysisModel] = React.useState(
    initialValues.documentAnalysisModel
  );
  const [editorTheme, setEditorTheme] = React.useState(
    initialValues.editorTheme
  );
  const [editorFontSize, setEditorFontSize] = React.useState(
    initialValues.editorFontSize
  );
  const [defaultAIModel, setDefaultAIModel] = React.useState(
    initialValues.defaultAIModel
  );
  const [assistantVoice, setAssistantVoice] = React.useState(
    initialValues.assistantVoice
  );
  const [emailNotifications, setEmailNotifications] = React.useState(
    initialValues.emailNotifications
  );
  const [webhookNotifications, setWebhookNotifications] = React.useState(
    initialValues.webhookNotifications
  );
  const [language, setLanguage] = React.useState(initialValues.language);
  const [timezone, setTimezone] = React.useState(initialValues.timezone);
  const [metadata, setMetadata] = React.useState(initialValues.metadata);
  const [updatedAt, setUpdatedAt] = React.useState(initialValues.updatedAt);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setOwner(initialValues.owner);
    setIdentityId(initialValues.identityId);
    setAutoAnalyzeDocuments(initialValues.autoAnalyzeDocuments);
    setDocumentAnalysisModel(initialValues.documentAnalysisModel);
    setEditorTheme(initialValues.editorTheme);
    setEditorFontSize(initialValues.editorFontSize);
    setDefaultAIModel(initialValues.defaultAIModel);
    setAssistantVoice(initialValues.assistantVoice);
    setEmailNotifications(initialValues.emailNotifications);
    setWebhookNotifications(initialValues.webhookNotifications);
    setLanguage(initialValues.language);
    setTimezone(initialValues.timezone);
    setMetadata(initialValues.metadata);
    setUpdatedAt(initialValues.updatedAt);
    setErrors({});
  };
  const validations = {
    owner: [],
    identityId: [],
    autoAnalyzeDocuments: [],
    documentAnalysisModel: [],
    editorTheme: [],
    editorFontSize: [],
    defaultAIModel: [],
    assistantVoice: [],
    emailNotifications: [],
    webhookNotifications: [],
    language: [],
    timezone: [],
    metadata: [{ type: "JSON" }],
    updatedAt: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          owner,
          identityId,
          autoAnalyzeDocuments,
          documentAnalysisModel,
          editorTheme,
          editorFontSize,
          defaultAIModel,
          assistantVoice,
          emailNotifications,
          webhookNotifications,
          language,
          timezone,
          metadata,
          updatedAt,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await DataStore.save(new Settings(modelFields));
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "SettingsCreateForm")}
      {...rest}
    >
      <TextField
        label="Owner"
        isRequired={false}
        isReadOnly={false}
        value={owner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner: value,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.owner ?? value;
          }
          if (errors.owner?.hasError) {
            runValidationTasks("owner", value);
          }
          setOwner(value);
        }}
        onBlur={() => runValidationTasks("owner", owner)}
        errorMessage={errors.owner?.errorMessage}
        hasError={errors.owner?.hasError}
        {...getOverrideProps(overrides, "owner")}
      ></TextField>
      <TextField
        label="Identity id"
        isRequired={false}
        isReadOnly={false}
        value={identityId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId: value,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.identityId ?? value;
          }
          if (errors.identityId?.hasError) {
            runValidationTasks("identityId", value);
          }
          setIdentityId(value);
        }}
        onBlur={() => runValidationTasks("identityId", identityId)}
        errorMessage={errors.identityId?.errorMessage}
        hasError={errors.identityId?.hasError}
        {...getOverrideProps(overrides, "identityId")}
      ></TextField>
      <SwitchField
        label="Auto analyze documents"
        defaultChecked={false}
        isDisabled={false}
        isChecked={autoAnalyzeDocuments}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments: value,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.autoAnalyzeDocuments ?? value;
          }
          if (errors.autoAnalyzeDocuments?.hasError) {
            runValidationTasks("autoAnalyzeDocuments", value);
          }
          setAutoAnalyzeDocuments(value);
        }}
        onBlur={() =>
          runValidationTasks("autoAnalyzeDocuments", autoAnalyzeDocuments)
        }
        errorMessage={errors.autoAnalyzeDocuments?.errorMessage}
        hasError={errors.autoAnalyzeDocuments?.hasError}
        {...getOverrideProps(overrides, "autoAnalyzeDocuments")}
      ></SwitchField>
      <TextField
        label="Document analysis model"
        isRequired={false}
        isReadOnly={false}
        value={documentAnalysisModel}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel: value,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.documentAnalysisModel ?? value;
          }
          if (errors.documentAnalysisModel?.hasError) {
            runValidationTasks("documentAnalysisModel", value);
          }
          setDocumentAnalysisModel(value);
        }}
        onBlur={() =>
          runValidationTasks("documentAnalysisModel", documentAnalysisModel)
        }
        errorMessage={errors.documentAnalysisModel?.errorMessage}
        hasError={errors.documentAnalysisModel?.hasError}
        {...getOverrideProps(overrides, "documentAnalysisModel")}
      ></TextField>
      <TextField
        label="Editor theme"
        isRequired={false}
        isReadOnly={false}
        value={editorTheme}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme: value,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.editorTheme ?? value;
          }
          if (errors.editorTheme?.hasError) {
            runValidationTasks("editorTheme", value);
          }
          setEditorTheme(value);
        }}
        onBlur={() => runValidationTasks("editorTheme", editorTheme)}
        errorMessage={errors.editorTheme?.errorMessage}
        hasError={errors.editorTheme?.hasError}
        {...getOverrideProps(overrides, "editorTheme")}
      ></TextField>
      <TextField
        label="Editor font size"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={editorFontSize}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize: value,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.editorFontSize ?? value;
          }
          if (errors.editorFontSize?.hasError) {
            runValidationTasks("editorFontSize", value);
          }
          setEditorFontSize(value);
        }}
        onBlur={() => runValidationTasks("editorFontSize", editorFontSize)}
        errorMessage={errors.editorFontSize?.errorMessage}
        hasError={errors.editorFontSize?.hasError}
        {...getOverrideProps(overrides, "editorFontSize")}
      ></TextField>
      <TextField
        label="Default ai model"
        isRequired={false}
        isReadOnly={false}
        value={defaultAIModel}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel: value,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.defaultAIModel ?? value;
          }
          if (errors.defaultAIModel?.hasError) {
            runValidationTasks("defaultAIModel", value);
          }
          setDefaultAIModel(value);
        }}
        onBlur={() => runValidationTasks("defaultAIModel", defaultAIModel)}
        errorMessage={errors.defaultAIModel?.errorMessage}
        hasError={errors.defaultAIModel?.hasError}
        {...getOverrideProps(overrides, "defaultAIModel")}
      ></TextField>
      <TextField
        label="Assistant voice"
        isRequired={false}
        isReadOnly={false}
        value={assistantVoice}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice: value,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.assistantVoice ?? value;
          }
          if (errors.assistantVoice?.hasError) {
            runValidationTasks("assistantVoice", value);
          }
          setAssistantVoice(value);
        }}
        onBlur={() => runValidationTasks("assistantVoice", assistantVoice)}
        errorMessage={errors.assistantVoice?.errorMessage}
        hasError={errors.assistantVoice?.hasError}
        {...getOverrideProps(overrides, "assistantVoice")}
      ></TextField>
      <SwitchField
        label="Email notifications"
        defaultChecked={false}
        isDisabled={false}
        isChecked={emailNotifications}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications: value,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.emailNotifications ?? value;
          }
          if (errors.emailNotifications?.hasError) {
            runValidationTasks("emailNotifications", value);
          }
          setEmailNotifications(value);
        }}
        onBlur={() =>
          runValidationTasks("emailNotifications", emailNotifications)
        }
        errorMessage={errors.emailNotifications?.errorMessage}
        hasError={errors.emailNotifications?.hasError}
        {...getOverrideProps(overrides, "emailNotifications")}
      ></SwitchField>
      <SwitchField
        label="Webhook notifications"
        defaultChecked={false}
        isDisabled={false}
        isChecked={webhookNotifications}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications: value,
              language,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.webhookNotifications ?? value;
          }
          if (errors.webhookNotifications?.hasError) {
            runValidationTasks("webhookNotifications", value);
          }
          setWebhookNotifications(value);
        }}
        onBlur={() =>
          runValidationTasks("webhookNotifications", webhookNotifications)
        }
        errorMessage={errors.webhookNotifications?.errorMessage}
        hasError={errors.webhookNotifications?.hasError}
        {...getOverrideProps(overrides, "webhookNotifications")}
      ></SwitchField>
      <TextField
        label="Language"
        isRequired={false}
        isReadOnly={false}
        value={language}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language: value,
              timezone,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.language ?? value;
          }
          if (errors.language?.hasError) {
            runValidationTasks("language", value);
          }
          setLanguage(value);
        }}
        onBlur={() => runValidationTasks("language", language)}
        errorMessage={errors.language?.errorMessage}
        hasError={errors.language?.hasError}
        {...getOverrideProps(overrides, "language")}
      ></TextField>
      <TextField
        label="Timezone"
        isRequired={false}
        isReadOnly={false}
        value={timezone}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone: value,
              metadata,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.timezone ?? value;
          }
          if (errors.timezone?.hasError) {
            runValidationTasks("timezone", value);
          }
          setTimezone(value);
        }}
        onBlur={() => runValidationTasks("timezone", timezone)}
        errorMessage={errors.timezone?.errorMessage}
        hasError={errors.timezone?.hasError}
        {...getOverrideProps(overrides, "timezone")}
      ></TextField>
      <TextAreaField
        label="Metadata"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata: value,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.metadata ?? value;
          }
          if (errors.metadata?.hasError) {
            runValidationTasks("metadata", value);
          }
          setMetadata(value);
        }}
        onBlur={() => runValidationTasks("metadata", metadata)}
        errorMessage={errors.metadata?.errorMessage}
        hasError={errors.metadata?.hasError}
        {...getOverrideProps(overrides, "metadata")}
      ></TextAreaField>
      <TextField
        label="Updated at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={updatedAt && convertToLocal(new Date(updatedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              autoAnalyzeDocuments,
              documentAnalysisModel,
              editorTheme,
              editorFontSize,
              defaultAIModel,
              assistantVoice,
              emailNotifications,
              webhookNotifications,
              language,
              timezone,
              metadata,
              updatedAt: value,
            };
            const result = onChange(modelFields);
            value = result?.updatedAt ?? value;
          }
          if (errors.updatedAt?.hasError) {
            runValidationTasks("updatedAt", value);
          }
          setUpdatedAt(value);
        }}
        onBlur={() => runValidationTasks("updatedAt", updatedAt)}
        errorMessage={errors.updatedAt?.errorMessage}
        hasError={errors.updatedAt?.hasError}
        {...getOverrideProps(overrides, "updatedAt")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
