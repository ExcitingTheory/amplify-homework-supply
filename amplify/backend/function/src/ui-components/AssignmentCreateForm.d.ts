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
export declare type AssignmentCreateFormInputValues = {
    dueDate?: string;
    learner?: string;
    owner?: string;
    status?: string;
};
export declare type AssignmentCreateFormValidationValues = {
    dueDate?: ValidationFunction<string>;
    learner?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AssignmentCreateFormOverridesProps = {
    AssignmentCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    dueDate?: PrimitiveOverrideProps<TextFieldProps>;
    learner?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type AssignmentCreateFormProps = React.PropsWithChildren<{
    overrides?: AssignmentCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AssignmentCreateFormInputValues) => AssignmentCreateFormInputValues;
    onSuccess?: (fields: AssignmentCreateFormInputValues) => void;
    onError?: (fields: AssignmentCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AssignmentCreateFormInputValues) => AssignmentCreateFormInputValues;
    onValidate?: AssignmentCreateFormValidationValues;
} & React.CSSProperties>;
export default function AssignmentCreateForm(props: AssignmentCreateFormProps): React.ReactElement;
