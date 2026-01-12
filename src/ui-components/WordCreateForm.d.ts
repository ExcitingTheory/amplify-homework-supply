/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type WordCreateFormInputValues = {
    phrase?: string;
    owner?: string;
    identityId?: string;
    pronunciation?: string;
    definition?: string;
    audio?: string[];
    waveformData?: string;
    definitionAudio?: string[];
    definitionWaveformData?: string;
    rubyTags?: string;
    importedAt?: string;
    embedding?: number[];
    embeddingModel?: string;
    embeddingDimensions?: number;
    embeddingVersion?: number;
    embeddingWordCount?: number;
    moderationStatus?: string;
    moderationFlags?: string;
    moderationCheckedAt?: string;
};
export declare type WordCreateFormValidationValues = {
    phrase?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    pronunciation?: ValidationFunction<string>;
    definition?: ValidationFunction<string>;
    audio?: ValidationFunction<string>;
    waveformData?: ValidationFunction<string>;
    definitionAudio?: ValidationFunction<string>;
    definitionWaveformData?: ValidationFunction<string>;
    rubyTags?: ValidationFunction<string>;
    importedAt?: ValidationFunction<string>;
    embedding?: ValidationFunction<number>;
    embeddingModel?: ValidationFunction<string>;
    embeddingDimensions?: ValidationFunction<number>;
    embeddingVersion?: ValidationFunction<number>;
    embeddingWordCount?: ValidationFunction<number>;
    moderationStatus?: ValidationFunction<string>;
    moderationFlags?: ValidationFunction<string>;
    moderationCheckedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WordCreateFormOverridesProps = {
    WordCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    phrase?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    pronunciation?: PrimitiveOverrideProps<TextFieldProps>;
    definition?: PrimitiveOverrideProps<TextFieldProps>;
    audio?: PrimitiveOverrideProps<TextFieldProps>;
    waveformData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    definitionAudio?: PrimitiveOverrideProps<TextFieldProps>;
    definitionWaveformData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    rubyTags?: PrimitiveOverrideProps<TextFieldProps>;
    importedAt?: PrimitiveOverrideProps<TextFieldProps>;
    embedding?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingModel?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingDimensions?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingVersion?: PrimitiveOverrideProps<TextFieldProps>;
    embeddingWordCount?: PrimitiveOverrideProps<TextFieldProps>;
    moderationStatus?: PrimitiveOverrideProps<TextFieldProps>;
    moderationFlags?: PrimitiveOverrideProps<TextAreaFieldProps>;
    moderationCheckedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WordCreateFormProps = React.PropsWithChildren<{
    overrides?: WordCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: WordCreateFormInputValues) => WordCreateFormInputValues;
    onSuccess?: (fields: WordCreateFormInputValues) => void;
    onError?: (fields: WordCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WordCreateFormInputValues) => WordCreateFormInputValues;
    onValidate?: WordCreateFormValidationValues;
} & React.CSSProperties>;
export default function WordCreateForm(props: WordCreateFormProps): React.ReactElement;
