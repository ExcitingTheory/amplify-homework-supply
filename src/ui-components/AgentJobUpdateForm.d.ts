/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { AgentJob } from "../models";
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
export declare type AgentJobUpdateFormInputValues = {
    owner?: string;
    identityId?: string;
    type?: string;
    status?: string;
    responseId?: string;
    webhookData?: string;
    error?: string;
    startedAt?: string;
    completedAt?: string;
    modelUsed?: string;
    tokensUsed?: number;
    estimatedCost?: number;
    retryCount?: number;
    metadata?: string;
};
export declare type AgentJobUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    responseId?: ValidationFunction<string>;
    webhookData?: ValidationFunction<string>;
    error?: ValidationFunction<string>;
    startedAt?: ValidationFunction<string>;
    completedAt?: ValidationFunction<string>;
    modelUsed?: ValidationFunction<string>;
    tokensUsed?: ValidationFunction<number>;
    estimatedCost?: ValidationFunction<number>;
    retryCount?: ValidationFunction<number>;
    metadata?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AgentJobUpdateFormOverridesProps = {
    AgentJobUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
    responseId?: PrimitiveOverrideProps<TextFieldProps>;
    webhookData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    error?: PrimitiveOverrideProps<TextAreaFieldProps>;
    startedAt?: PrimitiveOverrideProps<TextFieldProps>;
    completedAt?: PrimitiveOverrideProps<TextFieldProps>;
    modelUsed?: PrimitiveOverrideProps<TextFieldProps>;
    tokensUsed?: PrimitiveOverrideProps<TextFieldProps>;
    estimatedCost?: PrimitiveOverrideProps<TextFieldProps>;
    retryCount?: PrimitiveOverrideProps<TextFieldProps>;
    metadata?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type AgentJobUpdateFormProps = React.PropsWithChildren<{
    overrides?: AgentJobUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    agentJob?: AgentJob;
    onSubmit?: (fields: AgentJobUpdateFormInputValues) => AgentJobUpdateFormInputValues;
    onSuccess?: (fields: AgentJobUpdateFormInputValues) => void;
    onError?: (fields: AgentJobUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AgentJobUpdateFormInputValues) => AgentJobUpdateFormInputValues;
    onValidate?: AgentJobUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AgentJobUpdateForm(props: AgentJobUpdateFormProps): React.ReactElement;
