import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  THEME_PALETTES,
  getThemeOptions,
  sharedComponentOverrides,
  type ThemePaletteVariant,
} from "../themes/editorThemes";
import { SEMANTIC_THEME } from "../themes/semanticTheme";
import { BadgeIcon } from "../components/Gamification/BadgeIcon";
import {
  BadgeShelf,
  type EarnedBadge,
} from "../components/Gamification/BadgeShelf";
import { LevelBadge } from "../components/Gamification/LevelBadge";
import { AnimatedXPCounter } from "../components/Gamification/AnimatedXPCounter";
import { ProgressRings } from "../components/Gamification/ProgressRings";
import { StreakIndicator } from "../components/Gamification/StreakIndicator";
import { StreakCalendar } from "../components/Gamification/StreakCalendar";
import { SquadCrest } from "../components/Gamification/SquadCrest";
import { ArmoriaShield } from "../components/Gamification/ArmoriaShield";
import { StreakShield } from "../components/Gamification/StreakShield";
import { SectionXPGauge } from "../components/Gamification/SectionXPGauge";
import { AvatarDisplay } from "../components/Gamification/AvatarDisplay";
import { DiceBearAvatar } from "../components/Gamification/DiceBearAvatar";
import {
  AvatarGlowRing,
  DEFAULT_GLOW_COLORS,
} from "../components/Gamification/AvatarGlowRing";
import { SquadMentionPill } from "../components/Gamification/SquadMentionPill";
import { BossBattleProgress } from "../components/Gamification/BossBattleProgress";
import { AssignmentCardView } from "../components/Dashboard/AssignmentCardView";
import { DashboardHeroView } from "../components/Dashboard/DashboardHeroView";
import NotificationCard from "../components/NotificationCard";
import { NarrativeReader } from "../components/Editor3/NarrativeReader";
import MiniEditor from "../components/MiniEditor/MiniEditor";
import kitchenSinkEditorState from "../components/Editor3/__fixtures__/kitchenSinkEditorState.json";
import DictionaryContext from "../context/dictionaryContext";
import UnitContext from "../context/unitContext";
import { QuizView as QuizViewImpl } from "../components/Editor3/components/QuizComponent";
import NotificationBadge from "../components/NotificationBadge";
import NotificationContext from "../context/notificationContext";
import { UserAvatar } from "../components/UserAvatar";
import ModerationBadge from "../components/ModerationBadge";
import PrefetchBadge from "../components/PrefetchBadge";
import SharedUnitCard from "../components/SharedUnitCard";
import CommunityUnitCard from "../components/CommunityUnitCard";
import AuthFormSkeleton from "../components/AuthFormSkeleton";
import SearchIcon from "@mui/icons-material/Search";
import TitleIcon from "@mui/icons-material/Title";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CodeIcon from "@mui/icons-material/Code";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ImageIcon from "@mui/icons-material/Image";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import QuizIcon from "@mui/icons-material/Quiz";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ShieldIcon from "@mui/icons-material/Shield";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableChartIcon from "@mui/icons-material/TableChart";
import GestureIcon from "@mui/icons-material/Gesture";
import TranslateIcon from "@mui/icons-material/Translate";
import ForumIcon from "@mui/icons-material/Forum";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { ToolbarSpecimens } from "../components/DesignSystem/ToolbarSpecimens";
import { WaveformSpecimen } from "../components/DesignSystem/WaveformSpecimen";
import { BotAvatar } from "../components/BotAvatar";
import { BotCustomizer, type BotConfig } from "../components/BotCustomizer";
import { AvatarCustomizer } from "../components/Gamification/AvatarCustomizer";
import type { AvatarOverrides } from "../components/Gamification/DiceBearAvatar";
import ArmorEditor from "../components/Gamification/ArmorEditor";
import { SquadLeaderboard } from "../components/Gamification/SquadLeaderboard";
import { GroupChallengeCard } from "../components/Gamification/GroupChallengeCard";
import { BossBattleCard } from "../components/Gamification/BossBattleCard";
import { CampaignBriefing } from "../components/Gamification/CampaignBriefing";
import { SquadMessagePanel } from "../components/Gamification/SquadMessagePanel";
import { SquadJoinPanel } from "../components/Gamification/SquadJoinPanel";
import { SquadPostFeed } from "../components/Gamification/SquadPostFeed";
import {
  AIAgentConfig,
  type AIAgentConfigValues,
} from "../components/AIAgentConfig";
import RecordingSettings from "../components/RecordingStudio3/RecordingSettings";
import AudioFilterPanel from "../components/RecordingStudio3/AudioFilterPanel";
import TimelineCard from "../components/RecordingStudio3/TimelineCard";
import HorizontalTimeline from "../components/RecordingStudio3/HorizontalTimeline";
import ScreenplayEditor from "../components/RecordingStudio3/ScreenplayEditor";

// The graded block views are JS components; type as any for the showcase props.
const QuizView = QuizViewImpl as React.FC<any>;

/**
 * Design System Showcase — every cosmetic theme's palette and the MUI
 * components that carry app-wide custom style overrides, rendered side by side.
 *
 * Use this to visually compare theme colors (light + dark) and confirm that
 * buttons, cards, chips, progress bars, toggle buttons, and custom palette
 * tokens (chat bubbles, code blocks, search highlight, hero gradients) stay
 * consistent across the `default`, `midnight`, `forest`, `sunset`, and
 * `aurora` themes.
 */
