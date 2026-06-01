"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type AuthUser = {
  signInUserSession?: {
    accessToken?: { payload?: Record<string, unknown> };
    idToken?: { payload?: Record<string, unknown> };
  };
  groups?: string[];
};

function getUserGroups(user?: AuthUser): string[] {
  const accessGroups = user?.signInUserSession?.accessToken?.payload?.[
    "cognito:groups"
  ];
  if (Array.isArray(accessGroups)) return accessGroups as string[];

  const idGroups = user?.signInUserSession?.idToken?.payload?.["cognito:groups"];
  if (Array.isArray(idGroups)) return idGroups as string[];

  return Array.isArray(user?.groups) ? user.groups : [];
}

function canAccessAdminRoutes(user?: AuthUser): boolean {
  const groups = getUserGroups(user);
  return groups.includes("Admins") || groups.includes("Instructors");
}

type AdminRouteGuardProps = {
  user?: AuthUser;
  children: React.ReactNode;
};

export default function AdminRouteGuard({
  user,
  children,
}: AdminRouteGuardProps) {
  if (!canAccessAdminRoutes(user)) {
    return (
      <Box sx={{ p: 4, maxWidth: 720, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          Access denied
        </Typography>
        <Typography color="text.secondary">
          Admin pages are restricted to instructors and admins.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}