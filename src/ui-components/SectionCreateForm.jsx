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
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Section } from "../models";
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
export default function SectionCreateForm(props) {
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
    learner: "",
    description: "",
    status: "",
    code: "",
    featuredImage: "",
    identityId: "",
    thumbnail: "",
    backgroundColor: "",
    embedding: [],
    embeddingModel: "",
    embeddingDimensions: "",
    embeddingVersion: "",
    embeddingWordCount: "",
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
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setName(initialValues.name);
    setOwner(initialValues.owner);
    setLearner(initialValues.learner);
    setDescription(initialValues.description);
    setStatus(initialValues.status);
    setCode(initialValues.code);
    setFeaturedImage(initialValues.featuredImage);
    setIdentityId(initialValues.identityId);
    setThumbnail(initialValues.thumbnail);
    setBackgroundColor(initialValues.backgroundColor);
    setEmbedding(initialValues.embedding);
    setCurrentEmbeddingValue("");
    setEmbeddingModel(initialValues.embeddingModel);
    setEmbeddingDimensions(initialValues.embeddingDimensions);
    setEmbeddingVersion(initialValues.embeddingVersion);
    setEmbeddingWordCount(initialValues.embeddingWordCount);
    setErrors({});
  };
  const [currentEmbeddingValue, setCurrentEmbeddingValue] = React.useState("");
  const embeddingRef = React.createRef();
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
    embedding: [],
    embeddingModel: [],
    embeddingDimensions: [],
    embeddingVersion: [],
    embeddingWordCount: [],
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
          embedding,
          embeddingModel,
          embeddingDimensions,
          embeddingVersion,
          embeddingWordCount,
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
          await DataStore.save(new Section(modelFields));
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
      {...getOverrideProps(overrides, "SectionCreateForm")}
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
      <ArrayField
        onChange={async (items) => {
          let values = items;
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
              backgroundColor,
              embedding: values,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel: value,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions: value,
              embeddingVersion,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion: value,
              embeddingWordCount,
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
              embedding,
              embeddingModel,
              embeddingDimensions,
              embeddingVersion,
              embeddingWordCount: value,
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