const meta: Meta = {
  title: "🧩 UI Components/Design System Showcase",
  parameters: {
    // Pure presentational — skip the app context/subscription stack.
    minimalProviders: true,
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Side-by-side reference of all cosmetic theme palettes and the components that use custom style overrides.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const THEME_IDS = Object.keys(THEME_PALETTES);

// --- Color swatch helpers ---------------------------------------------------

interface Swatch {
  label: string;
  value: string;
  gradient?: boolean;
}

function collectSwatches(variant: ThemePaletteVariant): Swatch[] {
  const swatches: Swatch[] = [
    { label: "primary.main", value: variant.primary.main },
    { label: "secondary.main", value: variant.secondary.main },
  ];
  if (variant.error?.main) {
    swatches.push({ label: "error.main", value: variant.error.main });
  }
  swatches.push(
    { label: "background.default", value: variant.background.default },
    { label: "background.paper", value: variant.background.paper },
  );
  if (variant.text?.primary) {
    swatches.push({ label: "text.primary", value: variant.text.primary });
  }
  if (variant.text?.secondary) {
    swatches.push({ label: "text.secondary", value: variant.text.secondary });
  }
  swatches.push(
    { label: "custom.chatBubbleUser", value: variant.custom.chatBubbleUser },
    {
      label: "custom.chatBubbleAssistant",
      value: variant.custom.chatBubbleAssistant,
    },
    { label: "custom.glassNavbar", value: variant.custom.glassNavbar },
    {
      label: "custom.editorBackground",
      value: variant.custom.editorBackground,
    },
    { label: "custom.codeBlock", value: variant.custom.codeBlock },
    { label: "custom.searchHighlight", value: variant.custom.searchHighlight },
    { label: "custom.subtleBorder", value: variant.custom.subtleBorder },
    {
      label: "custom.heroCardGradient",
      value: variant.custom.heroCardGradient,
      gradient: true,
    },
  );
  return swatches;
}

function SwatchGrid({ variant }: { variant: ThemePaletteVariant }) {
  const swatches = collectSwatches(variant);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 1,
      }}
    >
      {swatches.map((s) => (
        <Box key={s.label} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              height: 44,
              borderRadius: 1,
              border: "1px solid rgba(128,128,128,0.35)",
              background: s.gradient ? s.value : undefined,
              backgroundColor: s.gradient ? undefined : s.value,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              fontFamily: "monospace",
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {s.label}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              fontFamily: "monospace",
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {s.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// --- Typography / font rhythm ----------------------------------------------

const TYPE_SPECIMENS: {
  variant:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body1"
    | "body2"
    | "caption"
    | "button";
  sample: string;
}[] = [
  { variant: "h1", sample: "Heading 1" },
  { variant: "h2", sample: "Heading 2" },
  { variant: "h3", sample: "Heading 3" },
  { variant: "h4", sample: "Heading 4" },
  { variant: "h5", sample: "Heading 5" },
  { variant: "h6", sample: "Heading 6" },
  {
    variant: "body1",
    sample:
      "Body 1 — the quick brown fox jumps over the lazy dog while learning new vocabulary.",
  },
  {
    variant: "body2",
    sample:
      "Body 2 — the quick brown fox jumps over the lazy dog while learning new vocabulary.",
  },
  { variant: "caption", sample: "Caption — supporting metadata and hints" },
  { variant: "button", sample: "Button label" },
];

function typeMeta(variant: (typeof TYPE_SPECIMENS)[number]["variant"]) {
  const t = SEMANTIC_THEME.typography;
  if (variant === "button") {
    return {
      size: "—",
      weight: String(t.controlWeight),
      lineHeight: "—",
    };
  }
  const heading = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(variant);
  const lineHeight =
    variant === "caption"
      ? t.lineHeight.dense
      : heading
        ? t.lineHeight.heading
        : t.lineHeight.body;
  return {
    size: t.scale[variant as keyof typeof t.scale],
    weight: heading ? String(t.headingWeight) : "400",
    lineHeight: String(lineHeight),
  };
}

function TypographyScale() {
  return (
    <Stack divider={<Divider flexItem />} spacing={1.5}>
      {TYPE_SPECIMENS.map(({ variant, sample }) => {
        const info = typeMeta(variant);
        return (
          <Box
            key={variant}
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant={variant}
              sx={{ flex: "1 1 320px", minWidth: 0, m: 0 }}
            >
              {sample}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {variant} · {info.size} · w{info.weight} · lh {info.lineHeight}
            </Typography>
          </Box>
        );
      })}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Font family: {SEMANTIC_THEME.typography.fontFamily}
      </Typography>
    </Stack>
  );
}

// --- Styled component samples ----------------------------------------------

function ComponentSamples() {
  const [toggle, setToggle] = React.useState("list");
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button variant="contained" color="secondary">
          Secondary
        </Button>
        <Button variant="contained" disabled>
          Disabled
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label="Filled" color="primary" />
        <Chip label="Outlined" variant="outlined" />
        <Chip label="Secondary" color="secondary" />
        <Chip label="Deletable" onDelete={() => {}} />
        <Badge badgeContent={4} color="primary">
          <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
        </Badge>
        <Tooltip title="Tooltip">
          <IconButton size="small" color="primary">
            <Box
              component="span"
              sx={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "currentColor",
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={toggle}
        onChange={(_, v) => v && setToggle(v)}
      >
        <ToggleButton value="list">List</ToggleButton>
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="cards">Cards</ToggleButton>
      </ToggleButtonGroup>

      <LinearProgress variant="determinate" value={62} />
      <LinearProgress color="secondary" variant="determinate" value={38} />

      <Stack direction="row" spacing={1} alignItems="center">
        <Switch defaultChecked />
        <Slider defaultValue={40} sx={{ maxWidth: 160 }} />
        <TextField size="small" label="Input" defaultValue="Text" />
      </Stack>

      <Alert severity="info">Informational alert styled by the theme.</Alert>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Card surface
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cards use the shared border-radius override.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

// --- Per-color-scheme panel -------------------------------------------------

function SchemePanel({
  scheme,
  variant,
}: {
  scheme: "light" | "dark";
  variant: ThemePaletteVariant;
}) {
  return (
    <Paper
      data-mui-color-scheme={scheme}
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 320,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Typography
        variant="overline"
        sx={{ display: "block", mb: 1, color: "text.secondary" }}
      >
        {scheme}
      </Typography>
      <SwatchGrid variant={variant} />
      <Divider sx={{ my: 2 }} />
      <TypographyScale />
      <Divider sx={{ my: 2 }} />
      <ComponentSamples />
    </Paper>
  );
}

/**
 * Build a showcase theme with a per-theme CSS variable prefix. Every theme's
 * `cssVariables` config emits global CSS rules for the same
 * `[data-mui-color-scheme]` selector using the default `--mui-*` variable
 * names. When several themes are mounted on one page (All Themes / Components
 * Across Themes) those rules collide and the last theme wins for every panel,
 * so the sample components stop reflecting their own palette. A unique
 * `cssVarPrefix` isolates each theme's variables.
 */
function createShowcaseTheme(themeId: string) {
  return createTheme({
    ...getThemeOptions(themeId),
    cssVariables: {
      colorSchemeSelector: "data-mui-color-scheme",
      cssVarPrefix: `dss-${themeId}`,
    },
    components: sharedComponentOverrides,
  });
}

function ThemeBlock({ themeId }: { themeId: string }) {
  const theme = React.useMemo(() => createShowcaseTheme(themeId), [themeId]);
  const palette = THEME_PALETTES[themeId];
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ textTransform: "capitalize", mb: 1.5 }}>
          {themeId}
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SchemePanel scheme="light" variant={palette.light} />
          <SchemePanel scheme="dark" variant={palette.dark} />
        </Stack>
      </Box>
    </ThemeProvider>
  );
}

// --- Semantic tokens (rounding / elevation / spacing / density) -------------

function TokenSwatch({
  label,
  value,
  children,
}: {
  label: string;
  value: string | number;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ textAlign: "center" }}>
      {children}
      <Typography
        variant="caption"
        sx={{ display: "block", mt: 0.75, fontWeight: 600, lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", fontFamily: "monospace", lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function TokenRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 1.5,
          alignItems: "end",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function RadiusTokens() {
  return (
    <TokenRow title="Rounding — radius">
      {Object.entries(SEMANTIC_THEME.radius).map(([key, px]) => (
        <TokenSwatch key={key} label={key} value={`${px}px`}>
          <Box sx={{ position: "relative", width: 64, height: 64, mx: "auto" }}>
            {/* square reference so the rounded corner is easy to read */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                border: "1px dashed",
                borderColor: "divider",
              }}
            />
            {/* the token radius applied to a single corner for precise diffing */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderTop: "3px solid",
                borderLeft: "3px solid",
                borderColor: "primary.main",
                borderTopLeftRadius: `${px}px`,
              }}
            />
          </Box>
        </TokenSwatch>
      ))}
    </TokenRow>
  );
}

function ElevationTokens() {
  return (
    <TokenRow title="Elevation — depth">
      {Object.entries(SEMANTIC_THEME.elevation).map(([key, level]) => (
        <TokenSwatch key={key} label={key} value={`e${level}`}>
          <Paper
            elevation={level as number}
            sx={{
              width: 72,
              height: 56,
              mx: "auto",
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          />
        </TokenSwatch>
      ))}
    </TokenRow>
  );
}

function SpacingTokens() {
  const entries = {
    ...SEMANTIC_THEME.spacing,
    ...SEMANTIC_THEME.padding,
  };
  return (
    <TokenRow title="Spacing & density — gap / padding">
      {Object.entries(entries).map(([key, px]) => (
        <TokenSwatch key={key} label={key} value={`${px}px`}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              height: 56,
            }}
          >
            <Box
              sx={{
                width: px as number,
                height: 20,
                bgcolor: "secondary.main",
                borderRadius: 0.5,
              }}
            />
          </Box>
        </TokenSwatch>
      ))}
    </TokenRow>
  );
}

function SurfaceTokens({ scheme }: { scheme: "light" | "dark" }) {
  const s = SEMANTIC_THEME.surface;
  const surfaces =
    scheme === "light"
      ? {
          appBarBlur: s.appBarBlur,
          overlayBlur: s.overlayBlur,
          modalBlur: s.modalBlur,
          lightGlass: s.lightGlass,
          lightOverlay: s.lightOverlay,
          lightDrawer: s.lightDrawer,
          lightDrawerBackdrop: s.lightDrawerBackdrop,
        }
      : {
          appBarBlur: s.appBarBlur,
          overlayBlur: s.overlayBlur,
          modalBlur: s.modalBlur,
          darkGlass: s.darkGlass,
          darkOverlay: s.darkOverlay,
          darkDrawer: s.darkDrawer,
          darkDrawerBackdrop: s.darkDrawerBackdrop,
        };
  return (
    <TokenRow title={`Surface / glass — ${scheme} (app bars, drawers, modals)`}>
      {Object.entries(surfaces).map(([key, value]) => {
        const isBlur = key.toLowerCase().includes("blur");
        return (
          <TokenSwatch key={key} label={key} value={value}>
            <Box
              sx={{
                width: 96,
                height: 56,
                mx: "auto",
                borderRadius: 1,
                border: "1px solid rgba(128,128,128,0.35)",
                position: "relative",
                overflow: "hidden",
                background:
                  "repeating-linear-gradient(45deg, rgba(128,128,128,0.25) 0 6px, transparent 6px 12px)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: isBlur ? "transparent" : value,
                  backdropFilter: isBlur ? value : undefined,
                }}
              />
            </Box>
          </TokenSwatch>
        );
      })}
    </TokenRow>
  );
}

/**
 * Semantic tokens (rounding, elevation, spacing/density, surfaces) that the
 * recurring app patterns should all share instead of solving independently.
 */
export const SemanticTokens: Story = {
  name: "Semantic Tokens (rounding · elevation · spacing · surface)",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Semantic Tokens
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The shared rounding, elevation, spacing/density, and surface
            language from <code>SEMANTIC_THEME</code>. Dashboard cards, workbook
            gates, instructor chips, app bars, drawers, and completion modals
            should all reference these rather than re-solving them inline.
          </Typography>
          <Stack spacing={2}>
            <RadiusTokens />
            <ElevationTokens />
            <SpacingTokens />
            <SurfaceTokens scheme="light" />
            <SurfaceTokens scheme="dark" />
          </Stack>
        </Paper>
      </ThemeProvider>
    );
  },
};

// --- Recurring app patterns -------------------------------------------------

// Minimal label lookup so the real AssignmentCardView renders without next-intl.
const assignmentCardLabels: Record<string, string> = {
  practice: "Practice",
  discuss: "Discuss",
  requestGuidance: "Guidance",
  requestGuidanceTooltip: "Request instructor guidance",
  startWorkbook: "Start",
  review: "Review",
  joinReview: "Join Review",
  overdue: "Overdue",
  noDueDate: "No due date",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  needsWork: "Needs work",
};

function DashboardCardReal() {
  return (
    <Box sx={{ width: "100%" }}>
      <AssignmentCardView
        assignment={{
          id: "a1",
          unitID: "u1",
          sectionID: "s1",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        }}
        unit={{
          id: "u1",
          name: "Greetings & Introductions",
          description:
            "Learn essential greetings, self-introductions, and polite phrases for everyday conversations.",
          difficulty: "medium",
        }}
        onOpenDrill={() => {}}
        onRequestGuidance={async () => {}}
        t={(key) => assignmentCardLabels[key] ?? key}
        thumbnail={
          <Box
            sx={{
              height: "100%",
              minHeight: 120,
              background: SEMANTIC_THEME.surface.lightOverlay,
              backgroundImage:
                "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
            }}
          />
        }
        startButton={
          <Button variant="contained" size="small" sx={{ ml: { sm: "auto" } }}>
            Start
          </Button>
        }
      />
    </Box>
  );
}

function WorkbookGateMock() {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 200,
        borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          p: 2,
          bgcolor: "background.paper",
          color: "text.disabled",
        }}
      >
        <Typography variant="body2">Workbook content (locked)…</Typography>
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          backgroundColor: SEMANTIC_THEME.surface.lightOverlay,
          backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
        }}
      >
        <Chip label="⏱ 20:00" color="primary" />
        <Typography variant="subtitle1">Timed exercise</Typography>
        <Button variant="contained">Start timed attempt</Button>
      </Box>
    </Box>
  );
}

function InstructorChipsMock() {
  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          label="Needs review · 3"
          color="warning"
          sx={{ borderRadius: `${SEMANTIC_THEME.radius.chip}px` }}
        />
        <Chip
          label="Graded · 12"
          color="success"
          variant="outlined"
          sx={{ borderRadius: `${SEMANTIC_THEME.radius.chip}px` }}
        />
        <Chip
          label="Pending · 0"
          variant="outlined"
          sx={{ borderRadius: `${SEMANTIC_THEME.radius.chip}px` }}
        />
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" label="Late" color="error" variant="outlined" />
        <Chip size="small" label="On time" color="success" variant="outlined" />
        <Chip size="small" label="85%" color="primary" />
      </Stack>
    </Stack>
  );
}

function SearchBarMock() {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        width: "100%",
        px: 1,
        py: 0.25,
        borderRadius: `${SEMANTIC_THEME.radius.control}px`,
        bgcolor: "action.hover",
      }}
    >
      <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
      <InputBase
        readOnly
        placeholder="Search units, words, questions…"
        sx={{ flex: 1, fontSize: "0.875rem" }}
      />
      <Chip size="small" label="⌘K" variant="outlined" />
    </Paper>
  );
}

