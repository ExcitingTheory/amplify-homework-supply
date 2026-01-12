/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Question } from "../models";
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
export declare type QuestionUpdateFormInputValues = {
    owner?: string;
    identityId?: string;
    answer?: string;
    hint?: string;
    prompt?: string;
    audio?: string[];
    audioWaveformData?: string;
    answerAudio?: string[];
    answerAudioWaveformData?: string;
    generated?: boolean;
    model?: string;
    promptHex?: string;
    byPromptHex?: string;
    thumbnail?: string;
    difficulty?: string;
    metadata?: string;
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
export declare type QuestionUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    answer?: ValidationFunction<string>;
    hint?: ValidationFunction<string>;
    prompt?: ValidationFunction<string>;
    audio?: ValidationFunction<string>;
    audioWaveformData?: ValidationFunction<string>;
    answerAudio?: ValidationFunction<string>;
    answerAudioWaveformData?: ValidationFunction<string>;
    generated?: ValidationFunction<boolean>;
    model?: ValidationFunction<string>;
    promptHex?: ValidationFunction<string>;
    byPromptHex?: ValidationFunction<string>;
    thumbnail?: ValidationFunction<string>;
    difficulty?: ValidationFunction<string>;
    metadata?: ValidationFunction<string>;
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
export declare type QuestionUpdateFormOverridesProps = {
    QuestionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    answer?: PrimitiveOverrideProps<TextFieldProps>;
    hint?: PrimitiveOverrideProps<TextFieldProps>;
    prompt?: PrimitiveOverrideProps<TextFieldProps>;
    audio?: PrimitiveOverrideProps<TextFieldProps>;
    audioWaveformData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    answerAudio?: PrimitiveOverrideProps<TextFieldProps>;
    answerAudioWaveformData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    generated?: PrimitiveOverrideProps<SwitchFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    promptHex?: PrimitiveOverrideProps<TextFieldProps>;
    byPromptHex?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
    difficulty?: PrimitiveOverrideProps<TextFieldProps>;
    metadata?: PrimitiveOverrideProps<TextFieldProps>;
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
export declare type QuestionUpdateFormProps = React.PropsWithChildren<{
    overrides?: QuestionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    question?: Question;
    onSubmit?: (fields: QuestionUpdateFormInputValues) => QuestionUpdateFormInputValues;
    onSuccess?: (fields: QuestionUpdateFormInputValues) => void;
    onError?: (fields: QuestionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: QuestionUpdateFormInputValues) => QuestionUpdateFormInputValues;
    onValidate?: QuestionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function QuestionUpdateForm(props: QuestionUpdateFormProps): React.ReactElement;
