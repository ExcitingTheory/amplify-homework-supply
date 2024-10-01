/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { File } from "../models";
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
export declare type FileUpdateFormInputValues = {
    name?: string;
    owner?: string;
    identityId?: string;
    description?: string;
    prompt?: string;
    model?: string;
    variant?: string;
    mimeType?: string;
    level?: string;
    path?: string;
    duration?: number;
    size?: number;
    generated?: boolean;
    hex?: string;
    byHex?: string;
    thumbnail?: string;
};
export declare type FileUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    prompt?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    variant?: ValidationFunction<string>;
    mimeType?: ValidationFunction<string>;
    level?: ValidationFunction<string>;
    path?: ValidationFunction<string>;
    duration?: ValidationFunction<number>;
    size?: ValidationFunction<number>;
    generated?: ValidationFunction<boolean>;
    hex?: ValidationFunction<string>;
    byHex?: ValidationFunction<string>;
    thumbnail?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FileUpdateFormOverridesProps = {
    FileUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    prompt?: PrimitiveOverrideProps<TextFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    variant?: PrimitiveOverrideProps<TextFieldProps>;
    mimeType?: PrimitiveOverrideProps<TextFieldProps>;
    level?: PrimitiveOverrideProps<SelectFieldProps>;
    path?: PrimitiveOverrideProps<TextFieldProps>;
    duration?: PrimitiveOverrideProps<TextFieldProps>;
    size?: PrimitiveOverrideProps<TextFieldProps>;
    generated?: PrimitiveOverrideProps<SwitchFieldProps>;
    hex?: PrimitiveOverrideProps<TextFieldProps>;
    byHex?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FileUpdateFormProps = React.PropsWithChildren<{
    overrides?: FileUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    file?: File;
    onSubmit?: (fields: FileUpdateFormInputValues) => FileUpdateFormInputValues;
    onSuccess?: (fields: FileUpdateFormInputValues) => void;
    onError?: (fields: FileUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FileUpdateFormInputValues) => FileUpdateFormInputValues;
    onValidate?: FileUpdateFormValidationValues;
} & React.CSSProperties>;
export default function FileUpdateForm(props: FileUpdateFormProps): React.ReactElement;
