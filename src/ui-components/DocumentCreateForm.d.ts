/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type DocumentCreateFormInputValues = {
    filename?: string;
    s3Key?: string;
    status?: string;
    owner?: string;
    identityId?: string;
    learner?: string;
    extractedText?: string;
    pageCount?: number;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string;
    resumeState?: string;
    embeddingsS3Key?: string;
    metadata?: string;
};
export declare type DocumentCreateFormValidationValues = {
    filename?: ValidationFunction<string>;
    s3Key?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    learner?: ValidationFunction<string>;
    extractedText?: ValidationFunction<string>;
    pageCount?: ValidationFunction<number>;
    fileSize?: ValidationFunction<number>;
    mimeType?: ValidationFunction<string>;
    uploadedAt?: ValidationFunction<string>;
    resumeState?: ValidationFunction<string>;
    embeddingsS3Key?: ValidationFunction<string>;
    metadata?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type DocumentCreateFormOverridesProps = {
    DocumentCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    filename?: PrimitiveOverrideProps<TextFieldProps>;
    s3Key?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    learner?: PrimitiveOverrideProps<TextFieldProps>;
    extractedText?: PrimitiveOverrideProps<TextFieldProps>;
    pageCount?: PrimitiveOverrideProps<TextFieldProps>;
    fileSize?: PrimitiveOverrideProps<TextFieldProps>;
    mimeType?: PrimitiveOverrideProps<TextFieldProps>;
    uploadedAt?: PrimitiveOverrideProps<TextFieldProps>;
    resumeState?: PrimitiveOverrideProps<TextAreaFieldProps>;
    embeddingsS3Key?: PrimitiveOverrideProps<TextFieldProps>;
    metadata?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type DocumentCreateFormProps = React.PropsWithChildren<{
    overrides?: DocumentCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: DocumentCreateFormInputValues) => DocumentCreateFormInputValues;
    onSuccess?: (fields: DocumentCreateFormInputValues) => void;
    onError?: (fields: DocumentCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: DocumentCreateFormInputValues) => DocumentCreateFormInputValues;
    onValidate?: DocumentCreateFormValidationValues;
} & React.CSSProperties>;
export default function DocumentCreateForm(props: DocumentCreateFormProps): React.ReactElement;
