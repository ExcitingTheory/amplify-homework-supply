import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import { getGrainySheenSx } from "@/utils/grainySheen";
import {
  getTinctures,
  readableInk,
  TINCTURE_KEYS,
  type Tincture,
  type TinctureKey,
} from "@/themes/heraldry";
import { DASHBOARD_TOKENS } from "./constants";

// Plain-English labels for the heraldic tincture names.
const TINCTURE_LABELS: Record<TinctureKey, string> = {
  or: "Or (gold)",
  argent: "Argent (silver)",
  gules: "Gules (red)",
  azure: "Azure (blue)",
  vert: "Vert (green)",
  sable: "Sable (black)",
  purpure: "Purpure (purple)",
};

// Mirrors the private `ramp()` helper in heraldry.ts so arbitrary theme colors
// (not just the 7 canonical tinctures) can be turned into the same
// shade/main/light ramp shape for the conic ring.
function toTincture(name: string, main: string, isDarkMode: boolean): Tincture {
  return {
    name,
    main,
    shade: darken(main, isDarkMode ? 0.35 : 0.3),
    light: lighten(main, isDarkMode ? 0.2 : 0.32),
  };
}

/**
 * Exploratory mockup — NOT wired into the real dashboard. Lets us compare
 * toned-down hero gradient presets, light-vs-dark card overlays, button
 * contrast, and monochromatic conic-gradient borders side by side before
 * picking a direction for `DashboardHeroView` / `InstructorDashboard`.
 */
const meta: Meta = {
  title: "🧩 UI Components/Dashboard Hero Gradient Presets",
  parameters: {
    minimalProviders: true,
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Mockup gallery for toning down the dashboard hero gradient. Compare background presets, white vs. black card overlays, button variants, and conic-gradient borders.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

interface GradientPreset {
  id: string;
  label: string;
  description: string;
  colorA: string;
  colorB: string;
  grain: number;
  shine: number;
  animate: boolean;
}

function usePresets(): GradientPreset[] {
  const theme = useTheme();
  return [
    {
      id: "current",
      label: "Current (baseline)",
      description: "secondary → error, full saturation, grain 0.35, shine 0.16",
      colorA: theme.palette.secondary.main,
      colorB: theme.palette.error.main,
      grain: 0.35,
      shine: 0.16,
      animate: true,
    },
    {
      id: "soft-duotone",
      label: "Soft duotone",
      description: "Same hues, lighter stops, grain 0.12, shine 0.08",
      colorA: theme.palette.secondary.light,
      colorB: theme.palette.error.light,
      grain: 0.12,
      shine: 0.08,
      animate: true,
    },
    {
      id: "monochromatic",
      label: "Monochromatic primary",
      description:
        "One hue ramp (primary dark → main) instead of two contrasting colors",
      colorA: theme.palette.primary.dark,
      colorB: theme.palette.primary.main,
      grain: 0.1,
      shine: 0.06,
      animate: false,
    },
    {
      id: "subtle-wash",
      label: "Subtle wash",
      description: "Near-neutral panel, grain only, no animated sheen",
      colorA: alpha(theme.palette.secondary.main, 0.25),
      colorB: theme.palette.background.paper,
      grain: 0.06,
      shine: 0,
      animate: false,
    },
  ];
}

function MockNextStepCard({
  overlay,
  onGradient,
  accentColor,
}: {
  overlay: "white" | "black";
  onGradient: boolean;
  accentColor: string;
}) {
  const isWhite = overlay === "white";
  const cardBg = onGradient
    ? isWhite
      ? alpha("#fff", 0.16)
      : alpha("#000", 0.38)
    : alpha(accentColor, 0.06);
  const cardBorder = onGradient
    ? isWhite
      ? alpha("#fff", 0.55)
      : alpha("#000", 0.55)
    : alpha(accentColor, 0.3);
  const textColor = onGradient
    ? isWhite
      ? "common.white"
      : "common.white"
    : undefined;
  const secondaryTextColor = onGradient
    ? isWhite
      ? alpha("#fff", 0.85)
      : alpha("#fff", 0.75)
    : "text.secondary";

  return (
    <Box
      sx={{
        bgcolor: cardBg,
        border: "2px solid",
        borderColor: cardBorder,
        borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
        p: 2.5,
        backdropFilter: onGradient ? "blur(2px)" : undefined,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: textColor,
          opacity: 0.85,
          mb: 0.5,
        }}
      >
        Today
      </Typography>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: textColor, mb: 0.5 }}
      >
        Fractions: Mixed Numbers
      </Typography>
      <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
        Due soon · Section 2B
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: isWhite ? "common.white" : "common.black",
            color: isWhite ? "primary.main" : "common.white",
            fontWeight: 700,
            "&:hover": {
              bgcolor: isWhite ? alpha("#fff", 0.85) : alpha("#000", 0.75),
            },
          }}
        >
          Start
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{
            color: textColor,
            borderWidth: "1.5px",
            borderColor: isWhite ? alpha("#fff", 0.8) : alpha("#000", 0.8),
            bgcolor: "transparent",
            fontWeight: 700,
            "&:hover": {
              borderColor: isWhite ? "common.white" : "common.black",
              bgcolor: isWhite ? alpha("#fff", 0.08) : alpha("#000", 0.08),
            },
          }}
        >
          Practice focus areas
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{
            color: textColor,
            borderWidth: "1px",
            borderColor: isWhite ? alpha("#fff", 0.35) : alpha("#000", 0.35),
            bgcolor: "transparent",
            fontWeight: 600,
            "&:hover": {
              borderColor: isWhite ? alpha("#fff", 0.6) : alpha("#000", 0.6),
              bgcolor: isWhite ? alpha("#fff", 0.05) : alpha("#000", 0.05),
            },
          }}
        >
          Dismiss
        </Button>
      </Stack>
    </Box>
  );
}

