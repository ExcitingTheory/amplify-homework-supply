/**
 * @fileoverview Authenticator - AWS Amplify authentication component wrapper
 * 
 * Provides sign in, sign up, and password reset flows using AWS Cognito.
 * Displays email/password form with custom field configuration. Used throughout
 * the app to gate access to authenticated content.
 * 
 * @module Authenticator
 */

import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useTranslation } from 'next-i18next';

function getFormFields(t) {
    return {
        signUp: {
            name: {
                label: t('authenticator.nameLabel'),
                placeholder: t('authenticator.namePlaceholder'),
                isRequired: true,
                order: 1,
            },
            email: {
                label: t('authenticator.emailLabel'),
                placeholder: t('authenticator.emailPlaceholder'),
                isRequired: true,
                order: 2,
            },
            password: {
                label: t('authenticator.passwordLabel'),
                placeholder: t('authenticator.passwordPlaceholder'),
                isRequired: false,
                order: 3,
            },
            confirm_password: {
                label: t('authenticator.confirmPasswordLabel'),
                placeholder: t('authenticator.confirmPasswordPlaceholder'),
                order: 4,
            },
        },
    };
}


export default function MyAuth({ children }) {
    const { t } = useTranslation('components');
    const formFields = getFormFields(t);
    
    return (
        <Authenticator
            usernameAttributes="email"
            variant="modal"
            formFields={formFields}
        >
            {({ signOut, user }) => React.Children.map(children, (child) =>
                React.cloneElement(child, { signOut, user })
            )}
        </Authenticator>
    )
}