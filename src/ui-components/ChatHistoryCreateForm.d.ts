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
export declare type ChatHistoryCreateFormInputValues = {
    owner?: string;
    messages?: string;
    model?: string;
    inputTokens?: string;
    outputTokens?: string;
    draft?: string;
    archived?: boolean;
};
export declare type ChatHistoryCreateFormValidationValues = {
    owner?: ValidationFunction<string>;
    messages?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    inputTokens?: ValidationFunction<string>;
    outputTokens?: ValidationFunction<string>;
    draft?: ValidationFunction<string>;
    archived?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ChatHistoryCreateFormOverridesProps = {
    ChatHistoryCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    messages?: PrimitiveOverrideProps<TextAreaFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    inputTokens?: PrimitiveOverrideProps<TextFieldProps>;
    outputTokens?: PrimitiveOverrideProps<TextFieldProps>;
    draft?: PrimitiveOverrideProps<TextFieldProps>;
    archived?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type ChatHistoryCreateFormProps = React.PropsWithChildren<{
    overrides?: ChatHistoryCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ChatHistoryCreateFormInputValues) => ChatHistoryCreateFormInputValues;
    onSuccess?: (fields: ChatHistoryCreateFormInputValues) => void;
    onError?: (fields: ChatHistoryCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ChatHistoryCreateFormInputValues) => ChatHistoryCreateFormInputValues;
    onValidate?: ChatHistoryCreateFormValidationValues;
} & React.CSSProperties>;
export default function ChatHistoryCreateForm(props: ChatHistoryCreateFormProps): React.ReactElement;
