/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { AssistantChat } from "../models";
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
export declare type AssistantChatUpdateFormInputValues = {
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
export declare type AssistantChatUpdateFormValidationValues = {
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
export declare type AssistantChatUpdateFormOverridesProps = {
    AssistantChatUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
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
export declare type AssistantChatUpdateFormProps = React.PropsWithChildren<{
    overrides?: AssistantChatUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    assistantChat?: AssistantChat;
    onSubmit?: (fields: AssistantChatUpdateFormInputValues) => AssistantChatUpdateFormInputValues;
    onSuccess?: (fields: AssistantChatUpdateFormInputValues) => void;
    onError?: (fields: AssistantChatUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AssistantChatUpdateFormInputValues) => AssistantChatUpdateFormInputValues;
    onValidate?: AssistantChatUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AssistantChatUpdateForm(props: AssistantChatUpdateFormProps): React.ReactElement;
