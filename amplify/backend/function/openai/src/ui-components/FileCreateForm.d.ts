/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type FileCreateFormInputValues = {
    name?: string;
    owner?: string;
    identityId?: string;
    description?: string;
    mimeType?: string;
    level?: string;
    path?: string;
    duration?: number;
    size?: number;
    thumbnail?: string;
};
export declare type FileCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    mimeType?: ValidationFunction<string>;
    level?: ValidationFunction<string>;
    path?: ValidationFunction<string>;
    duration?: ValidationFunction<number>;
    size?: ValidationFunction<number>;
    thumbnail?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FileCreateFormOverridesProps = {
    FileCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    mimeType?: PrimitiveOverrideProps<TextFieldProps>;
    level?: PrimitiveOverrideProps<SelectFieldProps>;
    path?: PrimitiveOverrideProps<TextFieldProps>;
    duration?: PrimitiveOverrideProps<TextFieldProps>;
    size?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FileCreateFormProps = React.PropsWithChildren<{
    overrides?: FileCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: FileCreateFormInputValues) => FileCreateFormInputValues;
    onSuccess?: (fields: FileCreateFormInputValues) => void;
    onError?: (fields: FileCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FileCreateFormInputValues) => FileCreateFormInputValues;
    onValidate?: FileCreateFormValidationValues;
} & React.CSSProperties>;
export default function FileCreateForm(props: FileCreateFormProps): React.ReactElement;
