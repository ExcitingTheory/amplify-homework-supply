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
import { Book } from "../models";
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
export default function BookCreateForm(props) {
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
    phrase: "",
    owner: "",
    identityId: "",
    hex: "",
    audio: [],
    generateAudio: false,
    description: "",
  };
  const [phrase, setPhrase] = React.useState(initialValues.phrase);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [hex, setHex] = React.useState(initialValues.hex);
  const [audio, setAudio] = React.useState(initialValues.audio);
  const [generateAudio, setGenerateAudio] = React.useState(
    initialValues.generateAudio
  );
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setPhrase(initialValues.phrase);
    setOwner(initialValues.owner);
    setIdentityId(initialValues.identityId);
    setHex(initialValues.hex);
    setAudio(initialValues.audio);
    setCurrentAudioValue("");
    setGenerateAudio(initialValues.generateAudio);
    setDescription(initialValues.description);
    setErrors({});
  };
  const [currentAudioValue, setCurrentAudioValue] = React.useState("");
  const audioRef = React.createRef();
  const validations = {
    phrase: [],
    owner: [],
    identityId: [],
    hex: [],
    audio: [],
    generateAudio: [],
    description: [],
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
          hex,
          audio,
          generateAudio,
          description,
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
          await DataStore.save(new Book(modelFields));
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
      {...getOverrideProps(overrides, "BookCreateForm")}
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
              hex,
              audio,
              generateAudio,
              description,
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
              hex,
              audio,
              generateAudio,
              description,
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
              hex,
              audio,
              generateAudio,
              description,
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
        label="Hex"
        isRequired={false}
        isReadOnly={false}
        value={hex}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              hex: value,
              audio,
              generateAudio,
              description,
            };
            const result = onChange(modelFields);
            value = result?.hex ?? value;
          }
          if (errors.hex?.hasError) {
            runValidationTasks("hex", value);
          }
          setHex(value);
        }}
        onBlur={() => runValidationTasks("hex", hex)}
        errorMessage={errors.hex?.errorMessage}
        hasError={errors.hex?.hasError}
        {...getOverrideProps(overrides, "hex")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              hex,
              audio: values,
              generateAudio,
              description,
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
      <SwitchField
        label="Generate audio"
        defaultChecked={false}
        isDisabled={false}
        isChecked={generateAudio}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              hex,
              audio,
              generateAudio: value,
              description,
            };
            const result = onChange(modelFields);
            value = result?.generateAudio ?? value;
          }
          if (errors.generateAudio?.hasError) {
            runValidationTasks("generateAudio", value);
          }
          setGenerateAudio(value);
        }}
        onBlur={() => runValidationTasks("generateAudio", generateAudio)}
        errorMessage={errors.generateAudio?.errorMessage}
        hasError={errors.generateAudio?.hasError}
        {...getOverrideProps(overrides, "generateAudio")}
      ></SwitchField>
      <TextField
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              phrase,
              owner,
              identityId,
              hex,
              audio,
              generateAudio,
              description: value,
            };
            const result = onChange(modelFields);
            value = result?.description ?? value;
          }
          if (errors.description?.hasError) {
            runValidationTasks("description", value);
          }
          setDescription(value);
        }}
        onBlur={() => runValidationTasks("description", description)}
        errorMessage={errors.description?.errorMessage}
        hasError={errors.description?.hasError}
        {...getOverrideProps(overrides, "description")}
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
