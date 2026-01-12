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
  TextAreaField,
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
    audioWaveformData: "",
    answerAudio: [],
    answerAudioWaveformData: "",
    generated: false,
    model: "",
    promptHex: "",
    byPromptHex: "",
    thumbnail: "",
    difficulty: "",
    metadata: "",
    importedAt: "",
    embedding: [],
    embeddingModel: "",
    embeddingDimensions: "",
    embeddingVersion: "",
    embeddingWordCount: "",
    moderationStatus: "",
    moderationFlags: "",
    moderationCheckedAt: "",
  };
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [answer, setAnswer] = React.useState(initialValues.answer);
  const [hint, setHint] = React.useState(initialValues.hint);
  const [prompt, setPrompt] = React.useState(initialValues.prompt);
  const [audio, setAudio] = React.useState(initialValues.audio);
  const [audioWaveformData, setAudioWaveformData] = React.useState(
    initialValues.audioWaveformData
  );
  const [answerAudio, setAnswerAudio] = React.useState(
    initialValues.answerAudio
  );
  const [answerAudioWaveformData, setAnswerAudioWaveformData] = React.useState(
    initialValues.answerAudioWaveformData
  );
  const [generated, setGenerated] = React.useState(initialValues.generated);
  const [model, setModel] = React.useState(initialValues.model);
  const [promptHex, setPromptHex] = React.useState(initialValues.promptHex);
  const [byPromptHex, setByPromptHex] = React.useState(
    initialValues.byPromptHex
  );
  const [thumbnail, setThumbnail] = React.useState(initialValues.thumbnail);
  const [difficulty, setDifficulty] = React.useState(initialValues.difficulty);
  const [metadata, setMetadata] = React.useState(initialValues.metadata);
  const [importedAt, setImportedAt] = React.useState(initialValues.importedAt);
  const [embedding, setEmbedding] = React.useState(initialValues.embedding);
  const [embeddingModel, setEmbeddingModel] = React.useState(
    initialValues.embeddingModel
  );
  const [embeddingDimensions, setEmbeddingDimensions] = React.useState(
    initialValues.embeddingDimensions
  );
  const [embeddingVersion, setEmbeddingVersion] = React.useState(
    initialValues.embeddingVersion
  );
  const [embeddingWordCount, setEmbeddingWordCount] = React.useState(
    initialValues.embeddingWordCount
  );
  const [moderationStatus, setModerationStatus] = React.useState(
    initialValues.moderationStatus
  );
  const [moderationFlags, setModerationFlags] = React.useState(
    initialValues.moderationFlags
  );
  const [moderationCheckedAt, setModerationCheckedAt] = React.useState(
    initialValues.moderationCheckedAt
  );
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
    setAudioWaveformData(
      typeof cleanValues.audioWaveformData === "string" ||
        cleanValues.audioWaveformData === null
        ? cleanValues.audioWaveformData
        : JSON.stringify(cleanValues.audioWaveformData)
    );
    setAnswerAudio(cleanValues.answerAudio ?? []);
    setCurrentAnswerAudioValue("");
    setAnswerAudioWaveformData(
      typeof cleanValues.answerAudioWaveformData === "string" ||
        cleanValues.answerAudioWaveformData === null
        ? cleanValues.answerAudioWaveformData
        : JSON.stringify(cleanValues.answerAudioWaveformData)
    );
    setGenerated(cleanValues.generated);
    setModel(cleanValues.model);
    setPromptHex(cleanValues.promptHex);
    setByPromptHex(cleanValues.byPromptHex);
    setThumbnail(cleanValues.thumbnail);
    setDifficulty(cleanValues.difficulty);
    setMetadata(cleanValues.metadata);
    setImportedAt(cleanValues.importedAt);
    setEmbedding(cleanValues.embedding ?? []);
    setCurrentEmbeddingValue("");
    setEmbeddingModel(cleanValues.embeddingModel);
    setEmbeddingDimensions(cleanValues.embeddingDimensions);
    setEmbeddingVersion(cleanValues.embeddingVersion);
    setEmbeddingWordCount(cleanValues.embeddingWordCount);
    setModerationStatus(cleanValues.moderationStatus);
    setModerationFlags(
      typeof cleanValues.moderationFlags === "string" ||
        cleanValues.moderationFlags === null
        ? cleanValues.moderationFlags
        : JSON.stringify(cleanValues.moderationFlags)
    );
    setModerationCheckedAt(cleanValues.moderationCheckedAt);
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
  const [currentEmbeddingValue, setCurrentEmbeddingValue] = React.useState("");
  const embeddingRef = React.createRef();
  const validations = {
    owner: [],
    identityId: [],
    answer: [],
    hint: [],
    prompt: [],
    audio: [],
    audioWaveformData: [{ type: "JSON" }],
    answerAudio: [],
    answerAudioWaveformData: [{ type: "JSON" }],
    generated: [],
    model: [],
    promptHex: [],
    byPromptHex: [],
    thumbnail: [],
    difficulty: [],
    metadata: [],
    importedAt: [],
    embedding: [],
    embeddingModel: [],
    embeddingDimensions: [],
    embeddingVersion: [],
    embeddingWordCount: [],
    moderationStatus: [],
    moderationFlags: [{ type: "JSON" }],
    moderationCheckedAt: [],
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
  const convertTimeStampToDate = (ts) => {
    if (Math.abs(Date.now() - ts) < Math.abs(Date.now() - ts * 1000)) {
      return new Date(ts);
    }
    return new Date(ts * 1000);
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
          answer,
          hint,
          prompt,
          audio,
          audioWaveformData,
          answerAudio,
          answerAudioWaveformData,
          generated,
          model,
          promptHex,
          byPromptHex,
          thumbnail,
          difficulty,
          metadata,
          importedAt,
          embedding,
          embeddingModel,
          embeddingDimensions,
          embeddingVersion,
          embeddingWordCount,
          moderationStatus,
          moderationFlags,
          moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
      <TextAreaField
        label="Audio waveform data"
        isRequired={false}
        isReadOnly={false}
        value={audioWaveformData}
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
              audioWaveformData: value,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.audioWaveformData ?? value;
          }
          if (errors.audioWaveformData?.hasError) {
            runValidationTasks("audioWaveformData", value);
          }
          setAudioWaveformData(value);
        }}
        onBlur={() =>
          runValidationTasks("audioWaveformData", audioWaveformData)
        }
        errorMessage={errors.audioWaveformData?.errorMessage}
        hasError={errors.audioWaveformData?.hasError}
        {...getOverrideProps(overrides, "audioWaveformData")}
      ></TextAreaField>
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
              audioWaveformData,
              answerAudio: values,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
      <TextAreaField
        label="Answer audio waveform data"
        isRequired={false}
        isReadOnly={false}
        value={answerAudioWaveformData}
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData: value,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.answerAudioWaveformData ?? value;
          }
          if (errors.answerAudioWaveformData?.hasError) {
            runValidationTasks("answerAudioWaveformData", value);
          }
          setAnswerAudioWaveformData(value);
        }}
        onBlur={() =>
          runValidationTasks("answerAudioWaveformData", answerAudioWaveformData)
        }
        errorMessage={errors.answerAudioWaveformData?.errorMessage}
        hasError={errors.answerAudioWaveformData?.hasError}
        {...getOverrideProps(overrides, "answerAudioWaveformData")}
      ></TextAreaField>
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated: value,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model: value,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex: value,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex: value,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail: value,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
      <TextField
        label="Difficulty"
        isRequired={false}
        isReadOnly={false}
        value={difficulty}
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty: value,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.difficulty ?? value;
          }
          if (errors.difficulty?.hasError) {
            runValidationTasks("difficulty", value);
          }
          setDifficulty(value);
        }}
        onBlur={() => runValidationTasks("difficulty", difficulty)}
        errorMessage={errors.difficulty?.errorMessage}
        hasError={errors.difficulty?.hasError}
        {...getOverrideProps(overrides, "difficulty")}
      ></TextField>
      <TextField
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
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata: value,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
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
      ></TextField>
      <TextField
        label="Imported at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={importedAt && convertToLocal(new Date(importedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt: value,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.importedAt ?? value;
          }
          if (errors.importedAt?.hasError) {
            runValidationTasks("importedAt", value);
          }
          setImportedAt(value);
        }}
        onBlur={() => runValidationTasks("importedAt", importedAt)}
        errorMessage={errors.importedAt?.errorMessage}
        hasError={errors.importedAt?.hasError}
        {...getOverrideProps(overrides, "importedAt")}
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
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding: values,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            values = result?.embedding ?? values;
          }
          setEmbedding(values);
          setCurrentEmbeddingValue("");
        }}
        currentFieldValue={currentEmbeddingValue}
        label={"Embedding"}
        items={embedding}
        hasError={errors?.embedding?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("embedding", currentEmbeddingValue)
        }
        errorMessage={errors?.embedding?.errorMessage}
        setFieldValue={setCurrentEmbeddingValue}
        inputFieldRef={embeddingRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Embedding"
          isRequired={false}
          isReadOnly={false}
          type="number"
          step="any"
          value={currentEmbeddingValue}
          onChange={(e) => {
            let value = isNaN(parseFloat(e.target.value))
              ? e.target.value
              : parseFloat(e.target.value);
            if (errors.embedding?.hasError) {
              runValidationTasks("embedding", value);
            }
            setCurrentEmbeddingValue(value);
          }}
          onBlur={() => runValidationTasks("embedding", currentEmbeddingValue)}
          errorMessage={errors.embedding?.errorMessage}
          hasError={errors.embedding?.hasError}
          ref={embeddingRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "embedding")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Embedding model"
        isRequired={false}
        isReadOnly={false}
        value={embeddingModel}
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel: value,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.embeddingModel ?? value;
          }
          if (errors.embeddingModel?.hasError) {
            runValidationTasks("embeddingModel", value);
          }
          setEmbeddingModel(value);
        }}
        onBlur={() => runValidationTasks("embeddingModel", embeddingModel)}
        errorMessage={errors.embeddingModel?.errorMessage}
        hasError={errors.embeddingModel?.hasError}
        {...getOverrideProps(overrides, "embeddingModel")}
      ></TextField>
      <TextField
        label="Embedding dimensions"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={embeddingDimensions}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions: value,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.embeddingDimensions ?? value;
          }
          if (errors.embeddingDimensions?.hasError) {
            runValidationTasks("embeddingDimensions", value);
          }
          setEmbeddingDimensions(value);
        }}
        onBlur={() =>
          runValidationTasks("embeddingDimensions", embeddingDimensions)
        }
        errorMessage={errors.embeddingDimensions?.errorMessage}
        hasError={errors.embeddingDimensions?.hasError}
        {...getOverrideProps(overrides, "embeddingDimensions")}
      ></TextField>
      <TextField
        label="Embedding version"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          embeddingVersion &&
          convertToLocal(convertTimeStampToDate(embeddingVersion))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : Number(new Date(e.target.value));
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion: value,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.embeddingVersion ?? value;
          }
          if (errors.embeddingVersion?.hasError) {
            runValidationTasks("embeddingVersion", value);
          }
          setEmbeddingVersion(value);
        }}
        onBlur={() => runValidationTasks("embeddingVersion", embeddingVersion)}
        errorMessage={errors.embeddingVersion?.errorMessage}
        hasError={errors.embeddingVersion?.hasError}
        {...getOverrideProps(overrides, "embeddingVersion")}
      ></TextField>
      <TextField
        label="Embedding word count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={embeddingWordCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount: value,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.embeddingWordCount ?? value;
          }
          if (errors.embeddingWordCount?.hasError) {
            runValidationTasks("embeddingWordCount", value);
          }
          setEmbeddingWordCount(value);
        }}
        onBlur={() =>
          runValidationTasks("embeddingWordCount", embeddingWordCount)
        }
        errorMessage={errors.embeddingWordCount?.errorMessage}
        hasError={errors.embeddingWordCount?.hasError}
        {...getOverrideProps(overrides, "embeddingWordCount")}
      ></TextField>
      <TextField
        label="Moderation status"
        isRequired={false}
        isReadOnly={false}
        value={moderationStatus}
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus: value,
              moderationFlags,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.moderationStatus ?? value;
          }
          if (errors.moderationStatus?.hasError) {
            runValidationTasks("moderationStatus", value);
          }
          setModerationStatus(value);
        }}
        onBlur={() => runValidationTasks("moderationStatus", moderationStatus)}
        errorMessage={errors.moderationStatus?.errorMessage}
        hasError={errors.moderationStatus?.hasError}
        {...getOverrideProps(overrides, "moderationStatus")}
      ></TextField>
      <TextAreaField
        label="Moderation flags"
        isRequired={false}
        isReadOnly={false}
        value={moderationFlags}
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
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags: value,
              moderationCheckedAt,
            };
            const result = onChange(modelFields);
            value = result?.moderationFlags ?? value;
          }
          if (errors.moderationFlags?.hasError) {
            runValidationTasks("moderationFlags", value);
          }
          setModerationFlags(value);
        }}
        onBlur={() => runValidationTasks("moderationFlags", moderationFlags)}
        errorMessage={errors.moderationFlags?.errorMessage}
        hasError={errors.moderationFlags?.hasError}
        {...getOverrideProps(overrides, "moderationFlags")}
      ></TextAreaField>
      <TextField
        label="Moderation checked at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          moderationCheckedAt && convertToLocal(new Date(moderationCheckedAt))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              owner,
              identityId,
              answer,
              hint,
              prompt,
              audio,
              audioWaveformData,
              answerAudio,
              answerAudioWaveformData,
              generated,
              model,
              promptHex,
              byPromptHex,
              thumbnail,
              difficulty,
              metadata,
              importedAt,
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
              moderationStatus,
              moderationFlags,
              moderationCheckedAt: value,
            };
            const result = onChange(modelFields);
            value = result?.moderationCheckedAt ?? value;
          }
          if (errors.moderationCheckedAt?.hasError) {
            runValidationTasks("moderationCheckedAt", value);
          }
          setModerationCheckedAt(value);
        }}
        onBlur={() =>
          runValidationTasks("moderationCheckedAt", moderationCheckedAt)
        }
        errorMessage={errors.moderationCheckedAt?.errorMessage}
        hasError={errors.moderationCheckedAt?.hasError}
        {...getOverrideProps(overrides, "moderationCheckedAt")}
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
