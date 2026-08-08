"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AuthContext from "@/context/authContext";

function canAccessAdminRoutes(groups: string[]): boolean {
  return groups.includes("Admins") || groups.includes("Instructors");
}

type AdminRouteGuardProps = {
  children: React.ReactNode;
};

export default function AdminRouteGuard({
  children,
}: AdminRouteGuardProps) {
  const { session } = React.useContext(AuthContext) as { session?: { groups?: string[] } };
  const groups = session?.groups || [];

  if (!canAccessAdminRoutes(groups)) {
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