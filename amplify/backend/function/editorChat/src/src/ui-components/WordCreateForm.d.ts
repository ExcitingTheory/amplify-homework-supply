/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type WordCreateFormInputValues = {
    phrase?: string;
    owner?: string;
    pronunciation?: string;
    definition?: string;
    audio?: string[];
    rubyTags?: string;
};
export declare type WordCreateFormValidationValues = {
    phrase?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    pronunciation?: ValidationFunction<string>;
    definition?: ValidationFunction<string>;
    audio?: ValidationFunction<string>;
    rubyTags?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WordCreateFormOverridesProps = {
    WordCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    phrase?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    pronunciation?: PrimitiveOverrideProps<TextFieldProps>;
    definition?: PrimitiveOverrideProps<TextFieldProps>;
    audio?: PrimitiveOverrideProps<TextFieldProps>;
    rubyTags?: PrimitiveOverrideProps<TextFieldProps>;
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
