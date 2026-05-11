/**
 * @fileoverview Authenticator - AWS Amplify authentication component wrapper
 *
 * Provides sign in, sign up, and password reset flows using AWS Cognito.
 * Displays email/password form with custom field configuration. Used throughout
 * the app to gate access to authenticated content.
 *
 * Handles return URL redirection: when a user is logged out and tries to access
 * a protected URL, the URL is stored and the user is redirected back after login.
 *
 * @module Authenticator
 */

import React from "react";
import {
  Authenticator,
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Hub } from "aws-amplify/utils";

const amplifyAuthTheme = {
  name: "homework-supply-auth",
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: "#eef0fa" },
          20: { value: "#d5d9f0" },
          40: { value: "#9aa3e0" },
          60: { value: "#6f7bd6" },
          80: { value: "#556cd6" },
          90: { value: "#4458b8" },
          100: { value: "#344499" },
        },
      },
      background: {
        primary: { value: "#fafafa" },
        secondary: { value: "#ffffff" },
      },
      font: {
        primary: { value: "#1a1a1a" },
        secondary: { value: "#666666" },
      },
      border: {
        primary: { value: "#e0e0e0" },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: { value: "0" },
          boxShadow: { value: "0 4px 24px rgba(0, 0, 0, 0.1)" },
        },
      },
    },
  },
  overrides: [
    {
      colorMode: "dark",
      tokens: {
        colors: {
          brand: {
            primary: {
              10: { value: "#1a1e3a" },
              20: { value: "#2a3060" },
              40: { value: "#4a5690" },
              60: { value: "#5560a0" },
              80: { value: "#4a5690" },
              90: { value: "#3f4a80" },
              100: { value: "#354070" },
            },
          },
          background: {
            primary: { value: "#121212" },
            secondary: { value: "#1e1e1e" },
          },
          font: {
            primary: { value: "#e0e0e0" },
            secondary: { value: "#a0a0a0" },
          },
          border: {
            primary: { value: "#333333" },
          },
        },
        components: {
          authenticator: {
            router: {
              boxShadow: { value: "0 4px 24px rgba(0, 0, 0, 0.4)" },
            },
          },
        },
      },
    },
  ],
};

function getFormFields(t) {
  return {
    signUp: {
      given_name: {
        label: t("authenticator.firstNameLabel"),
        placeholder: t("authenticator.firstNamePlaceholder"),
        isRequired: true,
        order: 1,
      },
      family_name: {
        label: t("authenticator.lastNameLabel"),
        placeholder: t("authenticator.lastNamePlaceholder"),
        isRequired: true,
        order: 2,
      },
      email: {
        label: t("authenticator.emailLabel"),
        placeholder: t("authenticator.emailPlaceholder"),
        isRequired: true,
        order: 3,
      },
      phone_number: {
        label: t("authenticator.phoneLabel"),
        placeholder: t("authenticator.phonePlaceholder"),
        isRequired: false,
        order: 4,
      },
      preferred_username: {
        label: t("authenticator.preferredNameLabel"),
        placeholder: t("authenticator.preferredNamePlaceholder"),
        isRequired: false,
        order: 5,
      },
      password: {
        label: t("authenticator.passwordLabel"),
        placeholder: t("authenticator.passwordPlaceholder"),
        isRequired: false,
        order: 6,
      },
      confirm_password: {
        label: t("authenticator.confirmPasswordLabel"),
        placeholder: t("authenticator.confirmPasswordPlaceholder"),
        order: 7,
      },
    },
  };
}

export default function MyAuth({ children }) {
  const t = useTranslations("components");
  const formFields = getFormFields(t);
  const router = useRouter();
  const { mode } = useColorScheme();
  // Map MUI mode to Amplify UI colorMode ('light' | 'dark' | 'system')
  const colorMode = mode || "system";

  React.useEffect(() => {
    // Listen for successful sign in events
    const hubListener = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        console.log("[MyAuth] User signed in, checking for return URL");
        // Check if there's a return URL stored
        const returnUrl = sessionStorage.getItem("returnUrl");
        if (returnUrl) {
          console.log("[MyAuth] Redirecting to return URL:", returnUrl);
          sessionStorage.removeItem("returnUrl");
          // Use replace to avoid adding to history
          router.replace(returnUrl);
        }
      }
    });

    return () => hubListener();
  }, [router]);

  return (
    <AmplifyThemeProvider theme={amplifyAuthTheme} colorMode={colorMode}>
      <Authenticator
        variant="modal"
        formFields={formFields}
        loginMechanisms={["email", "phone_number"]}
      >
        {({ signOut, user }) =>
          React.Children.map(children, (child) =>
            React.cloneElement(child, { signOut, user }),
          )
        }
      </Authenticator>
    </AmplifyThemeProvider>
  );
}
