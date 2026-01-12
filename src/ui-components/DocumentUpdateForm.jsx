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
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { Document } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function DocumentUpdateForm(props) {
  const {
    id: idProp,
    document: documentModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    filename: "",
    s3Key: "",
    status: "",
    owner: "",
    identityId: "",
    learner: "",
    extractedText: "",
    pageCount: "",
    fileSize: "",
    mimeType: "",
    uploadedAt: "",
    resumeState: "",
    embeddingsS3Key: "",
    metadata: "",
  };
  const [filename, setFilename] = React.useState(initialValues.filename);
  const [s3Key, setS3Key] = React.useState(initialValues.s3Key);
  const [status, setStatus] = React.useState(initialValues.status);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [identityId, setIdentityId] = React.useState(initialValues.identityId);
  const [learner, setLearner] = React.useState(initialValues.learner);
  const [extractedText, setExtractedText] = React.useState(
    initialValues.extractedText
  );
  const [pageCount, setPageCount] = React.useState(initialValues.pageCount);
  const [fileSize, setFileSize] = React.useState(initialValues.fileSize);
  const [mimeType, setMimeType] = React.useState(initialValues.mimeType);
  const [uploadedAt, setUploadedAt] = React.useState(initialValues.uploadedAt);
  const [resumeState, setResumeState] = React.useState(
    initialValues.resumeState
  );
  const [embeddingsS3Key, setEmbeddingsS3Key] = React.useState(
    initialValues.embeddingsS3Key
  );
  const [metadata, setMetadata] = React.useState(initialValues.metadata);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = documentRecord
      ? { ...initialValues, ...documentRecord }
      : initialValues;
    setFilename(cleanValues.filename);
    setS3Key(cleanValues.s3Key);
    setStatus(cleanValues.status);
    setOwner(cleanValues.owner);
    setIdentityId(cleanValues.identityId);
    setLearner(cleanValues.learner);
    setExtractedText(cleanValues.extractedText);
    setPageCount(cleanValues.pageCount);
    setFileSize(cleanValues.fileSize);
    setMimeType(cleanValues.mimeType);
    setUploadedAt(cleanValues.uploadedAt);
    setResumeState(
      typeof cleanValues.resumeState === "string" ||
        cleanValues.resumeState === null
        ? cleanValues.resumeState
        : JSON.stringify(cleanValues.resumeState)
    );
    setEmbeddingsS3Key(cleanValues.embeddingsS3Key);
    setMetadata(
      typeof cleanValues.metadata === "string" || cleanValues.metadata === null
        ? cleanValues.metadata
        : JSON.stringify(cleanValues.metadata)
    );
    setErrors({});
  };
  const [documentRecord, setDocumentRecord] = React.useState(documentModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Document, idProp)
        : documentModelProp;
      setDocumentRecord(record);
    };
    queryData();
  }, [idProp, documentModelProp]);
  React.useEffect(resetStateValues, [documentRecord]);
  const validations = {
    filename: [{ type: "Required" }],
    s3Key: [{ type: "Required" }],
    status: [{ type: "Required" }],
    owner: [],
    identityId: [],
    learner: [],
    extractedText: [],
    pageCount: [],
    fileSize: [],
    mimeType: [],
    uploadedAt: [],
    resumeState: [{ type: "JSON" }],
    embeddingsS3Key: [],
    metadata: [{ type: "JSON" }],
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
          filename,
          s3Key,
          status,
          owner,
          identityId,
          learner,
          extractedText,
          pageCount,
          fileSize,
          mimeType,
          uploadedAt,
          resumeState,
          embeddingsS3Key,
          metadata,
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
            Document.copyOf(documentRecord, (updated) => {
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
      {...getOverrideProps(overrides, "DocumentUpdateForm")}
      {...rest}
    >
      <TextField
        label="Filename"
        isRequired={true}
        isReadOnly={false}
        value={filename}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename: value,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.filename ?? value;
          }
          if (errors.filename?.hasError) {
            runValidationTasks("filename", value);
          }
          setFilename(value);
        }}
        onBlur={() => runValidationTasks("filename", filename)}
        errorMessage={errors.filename?.errorMessage}
        hasError={errors.filename?.hasError}
        {...getOverrideProps(overrides, "filename")}
      ></TextField>
      <TextField
        label="S3 key"
        isRequired={true}
        isReadOnly={false}
        value={s3Key}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key: value,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.s3Key ?? value;
          }
          if (errors.s3Key?.hasError) {
            runValidationTasks("s3Key", value);
          }
          setS3Key(value);
        }}
        onBlur={() => runValidationTasks("s3Key", s3Key)}
        errorMessage={errors.s3Key?.errorMessage}
        hasError={errors.s3Key?.hasError}
        {...getOverrideProps(overrides, "s3Key")}
      ></TextField>
      <TextField
        label="Status"
        isRequired={true}
        isReadOnly={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status: value,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
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
              filename,
              s3Key,
              status,
              owner: value,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
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
              filename,
              s3Key,
              status,
              owner,
              identityId: value,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
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
        label="Learner"
        isRequired={false}
        isReadOnly={false}
        value={learner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner: value,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
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
        label="Extracted text"
        isRequired={false}
        isReadOnly={false}
        value={extractedText}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText: value,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.extractedText ?? value;
          }
          if (errors.extractedText?.hasError) {
            runValidationTasks("extractedText", value);
          }
          setExtractedText(value);
        }}
        onBlur={() => runValidationTasks("extractedText", extractedText)}
        errorMessage={errors.extractedText?.errorMessage}
        hasError={errors.extractedText?.hasError}
        {...getOverrideProps(overrides, "extractedText")}
      ></TextField>
      <TextField
        label="Page count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={pageCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount: value,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.pageCount ?? value;
          }
          if (errors.pageCount?.hasError) {
            runValidationTasks("pageCount", value);
          }
          setPageCount(value);
        }}
        onBlur={() => runValidationTasks("pageCount", pageCount)}
        errorMessage={errors.pageCount?.errorMessage}
        hasError={errors.pageCount?.hasError}
        {...getOverrideProps(overrides, "pageCount")}
      ></TextField>
      <TextField
        label="File size"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={fileSize}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize: value,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.fileSize ?? value;
          }
          if (errors.fileSize?.hasError) {
            runValidationTasks("fileSize", value);
          }
          setFileSize(value);
        }}
        onBlur={() => runValidationTasks("fileSize", fileSize)}
        errorMessage={errors.fileSize?.errorMessage}
        hasError={errors.fileSize?.hasError}
        {...getOverrideProps(overrides, "fileSize")}
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
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType: value,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata,
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
      <TextField
        label="Uploaded at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={uploadedAt && convertToLocal(new Date(uploadedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt: value,
              resumeState,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.uploadedAt ?? value;
          }
          if (errors.uploadedAt?.hasError) {
            runValidationTasks("uploadedAt", value);
          }
          setUploadedAt(value);
        }}
        onBlur={() => runValidationTasks("uploadedAt", uploadedAt)}
        errorMessage={errors.uploadedAt?.errorMessage}
        hasError={errors.uploadedAt?.hasError}
        {...getOverrideProps(overrides, "uploadedAt")}
      ></TextField>
      <TextAreaField
        label="Resume state"
        isRequired={false}
        isReadOnly={false}
        value={resumeState}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState: value,
              embeddingsS3Key,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.resumeState ?? value;
          }
          if (errors.resumeState?.hasError) {
            runValidationTasks("resumeState", value);
          }
          setResumeState(value);
        }}
        onBlur={() => runValidationTasks("resumeState", resumeState)}
        errorMessage={errors.resumeState?.errorMessage}
        hasError={errors.resumeState?.hasError}
        {...getOverrideProps(overrides, "resumeState")}
      ></TextAreaField>
      <TextField
        label="Embeddings s3 key"
        isRequired={false}
        isReadOnly={false}
        value={embeddingsS3Key}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key: value,
              metadata,
            };
            const result = onChange(modelFields);
            value = result?.embeddingsS3Key ?? value;
          }
          if (errors.embeddingsS3Key?.hasError) {
            runValidationTasks("embeddingsS3Key", value);
          }
          setEmbeddingsS3Key(value);
        }}
        onBlur={() => runValidationTasks("embeddingsS3Key", embeddingsS3Key)}
        errorMessage={errors.embeddingsS3Key?.errorMessage}
        hasError={errors.embeddingsS3Key?.hasError}
        {...getOverrideProps(overrides, "embeddingsS3Key")}
      ></TextField>
      <TextAreaField
        label="Metadata"
        isRequired={false}
        isReadOnly={false}
        value={metadata}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              filename,
              s3Key,
              status,
              owner,
              identityId,
              learner,
              extractedText,
              pageCount,
              fileSize,
              mimeType,
              uploadedAt,
              resumeState,
              embeddingsS3Key,
              metadata: value,
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
          isDisabled={!(idProp || documentModelProp)}
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
              !(idProp || documentModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
