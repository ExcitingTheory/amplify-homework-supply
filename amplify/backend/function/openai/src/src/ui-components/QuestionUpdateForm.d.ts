/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
    answerAudio?: string[];
    generated?: boolean;
    model?: string;
    promptHex?: string;
    byPromptHex?: string;
    thumbnail?: string;
};
export declare type QuestionUpdateFormValidationValues = {
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    answer?: ValidationFunction<string>;
    hint?: ValidationFunction<string>;
    prompt?: ValidationFunction<string>;
    audio?: ValidationFunction<string>;
    answerAudio?: ValidationFunction<string>;
    generated?: ValidationFunction<boolean>;
    model?: ValidationFunction<string>;
    promptHex?: ValidationFunction<string>;
    byPromptHex?: ValidationFunction<string>;
    thumbnail?: ValidationFunction<string>;
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
    answerAudio?: PrimitiveOverrideProps<TextFieldProps>;
    generated?: PrimitiveOverrideProps<SwitchFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    promptHex?: PrimitiveOverrideProps<TextFieldProps>;
    byPromptHex?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
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
