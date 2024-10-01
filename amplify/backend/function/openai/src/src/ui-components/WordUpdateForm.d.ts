/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Word } from "../models";
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
export declare type WordUpdateFormInputValues = {
    phrase?: string;
    owner?: string;
    identityId?: string;
    pronunciation?: string;
    definition?: string;
    audio?: string[];
    definitionAudio?: string[];
    rubyTags?: string;
};
export declare type WordUpdateFormValidationValues = {
    phrase?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    pronunciation?: ValidationFunction<string>;
    definition?: ValidationFunction<string>;
    audio?: ValidationFunction<string>;
    definitionAudio?: ValidationFunction<string>;
    rubyTags?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WordUpdateFormOverridesProps = {
    WordUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    phrase?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    pronunciation?: PrimitiveOverrideProps<TextFieldProps>;
    definition?: PrimitiveOverrideProps<TextFieldProps>;
    audio?: PrimitiveOverrideProps<TextFieldProps>;
    definitionAudio?: PrimitiveOverrideProps<TextFieldProps>;
    rubyTags?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WordUpdateFormProps = React.PropsWithChildren<{
    overrides?: WordUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    word?: Word;
    onSubmit?: (fields: WordUpdateFormInputValues) => WordUpdateFormInputValues;
    onSuccess?: (fields: WordUpdateFormInputValues) => void;
    onError?: (fields: WordUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WordUpdateFormInputValues) => WordUpdateFormInputValues;
    onValidate?: WordUpdateFormValidationValues;
} & React.CSSProperties>;
export default function WordUpdateForm(props: WordUpdateFormProps): React.ReactElement;
