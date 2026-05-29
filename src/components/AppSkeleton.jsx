import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import AuthFormSkeleton from "./AuthFormSkeleton";

const DRAWER_WIDTH = 280;
const APPBAR_HEIGHT = 48;

/**
 * Quick synchronous check for a likely valid Cognito session.
 * Checks both localStorage (Amplify default) and cookies (ChunkedCookieStorage).
 * Decodes the JWT exp claim to confirm the token hasn't expired.
 * Does NOT validate the signature — just a heuristic for skeleton selection.
 */
export function hasLikelySession() {
  if (typeof window === "undefined") return false;

  function isLiveJwt(token) {
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      return payload.exp && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  try {
    // 1. Check localStorage (Amplify default storage)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(".idToken")) {
        if (isLiveJwt(localStorage.getItem(key))) return true;
      }
    }
  } catch {
    // localStorage may be blocked in some contexts
  }

  try {
    // 2. Check cookies (ChunkedCookieStorage path — ssr:true)
    for (const raw of document.cookie.split(";")) {
      const eqIdx = raw.indexOf("=");
      if (eqIdx === -1) continue;
      const name = raw.slice(0, eqIdx).trim();
      if (name.endsWith(".idToken")) {
        const value = decodeURIComponent(raw.slice(eqIdx + 1).trim());
        if (isLiveJwt(value)) return true;
      }
    }
  } catch {
    // cookies may be blocked
  }

  return false;
}

/**
 * Full-page skeleton used while the app is loading (auth resolving, providers mounting).
 * Checks localStorage for a likely valid session to decide whether to show
 * the authenticated layout (AppBar + drawer) or a minimal loading state.
 *
 * @param {object} props
 * @param {'page'|'cards'|'detail'|'sections'} [props.variant='page'] - Layout variant
 */
export default function AppSkeleton({ variant = "page" }) {
  const isLikelyLoggedIn = hasLikelySession();

  if (!isLikelyLoggedIn) {
    return <AuthFormSkeleton />;
  }

  // Logged-in users: return null for the top-level auth gate skeleton.
  // Auth resolves in <200ms from cookies — rendering a full frame skeleton
  // that immediately swaps for the real AppShell causes ugly flashing.
  // The real AppShell + route loading.tsx will handle any visible loading state.
  if (variant === "page") {
    return null;
  }

  const contentSkeleton = (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: { xs: 2, sm: 3 },
        maxWidth: variant === "detail" ? "none" : "80rem",
        mx: variant === "detail" ? 0 : "auto",
        width: "100%",
      }}
    >
      {variant === "cards" && <CardsSkeleton />}
      {variant === "sections" && <SectionsSkeleton />}
      {variant === "detail" && <DetailSkeleton />}
      {variant === "page" && <PageSkeleton />}
    </Box>
  );

  // Inner loading states happen inside an already-mounted AppShell.
  // Avoid rendering another frame/drawer in that case.
  if (variant !== "page") {
    return contentSkeleton;
  }

  // Logged-in: show AppBar + drawer + content skeleton
  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* AppBar skeleton */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: APPBAR_HEIGHT,
          zIndex: 1300,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          px: 1.5,
          gap: 1,
        }}
      >
        <Skeleton variant="circular" width={36} height={36} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>

      <Box sx={{ display: "flex", mt: `${APPBAR_HEIGHT}px` }}>
        {/* Left nav drawer — desktop only */}
        <Box
          sx={{
            width: DRAWER_WIDTH,
            minWidth: DRAWER_WIDTH,
            borderRight: "1px solid",
            borderColor: "divider",
            height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
            p: 2,
            display: { xs: "none", md: "block" },
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={`${40 + i * 10}%`} height={24} />
            </Box>
          ))}
          <Skeleton
            variant="rectangular"
            height={1}
            sx={{ my: 2, opacity: 0.3 }}
          />
          {[0, 1].map((i) => (
            <Box
              key={`s${i}`}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={`${50 + i * 15}%`} height={24} />
            </Box>
          ))}
        </Box>

        {/* Main content */}
        {contentSkeleton}
      </Box>
    </Box>
  );
}

/** Default page skeleton: streak row + progress rings + divider + assignment cards (home page) */
function PageSkeleton() {
  return (
    <>
      {/* Streak indicator row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={120} height={28} />
      </Box>
      {/* Progress rings placeholder */}
      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="circular" width={80} height={80} />
        ))}
      </Box>
      <Skeleton variant="rectangular" height={1} sx={{ mb: 3, opacity: 0.3 }} />
      {/* Assignment cards */}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 1.5,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width={80}
            height={60}
            sx={{ borderRadius: 1 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="35%" height={18} />
          </Box>
          <Skeleton
            variant="rectangular"
            width={60}
            height={24}
            sx={{ borderRadius: 0.5 }}
          />
        </Box>
      ))}
    </>
  );
}

/** Sections skeleton: title + bordered cards with left accent matching sections page */
function SectionsSkeleton() {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Skeleton variant="text" width="30%" height={48} />
        <Skeleton
          variant="rectangular"
          width={140}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </Box>
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 2.5,
            mb: 2,
            borderLeft: 4,
          }}
        >
          <Skeleton variant="text" width="50%" height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="35%" height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ borderRadius: 0.5 }}
            />
          </Box>
          <Skeleton
            variant="rectangular"
            width={120}
            height={32}
            sx={{ borderRadius: 1, mt: 1.5 }}
          />
        </Box>
      ))}
    </>
  );
}

/** Card list skeleton: grid of card placeholders (for units page) */
function CardsSkeleton() {
  return (
    <>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Skeleton variant="rectangular" height={140} />
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}

/** Detail/editor skeleton: title + description, toolbar, side tabs + canvas */
function DetailSkeleton() {
  return (
    <Box sx={{ mx: -2 }}>
      {/* Title + description area */}
      <Box sx={{ px: 2, pt: 1, mb: 1 }}>
        <Skeleton variant="text" width="45%" height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="65%" height={22} />
      </Box>
      {/* Toolbar row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {[0, 1].map((i) => (
          <Skeleton
            key={`g${i}`}
            variant="rounded"
            width={28}
            height={28}
            sx={{ borderRadius: 0.5 }}
          />
        ))}
        <Skeleton
          variant="rounded"
          width={60}
          height={28}
          sx={{ borderRadius: 0.5 }}
        />
        <Skeleton
          variant="rounded"
          width={24}
          height={28}
          sx={{ borderRadius: 0.5 }}
        />
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={`f${i}`}
            variant="rounded"
            width={28}
            height={28}
            sx={{ borderRadius: 0.5 }}
          />
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton
          variant="rounded"
          width={100}
          height={32}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton
          variant="rounded"
          width={28}
          height={28}
          sx={{ borderRadius: 0.5 }}
        />
      </Box>
      {/* Editor body: left tabs + canvas + right tabs */}
      <Box sx={{ display: "flex", height: "calc(100vh - 200px)" }}>
        {/* Left tab strip */}
        <Box
          sx={{
            width: 40,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            pt: 2,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={24}
              height={24}
              sx={{ borderRadius: 0.5 }}
            />
          ))}
        </Box>
        {/* Canvas area */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton
            variant="rectangular"
            height={100}
            sx={{ borderRadius: 1, mt: 1 }}
          />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="85%" height={20} />
        </Box>
        {/* Right tab strip */}
        <Box
          sx={{
            width: 40,
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            pt: 2,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={24}
              height={24}
              sx={{ borderRadius: 0.5 }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
