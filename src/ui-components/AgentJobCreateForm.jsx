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
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { AgentJob } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function AgentJobCreateForm(props) {
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
    type: "",
    status: "",
    responseId: "",
    webhookData: "",
    error: "",
    startedAt: "",
    completedAt: "",
    modelUsed: "",
    tokensUsed: "",
    estimatedCost: "",
    retryCount: "",
    metadata: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [type, setType] = React.useState(initialValues.type);
  const [status, setStatus] = React.useState(initialValues.status);
  const [responseId, setResponseId] = React.useState(initialValues.responseId);
  const [webhookData, setWebhookData] = React.useState(
    initialValues.webhookData
  );
  const [error, setError] = React.useState(initialValues.error);
  const [startedAt, setStartedAt] = React.useState(initialValues.startedAt);
  const [completedAt, setCompletedAt] = React.useState(
    initialValues.completedAt
  );
  const [modelUsed, setModelUsed] = React.useState(initialValues.modelUsed);
  const [tokensUsed, setTokensUsed] = React.useState(initialValues.tokensUsed);
  const [estimatedCost, setEstimatedCost] = React.useState(
    initialValues.estimatedCost
  );
  const [retryCount, setRetryCount] = React.useState(initialValues.retryCount);
  const [metadata, setMetadata] = React.useState(initialValues.metadata);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setOwner(initialValues.owner);
    setIdentityId(initialValues.identityId);
    setType(initialValues.type);
    setStatus(initialValues.status);
    setResponseId(initialValues.responseId);
    setWebhookData(initialValues.webhookData);
    setError(initialValues.error);
    setStartedAt(initialValues.startedAt);
    setCompletedAt(initialValues.completedAt);
    setModelUsed(initialValues.modelUsed);
    setTokensUsed(initialValues.tokensUsed);
    setEstimatedCost(initialValues.estimatedCost);
    setRetryCount(initialValues.retryCount);
    setMetadata(initialValues.metadata);
    setErrors({});
  };
  const validations = {
    owner: [],
    identityId: [],
    type: [{ type: "Required" }],
    status: [{ type: "Required" }],
    responseId: [],
    webhookData: [{ type: "JSON" }],
    error: [{ type: "JSON" }],
    startedAt: [],
    completedAt: [],
    modelUsed: [],
    tokensUsed: [],
    estimatedCost: [],
    retryCount: [],
    metadata: [{ type: "JSON" }],
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
          type,
          status,
          responseId,
          webhookData,
          error,
          startedAt,
          completedAt,
          modelUsed,
          tokensUsed,
          estimatedCost,
          retryCount,
          metadata,
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
          await DataStore.save(new AgentJob(modelFields));
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
      {...getOverrideProps(overrides, "AgentJobCreateForm")}
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
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
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
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
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
      <TextField
        label="Type"
        isRequired={true}
        isReadOnly={false}
        value={type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type: value,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.type ?? value;
          }
          if (errors.type?.hasError) {
            runValidationTasks("type", value);
          }
          setType(value);
        }}
        onBlur={() => runValidationTasks("type", type)}
        errorMessage={errors.type?.errorMessage}
        hasError={errors.type?.hasError}
        {...getOverrideProps(overrides, "type")}
      ></TextField>
      <TextField
        label="Status"
        isRequired={true}
        isReadOnly={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status: value,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      ></TextField>
      <TextField
        label="Response id"
        isRequired={false}
        isReadOnly={false}
        value={responseId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId: value,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.responseId ?? value;
          }
          if (errors.responseId?.hasError) {
            runValidationTasks("responseId", value);
          }
          setResponseId(value);
        }}
        onBlur={() => runValidationTasks("responseId", responseId)}
        errorMessage={errors.responseId?.errorMessage}
        hasError={errors.responseId?.hasError}
        {...getOverrideProps(overrides, "responseId")}
      ></TextField>
      <TextAreaField
        label="Webhook data"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData: value,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.webhookData ?? value;
          }
          if (errors.webhookData?.hasError) {
            runValidationTasks("webhookData", value);
          }
          setWebhookData(value);
        }}
        onBlur={() => runValidationTasks("webhookData", webhookData)}
        errorMessage={errors.webhookData?.errorMessage}
        hasError={errors.webhookData?.hasError}
        {...getOverrideProps(overrides, "webhookData")}
      ></TextAreaField>
      <TextAreaField
        label="Error"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error: value,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.error ?? value;
          }
          if (errors.error?.hasError) {
            runValidationTasks("error", value);
          }
          setError(value);
        }}
        onBlur={() => runValidationTasks("error", error)}
        errorMessage={errors.error?.errorMessage}
        hasError={errors.error?.hasError}
        {...getOverrideProps(overrides, "error")}
      ></TextAreaField>
      <TextField
        label="Started at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={startedAt && convertToLocal(new Date(startedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt: value,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.startedAt ?? value;
          }
          if (errors.startedAt?.hasError) {
            runValidationTasks("startedAt", value);
          }
          setStartedAt(value);
        }}
        onBlur={() => runValidationTasks("startedAt", startedAt)}
        errorMessage={errors.startedAt?.errorMessage}
        hasError={errors.startedAt?.hasError}
        {...getOverrideProps(overrides, "startedAt")}
      ></TextField>
      <TextField
        label="Completed at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={completedAt && convertToLocal(new Date(completedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt: value,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.completedAt ?? value;
          }
          if (errors.completedAt?.hasError) {
            runValidationTasks("completedAt", value);
          }
          setCompletedAt(value);
        }}
        onBlur={() => runValidationTasks("completedAt", completedAt)}
        errorMessage={errors.completedAt?.errorMessage}
        hasError={errors.completedAt?.hasError}
        {...getOverrideProps(overrides, "completedAt")}
      ></TextField>
      <TextField
        label="Model used"
        isRequired={false}
        isReadOnly={false}
        value={modelUsed}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed: value,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.modelUsed ?? value;
          }
          if (errors.modelUsed?.hasError) {
            runValidationTasks("modelUsed", value);
          }
          setModelUsed(value);
        }}
        onBlur={() => runValidationTasks("modelUsed", modelUsed)}
        errorMessage={errors.modelUsed?.errorMessage}
        hasError={errors.modelUsed?.hasError}
        {...getOverrideProps(overrides, "modelUsed")}
      ></TextField>
      <TextField
        label="Tokens used"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={tokensUsed}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed: value,
              estimatedCost,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.tokensUsed ?? value;
          }
          if (errors.tokensUsed?.hasError) {
            runValidationTasks("tokensUsed", value);
          }
          setTokensUsed(value);
        }}
        onBlur={() => runValidationTasks("tokensUsed", tokensUsed)}
        errorMessage={errors.tokensUsed?.errorMessage}
        hasError={errors.tokensUsed?.hasError}
        {...getOverrideProps(overrides, "tokensUsed")}
      ></TextField>
      <TextField
        label="Estimated cost"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={estimatedCost}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost: value,
              retryCount,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.estimatedCost ?? value;
          }
          if (errors.estimatedCost?.hasError) {
            runValidationTasks("estimatedCost", value);
          }
          setEstimatedCost(value);
        }}
        onBlur={() => runValidationTasks("estimatedCost", estimatedCost)}
        errorMessage={errors.estimatedCost?.errorMessage}
        hasError={errors.estimatedCost?.hasError}
        {...getOverrideProps(overrides, "estimatedCost")}
      ></TextField>
      <TextField
        label="Retry count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={retryCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount: value,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.retryCount ?? value;
          }
          if (errors.retryCount?.hasError) {
            runValidationTasks("retryCount", value);
          }
          setRetryCount(value);
        }}
        onBlur={() => runValidationTasks("retryCount", retryCount)}
        errorMessage={errors.retryCount?.errorMessage}
        hasError={errors.retryCount?.hasError}
        {...getOverrideProps(overrides, "retryCount")}
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
              type,
              status,
              responseId,
              webhookData,
              error,
              startedAt,
              completedAt,
              modelUsed,
              tokensUsed,
              estimatedCost,
              retryCount,
              metadata: value,
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
