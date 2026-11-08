"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AuthContext from "@/context/authContext";
import { canAccessAdminArea, type AdminAccess } from "./adminAccess";

type AdminRouteGuardProps = {
  children: React.ReactNode;
  /** Defaults to Admins only; pass "staff" for tools instructors also use. */
  access?: AdminAccess;
};

export default function AdminRouteGuard({
  children,
  access = "admins",
}: AdminRouteGuardProps) {
  const { session } = React.useContext(AuthContext) as { session?: { groups?: string[] } };
  const groups = session?.groups || [];

  if (!canAccessAdminArea(groups, access)) {
    return (
      <Box sx={{ p: 4, maxWidth: 720, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          Access denied
        </Typography>
        <Typography color="text.secondary">
          {access === "staff"
            ? "This page is restricted to instructors and admins."
            : "This page is restricted to admins."}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}