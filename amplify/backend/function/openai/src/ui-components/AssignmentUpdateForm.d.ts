/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Assignment } from "../models";
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
export declare type AssignmentUpdateFormInputValues = {
    dueDate?: string;
    learner?: string;
    owner?: string;
    status?: string;
};
export declare type AssignmentUpdateFormValidationValues = {
    dueDate?: ValidationFunction<string>;
    learner?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AssignmentUpdateFormOverridesProps = {
    AssignmentUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    dueDate?: PrimitiveOverrideProps<TextFieldProps>;
    learner?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
} & EscapeHatchProps;
export declare type AssignmentUpdateFormProps = React.PropsWithChildren<{
    overrides?: AssignmentUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    assignment?: Assignment;
    onSubmit?: (fields: AssignmentUpdateFormInputValues) => AssignmentUpdateFormInputValues;
    onSuccess?: (fields: AssignmentUpdateFormInputValues) => void;
    onError?: (fields: AssignmentUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AssignmentUpdateFormInputValues) => AssignmentUpdateFormInputValues;
    onValidate?: AssignmentUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AssignmentUpdateForm(props: AssignmentUpdateFormProps): React.ReactElement;
