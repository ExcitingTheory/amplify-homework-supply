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
  useAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
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

// One-click sign-in for seeded demo users. Available in development and on
// demo deployments that set NEXT_PUBLIC_DEMO_QUICK_LOGIN=true; requires
// TEST_USER_PASSWORD_SEED server-side and a seeded backend (see
// amplify/seed/seed.ts for the user list).
const IS_QUICK_LOGIN_ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEMO_QUICK_LOGIN === "true";

function useQuickLoginUsers(enabled) {
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetch("/api/dev/quick-login")
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setUsers(body.users || []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return users;
}

function DevQuickLogin({ users }) {
  const t = useTranslations("components");
  const [selectedUsername, setSelectedUsername] = React.useState(
    users[0]?.username ?? "",
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

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

  // Group users by role so the list reads "Admin / Instructor / Student".
  const usersByRole = users.reduce((acc, user) => {
    (acc[user.role] ||= []).push(user);
    return acc;
  }, {});

  return (
    <Card variant="outlined" sx={{ width: "100%", maxWidth: 440 }}>
      <CardHeader
        title={t("devQuickLogin.heading")}
        subheader={t("devQuickLogin.subheading")}
        slotProps={{
          title: { variant: "h6", component: "h2" },
        }}
      />
      <CardContent sx={{ pt: 0 }}>
        <List
          dense
          disablePadding
          aria-label={t("devQuickLogin.seededUserLabel")}
          sx={{ maxHeight: 360, overflowY: "auto" }}
        >
          {Object.entries(usersByRole).map(([role, roleUsers]) => (
            <li key={role}>
              <ul style={{ padding: 0 }}>
                <ListSubheader disableSticky>
                  {ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role}
                </ListSubheader>
                {roleUsers.map((user) => (
                  <ListItemButton
                    key={user.username}
                    selected={user.username === selectedUsername}
                    onClick={() => setSelectedUsername(user.username)}
                    aria-pressed={user.username === selectedUsername}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={user.displayName}
                      secondary={user.description}
                    />
                  </ListItemButton>
                ))}
              </ul>
            </li>
          ))}
        </List>
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
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={loading || !selectedUsername}
          onClick={handleQuickLogin}
        >
          {loading
            ? t("devQuickLogin.signingIn")
            : t("devQuickLogin.signInAs", {
                name:
                  users.find((u) => u.username === selectedUsername)
                    ?.displayName ?? "",
              })}
        </Button>
      </CardActions>
    </Card>
  );
}

// Amplify UI tokens resolve to the MUI CSS variables, so the widget follows the
// active theme (cosmetic theme and light/dark scheme) without per-mode overrides.
const muiVar = (name) => `var(--mui-palette-${name})`;
const mixPrimary = (percent, into) =>
  `color-mix(in srgb, ${muiVar("primary-main")} ${percent}%, ${into})`;
const primaryScale = {
  10: mixPrimary(10, muiVar("background-paper")),
  20: mixPrimary(20, muiVar("background-paper")),
  40: mixPrimary(40, muiVar("background-paper")),
  60: mixPrimary(70, muiVar("background-paper")),
  80: muiVar("primary-main"),
  // Mixing toward the text color darkens in light mode and lightens in dark mode.
  90: mixPrimary(85, muiVar("text-primary")),
  100: mixPrimary(70, muiVar("text-primary")),
};

const amplifyAuthTheme = {
  name: "homework-supply-auth",
  tokens: {
    colors: {
      // Amplify components read `colors.primary`, not `colors.brand.primary`.
      primary: Object.fromEntries(
        Object.entries(primaryScale).map(([step, value]) => [step, { value }]),
      ),
      background: {
        primary: { value: muiVar("background-paper") },
        secondary: { value: muiVar("background-default") },
      },
      font: {
        primary: { value: muiVar("text-primary") },
        secondary: { value: muiVar("text-secondary") },
        inverse: { value: muiVar("primary-contrastText") },
      },
      border: {
        primary: { value: muiVar("divider") },
      },
    },
    fonts: {
      default: {
        variable: { value: "inherit" },
        static: { value: "inherit" },
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: { value: "none" },
        },
      },
      // Mirror the MUI contained medium button (8px radius, 600 weight, 0.875rem,
      // ~36.5px tall); the 5px block padding plus the 1px border equals MUI's 6px.
      button: {
        borderRadius: { value: "var(--let-radius-control, 8px)" },
        fontWeight: { value: "600" },
        fontSize: { value: "0.875rem" },
        lineHeight: { value: "1.75" },
        paddingBlockStart: { value: "5px" },
        paddingBlockEnd: { value: "5px" },
      },
    },
  },
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

function AuthShell({ users, authenticator }) {
  const { authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);

  // Once authenticated, render the Authenticator on its own so the app is not
  // nested inside the sign-in layout.
  if (!users.length || authStatus === "authenticated") return authenticator;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: 3,
        alignItems: "start",
        justifyItems: "center",
        maxWidth: 1000,
        mx: "auto",
        p: { xs: 2, md: 4 },
      }}
    >
      <DevQuickLogin users={users} />
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          // Match the demo card's corner radius.
          "& [data-amplify-router]": {
            borderRadius: "var(--let-radius-card, 8px)",
            overflow: "hidden",
          },
        }}
      >
        {authenticator}
      </Box>
    </Box>
  );
}

export default function MyAuth({ children }) {
  const t = useTranslations("components");
  const formFields = getFormFields(t);
  const isDevelopment = process.env.NODE_ENV === "development";
  const loginMechanisms = isDevelopment ? ["email"] : ["email", "phone_number"];
  const router = useRouter();
  const { user: authUser } = React.useContext(AuthContext);
  const quickLoginUsers = useQuickLoginUsers(
    IS_QUICK_LOGIN_ENABLED && !authUser,
  );

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
    <AmplifyThemeProvider theme={amplifyAuthTheme}>
      <Authenticator.Provider>
        <AuthShell
          users={quickLoginUsers}
          authenticator={
            <Authenticator
              variant="modal"
              formFields={formFields}
              loginMechanisms={loginMechanisms}
            >
              {({ signOut, user }) =>
                React.Children.map(children, (child) =>
                  React.isValidElement(child) &&
                  typeof child.type === "function"
                    ? React.cloneElement(child, { signOut, user })
                    : child,
                )
              }
            </Authenticator>
          }
        />
      </Authenticator.Provider>
    </AmplifyThemeProvider>
  );
}
