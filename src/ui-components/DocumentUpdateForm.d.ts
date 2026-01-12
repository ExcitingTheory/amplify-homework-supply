/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Document } from "../models";
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
export declare type DocumentUpdateFormInputValues = {
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
export declare type DocumentUpdateFormValidationValues = {
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
export declare type DocumentUpdateFormOverridesProps = {
    DocumentUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
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
export declare type DocumentUpdateFormProps = React.PropsWithChildren<{
    overrides?: DocumentUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    document?: Document;
    onSubmit?: (fields: DocumentUpdateFormInputValues) => DocumentUpdateFormInputValues;
    onSuccess?: (fields: DocumentUpdateFormInputValues) => void;
    onError?: (fields: DocumentUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: DocumentUpdateFormInputValues) => DocumentUpdateFormInputValues;
    onValidate?: DocumentUpdateFormValidationValues;
} & React.CSSProperties>;
export default function DocumentUpdateForm(props: DocumentUpdateFormProps): React.ReactElement;
