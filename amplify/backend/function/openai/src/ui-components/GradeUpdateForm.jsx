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
import { Grade } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function GradeUpdateForm(props) {
  const {
    id: idProp,
    grade: gradeModelProp,
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
    instructor: "",
    unitVersion: "",
    data: "",
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
  const [instructor, setInstructor] = React.useState(initialValues.instructor);
  const [unitVersion, setUnitVersion] = React.useState(
    initialValues.unitVersion
  );
  const [data, setData] = React.useState(initialValues.data);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = gradeRecord
      ? { ...initialValues, ...gradeRecord }
      : initialValues;
    setPercentComplete(cleanValues.percentComplete);
    setAccuracy(cleanValues.accuracy);
    setTimerStarted(cleanValues.timerStarted);
    setComplete(cleanValues.complete);
    setOwner(cleanValues.owner);
    setInstructor(cleanValues.instructor);
    setUnitVersion(cleanValues.unitVersion);
    setData(
      typeof cleanValues.data === "string" || cleanValues.data === null
        ? cleanValues.data
        : JSON.stringify(cleanValues.data)
    );
    setErrors({});
  };
  const [gradeRecord, setGradeRecord] = React.useState(gradeModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Grade, idProp)
        : gradeModelProp;
      setGradeRecord(record);
    };
    queryData();
  }, [idProp, gradeModelProp]);
  React.useEffect(resetStateValues, [gradeRecord]);
  const validations = {
    percentComplete: [],
    accuracy: [],
    timerStarted: [],
    complete: [],
    owner: [],
    instructor: [],
    unitVersion: [],
    data: [{ type: "JSON" }],
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
          instructor,
          unitVersion,
          data,
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
            Grade.copyOf(gradeRecord, (updated) => {
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
      {...getOverrideProps(overrides, "GradeUpdateForm")}
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
              instructor,
              unitVersion,
              data,
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
              instructor,
              unitVersion,
              data,
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
              instructor,
              unitVersion,
              data,
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
              instructor,
              unitVersion,
              data,
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
              instructor,
              unitVersion,
              data,
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
              instructor: value,
              unitVersion,
              data,
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
              instructor,
              unitVersion: value,
              data,
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
        value={data}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              percentComplete,
              accuracy,
              timerStarted,
              complete,
              owner,
              instructor,
              unitVersion,
              data: value,
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
          isDisabled={!(idProp || gradeModelProp)}
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
              !(idProp || gradeModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
