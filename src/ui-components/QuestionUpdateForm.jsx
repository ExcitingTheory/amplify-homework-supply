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
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Question } from "../models";
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
export default function QuestionUpdateForm(props) {
  const {
    id: idProp,
    question: questionModelProp,
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
    answer: "",
    hint: "",
    prompt: "",
    audio: [],
    answerAudio: [],
    generated: false,
    model: "",
    promptHex: "",
    byPromptHex: "",
    thumbnail: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [answer, setAnswer] = React.useState(initialValues.answer);
  const [hint, setHint] = React.useState(initialValues.hint);
  const [prompt, setPrompt] = React.useState(initialValues.prompt);
  const [audio, setAudio] = React.useState(initialValues.audio);
  const [answerAudio, setAnswerAudio] = React.useState(
    initialValues.answerAudio
  );
  const [generated, setGenerated] = React.useState(initialValues.generated);
  const [model, setModel] = React.useState(initialValues.model);
  const [promptHex, setPromptHex] = React.useState(initialValues.promptHex);
  const [byPromptHex, setByPromptHex] = React.useState(
    initialValues.byPromptHex
  );
  const [thumbnail, setThumbnail] = React.useState(initialValues.thumbnail);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = questionRecord
      ? { ...initialValues, ...questionRecord }
      : initialValues;
    setOwner(cleanValues.owner);
    setIdentityId(cleanValues.identityId);
    setAnswer(cleanValues.answer);
    setHint(cleanValues.hint);
    setPrompt(cleanValues.prompt);
    setAudio(cleanValues.audio ?? []);
    setCurrentAudioValue("");
    setAnswerAudio(cleanValues.answerAudio ?? []);
    setCurrentAnswerAudioValue("");
    setGenerated(cleanValues.generated);
    setModel(cleanValues.model);
    setPromptHex(cleanValues.promptHex);
    setByPromptHex(cleanValues.byPromptHex);
    setThumbnail(cleanValues.thumbnail);
    setErrors({});
  };
  const [questionRecord, setQuestionRecord] = React.useState(questionModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Question, idProp)
        : questionModelProp;
      setQuestionRecord(record);
    };
    queryData();
  }, [idProp, questionModelProp]);
  React.useEffect(resetStateValues, [questionRecord]);
  const [currentAudioValue, setCurrentAudioValue] = React.useState("");
  const audioRef = React.createRef();
  const [currentAnswerAudioValue, setCurrentAnswerAudioValue] =
    React.useState("");
  const answerAudioRef = React.createRef();
  const validations = {
    owner: [],
    identityId: [],
    answer: [],
    hint: [],
    prompt: [],
    audio: [],
    answerAudio: [],
    generated: [],
    model: [],
    promptHex: [],
    byPromptHex: [],
    thumbnail: [],
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
          identityId,
          answer,
          hint,
          prompt,
          audio,
          answerAudio,
          generated,
          model,
          promptHex,
          byPromptHex,
          thumbnail,
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
            Question.copyOf(questionRecord, (updated) => {
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
      {...getOverrideProps(overrides, "QuestionUpdateForm")}
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
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
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
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
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
        label="Answer"
        isRequired={false}
        isReadOnly={false}
        value={answer}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer: value,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.answer ?? value;
          }
          if (errors.answer?.hasError) {
            runValidationTasks("answer", value);
          }
          setAnswer(value);
        }}
        onBlur={() => runValidationTasks("answer", answer)}
        errorMessage={errors.answer?.errorMessage}
        hasError={errors.answer?.hasError}
        {...getOverrideProps(overrides, "answer")}
      ></TextField>
      <TextField
        label="Hint"
        isRequired={false}
        isReadOnly={false}
        value={hint}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint: value,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.hint ?? value;
          }
          if (errors.hint?.hasError) {
            runValidationTasks("hint", value);
          }
          setHint(value);
        }}
        onBlur={() => runValidationTasks("hint", hint)}
        errorMessage={errors.hint?.errorMessage}
        hasError={errors.hint?.hasError}
        {...getOverrideProps(overrides, "hint")}
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
              answer,
              hint,
              prompt: value,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
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
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio: values,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            values = result?.audio ?? values;
          }
          setAudio(values);
          setCurrentAudioValue("");
        }}
        currentFieldValue={currentAudioValue}
        label={"Audio"}
        items={audio}
        hasError={errors?.audio?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("audio", currentAudioValue)
        }
        errorMessage={errors?.audio?.errorMessage}
        setFieldValue={setCurrentAudioValue}
        inputFieldRef={audioRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Audio"
          isRequired={false}
          isReadOnly={false}
          value={currentAudioValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.audio?.hasError) {
              runValidationTasks("audio", value);
            }
            setCurrentAudioValue(value);
          }}
          onBlur={() => runValidationTasks("audio", currentAudioValue)}
          errorMessage={errors.audio?.errorMessage}
          hasError={errors.audio?.hasError}
          ref={audioRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "audio")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              answerAudio: values,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            values = result?.answerAudio ?? values;
          }
          setAnswerAudio(values);
          setCurrentAnswerAudioValue("");
        }}
        currentFieldValue={currentAnswerAudioValue}
        label={"Answer audio"}
        items={answerAudio}
        hasError={errors?.answerAudio?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("answerAudio", currentAnswerAudioValue)
        }
        errorMessage={errors?.answerAudio?.errorMessage}
        setFieldValue={setCurrentAnswerAudioValue}
        inputFieldRef={answerAudioRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Answer audio"
          isRequired={false}
          isReadOnly={false}
          value={currentAnswerAudioValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.answerAudio?.hasError) {
              runValidationTasks("answerAudio", value);
            }
            setCurrentAnswerAudioValue(value);
          }}
          onBlur={() =>
            runValidationTasks("answerAudio", currentAnswerAudioValue)
          }
          errorMessage={errors.answerAudio?.errorMessage}
          hasError={errors.answerAudio?.hasError}
          ref={answerAudioRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "answerAudio")}
        ></TextField>
      </ArrayField>
      <SwitchField
        label="Generated"
        defaultChecked={false}
        isDisabled={false}
        isChecked={generated}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated: value,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.generated ?? value;
          }
          if (errors.generated?.hasError) {
            runValidationTasks("generated", value);
          }
          setGenerated(value);
        }}
        onBlur={() => runValidationTasks("generated", generated)}
        errorMessage={errors.generated?.errorMessage}
        hasError={errors.generated?.hasError}
        {...getOverrideProps(overrides, "generated")}
      ></SwitchField>
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
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model: value,
              promptHex,
              byPromptHex,
              thumbnail,
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
        label="Prompt hex"
        isRequired={false}
        isReadOnly={false}
        value={promptHex}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex: value,
              byPromptHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.promptHex ?? value;
          }
          if (errors.promptHex?.hasError) {
            runValidationTasks("promptHex", value);
          }
          setPromptHex(value);
        }}
        onBlur={() => runValidationTasks("promptHex", promptHex)}
        errorMessage={errors.promptHex?.errorMessage}
        hasError={errors.promptHex?.hasError}
        {...getOverrideProps(overrides, "promptHex")}
      ></TextField>
      <TextField
        label="By prompt hex"
        isRequired={false}
        isReadOnly={false}
        value={byPromptHex}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex: value,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.byPromptHex ?? value;
          }
          if (errors.byPromptHex?.hasError) {
            runValidationTasks("byPromptHex", value);
          }
          setByPromptHex(value);
        }}
        onBlur={() => runValidationTasks("byPromptHex", byPromptHex)}
        errorMessage={errors.byPromptHex?.errorMessage}
        hasError={errors.byPromptHex?.hasError}
        {...getOverrideProps(overrides, "byPromptHex")}
      ></TextField>
      <TextField
        label="Thumbnail"
        isRequired={false}
        isReadOnly={false}
        value={thumbnail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              answerAudio,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail: value,
            };
            const result = onChange(modelFields);
            value = result?.thumbnail ?? value;
          }
          if (errors.thumbnail?.hasError) {
            runValidationTasks("thumbnail", value);
          }
          setThumbnail(value);
        }}
        onBlur={() => runValidationTasks("thumbnail", thumbnail)}
        errorMessage={errors.thumbnail?.errorMessage}
        hasError={errors.thumbnail?.hasError}
        {...getOverrideProps(overrides, "thumbnail")}
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
          isDisabled={!(idProp || questionModelProp)}
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
              !(idProp || questionModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
