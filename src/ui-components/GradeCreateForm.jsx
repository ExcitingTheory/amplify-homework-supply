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
import { Grade } from "../models";
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
export default function GradeCreateForm(props) {
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
    percentComplete: "",
    accuracy: "",
    timerStarted: false,
    complete: false,
    owner: "",
    identityId: "",
    instructor: "",
    unitVersion: "",
    data: "",
    feedback: "",
    files: [],
  };
  const [percentComplete, setPercentComplete] = React.useState(
    initialValues.percentComplete
  );
  const [accuracy, setAccuracy] = React.useState(initialValues.accuracy);
  const [timerStarted, setTimerStarted] = React.useState(
    initialValues.timerStarted
  );
  const [complete, setComplete] = React.useState(initialValues.complete);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [instructor, setInstructor] = React.useState(initialValues.instructor);
  const [unitVersion, setUnitVersion] = React.useState(
    initialValues.unitVersion
  );
  const [data, setData] = React.useState(initialValues.data);
  const [feedback, setFeedback] = React.useState(initialValues.feedback);
  const [files, setFiles] = React.useState(initialValues.files);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setPercentComplete(initialValues.percentComplete);
    setAccuracy(initialValues.accuracy);
    setTimerStarted(initialValues.timerStarted);
    setComplete(initialValues.complete);
    setOwner(initialValues.owner);
    setIdentityId(initialValues.identityId);
    setInstructor(initialValues.instructor);
    setUnitVersion(initialValues.unitVersion);
    setData(initialValues.data);
    setFeedback(initialValues.feedback);
    setFiles(initialValues.files);
    setCurrentFilesValue("");
    setErrors({});
  };
  const [currentFilesValue, setCurrentFilesValue] = React.useState("");
  const filesRef = React.createRef();
  const validations = {
    percentComplete: [],
    accuracy: [],
    timerStarted: [],
    complete: [],
    owner: [],
    identityId: [],
    instructor: [],
    unitVersion: [],
    data: [{ type: "JSON" }],
    feedback: [{ type: "JSON" }],
    files: [],
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
          percentComplete,
          accuracy,
          timerStarted,
          complete,
          owner,
          identityId,
          instructor,
          unitVersion,
          data,
          feedback,
          files,
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
          await DataStore.save(new Grade(modelFields));
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
      {...getOverrideProps(overrides, "GradeCreateForm")}
      {...rest}
    >
      <TextField
        label="Percent complete"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={percentComplete}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              percentComplete: value,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.percentComplete ?? value;
          }
          if (errors.percentComplete?.hasError) {
            runValidationTasks("percentComplete", value);
          }
          setPercentComplete(value);
        }}
        onBlur={() => runValidationTasks("percentComplete", percentComplete)}
        errorMessage={errors.percentComplete?.errorMessage}
        hasError={errors.percentComplete?.hasError}
        {...getOverrideProps(overrides, "percentComplete")}
      ></TextField>
      <TextField
        label="Accuracy"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={accuracy}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy: value,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.accuracy ?? value;
          }
          if (errors.accuracy?.hasError) {
            runValidationTasks("accuracy", value);
          }
          setAccuracy(value);
        }}
        onBlur={() => runValidationTasks("accuracy", accuracy)}
        errorMessage={errors.accuracy?.errorMessage}
        hasError={errors.accuracy?.hasError}
        {...getOverrideProps(overrides, "accuracy")}
      ></TextField>
      <SwitchField
        label="Timer started"
        defaultChecked={false}
        isDisabled={false}
        isChecked={timerStarted}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted: value,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.timerStarted ?? value;
          }
          if (errors.timerStarted?.hasError) {
            runValidationTasks("timerStarted", value);
          }
          setTimerStarted(value);
        }}
        onBlur={() => runValidationTasks("timerStarted", timerStarted)}
        errorMessage={errors.timerStarted?.errorMessage}
        hasError={errors.timerStarted?.hasError}
        {...getOverrideProps(overrides, "timerStarted")}
      ></SwitchField>
      <SwitchField
        label="Complete"
        defaultChecked={false}
        isDisabled={false}
        isChecked={complete}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete: value,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.complete ?? value;
          }
          if (errors.complete?.hasError) {
            runValidationTasks("complete", value);
          }
          setComplete(value);
        }}
        onBlur={() => runValidationTasks("complete", complete)}
        errorMessage={errors.complete?.errorMessage}
        hasError={errors.complete?.hasError}
        {...getOverrideProps(overrides, "complete")}
      ></SwitchField>
      <TextField
        label="Owner"
        isRequired={false}
        isReadOnly={false}
        value={owner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner: value,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
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
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId: value,
              instructor,
              unitVersion,
              data,
              feedback,
              files,
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
        label="Instructor"
        isRequired={false}
        isReadOnly={false}
        value={instructor}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor: value,
              unitVersion,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.instructor ?? value;
          }
          if (errors.instructor?.hasError) {
            runValidationTasks("instructor", value);
          }
          setInstructor(value);
        }}
        onBlur={() => runValidationTasks("instructor", instructor)}
        errorMessage={errors.instructor?.errorMessage}
        hasError={errors.instructor?.hasError}
        {...getOverrideProps(overrides, "instructor")}
      ></TextField>
      <TextField
        label="Unit version"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={unitVersion}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion: value,
              data,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.unitVersion ?? value;
          }
          if (errors.unitVersion?.hasError) {
            runValidationTasks("unitVersion", value);
          }
          setUnitVersion(value);
        }}
        onBlur={() => runValidationTasks("unitVersion", unitVersion)}
        errorMessage={errors.unitVersion?.errorMessage}
        hasError={errors.unitVersion?.hasError}
        {...getOverrideProps(overrides, "unitVersion")}
      ></TextField>
      <TextAreaField
        label="Data"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data: value,
              feedback,
              files,
            };
            const result = onChange(modelFields);
            value = result?.data ?? value;
          }
          if (errors.data?.hasError) {
            runValidationTasks("data", value);
          }
          setData(value);
        }}
        onBlur={() => runValidationTasks("data", data)}
        errorMessage={errors.data?.errorMessage}
        hasError={errors.data?.hasError}
        {...getOverrideProps(overrides, "data")}
      ></TextAreaField>
      <TextAreaField
        label="Feedback"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback: value,
              files,
            };
            const result = onChange(modelFields);
            value = result?.feedback ?? value;
          }
          if (errors.feedback?.hasError) {
            runValidationTasks("feedback", value);
          }
          setFeedback(value);
        }}
        onBlur={() => runValidationTasks("feedback", feedback)}
        errorMessage={errors.feedback?.errorMessage}
        hasError={errors.feedback?.hasError}
        {...getOverrideProps(overrides, "feedback")}
      ></TextAreaField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              identityId,
              instructor,
              unitVersion,
              data,
              feedback,
              files: values,
            };
            const result = onChange(modelFields);
            values = result?.files ?? values;
          }
          setFiles(values);
          setCurrentFilesValue("");
        }}
        currentFieldValue={currentFilesValue}
        label={"Files"}
        items={files}
        hasError={errors?.files?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("files", currentFilesValue)
        }
        errorMessage={errors?.files?.errorMessage}
        setFieldValue={setCurrentFilesValue}
        inputFieldRef={filesRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Files"
          isRequired={false}
          isReadOnly={false}
          value={currentFilesValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.files?.hasError) {
              runValidationTasks("files", value);
            }
            setCurrentFilesValue(value);
          }}
          onBlur={() => runValidationTasks("files", currentFilesValue)}
          errorMessage={errors.files?.errorMessage}
          hasError={errors.files?.hasError}
          ref={filesRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "files")}
        ></TextField>
      </ArrayField>
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