function PresetBlock({ preset }: { preset: GradientPreset }) {
  const ink = readableInk(preset.colorA);
  return (
    <Box sx={{ mb: 5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
        {preset.label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {preset.description}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            border: "1px solid",
            borderColor: "divider",
            color: ink,
            p: { xs: 2.5, sm: 3 },
            ...getGrainySheenSx(preset.colorA, preset.colorB, {
              grain: preset.grain,
              shine: preset.shine,
              animate: preset.animate,
            }),
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 700, mb: 1, opacity: 0.8 }}
          >
            White overlay card
          </Typography>
          <MockNextStepCard
            overlay="white"
            onGradient
            accentColor={preset.colorA}
          />
        </Box>
        <Box
          sx={{
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            border: "1px solid",
            borderColor: "divider",
            color: ink,
            p: { xs: 2.5, sm: 3 },
            ...getGrainySheenSx(preset.colorA, preset.colorB, {
              grain: preset.grain,
              shine: preset.shine,
              animate: preset.animate,
            }),
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 700, mb: 1, opacity: 0.8 }}
          >
            Black overlay card
          </Typography>
          <MockNextStepCard
            overlay="black"
            onGradient
            accentColor={preset.colorA}
          />
        </Box>
      </Box>
    </Box>
  );
}

/** All toned-down gradient presets, each compared with white vs. black card overlays. */
export const GradientPresetGallery: Story = {
  render: function Render() {
    const presets = usePresets();
    return (
      <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          Hero gradient presets
        </Typography>
        {presets.map((preset) => (
          <PresetBlock key={preset.id} preset={preset} />
        ))}
      </Box>
    );
  },
};

/**
 * Single-tincture conic-gradient ring wrapped around arbitrary children (a card
 * body or a button). Uses the tincture's own opaque shade/light stops (not an
 * alpha-blended wash) so the ring stays visible against both light and dark
 * `background.paper` — alpha(hue, 0.15) reads as near-invisible on a white
 * card, which was the cause of the "colors are too subtle in light mode" bug.
 * The gradient lives on an oversized `::before` pseudo-element centered on the
 * wrapper via `top/left: 50% + translate(-50%, -50%)`, then spun with a
 * `transform: rotate()` keyframe — animating the `background` declaration
 * itself (e.g. a `from <angle>` custom property) does not repaint conic-gradient
 * stops in any browser, which is why an earlier version never visibly rotated.
 */
function ConicGradientRing({
  tincture,
  rotate,
  radius,
  thickness = 3,
  children,
}: {
  tincture: Tincture;
  rotate: boolean;
  radius: number;
  thickness?: number;
  children: React.ReactNode;
}) {
  // Exactly 3 stops (shade → light → shade) — one bright cone per revolution.
  // 5 stops (dim/hue/dim/hue/dim) would produce two cones instead of one.
  const ring = `conic-gradient(from 0deg, ${tincture.shade} 0%, ${tincture.light} 50%, ${tincture.shade} 100%)`;
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        width: "100%",
        borderRadius: `${radius}px`,
        p: `${thickness}px`,
        overflow: "hidden",
        isolation: "isolate",
        "@keyframes conicGradientSpin": {
          from: { transform: "translate(-50%, -50%) rotate(0deg)" },
          to: { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          // `width: %, height: %` resolves against the wrapper's own box, so on
          // a non-square wrapper (e.g. a wide, short button) it stretches into
          // a rectangle instead of a circle — the conic-gradient cone warps as
          // it turns instead of sweeping smoothly. Fixing the aspect ratio to
          // 1 keeps it a true circle (and therefore a steady rotation) no
          // matter the wrapper's shape; sizing off `width` alone is safe here
          // since every wrapper (card or button) is wider than it is tall.
          width: "300%",
          aspectRatio: "1",
          background: ring,
          transform: "translate(-50%, -50%)",
          ...(rotate && {
            animation: "conicGradientSpin 6s linear infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }),
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          borderRadius: `${Math.max(radius - thickness, 0)}px`,
          bgcolor: "background.paper",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function ConicBorderCard({
  tincture,
  label,
  rotate,
}: {
  tincture: Tincture;
  label: string;
  rotate: boolean;
}) {
  return (
    <ConicGradientRing
      tincture={tincture}
      rotate={rotate}
      radius={DASHBOARD_TOKENS.radius.card + 2}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
        >
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Fractions: Mixed Numbers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Due soon · Section 2B
        </Typography>
      </Box>
    </ConicGradientRing>
  );
}

function ConicBorderButton({
  tincture,
  label,
  rotate,
  variant,
}: {
  tincture: Tincture;
  label: string;
  rotate: boolean;
  variant: "contained" | "outlined";
}) {
  return (
    <ConicGradientRing
      tincture={tincture}
      rotate={rotate}
      radius={DASHBOARD_TOKENS.radius.button + 2}
    >
      <Button
        fullWidth
        variant={variant}
        size="small"
        sx={{
          borderRadius: `${DASHBOARD_TOKENS.radius.button}px`,
          ...(variant === "outlined" && { bgcolor: "transparent" }),
        }}
      >
        {label}
      </Button>
    </ConicGradientRing>
  );
}

/** Flat neutral panels with a single-tincture conic-gradient ring border instead of a filled background gradient. */
export const ConicMonochromeBorders: Story = {
  render: function Render() {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const hues: Array<{ id: string; label: string; tincture: Tincture }> = [
      {
        id: "primary",
        label: "Monochromatic — primary",
        tincture: toTincture("primary", theme.palette.primary.main, isDarkMode),
      },
      {
        id: "secondary",
        label: "Monochromatic — secondary",
        tincture: toTincture(
          "secondary",
          theme.palette.secondary.main,
          isDarkMode,
        ),
      },
      {
        id: "slate",
        label: "Monochromatic — slate (instructor accent)",
        tincture: toTincture("slate", theme.palette.grey[600], isDarkMode),
      },
    ];
    return (
      <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Conic-gradient border — static vs. rotating
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No background gradient at all — the card stays flat and neutral, the
          accent lives only in a thin single-hue ring around the edge.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 2,
            mb: 4,
          }}
        >
          {hues.map((hue) => (
            <ConicBorderCard
              key={hue.id}
              tincture={hue.tincture}
              label={`${hue.label} · static`}
              rotate={false}
            />
          ))}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Rotating variant (respects prefers-reduced-motion)
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 2,
            mb: 4,
          }}
        >
          {hues.map((hue) => (
            <ConicBorderCard
              key={hue.id}
              tincture={hue.tincture}
              label={`${hue.label} · rotating`}
              rotate
            />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Buttons — same ring, always rotating
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          The cone sits on an oversized pseudo-element centered behind the
          button and spins via <code>transform: rotate()</code>, so it stays
          centered through the whole rotation instead of sliding off-center.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 2,
          }}
        >
          {hues.map((hue) => (
            <Stack key={hue.id} spacing={1.5}>
              <ConicBorderButton
                tincture={hue.tincture}
                label="Primary"
                rotate
                variant="contained"
              />
              <ConicBorderButton
                tincture={hue.tincture}
                label="Secondary"
                rotate
                variant="outlined"
              />
            </Stack>
          ))}
        </Box>
      </Box>
    );
  },
};

/** One labeled gradient bar built from a tincture's own shade → main → light ramp. */
function TinctureRampSwatch({
  tinctureKey,
  tincture,
}: {
  tinctureKey: TinctureKey;
  tincture: Tincture;
}) {
  const ink = readableInk(tincture.main);
  return (
    <Box
      sx={{
        borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 72,
          display: "flex",
          alignItems: "flex-end",
          p: 1.5,
          color: ink,
          background: `linear-gradient(135deg, ${tincture.shade}, ${tincture.main}, ${tincture.light})`,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {TINCTURE_LABELS[tinctureKey]}
        </Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.68rem",
            display: "block",
          }}
        >
          {tincture.shade} → {tincture.main} → {tincture.light}
        </Typography>
      </Box>
    </Box>
  );
}

/** A two-tincture gradient (flat vs. with the grainy-sheen texture applied) for comparing hero-background candidates. */
function TincturePairRow({
  labelA,
  labelB,
  a,
  b,
}: {
  labelA: string;
  labelB: string;
  a: Tincture;
  b: Tincture;
}) {
  const ink = readableInk(a.main);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
      >
        {labelA} × {labelB}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
        }}
      >
        <Box
          sx={{
            height: 72,
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            display: "flex",
            alignItems: "flex-end",
            p: 1.5,
            color: ink,
            background: `linear-gradient(135deg, ${a.main}, ${b.main})`,
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Flat
          </Typography>
        </Box>
        <Box
          sx={{
            height: 72,
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "flex-end",
            p: 1.5,
            color: ink,
            ...getGrainySheenSx(a.main, b.main, {
              grain: 0.18,
              shine: 0.1,
              animate: false,
            }),
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            + grain/sheen
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Every gradient derivable from the 7 heraldic tinctures: each tincture's own
 * shade→main→light ramp, plus every unique pairwise combination (21 pairs) as
 * a two-color hero-background candidate, both flat and with the grainy-sheen
 * texture — so a direction can be picked from the same color system the
 * crests/medallions already use instead of an arbitrary two-color pick.
 */
export const TinctureGradients: Story = {
  render: function Render() {
    const theme = useTheme();
    const tinctures = getTinctures(theme);
    const pairs: Array<[TinctureKey, TinctureKey]> = [];
    for (let i = 0; i < TINCTURE_KEYS.length; i++) {
      for (let j = i + 1; j < TINCTURE_KEYS.length; j++) {
        pairs.push([TINCTURE_KEYS[i], TINCTURE_KEYS[j]]);
      }
    }
    return (
      <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Tincture gradients
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Derived from the same 7 heraldic tinctures used by crests/medallions (
          <code>getTinctures</code> in heraldry.ts), so a hero-gradient pick
          here stays inside the existing color system instead of a one-off
          secondary/error combo.
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Single-tincture ramps ({TINCTURE_KEYS.length})
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr 1fr",
            },
            gap: 2,
            mb: 4,
          }}
        >
          {TINCTURE_KEYS.map((key) => (
            <TinctureRampSwatch
              key={key}
              tinctureKey={key}
              tincture={tinctures[key]}
            />
          ))}
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Pairwise combinations ({pairs.length})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Every unique two-tincture pair, flat vs. with the toned-down
          grain/sheen texture.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {pairs.map(([keyA, keyB]) => (
            <TincturePairRow
              key={`${keyA}-${keyB}`}
              labelA={TINCTURE_LABELS[keyA]}
              labelB={TINCTURE_LABELS[keyB]}
              a={tinctures[keyA]}
              b={tinctures[keyB]}
            />
          ))}
        </Box>
      </Box>
    );
  },
};
