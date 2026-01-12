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
import { ChatHistory } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function ChatHistoryUpdateForm(props) {
  const {
    id: idProp,
    chatHistory: chatHistoryModelProp,
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
    messages: "",
    model: "",
    inputTokens: "",
    outputTokens: "",
    draft: "",
    archived: false,
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [messages, setMessages] = React.useState(initialValues.messages);
  const [model, setModel] = React.useState(initialValues.model);
  const [inputTokens, setInputTokens] = React.useState(
    initialValues.inputTokens
  );
  const [outputTokens, setOutputTokens] = React.useState(
    initialValues.outputTokens
  );
  const [draft, setDraft] = React.useState(initialValues.draft);
  const [archived, setArchived] = React.useState(initialValues.archived);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = chatHistoryRecord
      ? { ...initialValues, ...chatHistoryRecord }
      : initialValues;
    setOwner(cleanValues.owner);
    setMessages(
      typeof cleanValues.messages === "string" || cleanValues.messages === null
        ? cleanValues.messages
        : JSON.stringify(cleanValues.messages)
    );
    setModel(cleanValues.model);
    setInputTokens(cleanValues.inputTokens);
    setOutputTokens(cleanValues.outputTokens);
    setDraft(cleanValues.draft);
    setArchived(cleanValues.archived);
    setErrors({});
  };
  const [chatHistoryRecord, setChatHistoryRecord] =
    React.useState(chatHistoryModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(ChatHistory, idProp)
        : chatHistoryModelProp;
      setChatHistoryRecord(record);
    };
    queryData();
  }, [idProp, chatHistoryModelProp]);
  React.useEffect(resetStateValues, [chatHistoryRecord]);
  const validations = {
    owner: [],
    messages: [{ type: "JSON" }],
    model: [],
    inputTokens: [],
    outputTokens: [],
    draft: [],
    archived: [],
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
          messages,
          model,
          inputTokens,
          outputTokens,
          draft,
          archived,
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
          await DataStore.save(
            ChatHistory.copyOf(chatHistoryRecord, (updated) => {
              Object.assign(updated, modelFields);
            })
          );
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "ChatHistoryUpdateForm")}
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
              messages,
              model,
              inputTokens,
              outputTokens,
              draft,
              archived,
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
      <TextAreaField
        label="Messages"
        isRequired={false}
        isReadOnly={false}
        value={messages}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              messages: value,
              model,
              inputTokens,
              outputTokens,
              draft,
              archived,
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
        label="Model"
        isRequired={false}
        isReadOnly={false}
        value={model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              messages,
              model: value,
              inputTokens,
              outputTokens,
              draft,
              archived,
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
        label="Input tokens"
        isRequired={false}
        isReadOnly={false}
        value={inputTokens}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              messages,
              model,
              inputTokens: value,
              outputTokens,
              draft,
              archived,
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
              messages,
              model,
              inputTokens,
              outputTokens: value,
              draft,
              archived,
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
              messages,
              model,
              inputTokens,
              outputTokens,
              draft: value,
              archived,
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
              messages,
              model,
              inputTokens,
              outputTokens,
              draft,
              archived: value,
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
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || chatHistoryModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || chatHistoryModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
