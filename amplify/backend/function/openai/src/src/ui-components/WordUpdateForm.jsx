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
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Word } from "../models";
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
export default function WordUpdateForm(props) {
  const {
    id: idProp,
    word: wordModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    phrase: "",
    owner: "",
    identityId: "",
    pronunciation: "",
    definition: "",
    audio: [],
    definitionAudio: [],
    rubyTags: "",
  };
  const [phrase, setPhrase] = React.useState(initialValues.phrase);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [pronunciation, setPronunciation] = React.useState(
    initialValues.pronunciation
  );
  const [definition, setDefinition] = React.useState(initialValues.definition);
  const [audio, setAudio] = React.useState(initialValues.audio);
  const [definitionAudio, setDefinitionAudio] = React.useState(
    initialValues.definitionAudio
  );
  const [rubyTags, setRubyTags] = React.useState(initialValues.rubyTags);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = wordRecord
      ? { ...initialValues, ...wordRecord }
      : initialValues;
    setPhrase(cleanValues.phrase);
    setOwner(cleanValues.owner);
    setIdentityId(cleanValues.identityId);
    setPronunciation(cleanValues.pronunciation);
    setDefinition(cleanValues.definition);
    setAudio(cleanValues.audio ?? []);
    setCurrentAudioValue("");
    setDefinitionAudio(cleanValues.definitionAudio ?? []);
    setCurrentDefinitionAudioValue("");
    setRubyTags(cleanValues.rubyTags);
    setErrors({});
  };
  const [wordRecord, setWordRecord] = React.useState(wordModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Word, idProp)
        : wordModelProp;
      setWordRecord(record);
    };
    queryData();
  }, [idProp, wordModelProp]);
  React.useEffect(resetStateValues, [wordRecord]);
  const [currentAudioValue, setCurrentAudioValue] = React.useState("");
  const audioRef = React.createRef();
  const [currentDefinitionAudioValue, setCurrentDefinitionAudioValue] =
    React.useState("");
  const definitionAudioRef = React.createRef();
  const validations = {
    phrase: [],
    owner: [],
    identityId: [],
    pronunciation: [],
    definition: [],
    audio: [],
    definitionAudio: [],
    rubyTags: [],
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
          phrase,
          owner,
          identityId,
          pronunciation,
          definition,
          audio,
          definitionAudio,
          rubyTags,
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
            Word.copyOf(wordRecord, (updated) => {
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
      {...getOverrideProps(overrides, "WordUpdateForm")}
      {...rest}
    >
      <TextField
        label="Phrase"
        isRequired={false}
        isReadOnly={false}
        value={phrase}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase: value,
              owner,
              identityId,
              pronunciation,
              definition,
              audio,
              definitionAudio,
              rubyTags,
            };
            const result = onChange(modelFields);
            value = result?.phrase ?? value;
          }
          if (errors.phrase?.hasError) {
            runValidationTasks("phrase", value);
          }
          setPhrase(value);
        }}
        onBlur={() => runValidationTasks("phrase", phrase)}
        errorMessage={errors.phrase?.errorMessage}
        hasError={errors.phrase?.hasError}
        {...getOverrideProps(overrides, "phrase")}
      ></TextField>
      <TextField
        label="Owner"
        isRequired={false}
        isReadOnly={false}
        value={owner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner: value,
              identityId,
              pronunciation,
              definition,
              audio,
              definitionAudio,
              rubyTags,
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
              phrase,
              owner,
              identityId: value,
              pronunciation,
              definition,
              audio,
              definitionAudio,
              rubyTags,
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
        label="Pronunciation"
        isRequired={false}
        isReadOnly={false}
        value={pronunciation}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              pronunciation: value,
              definition,
              audio,
              definitionAudio,
              rubyTags,
            };
            const result = onChange(modelFields);
            value = result?.pronunciation ?? value;
          }
          if (errors.pronunciation?.hasError) {
            runValidationTasks("pronunciation", value);
          }
          setPronunciation(value);
        }}
        onBlur={() => runValidationTasks("pronunciation", pronunciation)}
        errorMessage={errors.pronunciation?.errorMessage}
        hasError={errors.pronunciation?.hasError}
        {...getOverrideProps(overrides, "pronunciation")}
      ></TextField>
      <TextField
        label="Definition"
        isRequired={false}
        isReadOnly={false}
        value={definition}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              pronunciation,
              definition: value,
              audio,
              definitionAudio,
              rubyTags,
            };
            const result = onChange(modelFields);
            value = result?.definition ?? value;
          }
          if (errors.definition?.hasError) {
            runValidationTasks("definition", value);
          }
          setDefinition(value);
        }}
        onBlur={() => runValidationTasks("definition", definition)}
        errorMessage={errors.definition?.errorMessage}
        hasError={errors.definition?.hasError}
        {...getOverrideProps(overrides, "definition")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              pronunciation,
              definition,
              audio: values,
              definitionAudio,
              rubyTags,
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
              phrase,
              owner,
              identityId,
              pronunciation,
              definition,
              audio,
              definitionAudio: values,
              rubyTags,
            };
            const result = onChange(modelFields);
            values = result?.definitionAudio ?? values;
          }
          setDefinitionAudio(values);
          setCurrentDefinitionAudioValue("");
        }}
        currentFieldValue={currentDefinitionAudioValue}
        label={"Definition audio"}
        items={definitionAudio}
        hasError={errors?.definitionAudio?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "definitionAudio",
            currentDefinitionAudioValue
          )
        }
        errorMessage={errors?.definitionAudio?.errorMessage}
        setFieldValue={setCurrentDefinitionAudioValue}
        inputFieldRef={definitionAudioRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Definition audio"
          isRequired={false}
          isReadOnly={false}
          value={currentDefinitionAudioValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.definitionAudio?.hasError) {
              runValidationTasks("definitionAudio", value);
            }
            setCurrentDefinitionAudioValue(value);
          }}
          onBlur={() =>
            runValidationTasks("definitionAudio", currentDefinitionAudioValue)
          }
          errorMessage={errors.definitionAudio?.errorMessage}
          hasError={errors.definitionAudio?.hasError}
          ref={definitionAudioRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "definitionAudio")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Ruby tags"
        isRequired={false}
        isReadOnly={false}
        value={rubyTags}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              pronunciation,
              definition,
              audio,
              definitionAudio,
              rubyTags: value,
            };
            const result = onChange(modelFields);
            value = result?.rubyTags ?? value;
          }
          if (errors.rubyTags?.hasError) {
            runValidationTasks("rubyTags", value);
          }
          setRubyTags(value);
        }}
        onBlur={() => runValidationTasks("rubyTags", rubyTags)}
        errorMessage={errors.rubyTags?.errorMessage}
        hasError={errors.rubyTags?.hasError}
        {...getOverrideProps(overrides, "rubyTags")}
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
          isDisabled={!(idProp || wordModelProp)}
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
              !(idProp || wordModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
