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
  SelectField,
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { Unit } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function UnitCreateForm(props) {
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
    number: "",
    name: "",
    owner: "",
    description: "",
    data: "",
    status: "",
    timeLimitSeconds: "",
    featuredImage: "",
    identityId: "",
    thumbnail: "",
  };
  const [number, setNumber] = React.useState(initialValues.number);
  const [name, setName] = React.useState(initialValues.name);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [data, setData] = React.useState(initialValues.data);
  const [status, setStatus] = React.useState(initialValues.status);
  const [timeLimitSeconds, setTimeLimitSeconds] = React.useState(
    initialValues.timeLimitSeconds
  );
  const [featuredImage, setFeaturedImage] = React.useState(
    initialValues.featuredImage
  );
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [thumbnail, setThumbnail] = React.useState(initialValues.thumbnail);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setNumber(initialValues.number);
    setName(initialValues.name);
    setOwner(initialValues.owner);
    setDescription(initialValues.description);
    setData(initialValues.data);
    setStatus(initialValues.status);
    setTimeLimitSeconds(initialValues.timeLimitSeconds);
    setFeaturedImage(initialValues.featuredImage);
    setIdentityId(initialValues.identityId);
    setThumbnail(initialValues.thumbnail);
    setErrors({});
  };
  const validations = {
    number: [],
    name: [],
    owner: [],
    description: [],
    data: [{ type: "JSON" }],
    status: [],
    timeLimitSeconds: [],
    featuredImage: [],
    identityId: [],
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
          number,
          name,
          owner,
          description,
          data,
          status,
          timeLimitSeconds,
          featuredImage,
          identityId,
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
          await DataStore.save(new Unit(modelFields));
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
      {...getOverrideProps(overrides, "UnitCreateForm")}
      {...rest}
    >
      <TextField
        label="Number"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={number}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              number: value,
              name,
              owner,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.number ?? value;
          }
          if (errors.number?.hasError) {
            runValidationTasks("number", value);
          }
          setNumber(value);
        }}
        onBlur={() => runValidationTasks("number", number)}
        errorMessage={errors.number?.errorMessage}
        hasError={errors.number?.hasError}
        {...getOverrideProps(overrides, "number")}
      ></TextField>
      <TextField
        label="Name"
        isRequired={false}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name: value,
              owner,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
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
              number,
              name,
              owner: value,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
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
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description: value,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
              thumbnail,
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
      <TextAreaField
        label="Data"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description,
              data: value,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
              thumbnail,
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
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description,
              data,
              status: value,
              timeLimitSeconds,
              featuredImage,
              identityId,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      >
        <option
          children="Draft"
          value="DRAFT"
          {...getOverrideProps(overrides, "statusoption0")}
        ></option>
        <option
          children="Published"
          value="PUBLISHED"
          {...getOverrideProps(overrides, "statusoption1")}
        ></option>
        <option
          children="Archived"
          value="ARCHIVED"
          {...getOverrideProps(overrides, "statusoption2")}
        ></option>
      </SelectField>
      <TextField
        label="Time limit seconds"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={timeLimitSeconds}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description,
              data,
              status,
              timeLimitSeconds: value,
              featuredImage,
              identityId,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.timeLimitSeconds ?? value;
          }
          if (errors.timeLimitSeconds?.hasError) {
            runValidationTasks("timeLimitSeconds", value);
          }
          setTimeLimitSeconds(value);
        }}
        onBlur={() => runValidationTasks("timeLimitSeconds", timeLimitSeconds)}
        errorMessage={errors.timeLimitSeconds?.errorMessage}
        hasError={errors.timeLimitSeconds?.hasError}
        {...getOverrideProps(overrides, "timeLimitSeconds")}
      ></TextField>
      <TextField
        label="Featured image"
        isRequired={false}
        isReadOnly={false}
        value={featuredImage}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage: value,
              identityId,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.featuredImage ?? value;
          }
          if (errors.featuredImage?.hasError) {
            runValidationTasks("featuredImage", value);
          }
          setFeaturedImage(value);
        }}
        onBlur={() => runValidationTasks("featuredImage", featuredImage)}
        errorMessage={errors.featuredImage?.errorMessage}
        hasError={errors.featuredImage?.hasError}
        {...getOverrideProps(overrides, "featuredImage")}
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
              number,
              name,
              owner,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId: value,
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
        label="Thumbnail"
        isRequired={false}
        isReadOnly={false}
        value={thumbnail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              number,
              name,
              owner,
              description,
              data,
              status,
              timeLimitSeconds,
              featuredImage,
              identityId,
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
