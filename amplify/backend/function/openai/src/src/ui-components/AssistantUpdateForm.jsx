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
  TextField,
} from "@aws-amplify/ui-react";
import { Assistant } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function AssistantUpdateForm(props) {
  const {
    id: idProp,
    assistant: assistantModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    model: "",
    assistantId: "",
    threadInstructions: "",
    additionalInstructions: "",
    messages: "",
    moderationFlag: false,
    identityId: "",
  };
  const [model, setModel] = React.useState(initialValues.model);
  const [assistantId, setAssistantId] = React.useState(
    initialValues.assistantId
  );
  const [threadInstructions, setThreadInstructions] = React.useState(
    initialValues.threadInstructions
  );
  const [additionalInstructions, setAdditionalInstructions] = React.useState(
    initialValues.additionalInstructions
  );
  const [messages, setMessages] = React.useState(initialValues.messages);
  const [moderationFlag, setModerationFlag] = React.useState(
    initialValues.moderationFlag
  );
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = assistantRecord
      ? { ...initialValues, ...assistantRecord }
      : initialValues;
    setModel(cleanValues.model);
    setAssistantId(cleanValues.assistantId);
    setThreadInstructions(cleanValues.threadInstructions);
    setAdditionalInstructions(cleanValues.additionalInstructions);
    setMessages(cleanValues.messages);
    setModerationFlag(cleanValues.moderationFlag);
    setIdentityId(cleanValues.identityId);
    setErrors({});
  };
  const [assistantRecord, setAssistantRecord] =
    React.useState(assistantModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Assistant, idProp)
        : assistantModelProp;
      setAssistantRecord(record);
    };
    queryData();
  }, [idProp, assistantModelProp]);
  React.useEffect(resetStateValues, [assistantRecord]);
  const validations = {
    model: [],
    assistantId: [],
    threadInstructions: [],
    additionalInstructions: [],
    messages: [],
    moderationFlag: [],
    identityId: [],
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
          model,
          assistantId,
          threadInstructions,
          additionalInstructions,
          messages,
          moderationFlag,
          identityId,
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
            Assistant.copyOf(assistantRecord, (updated) => {
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
      {...getOverrideProps(overrides, "AssistantUpdateForm")}
      {...rest}
    >
      <TextField
        label="Model"
        isRequired={false}
        isReadOnly={false}
        value={model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              model: value,
              assistantId,
              threadInstructions,
              additionalInstructions,
              messages,
              moderationFlag,
              identityId,
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
        label="Assistant id"
        isRequired={false}
        isReadOnly={false}
        value={assistantId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              model,
              assistantId: value,
              threadInstructions,
              additionalInstructions,
              messages,
              moderationFlag,
              identityId,
            };
            const result = onChange(modelFields);
            value = result?.assistantId ?? value;
          }
          if (errors.assistantId?.hasError) {
            runValidationTasks("assistantId", value);
          }
          setAssistantId(value);
        }}
        onBlur={() => runValidationTasks("assistantId", assistantId)}
        errorMessage={errors.assistantId?.errorMessage}
        hasError={errors.assistantId?.hasError}
        {...getOverrideProps(overrides, "assistantId")}
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
              model,
              assistantId,
              threadInstructions: value,
              additionalInstructions,
              messages,
              moderationFlag,
              identityId,
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
              model,
              assistantId,
              threadInstructions,
              additionalInstructions: value,
              messages,
              moderationFlag,
              identityId,
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
        label="Messages"
        isRequired={false}
        isReadOnly={false}
        value={messages}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              model,
              assistantId,
              threadInstructions,
              additionalInstructions,
              messages: value,
              moderationFlag,
              identityId,
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
              model,
              assistantId,
              threadInstructions,
              additionalInstructions,
              messages,
              moderationFlag: value,
              identityId,
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
      <TextField
        label="Identity id"
        isRequired={false}
        isReadOnly={false}
        value={identityId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              model,
              assistantId,
              threadInstructions,
              additionalInstructions,
              messages,
              moderationFlag,
              identityId: value,
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
          isDisabled={!(idProp || assistantModelProp)}
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
              !(idProp || assistantModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
