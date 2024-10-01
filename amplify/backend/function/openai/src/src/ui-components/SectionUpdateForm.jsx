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
  TextField,
} from "@aws-amplify/ui-react";
import { Section } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function SectionUpdateForm(props) {
  const {
    id: idProp,
    section: sectionModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    name: "",
    owner: "",
    learner: "",
    description: "",
    status: "",
    code: "",
    featuredImage: "",
    identityId: "",
    thumbnail: "",
    backgroundColor: "",
  };
  const [name, setName] = React.useState(initialValues.name);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [learner, setLearner] = React.useState(initialValues.learner);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [status, setStatus] = React.useState(initialValues.status);
  const [code, setCode] = React.useState(initialValues.code);
  const [featuredImage, setFeaturedImage] = React.useState(
    initialValues.featuredImage
  );
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [thumbnail, setThumbnail] = React.useState(initialValues.thumbnail);
  const [backgroundColor, setBackgroundColor] = React.useState(
    initialValues.backgroundColor
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = sectionRecord
      ? { ...initialValues, ...sectionRecord }
      : initialValues;
    setName(cleanValues.name);
    setOwner(cleanValues.owner);
    setLearner(cleanValues.learner);
    setDescription(cleanValues.description);
    setStatus(cleanValues.status);
    setCode(cleanValues.code);
    setFeaturedImage(cleanValues.featuredImage);
    setIdentityId(cleanValues.identityId);
    setThumbnail(cleanValues.thumbnail);
    setBackgroundColor(cleanValues.backgroundColor);
    setErrors({});
  };
  const [sectionRecord, setSectionRecord] = React.useState(sectionModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Section, idProp)
        : sectionModelProp;
      setSectionRecord(record);
    };
    queryData();
  }, [idProp, sectionModelProp]);
  React.useEffect(resetStateValues, [sectionRecord]);
  const validations = {
    name: [],
    owner: [],
    learner: [],
    description: [],
    status: [],
    code: [],
    featuredImage: [],
    identityId: [],
    thumbnail: [],
    backgroundColor: [],
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
          name,
          owner,
          learner,
          description,
          status,
          code,
          featuredImage,
          identityId,
          thumbnail,
          backgroundColor,
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
            Section.copyOf(sectionRecord, (updated) => {
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
      {...getOverrideProps(overrides, "SectionUpdateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={false}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              owner,
              learner,
              description,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
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
              name,
              owner: value,
              learner,
              description,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
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
        label="Learner"
        isRequired={false}
        isReadOnly={false}
        value={learner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              learner: value,
              description,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
            };
            const result = onChange(modelFields);
            value = result?.learner ?? value;
          }
          if (errors.learner?.hasError) {
            runValidationTasks("learner", value);
          }
          setLearner(value);
        }}
        onBlur={() => runValidationTasks("learner", learner)}
        errorMessage={errors.learner?.errorMessage}
        hasError={errors.learner?.hasError}
        {...getOverrideProps(overrides, "learner")}
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
              name,
              owner,
              learner,
              description: value,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
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
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              learner,
              description,
              status: value,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
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
        label="Code"
        isRequired={false}
        isReadOnly={false}
        value={code}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              learner,
              description,
              status,
              code: value,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor,
            };
            const result = onChange(modelFields);
            value = result?.code ?? value;
          }
          if (errors.code?.hasError) {
            runValidationTasks("code", value);
          }
          setCode(value);
        }}
        onBlur={() => runValidationTasks("code", code)}
        errorMessage={errors.code?.errorMessage}
        hasError={errors.code?.hasError}
        {...getOverrideProps(overrides, "code")}
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
              name,
              owner,
              learner,
              description,
              status,
              code,
              featuredImage: value,
              identityId,
              thumbnail,
              backgroundColor,
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
              name,
              owner,
              learner,
              description,
              status,
              code,
              featuredImage,
              identityId: value,
              thumbnail,
              backgroundColor,
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
              name,
              owner,
              learner,
              description,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail: value,
              backgroundColor,
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
        label="Background color"
        isRequired={false}
        isReadOnly={false}
        value={backgroundColor}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              learner,
              description,
              status,
              code,
              featuredImage,
              identityId,
              thumbnail,
              backgroundColor: value,
            };
            const result = onChange(modelFields);
            value = result?.backgroundColor ?? value;
          }
          if (errors.backgroundColor?.hasError) {
            runValidationTasks("backgroundColor", value);
          }
          setBackgroundColor(value);
        }}
        onBlur={() => runValidationTasks("backgroundColor", backgroundColor)}
        errorMessage={errors.backgroundColor?.errorMessage}
        hasError={errors.backgroundColor?.hasError}
        {...getOverrideProps(overrides, "backgroundColor")}
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
          isDisabled={!(idProp || sectionModelProp)}
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
              !(idProp || sectionModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
