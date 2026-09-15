"use client";

/**
 * Toolbar design-system specimens — faithful, non-interactive visual
 * representations of every toolbar surface in the app, at their true in-app
 * proportions. These are "mocked to visual" on purpose: the real toolbars are
 * context-bound (MainToolbar needs Auth/AppShell/router + data effects; the
 * editor toolbars need a live LexicalComposer), so these specimens give a
 * stable, dependency-free reference for the Design System Showcase.
 *
 * @module components/DesignSystem/ToolbarSpecimens
 */

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";

import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import PreviewIcon from "@mui/icons-material/Preview";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import CodeIcon from "@mui/icons-material/Code";
import SubscriptIcon from "@mui/icons-material/Subscript";
import SuperscriptIcon from "@mui/icons-material/Superscript";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import LinkIcon from "@mui/icons-material/Link";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import AddIcon from "@mui/icons-material/Add";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimerIcon from "@mui/icons-material/Timer";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const vDivider = <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />;

/** A labeled block: title + caption above its content. */
export function TitledStrip({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {caption && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {caption}
        </Typography>
      )}
      {children}
    </Box>
  );
}

/** A full-width toolbar band at true in-app proportion — chrome only. */
export function ToolbarStrip({
  children,
  height = 56,
  bg = "background.paper",
  wrap = false,
}: {
  children: React.ReactNode;
  height?: number;
  bg?: string;
  wrap?: boolean;
}) {
  return (
    <Box
      sx={{
        minHeight: height,
        height: wrap ? "auto" : height,
        px: 1.5,
        py: wrap ? 0.75 : 0,
        display: "flex",
        alignItems: "center",
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: 0.5,
        rowGap: wrap ? 0.5 : 0,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: bg,
        overflow: "hidden",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {children}
    </Box>
  );
}

/** Global navigation app bar — dashboard / list pages (single row). */
export function DefaultAppBar() {
  return (
    <ToolbarStrip height={56}>
      <IconButton size="small">
        <MenuIcon />
      </IconButton>
      <Typography fontWeight={700} sx={{ mx: 1 }}>
        Homework Supply
      </Typography>
      <Button size="small" color="inherit">
        Dashboard
      </Button>
      <Button size="small" color="inherit">
        Sections
      </Button>
      <Button size="small" color="inherit">
        Units
      </Button>
      <Box sx={{ flex: 1 }} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.25,
          py: 0.5,
          mr: 1,
          borderRadius: 999,
          bgcolor: "action.hover",
        }}
      >
        <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          Search…
        </Typography>
      </Box>
      <Chip size="small" icon={<EmojiEventsIcon />} label="1,240 XP" />
      <Chip
        size="small"
        variant="outlined"
        color="warning"
        icon={<LocalFireDepartmentIcon />}
        label="7"
        sx={{ mx: 0.5 }}
      />
      <IconButton size="small">
        <Badge badgeContent={3} color="error">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Avatar sx={{ width: 28, height: 28, ml: 0.5, fontSize: 14 }}>A</Avatar>
    </ToolbarStrip>
  );
}

/** Full Lexical editor toolbar — every text/block/insert control (edit mode). */
export function FullEditorToolbar() {
  return (
    <ToolbarStrip height={48} wrap>
      <IconButton size="small">
        <UndoIcon />
      </IconButton>
      <IconButton size="small">
        <RedoIcon />
      </IconButton>
      <IconButton size="small">
        <PreviewIcon />
      </IconButton>
      {vDivider}
      <Button size="small" color="inherit" endIcon={<ArrowDropDownIcon />}>
        Normal
      </Button>
      {vDivider}
      <Button
        size="small"
        color="inherit"
        startIcon={<FontDownloadIcon />}
        endIcon={<ArrowDropDownIcon />}
      >
        Inter
      </Button>
      <Button
        size="small"
        color="inherit"
        startIcon={<FormatSizeIcon />}
        endIcon={<ArrowDropDownIcon />}
      >
        16
      </Button>
      {vDivider}
      <IconButton size="small">
        <FormatBoldIcon />
      </IconButton>
      <IconButton size="small">
        <FormatItalicIcon />
      </IconButton>
      <IconButton size="small">
        <FormatUnderlinedIcon />
      </IconButton>
      <IconButton size="small">
        <FormatStrikethroughIcon />
      </IconButton>
      <IconButton size="small">
        <CodeIcon />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <SubscriptIcon />
      </IconButton>
      <IconButton size="small">
        <SuperscriptIcon />
      </IconButton>
      <IconButton size="small">
        <FormatClearIcon />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <FormatColorTextIcon />
      </IconButton>
      <IconButton size="small">
        <FormatColorFillIcon />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <LinkIcon />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <FormatListBulletedIcon />
      </IconButton>
      <IconButton size="small">
        <FormatListNumberedIcon />
      </IconButton>
      <IconButton size="small">
        <FormatQuoteIcon />
      </IconButton>
      {vDivider}
      <Button
        size="small"
        color="inherit"
        startIcon={<FormatAlignLeftIcon />}
        endIcon={<ArrowDropDownIcon />}
      >
        Align
      </Button>
      <IconButton size="small">
        <FormatIndentDecreaseIcon />
      </IconButton>
      <IconButton size="small">
        <FormatIndentIncreaseIcon />
      </IconButton>
      {vDivider}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<AddIcon />}
        endIcon={<ArrowDropDownIcon />}
      >
        Insert
      </Button>
    </ToolbarStrip>
  );
}

