/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type AssistantChatCreateFormInputValues = {
    owner?: string;
    model?: string;
    threadInstructions?: string;
    additionalInstructions?: string;
    threadId?: string;
    moderationFlag?: boolean;
    messages?: string;
    draft?: string;
    archived?: boolean;
    inputTokens?: string;
    outputTokens?: string;
};
export declare type AssistantChatCreateFormValidationValues = {
    owner?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    threadInstructions?: ValidationFunction<string>;
    additionalInstructions?: ValidationFunction<string>;
    threadId?: ValidationFunction<string>;
    moderationFlag?: ValidationFunction<boolean>;
    messages?: ValidationFunction<string>;
    draft?: ValidationFunction<string>;
    archived?: ValidationFunction<boolean>;
    inputTokens?: ValidationFunction<string>;
    outputTokens?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AssistantChatCreateFormOverridesProps = {
    AssistantChatCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    threadInstructions?: PrimitiveOverrideProps<TextFieldProps>;
    additionalInstructions?: PrimitiveOverrideProps<TextFieldProps>;
    threadId?: PrimitiveOverrideProps<TextFieldProps>;
    moderationFlag?: PrimitiveOverrideProps<SwitchFieldProps>;
    messages?: PrimitiveOverrideProps<TextAreaFieldProps>;
    draft?: PrimitiveOverrideProps<TextFieldProps>;
    archived?: PrimitiveOverrideProps<SwitchFieldProps>;
    inputTokens?: PrimitiveOverrideProps<TextFieldProps>;
    outputTokens?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AssistantChatCreateFormProps = React.PropsWithChildren<{
    overrides?: AssistantChatCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AssistantChatCreateFormInputValues) => AssistantChatCreateFormInputValues;
    onSuccess?: (fields: AssistantChatCreateFormInputValues) => void;
    onError?: (fields: AssistantChatCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AssistantChatCreateFormInputValues) => AssistantChatCreateFormInputValues;
    onValidate?: AssistantChatCreateFormValidationValues;
} & React.CSSProperties>;
export default function AssistantChatCreateForm(props: AssistantChatCreateFormProps): React.ReactElement;
