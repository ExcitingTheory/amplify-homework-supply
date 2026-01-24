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

const formFields = {
    signUp: {
        name: {
            label: 'Name:',
            placeholder: 'Enter your Name:',
            isRequired: true,
            order: 1,
        },

        email: {
            label: 'Email:',
            placeholder: 'Enter your Email:',
            isRequired: true,
            order: 2,
        },

        password: {
            label: 'Password:',
            placeholder: 'Enter your Password:',
            isRequired: false,
            order: 3,
        },
        confirm_password: {
            label: 'Confirm Password:',
            order: 4,
        },
    },
};



export default function MyAuth({ children }) {
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