/** Floating selection toolbar — the compact popover over selected text. */
export function FloatingSelectionToolbar() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        px: 0.75,
        height: 40,
        borderRadius: 999,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: 3,
        pointerEvents: "none",
      }}
    >
      <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled" }} />
      <IconButton size="small">
        <FormatBoldIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <FormatItalicIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <FormatUnderlinedIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <FormatStrikethroughIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <CodeIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <SubscriptIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <SuperscriptIcon fontSize="small" />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <LinkIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <FormatColorTextIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <FormatColorFillIcon fontSize="small" />
      </IconButton>
      {vDivider}
      <IconButton size="small">
        <AddIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <ViewColumnIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/** Contextual app bar — workbook / editor pages (two rows). */
export function ContextualAppBar() {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          height: 56,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconButton size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} noWrap lineHeight={1.2}>
            Chapter 3: Verb Conjugation
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            display="block"
          >
            Practice conjugating regular -ar, -er, and -ir verbs.
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Chip size="small" icon={<EmojiEventsIcon />} label="1,240 XP" />
        <IconButton size="small">
          <Badge badgeContent={3} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
        <Avatar sx={{ width: 28, height: 28, ml: 0.5, fontSize: 14 }}>A</Avatar>
      </Box>
      <Box
        sx={{
          height: 44,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "action.hover",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            bgcolor: "background.paper",
          }}
        >
          <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            Search this unit…
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Chip size="small" icon={<TimerIcon />} label="12:30" />
        <Chip
          size="small"
          variant="outlined"
          color="success"
          icon={<WifiTetheringIcon />}
          label="Synced"
          sx={{ mx: 0.5 }}
        />
        <Box sx={{ width: 120 }}>
          <LinearProgress variant="determinate" value={60} />
        </Box>
      </Box>
    </Box>
  );
}

/** Read-only workbook toolbar — slim primary row for the learner workbook. */
export function ReadOnlyWorkbookToolbar() {
  return (
    <ToolbarStrip height={48}>
      <IconButton size="small">
        <ArrowBackIcon />
      </IconButton>
      <Typography fontWeight={600} sx={{ mx: 1 }}>
        Chapter 3: Verb Conjugation
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Chip size="small" icon={<TimerIcon />} label="12:30" sx={{ mr: 1 }} />
      <Box sx={{ width: 120 }}>
        <LinearProgress variant="determinate" value={60} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
        60%
      </Typography>
    </ToolbarStrip>
  );
}

/** All toolbar specimens laid out with titles + captions. */
export function ToolbarSpecimens() {
  return (
    <Stack spacing={4}>
      <TitledStrip
        title="Default app bar (single row)"
        caption="Dashboard / list pages — nav, in-bar search, XP · streak · notifications · profile."
      >
        <DefaultAppBar />
      </TitledStrip>

      <TitledStrip
        title="Contextual app bar (two rows)"
        caption="Workbook / editor pages — primary row (title + description + actions) with a second contextual row (search, timer, connection, progress) injected via useSecondaryToolbar."
      >
        <ContextualAppBar />
      </TitledStrip>

      <TitledStrip
        title="Full editor toolbar (block editing mode)"
        caption="Lexical ToolBarPlugin — every text, block, alignment, color, and insert control."
      >
        <FullEditorToolbar />
      </TitledStrip>

      <TitledStrip
        title="Floating selection toolbar"
        caption="FloatingToolbarPlugin — the compact popover that appears over selected text."
      >
        <FloatingSelectionToolbar />
      </TitledStrip>

      <TitledStrip
        title="Read-only workbook toolbar"
        caption="ToolBarRoPlugin — slim primary row for the learner workbook."
      >
        <ReadOnlyWorkbookToolbar />
      </TitledStrip>
    </Stack>
  );
}
