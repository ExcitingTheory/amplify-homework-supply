/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type UnitCreateFormInputValues = {
    number?: number;
    name?: string;
    learners?: string[];
    owner?: string;
    description?: string;
    data?: string;
    status?: string;
    timeLimitSeconds?: number;
};
export declare type UnitCreateFormValidationValues = {
    number?: ValidationFunction<number>;
    name?: ValidationFunction<string>;
    learners?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    data?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    timeLimitSeconds?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type UnitCreateFormOverridesProps = {
    UnitCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    number?: PrimitiveOverrideProps<TextFieldProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    learners?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    data?: PrimitiveOverrideProps<TextAreaFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    timeLimitSeconds?: PrimitiveOverrideProps<TextFieldProps>;
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