function AppBarMock() {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={SEMANTIC_THEME.elevation.appBar}
        sx={{
          px: `${SEMANTIC_THEME.padding.toolbarX}px`,
          py: `${SEMANTIC_THEME.padding.toolbarY}px`,
          backgroundColor: SEMANTIC_THEME.surface.lightGlass,
          backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
          borderRadius: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Unit Editor
          </Typography>
          <IconButton size="small" color="primary">
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: "currentColor",
              }}
            />
          </IconButton>
          <Avatar sx={{ width: 28, height: 28 }}>A</Avatar>
        </Stack>
      </Paper>
      <Paper
        elevation={0}
        sx={{
          px: `${SEMANTIC_THEME.padding.toolbarX}px`,
          py: `${SEMANTIC_THEME.padding.toolbarY}px`,
          borderTop: "1px solid",
          borderColor: "divider",
          borderRadius: 0,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label="Search" variant="outlined" />
          <Chip size="small" label="⏱ 20:00" variant="outlined" />
          <Chip
            size="small"
            label="Synced"
            color="success"
            variant="outlined"
          />
        </Stack>
      </Paper>
    </Box>
  );
}

function DrawerMock() {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 200,
        borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
      }}
    >
      <Box
        sx={{
          flex: 1,
          backgroundColor: SEMANTIC_THEME.surface.lightDrawerBackdrop,
          backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
        }}
      />
      <Box
        sx={{
          width: 180,
          p: 2,
          backgroundColor: SEMANTIC_THEME.surface.lightDrawer,
          backdropFilter: SEMANTIC_THEME.surface.appBarBlur,
          borderLeft: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Menu
        </Typography>
        <Stack spacing={1}>
          <Button
            size="small"
            variant="text"
            sx={{ justifyContent: "flex-start" }}
          >
            Dashboard
          </Button>
          <Button
            size="small"
            variant="text"
            sx={{ justifyContent: "flex-start" }}
          >
            Units
          </Button>
          <Button
            size="small"
            variant="text"
            sx={{ justifyContent: "flex-start" }}
          >
            Settings
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function CompletionModalMock() {
  return (
    <Paper
      elevation={SEMANTIC_THEME.elevation.overlay}
      sx={{
        width: "100%",
        maxWidth: 340,
        p: 3,
        borderRadius: `${SEMANTIC_THEME.radius.modal}px`,
        textAlign: "center",
      }}
    >
      <Avatar
        sx={{
          width: 48,
          height: 48,
          mx: "auto",
          mb: 1,
          bgcolor: "success.main",
        }}
      >
        ✓
      </Avatar>
      <Typography variant="h6" gutterBottom>
        Unit completed!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Accuracy 92% · 4:12 to complete
      </Typography>
      <Stack spacing={1}>
        <Button variant="contained">Review Answers</Button>
        <Button variant="outlined">Try Again</Button>
      </Stack>
    </Paper>
  );
}

function EmptyStateMock() {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 340,
        p: 4,
        borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
        textAlign: "center",
      }}
    >
      <Avatar
        sx={{
          width: 48,
          height: 48,
          mx: "auto",
          mb: 1.5,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        ☆
      </Avatar>
      <Typography variant="subtitle1" gutterBottom>
        No squads yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Join or create a squad to compete on the leaderboard.
      </Typography>
      <Button variant="contained">Create a squad</Button>
    </Paper>
  );
}

function DashboardHeroReal() {
  return (
    <DashboardHeroView
      greeting="Good afternoon, Sakura"
      level={{ level: 3, label: "Adventurer", progress: 60 }}
      avatar={<AvatarDisplay seed="hero-demo" size={72} streak={7} />}
      nextStep={{
        todayLabel: "Today",
        unitName: "Greetings & Introductions",
        sectionName: "Japanese 101",
        dueText: "Due Sep 18",
      }}
      startButton={
        <Button
          variant="contained"
          size="small"
          sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" } }}
        >
          Start
        </Button>
      }
      caughtUpText="You are caught up on your assignments."
      streak={{ currentStreak: 7, freezesRemaining: 3, freezesUsed: 1 }}
      assignmentsCount={12}
      badgesCount={SHOWCASE_BADGES.length}
      totalXP={4250}
      badgeShelf={<BadgeShelf earnedBadges={SHOWCASE_BADGES} earnedOnly />}
      squad={{
        id: "sq-1",
        name: "Iron Dragons",
        crestSvg: armorSampleCrestSvg,
        totalXP: 18400,
      }}
    />
  );
}

// --- Editor block specimens (design-language mockups) -----------------------

function EditorBlockShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        p: 2,
        borderRadius: `${SEMANTIC_THEME.radius.card}px`,
        borderLeft: "3px solid",
        borderLeftColor: "secondary.main",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "inline-block",
          mb: 1,
          px: 0.75,
          py: 0.25,
          borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
          bgcolor: "action.hover",
          color: "text.secondary",
          fontFamily: "monospace",
        }}
      >
        {label}
      </Typography>
      {children}
    </Paper>
  );
}

function QuizBlockSpecimen() {
  const options = [
    { text: "こんにちは (konnichiwa)", correct: true },
    { text: "さようなら (sayōnara)", correct: false },
    { text: "ありがとう (arigatō)", correct: false },
  ];
  return (
    <EditorBlockShell label="quiz">
      <Typography variant="subtitle2" gutterBottom>
        Which word means &quot;hello&quot;?
      </Typography>
      <Stack spacing={0.75}>
        {options.map((o) => (
          <Stack
            key={o.text}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              p: 0.75,
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
              border: "1px solid",
              borderColor: o.correct ? "success.main" : "divider",
              bgcolor: o.correct ? "success.light" : "transparent",
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid",
                borderColor: o.correct ? "success.main" : "text.disabled",
                bgcolor: o.correct ? "success.main" : "transparent",
              }}
            />
            <Typography variant="body2">{o.text}</Typography>
          </Stack>
        ))}
      </Stack>
    </EditorBlockShell>
  );
}

function AnswerBlockSpecimen() {
  return (
    <EditorBlockShell label="answer">
      <Typography variant="subtitle2" gutterBottom>
        Type the reading of 日本語
      </Typography>
      <TextField
        size="small"
        fullWidth
        defaultValue="にほんご"
        InputProps={{
          endAdornment: (
            <Chip size="small" label="✓" color="success" sx={{ ml: 1 }} />
          ),
        }}
      />
    </EditorBlockShell>
  );
}

function CustomAnswerBlockSpecimen() {
  return (
    <EditorBlockShell label="custom-answer">
      <Typography variant="subtitle2" gutterBottom>
        Write a sentence introducing yourself
      </Typography>
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        defaultValue="はじめまして。田中です。"
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Chip
          size="small"
          label="AI graded"
          color="primary"
          variant="outlined"
        />
        <Chip size="small" label="88%" color="success" />
      </Stack>
    </EditorBlockShell>
  );
}

function MeaningAssociationBlockSpecimen() {
  const pairs = [
    { word: "犬", meaning: "dog" },
    { word: "猫", meaning: "cat" },
    { word: "魚", meaning: "fish" },
  ];
  return (
    <EditorBlockShell label="meaning-association">
      <Typography variant="subtitle2" gutterBottom>
        Match each word to its meaning
      </Typography>
      <Stack spacing={0.75}>
        {pairs.map((p) => (
          <Stack key={p.word} direction="row" spacing={1} alignItems="center">
            <Chip label={p.word} size="small" color="primary" />
            <Box
              sx={{
                flex: 1,
                borderBottom: "1px dashed",
                borderColor: "divider",
              }}
            />
            <Chip label={p.meaning} size="small" variant="outlined" />
          </Stack>
        ))}
      </Stack>
    </EditorBlockShell>
  );
}

// --- Editor blocks (live render via NarrativeReader) ------------------------

// Mock dictionary so vocab-referencing blocks (answer, meaning-association)
// resolve their words without the real DictionaryContext/data client.
const blockMockDictionary: Record<string, any> = {
  "word-1": {
    id: "word-1",
    phrase: "hello",
    pronunciation: "heh-LOH",
    definition: "a greeting or expression of goodwill",
    audio: [],
  },
  "word-2": {
    id: "word-2",
    phrase: "goodbye",
    pronunciation: "good-BYE",
    definition: "a parting phrase",
    audio: [],
  },
  "word-3": {
    id: "word-3",
    phrase: "thank you",
    pronunciation: "THANK yoo",
    definition: "an expression of gratitude",
    audio: [],
  },
  "word-4": {
    id: "word-4",
    phrase: "please",
    pronunciation: "PLEEZ",
    definition: "used in polite requests",
    audio: [],
  },
  "word-5": {
    id: "word-5",
    phrase: "water",
    pronunciation: "WAH-ter",
    definition: "a clear liquid essential for life",
    audio: [],
  },
  "word-6": {
    id: "word-6",
    phrase: "food",
    pronunciation: "FOOD",
    definition: "something eaten for nourishment",
    audio: [],
  },
};

const blockMockDictionaryContext = {
  filteredDictionary: blockMockDictionary,
  dictionary: blockMockDictionary,
  wordMapId: blockMockDictionary,
  wordMapPhrase: {
    hello: blockMockDictionary["word-1"],
    goodbye: blockMockDictionary["word-2"],
    "thank you": blockMockDictionary["word-3"],
  },
  setFilter: () => {},
  searching: false,
  setSearching: () => {},
  filter: "",
  filterWords: () => {},
  wordRefs: {},
  questionBank: {
    "q-ai-1": {
      id: "q-ai-1",
      prompt: "Explain the difference between は and が in a full sentence.",
    },
    "question-custom-1": {
      id: "question-custom-1",
      prompt: "Describe your learning experience.",
    },
  },
};

function heading(
  text: string,
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h3",
) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "heading",
    version: 1,
    tag,
  };
}

function paragraph(text: string) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  };
}

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

// Lexical text-format bitmask: bold=1, italic=2, strikethrough=4, underline=8,
// code=16, subscript=32, superscript=64, highlight=128.
function fmtText(text: string, format = 0) {
  return {
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function linkNode(text: string, url: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "link",
    version: 1,
    rel: "noopener",
    target: "_blank",
    title: null,
    url,
  };
}

function richParagraph(children: any[]) {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  };
}

function listItem(text: string, value = 1, checked?: boolean) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "listitem",
    version: 1,
    value,
    ...(checked === undefined ? {} : { checked }),
  };
}

function list(
  listType: "bullet" | "number" | "check",
  items: Array<{ text: string; checked?: boolean }>,
) {
  return {
    children: items.map((i, idx) => listItem(i.text, idx + 1, i.checked)),
    direction: "ltr",
    format: "",
    indent: 0,
    type: "list",
    version: 1,
    listType,
    start: 1,
    tag: listType === "number" ? "ol" : "ul",
  };
}

function quote(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "quote",
    version: 1,
  };
}

function codeBlock(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "code",
    version: 1,
    language: "javascript",
  };
}

const divider = { type: "horizontalrule", version: 1 };

