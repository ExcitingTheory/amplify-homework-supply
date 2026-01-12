/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Settings } from "../models";
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
export declare type SettingsUpdateFormInputValues = {
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
export declare type SettingsUpdateFormValidationValues = {
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
export declare type SettingsUpdateFormOverridesProps = {
    SettingsUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
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
export declare type SettingsUpdateFormProps = React.PropsWithChildren<{
    overrides?: SettingsUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    settings?: Settings;
    onSubmit?: (fields: SettingsUpdateFormInputValues) => SettingsUpdateFormInputValues;
    onSuccess?: (fields: SettingsUpdateFormInputValues) => void;
    onError?: (fields: SettingsUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SettingsUpdateFormInputValues) => SettingsUpdateFormInputValues;
    onValidate?: SettingsUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SettingsUpdateForm(props: SettingsUpdateFormProps): React.ReactElement;
