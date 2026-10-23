"use client";
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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Hub } from "aws-amplify/utils";
import { signIn, signOut } from "aws-amplify/auth";
import AuthContext from "@/context/authContext";

const ROLE_LABEL_KEYS = {
  admin: "devQuickLogin.roleAdmin",
  instructor: "devQuickLogin.roleInstructor",
  student: "devQuickLogin.roleStudent",
};

// Dev-only one-click sign-in for seeded demo users; requires TEST_USER_PASSWORD_SEED
// in .env.local and a seeded sandbox (see amplify/seed/seed.ts for the user list).
function DevQuickLogin() {
  const t = useTranslations("components");
  const [users, setUsers] = React.useState([]);
  const [selectedUsername, setSelectedUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/dev/quick-login")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        setUsers(body.users || []);
        if (body.users?.length) setSelectedUsername(body.users[0].username);
      })
      .catch(() => {
        if (!cancelled) setError(t("devQuickLogin.unavailable"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleQuickLogin = async () => {
    if (!selectedUsername) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dev/quick-login?username=${encodeURIComponent(selectedUsername)}`,
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error || t("devQuickLogin.unavailable"));
      await signOut().catch(() => {});
      await signIn({ username: body.username, password: body.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group users by role so the dropdown reads "Admin / Instructor / Student".
  const usersByRole = users.reduce((acc, user) => {
    (acc[user.role] ||= []).push(user);
    return acc;
  }, {});

  if (!users.length) return null;

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mb: 2, textAlign: "center" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        // eslint-disable-next-line i18next/no-literal-string -- CSS value
        display="block"
        mb={1}
      >
        {t("devQuickLogin.heading")}
      </Typography>
      {/* eslint-disable-next-line i18next/no-literal-string -- CSS value */}
      <Stack direction="row" spacing={1} justifyContent="center">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="dev-quick-login-label">
            {t("devQuickLogin.seededUserLabel")}
          </InputLabel>
          <Select
            labelId="dev-quick-login-label"
            label={t("devQuickLogin.seededUserLabel")}
            value={selectedUsername}
            onChange={(e) => setSelectedUsername(e.target.value)}
            renderValue={(value) =>
              users.find((u) => u.username === value)?.displayName || value
            }
            MenuProps={{ PaperProps: { sx: { maxWidth: 360 } } }}
          >
            {Object.entries(usersByRole).map(([role, roleUsers]) => [
              <ListSubheader key={`header-${role}`}>
                {ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role}
              </ListSubheader>,
              ...roleUsers.map((user) => (
                <MenuItem
                  key={user.username}
                  value={user.username}
                  sx={{ whiteSpace: "normal" }}
                >
                  <ListItemText
                    primary={user.displayName}
                    secondary={user.description}
                  />
                </MenuItem>
              )),
            ])}
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          disabled={loading || !selectedUsername}
          onClick={handleQuickLogin}
        >
          {loading ? t("devQuickLogin.signingIn") : t("devQuickLogin.signIn")}
        </Button>
      </Stack>
      {error && (
        <Typography
          variant="caption"
          color="error"
          // eslint-disable-next-line i18next/no-literal-string -- CSS value
          display="block"
          mt={1}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

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
  const isDevelopment = process.env.NODE_ENV === "development";
  const router = useRouter();
  const { mode } = useColorScheme();
  const { user: authUser } = React.useContext(AuthContext);
  // Map MUI mode to Amplify UI colorMode ('light' | 'dark' | 'system')
  const colorMode = mode || "system";

  React.useEffect(() => {
    const hubListener = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        console.log("[MyAuth] User signed in, checking for return URL");
        const returnUrl = sessionStorage.getItem("returnUrl");
        if (returnUrl) {
          console.log("[MyAuth] Redirecting to return URL:", returnUrl);
          sessionStorage.removeItem("returnUrl");
          router.replace(returnUrl);
        }
      }
    });

    return () => hubListener();
  }, [router]);

  // If the user is already authenticated (past the AuthGate), skip the
  // Authenticator's internal loading state and render children immediately.
  if (authUser) {
    return <>{children}</>;
  }

  return (
    <AmplifyThemeProvider theme={amplifyAuthTheme} colorMode={colorMode}>
      {isDevelopment && <DevQuickLogin />}
      <Authenticator
        variant="modal"
        formFields={formFields}
        // eslint-disable-next-line i18next/no-literal-string -- Amplify login mechanism identifiers
        loginMechanisms={isDevelopment ? ["email"] : ["email", "phone_number"]}
      >
        {({ signOut, user }) =>
          React.Children.map(children, (child) =>
            React.isValidElement(child) && typeof child.type === "function"
              ? React.cloneElement(child, { signOut, user })
              : child,
          )
        }
      </Authenticator>
    </AmplifyThemeProvider>
  );
}