// Serialized Lexical content containing the real interactive block nodes.
function buildEditorBlocksContentJson(origin: string) {
  return JSON.stringify({
    root: {
      children: [
        heading("Heading 1", "h1"),
        heading("Heading 2", "h2"),
        heading("Heading 3", "h3"),
        heading("Heading 4", "h4"),
        heading("Heading 5", "h5"),
        heading("Heading 6", "h6"),
        paragraph(
          "A paragraph of body text rendered at the semantic body scale, the same as it appears inside a lesson.",
        ),
        richParagraph([
          fmtText("Bold", 1),
          fmtText(" · "),
          fmtText("Italic", 2),
          fmtText(" · "),
          fmtText("Underline", 8),
          fmtText(" · "),
          fmtText("Strikethrough", 4),
          fmtText(" · "),
          fmtText("Bold italic", 3),
          fmtText(" · "),
          fmtText("inline code", 16),
          fmtText(" · "),
          fmtText("Highlight", 128),
        ]),
        richParagraph([
          fmtText("Subscript: H"),
          fmtText("2", 32),
          fmtText("O"),
          fmtText("   Superscript: E = mc"),
          fmtText("2", 64),
          fmtText("   Link: "),
          linkNode("example.com", "https://example.com"),
        ]),
        list("bullet", [
          { text: "First bullet point" },
          { text: "Second bullet point" },
        ]),
        list("number", [{ text: "First step" }, { text: "Second step" }]),
        list("check", [
          { text: "Completed task", checked: true },
          { text: "Pending task", checked: false },
        ]),
        quote("A block quote for citations and emphasis."),
        codeBlock("const greeting = 'こんにちは';\nconsole.log(greeting);"),
        divider,
        heading("Image (image)"),
        {
          type: "image",
          version: 1,
          src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%25' height='100%25' fill='%231565c0'/><text x='50%25' y='50%25' fill='white' font-size='20' text-anchor='middle' dy='.3em'>Sample image</text></svg>",
          altText: "Sample image",
          width: 320,
          height: 180,
          maxWidth: 400,
          showCaption: false,
          caption: {
            editorState: {
              root: {
                children: [],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "root",
                version: 1,
              },
            },
          },
        },
        heading("Vocabulary word card (word-block)"),
        { type: "word-block", version: 1, wordID: "word-1", format: "" },
        heading("Vocabulary matching (meaning-association)"),
        {
          type: "meaning-association",
          version: 1,
          wordIDs: ["word-1", "word-2", "word-3"],
          enabledModes: ["learn", "easy", "hard"],
        },
        heading("Media embed (youtube)"),
        {
          type: "youtube",
          version: 1,
          videoID: "dQw4w9WgXcQ",
          format: "",
        },
        heading("Audio playlist (playlist)"),
        {
          type: "playlist",
          version: 1,
          fileIDs: ["file-audio-1", "file-audio-2"],
        },
        heading("Conversation playlist (conversation-playlist)"),
        {
          type: "conversation-playlist",
          version: 1,
          fileIDs: ["file-audio-1", "file-audio-2"],
          dialogue: [
            { speaker: "A", text: "こんにちは！", translation: "Hello!" },
            {
              speaker: "B",
              text: "こんにちは、元気ですか？",
              translation: "Hello, how are you?",
            },
          ],
          scriptTitle: "Greetings",
          movieFileID: null,
        },
        heading("AI block (custom-ai)"),
        {
          type: "custom-ai",
          version: 1,
          ids: ["q-ai-1"],
          inputMode: "text",
          criteria:
            "Explain the difference between は and が in a full sentence.",
          allowedInput: ["text", "audio", "writing"],
          format: "",
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

function LiveEditorBlocks() {
  // Absolute story-mock URLs so getCachedUrl passes them through (http/https).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mockFiles: Record<string, any> = React.useMemo(
    () => ({
      "file-audio-1": {
        id: "file-audio-1",
        name: "Track 1",
        size: 500000,
        path: `${origin}/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
      },
      "file-audio-2": {
        id: "file-audio-2",
        name: "Track 2",
        size: 500000,
        path: `${origin}/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
      },
      // Kitchen-sink playlist references (audio-1/2/3).
      "audio-1": {
        id: "audio-1",
        name: "Clip 1",
        size: 500000,
        path: `${origin}/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
      },
      "audio-2": {
        id: "audio-2",
        name: "Clip 2",
        size: 500000,
        path: `${origin}/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
      },
      "audio-3": {
        id: "audio-3",
        name: "Clip 3",
        size: 500000,
        path: `${origin}/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3`,
      },
    }),
    [origin],
  );
  // Mock UnitContext so real block components (answer, playlist, custom-answer)
  // resolve dictionary/files/grade without the app data client.
  const mockUnitContext = React.useMemo(
    () => ({
      files: mockFiles,
      dictionary: blockMockDictionary,
      questionBank: blockMockDictionaryContext.questionBank,
      playlistUrls: {},
      unit: {},
      grade: null,
      saveGrade: () => {},
    }),
    [mockFiles],
  );
  const editorBlocksContentJson = React.useMemo(
    () => buildEditorBlocksContentJson(origin),
    [origin],
  );
  // Kitchen-sink fixture plus an AI answer (custom-ai) block so both editors
  // render every graded block type, including AI answer.
  const editorContent = React.useMemo(() => {
    const base = JSON.parse(JSON.stringify(kitchenSinkEditorState));
    base.root.children.push(heading("AI answer (custom-ai)"), {
      type: "custom-ai",
      version: 1,
      ids: ["q-ai-1"],
      inputMode: "text",
      criteria: "Explain the difference between は and が in a full sentence.",
      allowedInput: ["text", "audio", "writing"],
      format: "",
    });
    return JSON.stringify(base);
  }, []);
  return (
    <DictionaryContext.Provider value={blockMockDictionaryContext as any}>
      <UnitContext.Provider value={mockUnitContext as any}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Editable editor
            </Typography>
            <Box sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
              <MiniEditor
                mode="editable"
                showBlockInserter
                placeholder="Type here, or hover the left gutter and click + to insert a block…"
                content={editorContent}
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Read-only render
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: `${SEMANTIC_THEME.radius.card}px` }}
            >
              <MiniEditor mode="readonly" content={editorContent} />
            </Paper>
          </Box>
        </Box>
      </UnitContext.Provider>
    </DictionaryContext.Provider>
  );
}

// --- Full editor block library (all insertable block types) -----------------

interface BlockDef {
  label: string;
  description: string;
  icon: React.ReactNode;
  specimen: React.ReactNode;
}

const BLOCK_LIBRARY: { category: string; blocks: BlockDef[] }[] = [
  {
    category: "Text",
    blocks: [
      {
        label: "Heading 1",
        description: "Large section heading",
        icon: <TitleIcon fontSize="small" />,
        specimen: (
          <Typography variant="h4" sx={{ m: 0 }}>
            Heading 1
          </Typography>
        ),
      },
      {
        label: "Heading 2",
        description: "Medium section heading",
        icon: <TitleIcon fontSize="small" />,
        specimen: (
          <Typography variant="h5" sx={{ m: 0 }}>
            Heading 2
          </Typography>
        ),
      },
      {
        label: "Heading 3",
        description: "Small section heading",
        icon: <TitleIcon fontSize="small" />,
        specimen: (
          <Typography variant="h6" sx={{ m: 0 }}>
            Heading 3
          </Typography>
        ),
      },
      {
        label: "Bullet List",
        description: "Unordered list",
        icon: <FormatListBulletedIcon fontSize="small" />,
        specimen: (
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            <Typography component="li" variant="body2">
              First item
            </Typography>
            <Typography component="li" variant="body2">
              Second item
            </Typography>
          </Box>
        ),
      },
      {
        label: "Numbered List",
        description: "Ordered list",
        icon: <FormatListNumberedIcon fontSize="small" />,
        specimen: (
          <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
            <Typography component="li" variant="body2">
              First step
            </Typography>
            <Typography component="li" variant="body2">
              Second step
            </Typography>
          </Box>
        ),
      },
      {
        label: "Checklist",
        description: "To-do checkboxes",
        icon: <CheckBoxIcon fontSize="small" />,
        specimen: (
          <Stack spacing={0.25}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckBoxIcon fontSize="small" color="primary" />
              <Typography
                variant="body2"
                sx={{ textDecoration: "line-through", color: "text.secondary" }}
              >
                Review vocabulary
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckBoxOutlineBlankIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
              <Typography variant="body2">Practice quiz</Typography>
            </Stack>
          </Stack>
        ),
      },
      {
        label: "Quote",
        description: "Block quote",
        icon: <FormatQuoteIcon fontSize="small" />,
        specimen: (
          <Box
            sx={{
              borderLeft: "3px solid",
              borderColor: "primary.main",
              pl: 1.5,
              py: 0.25,
              fontStyle: "italic",
              color: "text.secondary",
            }}
          >
            <Typography variant="body2">
              “Language is the road map of a culture.”
            </Typography>
          </Box>
        ),
      },
      {
        label: "Code Block",
        description: "Syntax-highlighted code",
        icon: <CodeIcon fontSize="small" />,
        specimen: (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1,
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
              bgcolor: "var(--mui-palette-custom-codeBlock, #f6f8fa)",
              fontFamily: "monospace",
              fontSize: "0.72rem",
              overflow: "auto",
            }}
          >{`const greet = (name) =>\n  \`こんにちは, \${name}\`;`}</Box>
        ),
      },
      {
        label: "Divider",
        description: "Horizontal rule",
        icon: <HorizontalRuleIcon fontSize="small" />,
        specimen: (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Section one
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Section two
            </Typography>
          </Box>
        ),
      },
      {
        label: "Table",
        description: "Rows and columns",
        icon: <TableChartIcon fontSize="small" />,
        specimen: (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
              overflow: "hidden",
              "& > *": {
                px: 1,
                py: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontSize: "0.75rem",
              },
            }}
          >
            <Box sx={{ fontWeight: 700, bgcolor: "action.hover" }}>Word</Box>
            <Box sx={{ fontWeight: 700, bgcolor: "action.hover" }}>Meaning</Box>
            <Box>犬</Box>
            <Box>dog</Box>
            <Box sx={{ borderBottom: "none !important" }}>猫</Box>
            <Box sx={{ borderBottom: "none !important" }}>cat</Box>
          </Box>
        ),
      },
    ],
  },
  {
    category: "Media",
    blocks: [
      {
        label: "Image",
        description: "Upload or paste image",
        icon: <ImageIcon fontSize="small" />,
        specimen: (
          <Box
            sx={{
              aspectRatio: "16 / 9",
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-secondary-main) 100%)",
              color: "#fff",
            }}
          >
            <ImageIcon />
          </Box>
        ),
      },
      {
        label: "YouTube",
        description: "Embed a video",
        icon: <YouTubeIcon fontSize="small" />,
        specimen: (
          <Box
            sx={{
              aspectRatio: "16 / 9",
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
              bgcolor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlayCircleIcon sx={{ fontSize: 44, color: "#ff0000" }} />
          </Box>
        ),
      },
      {
        label: "Audio Playlist",
        description: "Embed audio playlist",
        icon: <MusicNoteIcon fontSize="small" />,
        specimen: <AudioSpecimen />,
      },
      {
        label: "Conversation Playlist",
        description: "Dialogue audio",
        icon: <ForumIcon fontSize="small" />,
        specimen: <ConversationSpecimen />,
      },
      {
        label: "PDF Viewer",
        description: "Embed a PDF",
        icon: <PictureAsPdfIcon fontSize="small" />,
        specimen: <PdfSpecimen />,
      },
      {
        label: "Drawing",
        description: "Excalidraw canvas",
        icon: <GestureIcon fontSize="small" />,
        specimen: (
          <Box
            sx={{
              height: 72,
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
              border: "1px dashed",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <GestureIcon sx={{ fontSize: 40 }} />
          </Box>
        ),
      },
    ],
  },
  {
    category: "Educational",
    blocks: [
      {
        label: "Quiz",
        description: "Multiple choice / free response",
        icon: <QuizIcon fontSize="small" />,
        specimen: (
          <QuizView
            data={[
              { answer: "こんにちは", correct: true },
              { answer: "さようなら", correct: false },
            ]}
            attemptedAnswers={{}}
            isLocked={false}
            gradeDisplayText="Score: 0%"
            onToggle={() => {}}
          />
        ),
      },
      {
        label: "Vocabulary Answer",
        description: "Fill-in vocabulary",
        icon: <SpellcheckIcon fontSize="small" />,
        specimen: (
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              Define: <strong>hello</strong>
            </Typography>
            <TextField
              size="small"
              fullWidth
              defaultValue="a greeting"
              InputProps={{
                endAdornment: (
                  <Chip size="small" label="✓" color="success" sx={{ ml: 1 }} />
                ),
              }}
            />
          </Stack>
        ),
      },
      {
        label: "Custom Answer",
        description: "Custom prompt & validation",
        icon: <EditNoteIcon fontSize="small" />,
        specimen: (
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              Introduce yourself in Japanese
            </Typography>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              defaultValue="はじめまして。"
            />
            <Chip
              size="small"
              label="AI graded"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            />
          </Stack>
        ),
      },
      {
        label: "Matching Exercise",
        description: "Meaning association",
        icon: <PsychologyIcon fontSize="small" />,
        specimen: (
          <Stack spacing={0.5}>
            {[
              { w: "犬", m: "dog" },
              { w: "猫", m: "cat" },
            ].map((p) => (
              <Stack key={p.w} direction="row" spacing={1} alignItems="center">
                <Chip label={p.w} size="small" color="primary" />
                <Box
                  sx={{
                    flex: 1,
                    borderBottom: "1px dashed",
                    borderColor: "divider",
                  }}
                />
                <Chip label={p.m} size="small" variant="outlined" />
              </Stack>
            ))}
          </Stack>
        ),
      },
      {
        label: "Word Block",
        description: "Vocabulary word card",
        icon: <TranslateIcon fontSize="small" />,
        specimen: <WordBlockSpecimen />,
      },
      {
        label: "Armor Editor",
        description: "Interactive item builder",
        icon: <ShieldIcon fontSize="small" />,
        specimen: <ArmorSpecimen />,
      },
    ],
  },
  {
    category: "Layout & AI",
    blocks: [
      {
        label: "Columns",
        description: "2-column layout",
        icon: <ViewColumnIcon fontSize="small" />,
        specimen: (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {[0, 1].map((c) => (
              <Box
                key={c}
                sx={{
                  p: 1,
                  borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
                  bgcolor: "action.hover",
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    bgcolor: "text.disabled",
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                />
                <Box
                  sx={{
                    height: 6,
                    width: "70%",
                    bgcolor: "text.disabled",
                    borderRadius: 1,
                  }}
                />
              </Box>
            ))}
          </Box>
        ),
      },
      {
        label: "AI Block",
        description: "AI-powered content",
        icon: <SmartToyIcon fontSize="small" />,
        specimen: <AiBlockSpecimen />,
      },
    ],
  },
];

// --- Media / interactive catalog specimens ----------------------------------

function AudioSpecimen() {
  return (
    <Stack spacing={0.75}>
      {["Track 1 · Greetings", "Track 2 · Numbers"].map((label, i) => (
        <Stack key={label} direction="row" spacing={1} alignItems="center">
          <PlayCircleIcon
            fontSize="small"
            color={i === 0 ? "primary" : "action"}
          />
          {/* Fine, symmetric center-line waveform matching AudioWaveformPlayer */}
          <Stack
            direction="row"
            spacing="1px"
            alignItems="center"
            sx={{ flex: 1, height: 24 }}
          >
            {Array.from({ length: 56 }).map((_, b) => {
              const amp =
                Math.abs(Math.sin(b * 0.5 + i)) * 0.7 +
                Math.abs(Math.sin(b * 0.17 + i)) * 0.3;
              return (
                <Box
                  key={b}
                  sx={{
                    width: 1.5,
                    flexShrink: 0,
                    height: `${Math.max(6, amp * 100)}%`,
                    bgcolor: i === 0 ? "primary.main" : "action.disabled",
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

function ConversationSpecimen() {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={1} alignItems="center">
        <PlayCircleIcon fontSize="small" color="primary" />
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: "12px 12px 12px 2px",
            bgcolor: "var(--mui-palette-custom-chatBubbleAssistant, #f3f4f6)",
            fontSize: "0.75rem",
          }}
        >
          A: こんにちは
        </Box>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="flex-end"
      >
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: "12px 12px 2px 12px",
            bgcolor: "var(--mui-palette-custom-chatBubbleUser, #e3f2fd)",
            fontSize: "0.75rem",
          }}
        >
          B: こんにちは！
        </Box>
        <PlayCircleIcon fontSize="small" color="action" />
      </Stack>
    </Stack>
  );
}

/**
 * AI chat bubble showing what a chat message can actually render: streamed
 * markdown (heading, list, inline code) plus an embedded interactive block
 * preview with insert/dismiss — mirroring chatMessageConfig + BlockInsertPreview.
 */
function ChatMessageSpecimen() {
  return (
    <Stack spacing={1}>
      {/* User prompt */}
      <Box sx={{ alignSelf: "flex-end", maxWidth: "85%" }}>
        <Box
          sx={{
            px: 1.25,
            py: 0.75,
            borderRadius: "12px 12px 2px 12px",
            bgcolor: "var(--mui-palette-custom-chatBubbleUser, #e3f2fd)",
            fontSize: "0.8125rem",
          }}
        >
          Add a quick check for greetings.
        </Box>
      </Box>

      {/* Assistant: rich markdown + embedded block preview */}
      <Stack direction="row" spacing={0.75} alignItems="flex-start">
        <SmartToyIcon fontSize="small" color="primary" sx={{ mt: 0.5 }} />
        <Box
          sx={{
            px: 1.25,
            py: 1,
            borderRadius: "12px 12px 12px 2px",
            bgcolor: "var(--mui-palette-custom-chatBubbleAssistant, #f3f4f6)",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Sure — here&apos;s a quick check:
          </Typography>
          <Box component="ul" sx={{ m: 0, mb: 1, pl: 2.5 }}>
            <Typography component="li" variant="body2">
              Uses{" "}
              <Box
                component="code"
                sx={{
                  px: 0.5,
                  borderRadius: 0.5,
                  bgcolor: "action.hover",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                こんにちは
              </Box>
            </Typography>
            <Typography component="li" variant="body2">
              One correct option
            </Typography>
          </Box>

          {/* Embedded block preview (BlockInsertPreview pattern) */}
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              borderRadius: `${SEMANTIC_THEME.radius.card}px`,
              borderLeft: "3px solid",
              borderLeftColor: "secondary.main",
              bgcolor: "background.paper",
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ mb: 0.75 }}
            >
              <QuizIcon fontSize="small" color="primary" />
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, fontFamily: "monospace" }}
              >
                quiz
              </Typography>
            </Stack>
            <Typography variant="body2" gutterBottom>
              Which word means &quot;hello&quot;?
            </Typography>
            <Stack spacing={0.5}>
              {[
                { t: "こんにちは", correct: true },
                { t: "さようなら", correct: false },
              ].map((o) => (
                <Stack
                  key={o.t}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 0.5,
                    borderRadius: `${SEMANTIC_THEME.radius.control}px`,
                    border: "1px solid",
                    borderColor: o.correct ? "success.main" : "divider",
                  }}
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor: o.correct ? "success.main" : "text.disabled",
                      bgcolor: o.correct ? "success.main" : "transparent",
                    }}
                  />
                  <Typography variant="caption">{o.t}</Typography>
                </Stack>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" variant="contained" color="success">
                Insert
              </Button>
              <Button size="small" variant="outlined" color="inherit">
                Dismiss
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Stack>
  );
}

function PdfSpecimen() {
  return (
    <Box
      sx={{
        height: 88,
        borderRadius: `${SEMANTIC_THEME.radius.control}px`,
        border: "1px solid",
        borderColor: "divider",
        p: 1,
        display: "flex",
        gap: 1,
      }}
    >
      <PictureAsPdfIcon color="error" />
      <Stack spacing={0.5} sx={{ flex: 1, justifyContent: "center" }}>
        {[100, 90, 80, 60].map((w) => (
          <Box
            key={w}
            sx={{
              height: 5,
              width: `${w}%`,
              bgcolor: "action.disabled",
              borderRadius: 1,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function WordBlockSpecimen() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1, borderRadius: `${SEMANTIC_THEME.radius.chip}px` }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
            こんにちは
          </Typography>
          <Typography variant="caption" color="text.secondary">
            koɴɲitɕiwa · hello
          </Typography>
        </Box>
        <PlayCircleIcon fontSize="small" color="primary" />
      </Stack>
    </Paper>
  );
}

function ArmorSpecimen() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <ShieldIcon sx={{ fontSize: 44, color: "primary.main" }} />
      <Stack spacing={0.75} sx={{ flex: 1 }}>
        {[
          { label: "Defense", value: 70 },
          { label: "Speed", value: 45 },
        ].map((s) => (
          <Box key={s.label}>
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={s.value}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function AiBlockSpecimen() {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: `${SEMANTIC_THEME.radius.control}px`,
        border: "1px solid",
        borderColor: "primary.light",
        bgcolor: "action.hover",
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ mb: 0.75 }}
      >
        <SmartToyIcon fontSize="small" color="primary" />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          AI generated
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        {[100, 92, 75].map((w) => (
          <Box
            key={w}
            sx={{
              height: 6,
              width: `${w}%`,
              borderRadius: 1,
              background:
                "linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-secondary-main))",
              opacity: 0.5,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function BlockLibrary() {
  return (
    <Stack spacing={2.5}>
      {BLOCK_LIBRARY.map((group) => (
        <Box key={group.category}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {group.category}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 2,
            }}
          >
            {group.blocks.map((b) => (
              <Paper
                key={b.label}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: `${SEMANTIC_THEME.radius.control}px`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
                      bgcolor: "action.hover",
                      color: "text.secondary",
                    }}
                  >
                    {b.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, lineHeight: 1.2 }}
                    >
                      {b.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {b.description}
                    </Typography>
                  </Box>
                </Stack>
                <Box
                  sx={{
                    mt: "auto",
                    pt: 1,
                    borderTop: "1px dashed",
                    borderColor: "divider",
                  }}
                >
                  {b.specimen}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function PatternCell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}

/**
 * Recurring app patterns, each built from the shared semantic tokens so the
 * rounding / elevation / spacing / color / density language is consistent.
 */
function PatternGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 4,
        alignItems: "start",
      }}
    >
      {children}
    </Box>
  );
}

function RecurringNotificationCards() {
  return (
    <Stack spacing={1} sx={{ maxWidth: 340 }}>
      <NotificationCard
        notification={{
          id: "n1",
          category: "GAMIFICATION",
          title: "You earned the 'Consistent Learner' badge!",
          body: "You've maintained a 7-day learning streak.",
          linkPath: "/profile/badges",
          linkLabel: "View Badges",
          senderName: "System",
          seen: false,
          interacted: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        }}
        onMarkSeen={() => {}}
        onMarkInteracted={() => {}}
        onDelete={() => {}}
        onNavigate={() => {}}
      />
      <NotificationCard
        notification={{
          id: "n2",
          category: "ASSIGNMENT",
          title: "New assignment: Greetings & Introductions",
          body: "Due in 3 days.",
          senderName: "Instructor",
          seen: true,
          interacted: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        }}
        onMarkSeen={() => {}}
        onMarkInteracted={() => {}}
        onDelete={() => {}}
        onNavigate={() => {}}
      />
    </Stack>
  );
}

function RecurringPatternsTabs() {
  const [tab, setTab] = React.useState(0);
  const groups: { label: string; content: React.ReactNode }[] = [
    {
      label: "Cards & states",
      content: (
        <PatternGrid>
          <PatternCell title="Dashboard card">
            <DashboardCardReal />
          </PatternCell>
          <PatternCell title="Notification card">
            <RecurringNotificationCards />
          </PatternCell>
          <PatternCell title="Completion modal">
            <CompletionModalMock />
          </PatternCell>
          <PatternCell title="Empty state">
            <EmptyStateMock />
          </PatternCell>
        </PatternGrid>
      ),
    },
    {
      label: "App chrome",
      content: (
        <PatternGrid>
          <PatternCell title="App bar (two-row)">
            <AppBarMock />
          </PatternCell>
          <PatternCell title="Drawer">
            <DrawerMock />
          </PatternCell>
          <PatternCell title="Search bar">
            <SearchBarMock />
          </PatternCell>
        </PatternGrid>
      ),
    },
    {
      label: "Workbook & grading",
      content: (
        <PatternGrid>
          <PatternCell title="Workbook gate">
            <WorkbookGateMock />
          </PatternCell>
          <PatternCell title="Instructor review chips">
            <InstructorChipsMock />
          </PatternCell>
        </PatternGrid>
      ),
    },
    {
      label: "Chat & media",
      content: (
        <PatternGrid>
          <PatternCell title="AI chat message (rich + block)">
            <ChatMessageSpecimen />
          </PatternCell>
          <PatternCell title="Audio waveform (pink = loud · blue = quiet)">
            <WaveformSpecimen />
          </PatternCell>
        </PatternGrid>
      ),
    },
    {
      label: "Editor blocks",
      content: (
        <>
          <PatternGrid>
            <PatternCell title="Quiz block">
              <QuizBlockSpecimen />
            </PatternCell>
            <PatternCell title="Answer block">
              <AnswerBlockSpecimen />
            </PatternCell>
            <PatternCell title="Custom answer block">
              <CustomAnswerBlockSpecimen />
            </PatternCell>
            <PatternCell title="Meaning association block">
              <MeaningAssociationBlockSpecimen />
            </PatternCell>
          </PatternGrid>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              All insertable block types (catalog)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The full palette of block types available in the lesson editor's
              insert menu.
            </Typography>
            <BlockLibrary />
          </Box>
        </>
      ),
    },
  ];
  return (
    <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderRight: 1,
          borderColor: "divider",
          minWidth: 200,
          flexShrink: 0,
          "& .MuiTab-root": {
            alignItems: "flex-start",
            textTransform: "none",
            textAlign: "left",
          },
        }}
      >
        {groups.map((g) => (
          <Tab key={g.label} label={g.label} />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, minWidth: 0 }}>{groups[tab].content}</Box>
    </Box>
  );
}

export const RecurringPatterns: Story = {
  name: "Recurring Patterns (cards · gates · chips · chrome · modals · empty)",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Recurring Patterns
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Dashboard cards, workbook gates, instructor review chips, search
            bars, app bars, drawers, completion modals, empty states, AI chat
            messages, and graded editor blocks — all built from the same
            semantic rounding, elevation, spacing, color, and density tokens.
          </Typography>
          <RecurringPatternsTabs />
        </Paper>
      </ThemeProvider>
    );
  },
};

/**
 * Real interactive editor block nodes rendered read-only via NarrativeReader —
 * the same Lexical node set the Workbook uses. Unlike the design specimens in
 * Recurring Patterns, these are the actual block components.
 */
export const EditorBlocksLive: Story = {
  name: "Editor Blocks (Live)",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Editor Blocks (Live)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Actual interactive block components rendered from their exported
            view components (shared with the real editor) — a quiz, a
            meaning-association matching exercise, and a media embed.
          </Typography>
          <LiveEditorBlocks />
        </Paper>
      </ThemeProvider>
    );
  },
};

/**
 * Every toolbar surface at its true in-app proportion — a thin, full-width
 * strip. Chrome only: no page content, no interactivity.
 */
export const Toolbars: Story = {
  name: "Toolbars (all variants, in proportion)",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Toolbars
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Every toolbar surface at its true in-app proportion — a thin,
            full-width strip. Chrome only: no page content, no interactivity.
          </Typography>
          <ToolbarSpecimens />
        </Paper>
      </ThemeProvider>
    );
  },
};

// --- Gamification components -------------------------------------------------

// Sample coat-of-arms produced by the Armor Editor (ArmoriaShield renders it).
const armorSampleCrestSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
  <path d="M10,2 L90,2 L90,60 Q90,95 50,98 Q10,95 10,60 Z" fill="#0f47af" stroke="#333" stroke-width="2"/>
  <text x="50" y="60" text-anchor="middle" font-size="34" fill="#f9a825">⚜</text>
</svg>`;

const SHOWCASE_BADGES: EarnedBadge[] = [
  { badgeType: "FIRST_SUBMISSION", awardedAt: "2025-01-15T10:00:00Z" },
  { badgeType: "GOOD_EYE", awardedAt: "2025-01-20T14:30:00Z" },
  { badgeType: "QUICK_DRAW", awardedAt: "2025-02-01T08:00:00Z" },
  { badgeType: "SHARPSHOOTER", awardedAt: "2025-02-10T11:00:00Z" },
  { badgeType: "CONSISTENT", awardedAt: "2025-02-15T09:00:00Z" },
  { badgeType: "TOP_OF_CLASS", awardedAt: "2025-03-20T10:00:00Z" },
];

function showcaseStreakDays(): Set<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return new Set(
    [1, 2, 3, 5, 8, 9, 10, 12, 15, 16].map(
      (d) => `${y}-${m}-${String(d).padStart(2, "0")}`,
    ),
  );
}

// Level object shared by the profile card's avatar + level badge (LevelInfo).
const showcaseProfileLevel = {
  level: 5,
  label: "Scholar",
  xpRequired: 1600,
  xpForNextLevel: 2400,
  progress: 40,
};

/**
 * A learner profile card — avatar (with streak/level/border), name, level
 * badge, XP, streak shield, and badge shelf. Composed from the same
 * presentational components the profile page uses.
 */
function ProfileCardSpecimen() {
  return (
    <Card
      sx={{
        p: 3,
        pt: 3.5,
        maxWidth: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.25,
        overflow: "visible",
      }}
    >
      <AvatarDisplay
        seed="profile-demo"
        size={112}
        style="detailed"
        streak={7}
        level={showcaseProfileLevel}
        borderEffect="gold"
      />
      <Typography variant="h6" sx={{ mt: 0.5 }}>
        Sakura Tanaka
      </Typography>
      <Typography variant="body2" color="text.secondary">
        @sakura
      </Typography>
      <LevelBadge level={showcaseProfileLevel} />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
        <Stack alignItems="center">
          <AnimatedXPCounter targetValue={4250} />
          <Typography variant="caption" color="text.secondary">
            Total XP
          </Typography>
        </Stack>
        <StreakShield freezesRemaining={2} freezesUsed={1} />
      </Stack>
      <Divider flexItem sx={{ my: 0.5 }} />
      <BadgeShelf earnedBadges={SHOWCASE_BADGES} earnedOnly />
    </Card>
  );
}

/**
 * A learner's account & preferences settings panel — display name, appearance
 * (language / theme / dark mode), and notification toggles.
 */
function UserSettingsSpecimen() {
  return (
    <Card variant="outlined" sx={{ maxWidth: 560 }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Account
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Display name"
                defaultValue="Sakura Tanaka"
                fullWidth
              />
              <TextField
                size="small"
                label="Email"
                defaultValue="sakura@example.com"
                fullWidth
              />
            </Stack>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Appearance
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="Language"
                defaultValue="en"
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Theme"
                defaultValue="default"
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="midnight">Midnight</MenuItem>
                <MenuItem value="forest">Forest</MenuItem>
              </TextField>
            </Stack>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={<Switch defaultChecked />}
              label="Dark mode"
            />
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Notifications
            </Typography>
            <Stack>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Assignment reminders"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Squad activity"
              />
              <FormControlLabel
                control={<Switch />}
                label="Weekly summary email"
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="text">Cancel</Button>
            <Button variant="contained">Save changes</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * The presentational gamification components (badges, XP, levels, streaks,
 * squads) rendered together so their styling reads as one system.
 */
export const GamificationComponents: Story = {
  name: "Gamification Components",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    const borderEffects: {
      effect:
        | "solid"
        | "gradient"
        | "pulse"
        | "rainbow"
        | "fire"
        | "ice"
        | "gold"
        | "shadow";
      label: string;
    }[] = [
      { effect: "solid", label: "solid" },
      { effect: "gradient", label: "gradient" },
      { effect: "pulse", label: "pulse" },
      { effect: "rainbow", label: "rainbow" },
      { effect: "fire", label: "fire" },
      { effect: "ice", label: "ice" },
      { effect: "gold", label: "gold" },
      { effect: "shadow", label: "shadow" },
    ];
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Gamification Components
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Badges, XP counters, level progression, streaks, squad crests, and
            status indicators — the presentational gamification building blocks.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 4,
              alignItems: "start",
            }}
          >
            <PatternCell title="Badge icons">
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <BadgeIcon badgeType="FIRST_SUBMISSION" size={64} earned />
                <BadgeIcon badgeType="SHARPSHOOTER" size={64} earned />
                <BadgeIcon badgeType="TOP_OF_CLASS" size={64} earned />
                <BadgeIcon badgeType="PERFECTIONIST" size={64} earned={false} />
              </Stack>
            </PatternCell>

            <PatternCell title="Badge shelf">
              <BadgeShelf earnedBadges={SHOWCASE_BADGES} />
            </PatternCell>

            <PatternCell title="Level badge">
              <LevelBadge
                level={{
                  level: 3,
                  label: "Adventurer",
                  xpRequired: 400,
                  xpForNextLevel: 800,
                  progress: 55,
                }}
              />
            </PatternCell>

            <PatternCell title="Animated XP counter">
              <AnimatedXPCounter targetValue={1250} />
            </PatternCell>

            <PatternCell title="Progress rings">
              <ProgressRings
                modules={[
                  {
                    moduleId: "m1",
                    moduleName: "Foundations",
                    completionPercent: 75,
                    totalWorkbooks: 4,
                    completedWorkbooks: 3,
                  },
                  {
                    moduleId: "m2",
                    moduleName: "Advanced",
                    completionPercent: 40,
                    totalWorkbooks: 5,
                    completedWorkbooks: 2,
                  },
                  {
                    moduleId: "m3",
                    moduleName: "Projects",
                    completionPercent: 100,
                    totalWorkbooks: 3,
                    completedWorkbooks: 3,
                  },
                ]}
              />
            </PatternCell>

            <PatternCell title="Streak indicator">
              <Stack direction="row" spacing={3} alignItems="center">
                <StreakIndicator currentStreak={5} />
                <StreakIndicator currentStreak={7} />
              </Stack>
            </PatternCell>

            <PatternCell title="Streak calendar">
              <StreakCalendar activeDays={showcaseStreakDays()} />
            </PatternCell>

            <PatternCell title="Squad crests">
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <SquadCrest
                  squadId="g1"
                  squadName="Alpha Squad"
                  totalXP={1500}
                />
                <SquadCrest squadId="g2" squadName="Beta Team" totalXP={3000} />
              </Stack>
            </PatternCell>

            <PatternCell title="Armor Editor (coat of arms)">
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <ArmoriaShield
                  squadId="armor-1"
                  squadName="Phoenix Squad"
                  crestSvg={armorSampleCrestSvg}
                  armoriaUnlocked
                  size={96}
                />
                <ArmoriaShield
                  squadId="armor-2"
                  squadName="Dragon Knights"
                  crestSvg={null}
                  armoriaUnlocked={false}
                  size={96}
                />
              </Stack>
            </PatternCell>

            <PatternCell title="Streak freeze shield">
              <Stack direction="row" spacing={3} alignItems="center">
                <StreakShield freezesRemaining={3} freezesUsed={1} />
                <StreakShield freezesRemaining={0} freezesUsed={2} />
              </Stack>
            </PatternCell>

            <PatternCell title="Avatar border effects">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 2,
                }}
              >
                {borderEffects.map(({ effect, label }) => (
                  <Stack key={effect} alignItems="center" spacing={0.5}>
                    <AvatarDisplay
                      seed={`indicator-${effect}`}
                      size={56}
                      borderEffect={effect}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </PatternCell>

            <PatternCell title="Avatar glow ring">
              <AvatarGlowRing
                size={96}
                config={{
                  colors: DEFAULT_GLOW_COLORS,
                  speed: 4,
                  thickness: 3,
                  active: true,
                  expiresAt: null,
                }}
              >
                <DiceBearAvatar
                  seed="indicator-glow"
                  size={96}
                  style="detailed"
                />
              </AvatarGlowRing>
            </PatternCell>

            <PatternCell title="Squad mention pills">
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <SquadMentionPill
                  squadId="squad-alpha-001"
                  squadName="Iron Dragons"
                  totalXP={4250}
                  size="small"
                />
                <SquadMentionPill
                  squadId="squad-beta-002"
                  squadName="Night Owls"
                  totalXP={2100}
                  size="medium"
                />
              </Stack>
            </PatternCell>

            <PatternCell title="Section XP gauge">
              <SectionXPGauge
                unitCount={8}
                desiredMaxLevel={6}
                showTuner={false}
              />
            </PatternCell>

            <PatternCell title="Boss battle progress">
              <BossBattleProgress
                id="boss-1"
                title="The Algorithm Dragon"
                currentXP={500}
                targetXP={1000}
                active
                bonusMultiplier={1.5}
                setting="A fortress of infinite loops and recursive nightmares."
                stakes="If the team fails, everyone loses a streak freeze."
                deadline={new Date(
                  Date.now() + 3 * 24 * 60 * 60 * 1000,
                ).toISOString()}
                contributors={[
                  { studentId: "s1", displayName: "Alice", xpContributed: 200 },
                  { studentId: "s2", displayName: "Bob", xpContributed: 150 },
                  {
                    studentId: "s3",
                    displayName: "Charlie",
                    xpContributed: 100,
                  },
                  { studentId: "s4", displayName: "Diana", xpContributed: 50 },
                ]}
              />
            </PatternCell>

            <PatternCell title="Profile card">
              <ProfileCardSpecimen />
            </PatternCell>

            <PatternCell title="Bot avatar (AI assistant, style tiers)">
              <Stack direction="row" spacing={2} alignItems="center">
                <BotAvatar size={56} style="simple" />
                <BotAvatar size={56} style="detailed" />
                <BotAvatar size={56} style="toonhead" />
              </Stack>
            </PatternCell>

            <PatternCell title="Bot customizer (inline editor card)">
              <BotCustomizerCard />
            </PatternCell>

            <PatternCell title="Avatar customizer (editor dialog)">
              <AvatarCustomizerEditorView />
            </PatternCell>

            <PatternCell title="Squad armor editor (editor dialog)">
              <ArmorCrestEditorView />
            </PatternCell>

            <PatternCell title="Group challenge">
              <GroupChallengeCard
                title="Weekly Sprint"
                targetXP={1000}
                currentXP={600}
                active
                bonusMultiplier={1.5}
                deadline={new Date(Date.now() + 2 * 86400000).toISOString()}
              />
            </PatternCell>
          </Box>

          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              Squads &amp; Teams
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The collaborative squad surface — leaderboards, boss battles,
              campaign briefings, and the instructor / member panels from the
              squads page.
            </Typography>
            <Stack spacing={4}>
              <PatternCell title="Squad leaderboard">
                <SquadLeaderboard squads={SHOWCASE_SQUADS} mySquadId="g2" />
              </PatternCell>
              <PatternCell title="Boss battle">
                <BossBattleCard
                  title="The Grammar Wyrm"
                  narrative="A fearsome wyrm guards the irregular verbs. Only a coordinated squad can defeat it."
                  phases={SHOWCASE_BOSS_PHASES}
                  totalHP={1000}
                  totalDamage={650}
                  active
                  bonusMultiplier={2}
                  currentUserRole="Reviewer"
                  contributors={[
                    { userId: "u1", displayName: "Alice", xpContributed: 250 },
                    { userId: "u2", displayName: "Bob", xpContributed: 200 },
                    {
                      userId: "u3",
                      displayName: "Charlie",
                      xpContributed: 150,
                    },
                    { userId: "u4", displayName: "Diana", xpContributed: 50 },
                  ]}
                  deadline={new Date(Date.now() + 2 * 86400000).toISOString()}
                />
              </PatternCell>
              <PatternCell title="Campaign briefing">
                <CampaignBriefing
                  title="Operation Syntax Storm"
                  setting="In the year 2142, the world runs on code. Your cohort must debug reality itself."
                  stakes="If the compiler isn't fixed in time, every app crashes — and civilization with it."
                  chapterText="Chapter 3: You've reached the Memory Leak Caverns. Debug the reference cycles to proceed."
                />
              </PatternCell>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: 4,
                  alignItems: "start",
                }}
              >
                <PatternCell title="Squad message panel (instructor)">
                  <SquadMessagePanelCard />
                </PatternCell>
                <PatternCell title="Squad join / membership panel">
                  <SquadJoinPanelCard />
                </PatternCell>
              </Box>
              <PatternCell title="Squad post feed">
                <SquadPostFeedCard />
              </PatternCell>
            </Stack>
          </Box>
        </Paper>
      </ThemeProvider>
    );
  },
};

// --- Real reusable components (props-only, no app context) -------------------

const moderationFlaggedItem = {
  id: "mod-1",
  moderationStatus: "flagged",
  moderationFlags: JSON.stringify({
    categories: { harassment: true, spam: false },
    categoryScores: { harassment: 0.87, spam: 0.12 },
    model: "text-moderation-latest",
  }),
  moderationCheckedAt: new Date().toISOString(),
};

const moderationApprovedItem = {
  id: "mod-2",
  moderationStatus: "approved",
  moderationFlags: null,
  moderationCheckedAt: new Date().toISOString(),
};

/**
 * Real reusable components that render directly (props-only, or wrapped in a
 * lightweight mock provider) — no full app context needed.
 */
export const RealComponents: Story = {
  name: "Real Components (gallery)",
  render: () => {
    const theme = createShowcaseTheme("default");
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Real Components
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Actual reusable components rendered without the full app context —
            props-only, or wrapped in a lightweight mock provider.
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary">
              Dashboard hero
            </Typography>
            <Box sx={{ mt: 1 }}>
              <DashboardHeroReal />
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 4,
              alignItems: "start",
            }}
          >
            <PatternCell title="User avatar">
              <Stack direction="row" spacing={2} alignItems="center">
                <UserAvatar size={40} />
                <UserAvatar size={56} streak={5} />
                <UserAvatar size={72} streak={14} />
              </Stack>
            </PatternCell>

            <PatternCell title="Notification badge">
              <NotificationContext.Provider
                value={
                  {
                    notifications: [],
                    unseenCount: 5,
                    unseenByCategory: { COLLABORATION: 3 },
                    loading: false,
                    markSeen: async () => {},
                    markInteracted: async () => {},
                    markAllSeen: async () => {},
                    deleteNotification: async () => {},
                  } as any
                }
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <NotificationBadge>
                    <UserAvatar size={40} />
                  </NotificationBadge>
                  <NotificationBadge category="COLLABORATION">
                    <UserAvatar size={40} />
                  </NotificationBadge>
                </Stack>
              </NotificationContext.Provider>
            </PatternCell>

            <PatternCell title="Moderation badge">
              <Stack direction="row" spacing={2} alignItems="center">
                <ModerationBadge item={moderationFlaggedItem} showDetails />
                <ModerationBadge item={moderationApprovedItem} showDetails />
              </Stack>
            </PatternCell>

            <PatternCell title="Prefetch badge">
              <Stack direction="row" spacing={2} alignItems="center">
                <PrefetchBadge unitId="unit-gallery-1" />
              </Stack>
            </PatternCell>

            <PatternCell title="Notification card">
              <NotificationCard
                notification={{
                  id: "n-gallery",
                  category: "SQUAD",
                  title: "Iron Dragons posted in your squad",
                  body: "Check out the latest challenge results.",
                  linkPath: "/squads",
                  linkLabel: "View squad",
                  senderName: "Iron Dragons",
                  seen: false,
                  interacted: false,
                  createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                }}
                onMarkSeen={() => {}}
                onMarkInteracted={() => {}}
                onDelete={() => {}}
                onNavigate={() => {}}
              />
            </PatternCell>

            <PatternCell title="Auth form skeleton">
              <AuthFormSkeleton />
            </PatternCell>
          </Box>
          <Box sx={{ mt: 4 }}>
            <Typography variant="overline" color="text.secondary">
              Unit cards
            </Typography>
            <Box
              sx={{
                mt: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                alignItems: "start",
              }}
            >
              <SharedUnitCard
                unit={{
                  id: "u-shared",
                  name: "Japanese Greetings",
                  description:
                    "Learn essential greetings and polite phrases for everyday conversation.",
                  _collaboratorPermission: "EDIT",
                }}
                onOpen={() => {}}
              />
              <CommunityUnitCard
                unit={{
                  id: "u-community",
                  name: "Hiragana Basics",
                  description:
                    "A community-published unit covering the hiragana syllabary.",
                  publishedAt: new Date().toISOString(),
                }}
                onFork={() => {}}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              Settings panels
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configuration surfaces — the Kai/Sage AI agent config form and the
              recording cleanup-strength control.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: 4,
                alignItems: "start",
              }}
            >
              <PatternCell title="AI agent config — platform mode">
                <AIAgentConfigCard mode="platform" />
              </PatternCell>
              <PatternCell title="AI agent config — section mode">
                <AIAgentConfigCard mode="section" />
              </PatternCell>
            </Box>
            <Box sx={{ mt: 3 }}>
              <PatternCell title="User settings (account & preferences)">
                <UserSettingsSpecimen />
              </PatternCell>
            </Box>
            <Box sx={{ mt: 3, maxWidth: 480 }}>
              <PatternCell title="Recording cleanup strength">
                <RecordingSettingsCard />
              </PatternCell>
            </Box>
          </Box>

          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              Recording studio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The presentational building blocks of the multi-speaker recording
              studio — audio cleanup filters, timeline cards, the horizontal
              timeline, and the Fountain screenplay editor.
            </Typography>
            <Stack spacing={4}>
              <PatternCell title="Audio filter panel">
                <AudioFilterCard />
              </PatternCell>
              <PatternCell title="Timeline card">
                <Box sx={{ position: "relative", height: 120 }}>
                  <TimelineCard
                    line={{
                      id: "line-1",
                      text: "Hello, welcome to today's lesson.",
                      emotion: "neutral",
                    }}
                    speaker={{ name: "Instructor", color: "#1976d2" }}
                    isSelected={false}
                    left={10}
                    width={220}
                    onClick={() => {}}
                  />
                  <TimelineCard
                    line={{
                      id: "line-2",
                      text: "こんにちは！",
                      emotion: "cheerful",
                    }}
                    speaker={{ name: "Akiko", color: "#9c27b0" }}
                    isSelected
                    left={250}
                    width={140}
                    onClick={() => {}}
                  />
                </Box>
              </PatternCell>
              <PatternCell title="Horizontal timeline">
                <HorizontalTimelineCard />
              </PatternCell>
              <PatternCell title="Screenplay editor (Fountain)">
                <ScreenplayEditorCard />
              </PatternCell>
            </Stack>
          </Box>
        </Paper>
      </ThemeProvider>
    );
  },
};

/**
 * Every theme, both color schemes, colors + components stacked for scanning.
 */
export const AllThemes: Story = {
  name: "All Themes & Colors",
  render: () => (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Design System Showcase
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Palette swatches and the components carrying app-wide custom style
        overrides, for every cosmetic theme in both light and dark schemes.
      </Typography>
      {THEME_IDS.map((id) => (
        <ThemeBlock key={id} themeId={id} />
      ))}
    </Box>
  ),
};

/**
 * The full type scale and font rhythm from the semantic theme, isolated for
 * reviewing heading/body sizes, weights, and line heights.
 */
export const TypographyRhythm: Story = {
  name: "Typography & Font Rhythm",
  render: () => {
    const theme = createTheme({
      ...getThemeOptions("default"),
      components: sharedComponentOverrides,
    });
    return (
      <ThemeProvider theme={theme}>
        <Paper
          data-mui-color-scheme="light"
          elevation={0}
          sx={{ p: 4, minHeight: "100vh", bgcolor: "background.default" }}
        >
          <Typography variant="h4" gutterBottom>
            Typography &amp; Font Rhythm
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            The semantic type scale — sizes, weights, and line heights applied
            across the app.
          </Typography>
          <Box sx={{ maxWidth: 860 }}>
            <TypographyScale />
          </Box>
        </Paper>
      </ThemeProvider>
    );
  },
};

/**
 * Just the styled components, compared across all themes in a single row so
 * shape/typography overrides are easy to diff side by side.
 */
export const ComponentsAcrossThemes: Story = {
  name: "Components Across Themes",
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Components Across Themes
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The same component set rendered under each theme in both light and dark
        schemes for quick side-by-side comparison.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 2 }}>
        {THEME_IDS.map((id) => {
          const theme = createShowcaseTheme(id);
          return (
            <ThemeProvider key={id} theme={theme}>
              <Box sx={{ minWidth: 340 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ textTransform: "capitalize", mb: 1 }}
                >
                  {id}
                </Typography>
                <Stack spacing={2}>
                  {(["light", "dark"] as const).map((scheme) => (
                    <Paper
                      key={scheme}
                      data-mui-color-scheme={scheme}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.default",
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          mb: 1,
                          color: "text.secondary",
                        }}
                      >
                        {scheme}
                      </Typography>
                      <ComponentSamples />
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </ThemeProvider>
          );
        })}
      </Stack>
    </Box>
  ),
};

// ============================================================================
// Avatars, customizers & editor modals
// ============================================================================

/** BotCustomizer is already an inline card (not a dialog) — full unlock tier. */
function BotCustomizerCard() {
  const [config, setConfig] = React.useState<BotConfig>({
    style: "detailed",
    backgroundColor: "b6e3f4",
  });
  return (
    <BotCustomizer
      botWhispererTier={4}
      initialConfig={config}
      onChange={setConfig}
    />
  );
}

/** The avatar customizer is a MUI Dialog — launch it to see the editor UI. */
function AvatarCustomizerEditorView() {
  const [open, setOpen] = React.useState(false);
  const [overrides, setOverrides] = React.useState<AvatarOverrides>({});
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Open avatar editor
      </Button>
      <AvatarCustomizer
        open={open}
        onClose={() => setOpen(false)}
        level={5}
        seed="student-showcase"
        overrides={overrides}
        onSave={(next) => setOverrides(next)}
      />
    </>
  );
}

/** The heraldic squad armor / coat-of-arms editor is a MUI Dialog — launch it. */
function ArmorCrestEditorView() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Open armor editor
      </Button>
      <ArmorEditor
        open={open}
        squadName="Iron Dragons"
        squadDescription="Forged in fire, tempered by every failed test."
        onSave={() => {}}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// ============================================================================
// Squads & teams
// ============================================================================

const SQUAD_POST_LEXICAL = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Let's crush vocabulary chapters 5–7 this week. Meet Thursday for grammar drills!",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

const SHOWCASE_SQUADS = [
  { id: "g1", name: "Iron Dragons", totalXP: 2500, memberCount: 5 },
  { id: "g2", name: "Pixel Wolves", totalXP: 1800, memberCount: 4 },
  { id: "g3", name: "Code Serpents", totalXP: 1200, memberCount: 3 },
  { id: "g4", name: "Quantum Foxes", totalXP: 800, memberCount: 6 },
];

const SHOWCASE_SQUAD_MEMBERS = [
  {
    id: "m1",
    studentId: "student-1",
    role: "LEADER" as const,
    displayName: "Alice",
    joinedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "m2",
    studentId: "student-2",
    role: "MEMBER" as const,
    displayName: "Bob",
    joinedAt: "2026-03-16T14:00:00Z",
  },
  {
    id: "m3",
    studentId: "student-3",
    role: "MEMBER" as const,
    displayName: "Charlie",
    joinedAt: "2026-03-17T09:00:00Z",
  },
];

const SHOWCASE_BOSS_PHASES = [
  {
    id: "p1",
    title: "Core Questions",
    description: "Answer the fundamental vocabulary questions.",
    status: "COMPLETED" as const,
    targetXP: 500,
    currentXP: 500,
  },
  {
    id: "p2",
    title: "Peer Review",
    description: "Review and improve squadmates' recordings.",
    status: "ACTIVE" as const,
    targetXP: 300,
    currentXP: 150,
    requiredRoles: ["Reviewer"],
  },
  {
    id: "p3",
    title: "Final Challenge",
    description: "Complete the conversation gauntlet.",
    status: "LOCKED" as const,
    targetXP: 200,
    currentXP: 0,
  },
];

function SquadMessagePanelCard() {
  return (
    <SquadMessagePanel
      squads={SHOWCASE_SQUADS.map((s) => ({
        id: s.id,
        name: s.name,
        totalXP: s.totalXP,
        crestSvg: null,
      }))}
      onSend={() => {}}
    />
  );
}

function SquadJoinPanelCard() {
  return (
    <SquadJoinPanel
      availableSquads={SHOWCASE_SQUADS.map((s) => ({
        ...s,
        description: "A squad that practices together and levels up together.",
      }))}
      mySquad={{
        ...SHOWCASE_SQUADS[0],
        description: "Forged in fire, tempered by every failed test.",
      }}
      mySquadMembers={SHOWCASE_SQUAD_MEMBERS}
      studentId="student-1"
      onJoinSquad={() => {}}
      onLeaveSquad={() => {}}
      level={4}
    />
  );
}

function SquadPostFeedCard() {
  return (
    <SquadPostFeed
      posts={[
        {
          id: "post-1",
          title: "Weekly Practice Plan",
          data: SQUAD_POST_LEXICAL,
          authorId: "student-1",
          createdAt: "2026-04-28T10:00:00Z",
          _version: 1,
        },
      ]}
      currentUserId="student-1"
      isMember
      onPublish={() => {}}
      onDelete={() => {}}
      authorDisplayNames={{ "student-1": "Alice" }}
    />
  );
}

// ============================================================================
// Settings panels
// ============================================================================

const SHOWCASE_AI_CONFIG: AIAgentConfigValues = {
  defaultAIModel: "gpt-4o",
  kaiModel: "gpt-4o-mini",
  sageModel: "gpt-4o",
  kaiTemperature: 0.7,
  sageTemperature: 0.7,
  kaiMaxTokens: 2000,
  sageMaxTokens: 4000,
  agentMaxSteps: 5,
  searchThreshold: 0.3,
  searchDefaultLimit: 5,
  memoryEnabled: true,
  memorySummarizationModel: "gpt-4o-mini",
  kaiEnabled: true,
  sageEnabled: true,
  kaiSystemPromptOverride: "",
  sageSystemPromptOverride: "",
  systemPromptBudget: 2000,
  toolResultBudget: 4000,
  totalTurnBudget: 16000,
  enforceTokenBudget: true,
};

function AIAgentConfigCard({ mode }: { mode: "platform" | "section" }) {
  const [values, setValues] =
    React.useState<AIAgentConfigValues>(SHOWCASE_AI_CONFIG);
  return (
    <AIAgentConfig
      mode={mode}
      values={values}
      onChange={setValues}
      onSave={() => {}}
    />
  );
}

function RecordingSettingsCard() {
  const [value, setValue] = React.useState("standard");
  return <RecordingSettings value={value} onChange={setValue} />;
}

// ============================================================================
// Recording studio
// ============================================================================

const SHOWCASE_SCRIPT_DATA = {
  metadata: {
    title: "Coffee Shop Conversation",
    scene: "INT. COFFEE SHOP - MORNING",
    date: "2026-01-04",
    version: "1.0",
  },
  speakers: {
    alice: { name: "Alice", voice: "nova", description: "30s, energetic" },
    bob: { name: "Bob", voice: "onyx", description: "40s, laid-back" },
  },
  dialogue: [
    {
      id: 1,
      speaker: "alice",
      text: "Hello, how are you doing today?",
      timing: { start: 0.0, end: 3.5 },
      direction: "entering, slightly out of breath",
      emotion: "cheerful",
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 2,
      speaker: "bob",
      text: "I'm doing well, thanks for asking.",
      timing: { start: 3.5, end: 6.2 },
      direction: "looks up from newspaper",
      emotion: "warm",
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 3,
      speaker: "alice",
      text: "Just needed a break from work.",
      timing: { start: 7.0, end: 10.0 },
      direction: "sighs, pulls out chair",
      emotion: "tired but relieved",
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

const SHOWCASE_FOUNTAIN = `Title: Japanese Greetings Lesson
Date: 2026-04-17

INT. COFFEE SHOP - MORNING

NARRATOR
(warm, inviting)
Welcome to our lesson on Japanese greetings.
[[Slower pace. Clear enunciation.]]

AKIKO
(cheerful, native speaker)
こんにちは！ はじめまして。
[[Bow slightly. Formal register.]]`;

function AudioFilterCard() {
  const [filters, setFilters] = React.useState<Set<string>>(
    new Set(["derumble", "noisecancel"]),
  );
  return (
    <AudioFilterPanel activeFilters={filters} onFiltersChange={setFilters} />
  );
}

function HorizontalTimelineCard() {
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <Box sx={{ height: 300 }}>
      <HorizontalTimeline
        scriptData={SHOWCASE_SCRIPT_DATA as any}
        selectedDialogueId={selected}
        onSelectDialogue={(id) => setSelected(String(id))}
        onPlay={() => {}}
        onStop={() => {}}
        onRecordingComplete={() => {}}
        readOnly
      />
    </Box>
  );
}

function ScreenplayEditorCard() {
  const [fountain, setFountain] = React.useState(SHOWCASE_FOUNTAIN);
  return (
    <Box
      sx={{
        height: 360,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <ScreenplayEditor
        fountainText={fountain}
        onFountainChange={setFountain}
        onPromptSubmit={() => {}}
        isGenerating={false}
        readOnly={false}
      />
    </Box>
  );
}

// Recording Studio building blocks are shown in the Real Components story.
