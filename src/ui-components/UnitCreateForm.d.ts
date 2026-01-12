/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type UnitCreateFormInputValues = {
    number?: number;
    name?: string;
    owner?: string;
    description?: string;
    data?: string;
    status?: string;
    timeLimitSeconds?: number;
    featuredImage?: string;
    identityId?: string;
    thumbnail?: string;
    embedding?: number[];
    embeddingModel?: string;
    embeddingDimensions?: number;
    embeddingVersion?: number;
    embeddingWordCount?: number;
    publishedAt?: number;
    isDraft?: boolean;
    moderationStatus?: string;
    moderationFlags?: string;
    moderationCheckedAt?: string;
};
export declare type UnitCreateFormValidationValues = {
    number?: ValidationFunction<number>;
    name?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    data?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    timeLimitSeconds?: ValidationFunction<number>;
    featuredImage?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    thumbnail?: ValidationFunction<string>;
    embedding?: ValidationFunction<number>;
    embeddingModel?: ValidationFunction<string>;
    embeddingDimensions?: ValidationFunction<number>;
    embeddingVersion?: ValidationFunction<number>;
    embeddingWordCount?: ValidationFunction<number>;
    publishedAt?: ValidationFunction<number>;
    isDraft?: ValidationFunction<boolean>;
    moderationStatus?: ValidationFunction<string>;
    moderationFlags?: ValidationFunction<string>;
    moderationCheckedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type UnitCreateFormOverridesProps = {
    UnitCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    number?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    data?: PrimitiveOverrideProps<TextAreaFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    timeLimitSeconds?: PrimitiveOverrideProps<TextFieldProps>;
    featuredImage?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
    embedding?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingModel?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingDimensions?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingVersion?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingWordCount?: PrimitiveOverrideProps<TextFieldProps>;
    publishedAt?: PrimitiveOverrideProps<TextFieldProps>;
    isDraft?: PrimitiveOverrideProps<SwitchFieldProps>;
    moderationStatus?: PrimitiveOverrideProps<TextFieldProps>;
    moderationFlags?: PrimitiveOverrideProps<TextAreaFieldProps>;
    moderationCheckedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type UnitCreateFormProps = React.PropsWithChildren<{
    overrides?: UnitCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: UnitCreateFormInputValues) => UnitCreateFormInputValues;
    onSuccess?: (fields: UnitCreateFormInputValues) => void;
    onError?: (fields: UnitCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: UnitCreateFormInputValues) => UnitCreateFormInputValues;
    onValidate?: UnitCreateFormValidationValues;
} & React.CSSProperties>;
export default function UnitCreateForm(props: UnitCreateFormProps): React.ReactElement;
