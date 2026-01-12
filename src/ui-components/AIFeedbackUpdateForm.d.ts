/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { AIFeedback } from "../models";
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
export declare type AIFeedbackUpdateFormInputValues = {
    owner?: string;
    identityId?: string;
    contentType?: string;
    feedbackType?: string;
    reasons?: string[];
    comment?: string;
    model?: string;
    prompt?: string;
    generatedContent?: string;
    unitID?: string;
    gradeID?: string;
    documentID?: string;
    messageId?: string;
    sessionId?: string;
    metadata?: string;
    createdAt?: string;
    updatedAt?: string;
};
export declare type AIFeedbackUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    contentType?: ValidationFunction<string>;
    feedbackType?: ValidationFunction<string>;
    reasons?: ValidationFunction<string>;
    comment?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    prompt?: ValidationFunction<string>;
    generatedContent?: ValidationFunction<string>;
    unitID?: ValidationFunction<string>;
    gradeID?: ValidationFunction<string>;
    documentID?: ValidationFunction<string>;
    messageId?: ValidationFunction<string>;
    sessionId?: ValidationFunction<string>;
    metadata?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AIFeedbackUpdateFormOverridesProps = {
    AIFeedbackUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    contentType?: PrimitiveOverrideProps<SelectFieldProps>;
    feedbackType?: PrimitiveOverrideProps<SelectFieldProps>;
    reasons?: PrimitiveOverrideProps<SelectFieldProps>;
    comment?: PrimitiveOverrideProps<TextFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    prompt?: PrimitiveOverrideProps<TextFieldProps>;
    generatedContent?: PrimitiveOverrideProps<TextFieldProps>;
    unitID?: PrimitiveOverrideProps<TextFieldProps>;
    gradeID?: PrimitiveOverrideProps<TextFieldProps>;
    documentID?: PrimitiveOverrideProps<TextFieldProps>;
    messageId?: PrimitiveOverrideProps<TextFieldProps>;
    sessionId?: PrimitiveOverrideProps<TextFieldProps>;
    metadata?: PrimitiveOverrideProps<TextAreaFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AIFeedbackUpdateFormProps = React.PropsWithChildren<{
    overrides?: AIFeedbackUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    aIFeedback?: AIFeedback;
    onSubmit?: (fields: AIFeedbackUpdateFormInputValues) => AIFeedbackUpdateFormInputValues;
    onSuccess?: (fields: AIFeedbackUpdateFormInputValues) => void;
    onError?: (fields: AIFeedbackUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AIFeedbackUpdateFormInputValues) => AIFeedbackUpdateFormInputValues;
    onValidate?: AIFeedbackUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AIFeedbackUpdateForm(props: AIFeedbackUpdateFormProps): React.ReactElement;
