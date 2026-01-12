/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { ChatHistory } from "../models";
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
export declare type ChatHistoryUpdateFormInputValues = {
    owner?: string;
    messages?: string;
    model?: string;
    inputTokens?: string;
    outputTokens?: string;
    draft?: string;
    archived?: boolean;
};
export declare type ChatHistoryUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    messages?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    inputTokens?: ValidationFunction<string>;
    outputTokens?: ValidationFunction<string>;
    draft?: ValidationFunction<string>;
    archived?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ChatHistoryUpdateFormOverridesProps = {
    ChatHistoryUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    messages?: PrimitiveOverrideProps<TextAreaFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    inputTokens?: PrimitiveOverrideProps<TextFieldProps>;
    outputTokens?: PrimitiveOverrideProps<TextFieldProps>;
    draft?: PrimitiveOverrideProps<TextFieldProps>;
    archived?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type ChatHistoryUpdateFormProps = React.PropsWithChildren<{
    overrides?: ChatHistoryUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    chatHistory?: ChatHistory;
    onSubmit?: (fields: ChatHistoryUpdateFormInputValues) => ChatHistoryUpdateFormInputValues;
    onSuccess?: (fields: ChatHistoryUpdateFormInputValues) => void;
    onError?: (fields: ChatHistoryUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ChatHistoryUpdateFormInputValues) => ChatHistoryUpdateFormInputValues;
    onValidate?: ChatHistoryUpdateFormValidationValues;
} & React.CSSProperties>;
export default function ChatHistoryUpdateForm(props: ChatHistoryUpdateFormProps): React.ReactElement;
