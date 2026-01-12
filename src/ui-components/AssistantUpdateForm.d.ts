/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Assistant } from "../models";
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
export declare type AssistantUpdateFormInputValues = {
    owner?: string;
    model?: string;
    threadInstructions?: string;
    additionalInstructions?: string;
    moderationFlag?: boolean;
    threadId?: string;
};
export declare type AssistantUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    threadInstructions?: ValidationFunction<string>;
    additionalInstructions?: ValidationFunction<string>;
    moderationFlag?: ValidationFunction<boolean>;
    threadId?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AssistantUpdateFormOverridesProps = {
    AssistantUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    threadInstructions?: PrimitiveOverrideProps<TextFieldProps>;
    additionalInstructions?: PrimitiveOverrideProps<TextFieldProps>;
    moderationFlag?: PrimitiveOverrideProps<SwitchFieldProps>;
    threadId?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AssistantUpdateFormProps = React.PropsWithChildren<{
    overrides?: AssistantUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    assistant?: Assistant;
    onSubmit?: (fields: AssistantUpdateFormInputValues) => AssistantUpdateFormInputValues;
    onSuccess?: (fields: AssistantUpdateFormInputValues) => void;
    onError?: (fields: AssistantUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AssistantUpdateFormInputValues) => AssistantUpdateFormInputValues;
    onValidate?: AssistantUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AssistantUpdateForm(props: AssistantUpdateFormProps): React.ReactElement;
