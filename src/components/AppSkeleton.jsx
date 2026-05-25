import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * Full-page skeleton used while the app is loading (auth resolving, data fetching, etc.)
 * Mimics the typical page layout without an AppBar (AppShell provides that globally).
 *
 * @param {object} props
 * @param {'page'|'cards'|'detail'|'sections'} [props.variant='page'] - Layout variant
 */
export default function AppSkeleton({ variant = "page" }) {
  const isFullWidth = variant === "detail";
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        ...(!isFullWidth && { maxWidth: "60rem", mx: "auto" }),
      }}
    >
      {variant === "cards" && <CardsSkeleton />}
      {variant === "sections" && <SectionsSkeleton />}
      {variant === "detail" && <DetailSkeleton />}
      {variant === "page" && <PageSkeleton />}
    </Box>
  );
}

/** Default page skeleton: title + a few content blocks */
function PageSkeleton() {
  return (
    <>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="70%" height={24} sx={{ mb: 3 }} />
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 1, mb: 1 }}
          />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ))}
    </>
  );
}

/** Sections skeleton: vertical list of bordered cards matching sections page */
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
