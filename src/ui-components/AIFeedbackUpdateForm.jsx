/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  SelectField,
  Text,
  TextAreaField,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { AIFeedback } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function AIFeedbackUpdateForm(props) {
  const {
    id: idProp,
    aIFeedback: aIFeedbackModelProp,
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
    contentType: "",
    feedbackType: "",
    reasons: [],
    comment: "",
    model: "",
    prompt: "",
    generatedContent: "",
    unitID: "",
    gradeID: "",
    documentID: "",
    messageId: "",
    sessionId: "",
    metadata: "",
    createdAt: "",
    updatedAt: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [contentType, setContentType] = React.useState(
    initialValues.contentType
  );
  const [feedbackType, setFeedbackType] = React.useState(
    initialValues.feedbackType
  );
  const [reasons, setReasons] = React.useState(initialValues.reasons);
  const [comment, setComment] = React.useState(initialValues.comment);
  const [model, setModel] = React.useState(initialValues.model);
  const [prompt, setPrompt] = React.useState(initialValues.prompt);
  const [generatedContent, setGeneratedContent] = React.useState(
    initialValues.generatedContent
  );
  const [unitID, setUnitID] = React.useState(initialValues.unitID);
  const [gradeID, setGradeID] = React.useState(initialValues.gradeID);
  const [documentID, setDocumentID] = React.useState(initialValues.documentID);
  const [messageId, setMessageId] = React.useState(initialValues.messageId);
  const [sessionId, setSessionId] = React.useState(initialValues.sessionId);
  const [metadata, setMetadata] = React.useState(initialValues.metadata);
  const [createdAt, setCreatedAt] = React.useState(initialValues.createdAt);
  const [updatedAt, setUpdatedAt] = React.useState(initialValues.updatedAt);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = aIFeedbackRecord
      ? { ...initialValues, ...aIFeedbackRecord }
      : initialValues;
    setOwner(cleanValues.owner);
    setIdentityId(cleanValues.identityId);
    setContentType(cleanValues.contentType);
    setFeedbackType(cleanValues.feedbackType);
    setReasons(cleanValues.reasons ?? []);
    setCurrentReasonsValue("");
    setComment(cleanValues.comment);
    setModel(cleanValues.model);
    setPrompt(cleanValues.prompt);
    setGeneratedContent(cleanValues.generatedContent);
    setUnitID(cleanValues.unitID);
    setGradeID(cleanValues.gradeID);
    setDocumentID(cleanValues.documentID);
    setMessageId(cleanValues.messageId);
    setSessionId(cleanValues.sessionId);
    setMetadata(
      typeof cleanValues.metadata === "string" || cleanValues.metadata === null
        ? cleanValues.metadata
        : JSON.stringify(cleanValues.metadata)
    );
    setCreatedAt(cleanValues.createdAt);
    setUpdatedAt(cleanValues.updatedAt);
    setErrors({});
  };
  const [aIFeedbackRecord, setAIFeedbackRecord] =
    React.useState(aIFeedbackModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(AIFeedback, idProp)
        : aIFeedbackModelProp;
      setAIFeedbackRecord(record);
    };
    queryData();
  }, [idProp, aIFeedbackModelProp]);
  React.useEffect(resetStateValues, [aIFeedbackRecord]);
  const [currentReasonsValue, setCurrentReasonsValue] = React.useState("");
  const reasonsRef = React.createRef();
  const getDisplayValue = {
    reasons: (r) => {
      const enumDisplayValueMap = {
        INCORRECT: "Incorrect",
        INCOMPLETE: "Incomplete",
        INAPPROPRIATE: "Inappropriate",
        NOT_HELPFUL: "Not helpful",
        IRRELEVANT: "Irrelevant",
        POOR_QUALITY: "Poor quality",
        OTHER: "Other",
      };
      return enumDisplayValueMap[r];
    },
  };
  const validations = {
    owner: [],
    identityId: [],
    contentType: [{ type: "Required" }],
    feedbackType: [{ type: "Required" }],
    reasons: [],
    comment: [],
    model: [],
    prompt: [],
    generatedContent: [],
    unitID: [],
    gradeID: [],
    documentID: [],
    messageId: [],
    sessionId: [],
    metadata: [{ type: "JSON" }],
    createdAt: [{ type: "Required" }],
    updatedAt: [{ type: "Required" }],
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
          contentType,
          feedbackType,
          reasons,
          comment,
          model,
          prompt,
          generatedContent,
          unitID,
          gradeID,
          documentID,
          messageId,
          sessionId,
          metadata,
          createdAt,
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
          await DataStore.save(
            AIFeedback.copyOf(aIFeedbackRecord, (updated) => {
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
      {...getOverrideProps(overrides, "AIFeedbackUpdateForm")}
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
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
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
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
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
      <SelectField
        label="Content type"
        placeholder="Please select an option"
        isDisabled={false}
        value={contentType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType: value,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.contentType ?? value;
          }
          if (errors.contentType?.hasError) {
            runValidationTasks("contentType", value);
          }
          setContentType(value);
        }}
        onBlur={() => runValidationTasks("contentType", contentType)}
        errorMessage={errors.contentType?.errorMessage}
        hasError={errors.contentType?.hasError}
        {...getOverrideProps(overrides, "contentType")}
      >
        <option
          children="Chat message"
          value="CHAT_MESSAGE"
          {...getOverrideProps(overrides, "contentTypeoption0")}
        ></option>
        <option
          children="Content completion"
          value="CONTENT_COMPLETION"
          {...getOverrideProps(overrides, "contentTypeoption1")}
        ></option>
        <option
          children="Audio generation"
          value="AUDIO_GENERATION"
          {...getOverrideProps(overrides, "contentTypeoption2")}
        ></option>
        <option
          children="Image generation"
          value="IMAGE_GENERATION"
          {...getOverrideProps(overrides, "contentTypeoption3")}
        ></option>
        <option
          children="Document analysis"
          value="DOCUMENT_ANALYSIS"
          {...getOverrideProps(overrides, "contentTypeoption4")}
        ></option>
        <option
          children="Vocabulary extraction"
          value="VOCABULARY_EXTRACTION"
          {...getOverrideProps(overrides, "contentTypeoption5")}
        ></option>
        <option
          children="Transcription"
          value="TRANSCRIPTION"
          {...getOverrideProps(overrides, "contentTypeoption6")}
        ></option>
        <option
          children="Image description"
          value="IMAGE_DESCRIPTION"
          {...getOverrideProps(overrides, "contentTypeoption7")}
        ></option>
        <option
          children="Grading feedback"
          value="GRADING_FEEDBACK"
          {...getOverrideProps(overrides, "contentTypeoption8")}
        ></option>
        <option
          children="Block suggestion"
          value="BLOCK_SUGGESTION"
          {...getOverrideProps(overrides, "contentTypeoption9")}
        ></option>
      </SelectField>
      <SelectField
        label="Feedback type"
        placeholder="Please select an option"
        isDisabled={false}
        value={feedbackType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType: value,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.feedbackType ?? value;
          }
          if (errors.feedbackType?.hasError) {
            runValidationTasks("feedbackType", value);
          }
          setFeedbackType(value);
        }}
        onBlur={() => runValidationTasks("feedbackType", feedbackType)}
        errorMessage={errors.feedbackType?.errorMessage}
        hasError={errors.feedbackType?.hasError}
        {...getOverrideProps(overrides, "feedbackType")}
      >
        <option
          children="Positive"
          value="POSITIVE"
          {...getOverrideProps(overrides, "feedbackTypeoption0")}
        ></option>
        <option
          children="Negative"
          value="NEGATIVE"
          {...getOverrideProps(overrides, "feedbackTypeoption1")}
        ></option>
      </SelectField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons: values,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            values = result?.reasons ?? values;
          }
          setReasons(values);
          setCurrentReasonsValue("");
        }}
        currentFieldValue={currentReasonsValue}
        label={"Reasons"}
        items={reasons}
        hasError={errors?.reasons?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("reasons", currentReasonsValue)
        }
        errorMessage={errors?.reasons?.errorMessage}
        getBadgeText={getDisplayValue.reasons}
        setFieldValue={setCurrentReasonsValue}
        inputFieldRef={reasonsRef}
        defaultFieldValue={""}
      >
        <SelectField
          label="Reasons"
          placeholder="Please select an option"
          isDisabled={false}
          value={currentReasonsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.reasons?.hasError) {
              runValidationTasks("reasons", value);
            }
            setCurrentReasonsValue(value);
          }}
          onBlur={() => runValidationTasks("reasons", currentReasonsValue)}
          errorMessage={errors.reasons?.errorMessage}
          hasError={errors.reasons?.hasError}
          ref={reasonsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "reasons")}
        >
          <option
            children="Incorrect"
            value="INCORRECT"
            {...getOverrideProps(overrides, "reasonsoption0")}
          ></option>
          <option
            children="Incomplete"
            value="INCOMPLETE"
            {...getOverrideProps(overrides, "reasonsoption1")}
          ></option>
          <option
            children="Inappropriate"
            value="INAPPROPRIATE"
            {...getOverrideProps(overrides, "reasonsoption2")}
          ></option>
          <option
            children="Not helpful"
            value="NOT_HELPFUL"
            {...getOverrideProps(overrides, "reasonsoption3")}
          ></option>
          <option
            children="Irrelevant"
            value="IRRELEVANT"
            {...getOverrideProps(overrides, "reasonsoption4")}
          ></option>
          <option
            children="Poor quality"
            value="POOR_QUALITY"
            {...getOverrideProps(overrides, "reasonsoption5")}
          ></option>
          <option
            children="Other"
            value="OTHER"
            {...getOverrideProps(overrides, "reasonsoption6")}
          ></option>
        </SelectField>
      </ArrayField>
      <TextField
        label="Comment"
        isRequired={false}
        isReadOnly={false}
        value={comment}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment: value,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.comment ?? value;
          }
          if (errors.comment?.hasError) {
            runValidationTasks("comment", value);
          }
          setComment(value);
        }}
        onBlur={() => runValidationTasks("comment", comment)}
        errorMessage={errors.comment?.errorMessage}
        hasError={errors.comment?.hasError}
        {...getOverrideProps(overrides, "comment")}
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
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model: value,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
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
        label="Prompt"
        isRequired={false}
        isReadOnly={false}
        value={prompt}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt: value,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.prompt ?? value;
          }
          if (errors.prompt?.hasError) {
            runValidationTasks("prompt", value);
          }
          setPrompt(value);
        }}
        onBlur={() => runValidationTasks("prompt", prompt)}
        errorMessage={errors.prompt?.errorMessage}
        hasError={errors.prompt?.hasError}
        {...getOverrideProps(overrides, "prompt")}
      ></TextField>
      <TextField
        label="Generated content"
        isRequired={false}
        isReadOnly={false}
        value={generatedContent}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent: value,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.generatedContent ?? value;
          }
          if (errors.generatedContent?.hasError) {
            runValidationTasks("generatedContent", value);
          }
          setGeneratedContent(value);
        }}
        onBlur={() => runValidationTasks("generatedContent", generatedContent)}
        errorMessage={errors.generatedContent?.errorMessage}
        hasError={errors.generatedContent?.hasError}
        {...getOverrideProps(overrides, "generatedContent")}
      ></TextField>
      <TextField
        label="Unit id"
        isRequired={false}
        isReadOnly={false}
        value={unitID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID: value,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.unitID ?? value;
          }
          if (errors.unitID?.hasError) {
            runValidationTasks("unitID", value);
          }
          setUnitID(value);
        }}
        onBlur={() => runValidationTasks("unitID", unitID)}
        errorMessage={errors.unitID?.errorMessage}
        hasError={errors.unitID?.hasError}
        {...getOverrideProps(overrides, "unitID")}
      ></TextField>
      <TextField
        label="Grade id"
        isRequired={false}
        isReadOnly={false}
        value={gradeID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID: value,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.gradeID ?? value;
          }
          if (errors.gradeID?.hasError) {
            runValidationTasks("gradeID", value);
          }
          setGradeID(value);
        }}
        onBlur={() => runValidationTasks("gradeID", gradeID)}
        errorMessage={errors.gradeID?.errorMessage}
        hasError={errors.gradeID?.hasError}
        {...getOverrideProps(overrides, "gradeID")}
      ></TextField>
      <TextField
        label="Document id"
        isRequired={false}
        isReadOnly={false}
        value={documentID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID: value,
              messageId,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.documentID ?? value;
          }
          if (errors.documentID?.hasError) {
            runValidationTasks("documentID", value);
          }
          setDocumentID(value);
        }}
        onBlur={() => runValidationTasks("documentID", documentID)}
        errorMessage={errors.documentID?.errorMessage}
        hasError={errors.documentID?.hasError}
        {...getOverrideProps(overrides, "documentID")}
      ></TextField>
      <TextField
        label="Message id"
        isRequired={false}
        isReadOnly={false}
        value={messageId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId: value,
              sessionId,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.messageId ?? value;
          }
          if (errors.messageId?.hasError) {
            runValidationTasks("messageId", value);
          }
          setMessageId(value);
        }}
        onBlur={() => runValidationTasks("messageId", messageId)}
        errorMessage={errors.messageId?.errorMessage}
        hasError={errors.messageId?.hasError}
        {...getOverrideProps(overrides, "messageId")}
      ></TextField>
      <TextField
        label="Session id"
        isRequired={false}
        isReadOnly={false}
        value={sessionId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId: value,
              metadata,
              createdAt,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.sessionId ?? value;
          }
          if (errors.sessionId?.hasError) {
            runValidationTasks("sessionId", value);
          }
          setSessionId(value);
        }}
        onBlur={() => runValidationTasks("sessionId", sessionId)}
        errorMessage={errors.sessionId?.errorMessage}
        hasError={errors.sessionId?.hasError}
        {...getOverrideProps(overrides, "sessionId")}
      ></TextField>
      <TextAreaField
        label="Metadata"
        isRequired={false}
        isReadOnly={false}
        value={metadata}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata: value,
              createdAt,
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
        label="Created at"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={createdAt && convertToLocal(new Date(createdAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt: value,
              updatedAt,
            };
            const result = onChange(modelFields);
            value = result?.createdAt ?? value;
          }
          if (errors.createdAt?.hasError) {
            runValidationTasks("createdAt", value);
          }
          setCreatedAt(value);
        }}
        onBlur={() => runValidationTasks("createdAt", createdAt)}
        errorMessage={errors.createdAt?.errorMessage}
        hasError={errors.createdAt?.hasError}
        {...getOverrideProps(overrides, "createdAt")}
      ></TextField>
      <TextField
        label="Updated at"
        isRequired={true}
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
              contentType,
              feedbackType,
              reasons,
              comment,
              model,
              prompt,
              generatedContent,
              unitID,
              gradeID,
              documentID,
              messageId,
              sessionId,
              metadata,
              createdAt,
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
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || aIFeedbackModelProp)}
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
              !(idProp || aIFeedbackModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
