/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Grade } from "../models";
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
export declare type GradeUpdateFormInputValues = {
    percentComplete?: number;
    accuracy?: number;
    timerStarted?: boolean;
    complete?: boolean;
    owner?: string;
    identityId?: string;
    instructor?: string;
    unitVersion?: number;
    data?: string;
    feedback?: string;
    files?: string[];
};
export declare type GradeUpdateFormValidationValues = {
    percentComplete?: ValidationFunction<number>;
    accuracy?: ValidationFunction<number>;
    timerStarted?: ValidationFunction<boolean>;
    complete?: ValidationFunction<boolean>;
    owner?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    instructor?: ValidationFunction<string>;
    unitVersion?: ValidationFunction<number>;
    data?: ValidationFunction<string>;
    feedback?: ValidationFunction<string>;
    files?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type GradeUpdateFormOverridesProps = {
    GradeUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    percentComplete?: PrimitiveOverrideProps<TextFieldProps>;
    accuracy?: PrimitiveOverrideProps<TextFieldProps>;
    timerStarted?: PrimitiveOverrideProps<SwitchFieldProps>;
    complete?: PrimitiveOverrideProps<SwitchFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    instructor?: PrimitiveOverrideProps<TextFieldProps>;
    unitVersion?: PrimitiveOverrideProps<TextFieldProps>;
    data?: PrimitiveOverrideProps<TextAreaFieldProps>;
    feedback?: PrimitiveOverrideProps<TextAreaFieldProps>;
    files?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type GradeUpdateFormProps = React.PropsWithChildren<{
    overrides?: GradeUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    grade?: Grade;
    onSubmit?: (fields: GradeUpdateFormInputValues) => GradeUpdateFormInputValues;
    onSuccess?: (fields: GradeUpdateFormInputValues) => void;
    onError?: (fields: GradeUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: GradeUpdateFormInputValues) => GradeUpdateFormInputValues;
    onValidate?: GradeUpdateFormValidationValues;
} & React.CSSProperties>;
export default function GradeUpdateForm(props: GradeUpdateFormProps): React.ReactElement;
