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
  SwitchField,
  TextField,
} from "@aws-amplify/ui-react";
import { File } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function FileCreateForm(props) {
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
    name: "",
    owner: "",
    identityId: "",
    description: "",
    prompt: "",
    model: "",
    variant: "",
    mimeType: "",
    level: "",
    path: "",
    duration: "",
    size: "",
    generated: false,
    hex: "",
    byHex: "",
    thumbnail: "",
  };
  const [name, setName] = React.useState(initialValues.name);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [prompt, setPrompt] = React.useState(initialValues.prompt);
  const [model, setModel] = React.useState(initialValues.model);
  const [variant, setVariant] = React.useState(initialValues.variant);
  const [mimeType, setMimeType] = React.useState(initialValues.mimeType);
  const [level, setLevel] = React.useState(initialValues.level);
  const [path, setPath] = React.useState(initialValues.path);
  const [duration, setDuration] = React.useState(initialValues.duration);
  const [size, setSize] = React.useState(initialValues.size);
  const [generated, setGenerated] = React.useState(initialValues.generated);
  const [hex, setHex] = React.useState(initialValues.hex);
  const [byHex, setByHex] = React.useState(initialValues.byHex);
  const [thumbnail, setThumbnail] = React.useState(initialValues.thumbnail);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setName(initialValues.name);
    setOwner(initialValues.owner);
    setIdentityId(initialValues.identityId);
    setDescription(initialValues.description);
    setPrompt(initialValues.prompt);
    setModel(initialValues.model);
    setVariant(initialValues.variant);
    setMimeType(initialValues.mimeType);
    setLevel(initialValues.level);
    setPath(initialValues.path);
    setDuration(initialValues.duration);
    setSize(initialValues.size);
    setGenerated(initialValues.generated);
    setHex(initialValues.hex);
    setByHex(initialValues.byHex);
    setThumbnail(initialValues.thumbnail);
    setErrors({});
  };
  const validations = {
    name: [],
    owner: [],
    identityId: [],
    description: [],
    prompt: [],
    model: [],
    variant: [],
    mimeType: [],
    level: [],
    path: [],
    duration: [],
    size: [],
    generated: [],
    hex: [],
    byHex: [],
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
          name,
          owner,
          identityId,
          description,
          prompt,
          model,
          variant,
          mimeType,
          level,
          path,
          duration,
          size,
          generated,
          hex,
          byHex,
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
          await DataStore.save(new File(modelFields));
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
      {...getOverrideProps(overrides, "FileCreateForm")}
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
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
              name,
              owner: value,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
              name,
              owner,
              identityId: value,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
              identityId,
              description: value,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
      <TextField
        label="Prompt"
        isRequired={false}
        isReadOnly={false}
        value={prompt}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt: value,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
      <TextField
        label="Model"
        isRequired={false}
        isReadOnly={false}
        value={model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model: value,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
        label="Variant"
        isRequired={false}
        isReadOnly={false}
        value={variant}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant: value,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.variant ?? value;
          }
          if (errors.variant?.hasError) {
            runValidationTasks("variant", value);
          }
          setVariant(value);
        }}
        onBlur={() => runValidationTasks("variant", variant)}
        errorMessage={errors.variant?.errorMessage}
        hasError={errors.variant?.hasError}
        {...getOverrideProps(overrides, "variant")}
      ></TextField>
      <TextField
        label="Mime type"
        isRequired={false}
        isReadOnly={false}
        value={mimeType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType: value,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.mimeType ?? value;
          }
          if (errors.mimeType?.hasError) {
            runValidationTasks("mimeType", value);
          }
          setMimeType(value);
        }}
        onBlur={() => runValidationTasks("mimeType", mimeType)}
        errorMessage={errors.mimeType?.errorMessage}
        hasError={errors.mimeType?.hasError}
        {...getOverrideProps(overrides, "mimeType")}
      ></TextField>
      <SelectField
        label="Level"
        placeholder="Please select an option"
        isDisabled={false}
        value={level}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level: value,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.level ?? value;
          }
          if (errors.level?.hasError) {
            runValidationTasks("level", value);
          }
          setLevel(value);
        }}
        onBlur={() => runValidationTasks("level", level)}
        errorMessage={errors.level?.errorMessage}
        hasError={errors.level?.hasError}
        {...getOverrideProps(overrides, "level")}
      >
        <option
          children="Public"
          value="PUBLIC"
          {...getOverrideProps(overrides, "leveloption0")}
        ></option>
        <option
          children="Private"
          value="PRIVATE"
          {...getOverrideProps(overrides, "leveloption1")}
        ></option>
        <option
          children="Protected"
          value="PROTECTED"
          {...getOverrideProps(overrides, "leveloption2")}
        ></option>
      </SelectField>
      <TextField
        label="Path"
        isRequired={false}
        isReadOnly={false}
        value={path}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path: value,
              duration,
              size,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.path ?? value;
          }
          if (errors.path?.hasError) {
            runValidationTasks("path", value);
          }
          setPath(value);
        }}
        onBlur={() => runValidationTasks("path", path)}
        errorMessage={errors.path?.errorMessage}
        hasError={errors.path?.hasError}
        {...getOverrideProps(overrides, "path")}
      ></TextField>
      <TextField
        label="Duration"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={duration}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration: value,
              size,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.duration ?? value;
          }
          if (errors.duration?.hasError) {
            runValidationTasks("duration", value);
          }
          setDuration(value);
        }}
        onBlur={() => runValidationTasks("duration", duration)}
        errorMessage={errors.duration?.errorMessage}
        hasError={errors.duration?.hasError}
        {...getOverrideProps(overrides, "duration")}
      ></TextField>
      <TextField
        label="Size"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={size}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size: value,
              generated,
              hex,
              byHex,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.size ?? value;
          }
          if (errors.size?.hasError) {
            runValidationTasks("size", value);
          }
          setSize(value);
        }}
        onBlur={() => runValidationTasks("size", size)}
        errorMessage={errors.size?.errorMessage}
        hasError={errors.size?.hasError}
        {...getOverrideProps(overrides, "size")}
      ></TextField>
      <SwitchField
        label="Generated"
        defaultChecked={false}
        isDisabled={false}
        isChecked={generated}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated: value,
              hex,
              byHex,
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
        label="Hex"
        isRequired={false}
        isReadOnly={false}
        value={hex}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex: value,
              byHex,
              thumbnail,
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
      <TextField
        label="By hex"
        isRequired={false}
        isReadOnly={false}
        value={byHex}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex: value,
              thumbnail,
            };
            const result = onChange(modelFields);
            value = result?.byHex ?? value;
          }
          if (errors.byHex?.hasError) {
            runValidationTasks("byHex", value);
          }
          setByHex(value);
        }}
        onBlur={() => runValidationTasks("byHex", byHex)}
        errorMessage={errors.byHex?.errorMessage}
        hasError={errors.byHex?.hasError}
        {...getOverrideProps(overrides, "byHex")}
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
              identityId,
              description,
              prompt,
              model,
              variant,
              mimeType,
              level,
              path,
              duration,
              size,
              generated,
              hex,
              byHex,
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
