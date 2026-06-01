"use client";
import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * Skeleton shaped like the Amplify sign-in form.
 * Shown while auth is resolving for unauthenticated (or unknown) users
 * so the loading state matches the real form that appears next.
 */
export default function AuthFormSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        pt: 6,
      }}
    >
      <Box
        sx={{
          width: 360,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          p: 3,
          backgroundColor: "background.paper",
        }}
      >
        {/* Sign In / Create Account tabs */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Skeleton variant="rounded" width="50%" height={36} />
          <Skeleton variant="rounded" width="50%" height={36} />
        </Box>
        {/* Email label + input */}
        <Skeleton variant="text" width={80} height={18} sx={{ mb: 0.5 }} />
        <Skeleton
          variant="rounded"
          width="100%"
          height={40}
          sx={{ mb: 2, borderRadius: 1 }}
        />
        {/* Password label + input */}
        <Skeleton variant="text" width={100} height={18} sx={{ mb: 0.5 }} />
        <Skeleton
          variant="rounded"
          width="100%"
          height={40}
          sx={{ mb: 1, borderRadius: 1 }}
        />
        {/* Forgot password link */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Skeleton variant="text" width={130} height={18} />
        </Box>
        {/* Sign In button */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={42}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
}
