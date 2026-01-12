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
export declare type SettingsCreateFormInputValues = {
    owner?: string;
    identityId?: string;
    autoAnalyzeDocuments?: boolean;
    documentAnalysisModel?: string;
    editorTheme?: string;
    editorFontSize?: number;
    defaultAIModel?: string;
    assistantVoice?: string;
    emailNotifications?: boolean;
    webhookNotifications?: boolean;
    language?: string;
    timezone?: string;
    metadata?: string;
    updatedAt?: string;
};
export declare type SettingsCreateFormValidationValues = {
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    autoAnalyzeDocuments?: ValidationFunction<boolean>;
    documentAnalysisModel?: ValidationFunction<string>;
    editorTheme?: ValidationFunction<string>;
    editorFontSize?: ValidationFunction<number>;
    defaultAIModel?: ValidationFunction<string>;
    assistantVoice?: ValidationFunction<string>;
    emailNotifications?: ValidationFunction<boolean>;
    webhookNotifications?: ValidationFunction<boolean>;
    language?: ValidationFunction<string>;
    timezone?: ValidationFunction<string>;
    metadata?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SettingsCreateFormOverridesProps = {
    SettingsCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    autoAnalyzeDocuments?: PrimitiveOverrideProps<SwitchFieldProps>;
    documentAnalysisModel?: PrimitiveOverrideProps<TextFieldProps>;
    editorTheme?: PrimitiveOverrideProps<TextFieldProps>;
    editorFontSize?: PrimitiveOverrideProps<TextFieldProps>;
    defaultAIModel?: PrimitiveOverrideProps<TextFieldProps>;
    assistantVoice?: PrimitiveOverrideProps<TextFieldProps>;
    emailNotifications?: PrimitiveOverrideProps<SwitchFieldProps>;
    webhookNotifications?: PrimitiveOverrideProps<SwitchFieldProps>;
    language?: PrimitiveOverrideProps<TextFieldProps>;
    timezone?: PrimitiveOverrideProps<TextFieldProps>;
    metadata?: PrimitiveOverrideProps<TextAreaFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SettingsCreateFormProps = React.PropsWithChildren<{
    overrides?: SettingsCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: SettingsCreateFormInputValues) => SettingsCreateFormInputValues;
    onSuccess?: (fields: SettingsCreateFormInputValues) => void;
    onError?: (fields: SettingsCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SettingsCreateFormInputValues) => SettingsCreateFormInputValues;
    onValidate?: SettingsCreateFormValidationValues;
} & React.CSSProperties>;
export default function SettingsCreateForm(props: SettingsCreateFormProps): React.ReactElement;
