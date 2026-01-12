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
import { AssistantChat } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function AssistantChatCreateForm(props) {
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
    model: "",
    threadInstructions: "",
    additionalInstructions: "",
    threadId: "",
    moderationFlag: false,
    messages: "",
    draft: "",
    archived: false,
    inputTokens: "",
    outputTokens: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [model, setModel] = React.useState(initialValues.model);
  const [threadInstructions, setThreadInstructions] = React.useState(
    initialValues.threadInstructions
  );
  const [additionalInstructions, setAdditionalInstructions] = React.useState(
    initialValues.additionalInstructions
  );
  const [threadId, setThreadId] = React.useState(initialValues.threadId);
  const [moderationFlag, setModerationFlag] = React.useState(
    initialValues.moderationFlag
  );
  const [messages, setMessages] = React.useState(initialValues.messages);
  const [draft, setDraft] = React.useState(initialValues.draft);
  const [archived, setArchived] = React.useState(initialValues.archived);
  const [inputTokens, setInputTokens] = React.useState(
    initialValues.inputTokens
  );
  const [outputTokens, setOutputTokens] = React.useState(
    initialValues.outputTokens
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setOwner(initialValues.owner);
    setModel(initialValues.model);
    setThreadInstructions(initialValues.threadInstructions);
    setAdditionalInstructions(initialValues.additionalInstructions);
    setThreadId(initialValues.threadId);
    setModerationFlag(initialValues.moderationFlag);
    setMessages(initialValues.messages);
    setDraft(initialValues.draft);
    setArchived(initialValues.archived);
    setInputTokens(initialValues.inputTokens);
    setOutputTokens(initialValues.outputTokens);
    setErrors({});
  };
  const validations = {
    owner: [],
    model: [],
    threadInstructions: [],
    additionalInstructions: [],
    threadId: [],
    moderationFlag: [],
    messages: [{ type: "JSON" }],
    draft: [],
    archived: [],
    inputTokens: [],
    outputTokens: [],
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
          model,
          threadInstructions,
          additionalInstructions,
          threadId,
          moderationFlag,
          messages,
          draft,
          archived,
          inputTokens,
          outputTokens,
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
          await DataStore.save(new AssistantChat(modelFields));
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
      {...getOverrideProps(overrides, "AssistantChatCreateForm")}
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
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
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
        label="Model"
        isRequired={false}
        isReadOnly={false}
        value={model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model: value,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.model ?? value;
          }
          if (errors.model?.hasError) {
            runValidationTasks("model", value);
          }
          setModel(value);
        }}
        onBlur={() => runValidationTasks("model", model)}
        errorMessage={errors.model?.errorMessage}
        hasError={errors.model?.hasError}
        {...getOverrideProps(overrides, "model")}
      ></TextField>
      <TextField
        label="Thread instructions"
        isRequired={false}
        isReadOnly={false}
        value={threadInstructions}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions: value,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.threadInstructions ?? value;
          }
          if (errors.threadInstructions?.hasError) {
            runValidationTasks("threadInstructions", value);
          }
          setThreadInstructions(value);
        }}
        onBlur={() =>
          runValidationTasks("threadInstructions", threadInstructions)
        }
        errorMessage={errors.threadInstructions?.errorMessage}
        hasError={errors.threadInstructions?.hasError}
        {...getOverrideProps(overrides, "threadInstructions")}
      ></TextField>
      <TextField
        label="Additional instructions"
        isRequired={false}
        isReadOnly={false}
        value={additionalInstructions}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions: value,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.additionalInstructions ?? value;
          }
          if (errors.additionalInstructions?.hasError) {
            runValidationTasks("additionalInstructions", value);
          }
          setAdditionalInstructions(value);
        }}
        onBlur={() =>
          runValidationTasks("additionalInstructions", additionalInstructions)
        }
        errorMessage={errors.additionalInstructions?.errorMessage}
        hasError={errors.additionalInstructions?.hasError}
        {...getOverrideProps(overrides, "additionalInstructions")}
      ></TextField>
      <TextField
        label="Thread id"
        isRequired={false}
        isReadOnly={false}
        value={threadId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId: value,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.threadId ?? value;
          }
          if (errors.threadId?.hasError) {
            runValidationTasks("threadId", value);
          }
          setThreadId(value);
        }}
        onBlur={() => runValidationTasks("threadId", threadId)}
        errorMessage={errors.threadId?.errorMessage}
        hasError={errors.threadId?.hasError}
        {...getOverrideProps(overrides, "threadId")}
      ></TextField>
      <SwitchField
        label="Moderation flag"
        defaultChecked={false}
        isDisabled={false}
        isChecked={moderationFlag}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag: value,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.moderationFlag ?? value;
          }
          if (errors.moderationFlag?.hasError) {
            runValidationTasks("moderationFlag", value);
          }
          setModerationFlag(value);
        }}
        onBlur={() => runValidationTasks("moderationFlag", moderationFlag)}
        errorMessage={errors.moderationFlag?.errorMessage}
        hasError={errors.moderationFlag?.hasError}
        {...getOverrideProps(overrides, "moderationFlag")}
      ></SwitchField>
      <TextAreaField
        label="Messages"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages: value,
              draft,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.messages ?? value;
          }
          if (errors.messages?.hasError) {
            runValidationTasks("messages", value);
          }
          setMessages(value);
        }}
        onBlur={() => runValidationTasks("messages", messages)}
        errorMessage={errors.messages?.errorMessage}
        hasError={errors.messages?.hasError}
        {...getOverrideProps(overrides, "messages")}
      ></TextAreaField>
      <TextField
        label="Draft"
        isRequired={false}
        isReadOnly={false}
        value={draft}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft: value,
              archived,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.draft ?? value;
          }
          if (errors.draft?.hasError) {
            runValidationTasks("draft", value);
          }
          setDraft(value);
        }}
        onBlur={() => runValidationTasks("draft", draft)}
        errorMessage={errors.draft?.errorMessage}
        hasError={errors.draft?.hasError}
        {...getOverrideProps(overrides, "draft")}
      ></TextField>
      <SwitchField
        label="Archived"
        defaultChecked={false}
        isDisabled={false}
        isChecked={archived}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived: value,
              inputTokens,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.archived ?? value;
          }
          if (errors.archived?.hasError) {
            runValidationTasks("archived", value);
          }
          setArchived(value);
        }}
        onBlur={() => runValidationTasks("archived", archived)}
        errorMessage={errors.archived?.errorMessage}
        hasError={errors.archived?.hasError}
        {...getOverrideProps(overrides, "archived")}
      ></SwitchField>
      <TextField
        label="Input tokens"
        isRequired={false}
        isReadOnly={false}
        value={inputTokens}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens: value,
              outputTokens,
            };
            const result = onChange(modelFields);
            value = result?.inputTokens ?? value;
          }
          if (errors.inputTokens?.hasError) {
            runValidationTasks("inputTokens", value);
          }
          setInputTokens(value);
        }}
        onBlur={() => runValidationTasks("inputTokens", inputTokens)}
        errorMessage={errors.inputTokens?.errorMessage}
        hasError={errors.inputTokens?.hasError}
        {...getOverrideProps(overrides, "inputTokens")}
      ></TextField>
      <TextField
        label="Output tokens"
        isRequired={false}
        isReadOnly={false}
        value={outputTokens}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              model,
              threadInstructions,
              additionalInstructions,
              threadId,
              moderationFlag,
              messages,
              draft,
              archived,
              inputTokens,
              outputTokens: value,
            };
            const result = onChange(modelFields);
            value = result?.outputTokens ?? value;
          }
          if (errors.outputTokens?.hasError) {
            runValidationTasks("outputTokens", value);
          }
          setOutputTokens(value);
        }}
        onBlur={() => runValidationTasks("outputTokens", outputTokens)}
        errorMessage={errors.outputTokens?.errorMessage}
        hasError={errors.outputTokens?.hasError}
        {...getOverrideProps(overrides, "outputTokens")}
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
