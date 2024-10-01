/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Section } from "../models";
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
export declare type SectionUpdateFormInputValues = {
    name?: string;
    owner?: string;
    learner?: string;
    description?: string;
    status?: string;
    code?: string;
    featuredImage?: string;
    identityId?: string;
    thumbnail?: string;
    backgroundColor?: string;
};
export declare type SectionUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    learner?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    code?: ValidationFunction<string>;
    featuredImage?: ValidationFunction<string>;
    identityId?: ValidationFunction<string>;
    thumbnail?: ValidationFunction<string>;
    backgroundColor?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SectionUpdateFormOverridesProps = {
    SectionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    learner?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    code?: PrimitiveOverrideProps<TextFieldProps>;
    featuredImage?: PrimitiveOverrideProps<TextFieldProps>;
    identityId?: PrimitiveOverrideProps<TextFieldProps>;
    thumbnail?: PrimitiveOverrideProps<TextFieldProps>;
    backgroundColor?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SectionUpdateFormProps = React.PropsWithChildren<{
    overrides?: SectionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    section?: Section;
    onSubmit?: (fields: SectionUpdateFormInputValues) => SectionUpdateFormInputValues;
    onSuccess?: (fields: SectionUpdateFormInputValues) => void;
    onError?: (fields: SectionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SectionUpdateFormInputValues) => SectionUpdateFormInputValues;
    onValidate?: SectionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SectionUpdateForm(props: SectionUpdateFormProps): React.ReactElement;
