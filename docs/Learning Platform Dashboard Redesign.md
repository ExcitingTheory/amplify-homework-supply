Learning Platform Dashboard Redesign: Comprehensive Engineering & Planning Specification
This planning document aggregates the complete strategic design principles, architectural critiques, and reusable Material UI (MUI v5) technical layouts developed across our design session. It serves as a single source of truth for engineering the student and teacher interfaces.
📐 Section 1: Core Design Critique & Core UX Strategy
1.1 Structural Layout & Information Hierarchy
• The Problem: The initial dashboard suffered from extreme layout duplication and information noise. Content tracking details, execution variables, and lesson details shared identical text scales. In the teacher view, individual student list tiles took up massive vertical real estate, forcing extensive page scrolling.
• The Strategy: Break user layouts into clean, visually separated functional zones. Isolate high-impact interaction layers from baseline descriptive text, ensuring information layouts remain highly predictable and digestible.
1.2 Multi-Viewport Layout Systems (Desktop vs. Mobile)
• Desktop (Horizontal Feed Layout): Standardize Left-to-Right reading dynamics as the structural baseline. Position illustrative graphic elements or course thumbnails on the left, typography and content columns in the center, and primary calls-to-action (CTAs) along the far-right margin. This aligns directly with natural eye tracking.
• Grid & Carousel Structural Constraints: Never split narrow grid blocks or carousel frames horizontally (Image Right / Text Left). Doing so compresses text areas into unreadable strips, forcing awkward, broken word wrapping.
• Mobile Viewport Folding: On compact screen shapes, dynamically drop horizontal layers into vertical structures. Force the thumbnail container to sit at full width on top to function as a visual header, positioning multi-line details underneath and buttons expanding to full width along the lower layout margin for thumb accessibility.
1.3 High-Impact Functional Polish
• Eliminate Raw String Key Leakage: Ensure internal localization paths (pages.sectionDetail.*, components.assignmentCard.*) are fully resolved into text layers using active localized context bundles before rendering in the DOM tree.
• Establish Clear Call-to-Action (CTA) Weights: Avoid identical buttons side-by-side. Secondary utility paths must use lightweight text configurations, while main goal tasks highlight themselves via high-contrast solid filled backgrounds.
• Anchor Alerts Inline with Content Contexts: Move global error warnings down out of top screen margins directly into respective modular section boundaries. This immediately alerts teachers to specific items requiring swift intervention without forcing them to trace back and forth across the screen.
💻 Section 2: Production Component Specifications (MUI v5)
2.1 The Responsive Student Assignment Card
Manages standard horizontal rendering on desktop monitors and switches cleanly to an image-on-top layout for smaller viewports.
jsx
import React from 'react';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  Box, 
  Chip 
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function AssignmentCard({ assignmentTitle, assignmentDesc, dueDate, imageUrl }) {
  const defaultTitle = assignmentTitle || "Japanese Numbers and Counting";
  const defaultDesc = assignmentDesc || "Master numbers 1-100 and counting objects in Japanese.";
  const defaultDate = dueDate || "Jan 30, 2024 • 3:59 PM";
  const defaultImg = imageUrl || "https://unsplash.com";

  return (
    <Card 
      elevation={1} 
      sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: 3, 
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        mb: 3
      }}
    >
      {/* Left Thumbnail Anchor */}
      <CardMedia
        component="img"
        image={defaultImg}
        alt={defaultTitle}
        sx={{ 
          width: { xs: '100%', md: 220 }, 
          height: { xs: 160, md: 'auto' },
          objectFit: 'cover'
        }}
      />

      {/* Structured Layout Body */}
      <CardContent 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          p: 3,
          '&:last-child': { pb: 3 }
        }}
      >
        <Box>
          {/* Header Metadata */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Chip 
              label="Up Next" 
              color="primary" 
              size="small" 
              sx={{ fontWeight: 'bold', borderRadius: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Due: {defaultDate}
            </Typography>
          </Stack>

          {/* Core Content Layers */}
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            {defaultTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineClamp: 2 }}>
            {defaultDesc}
          </Typography>
        </Box>

        {/* Action Rows with Distinct Structural Importance */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1.5} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Secondary Utilities */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: { xs: 1, sm: 0 } }}>
            <Button size="small" variant="text" startIcon={<AssignmentIcon />} sx={{ color: 'text.secondary' }}>
              Practice
            </Button>
            <Button size="small" variant="text" startIcon={<ChatBubbleOutlineIcon />} sx={{ color: 'text.secondary' }}>
              Discussion
            </Button>
            <Button size="small" variant="text" startIcon={<HelpOutlineIcon />} sx={{ color: 'text.secondary' }}>
              Get Help
            </Button>
          </Stack>

          {/* Primary Milestone Action */}
          <Button 
            variant="contained" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              fontWeight: 'bold',
              textTransform: 'none'
            }}
          >
            Start Workbook
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
Use code with caution.
2.2 Course Module Accordion Wrapper
Embeds tracking indicators, linear metric paths, and course statistics cleanly within an expandable dashboard header block.
jsx
import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';

export default function CourseAccordion({ children, courseTitle, progressValue }) {
  const [expanded, setExpanded] = useState(true);
  const defaultTitle = courseTitle || "Japanese 101 - Spring 2024";
  const defaultProgress = progressValue ?? 23;

  return (
    <Accordion 
      expanded={expanded} 
      onChange={() => setExpanded(!expanded)}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px !important',
        overflow: 'hidden',
        background: '#fafafa',
        mb: 4
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
        sx={{
          px: 3,
          py: 1,
          backgroundColor: '#ffffff',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'stretch', lg: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            width: '100%'
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {defaultTitle}
        </Typography>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ flex: { lg: 1 }, justifyContent: 'flex-end', maxWidth: { lg: '65%' } }}
        >
          {/* Status Metrics Section */}
          <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Chip 
              icon={<StarOutlineIcon style={{ fontSize: '16px' }} />} 
              label="30xp" 
              size="small" 
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} 
            />
            <Chip 
              icon={<DynamicFeedIcon style={{ fontSize: '16px' }} />} 
              label="2 passing" 
              size="small" 
              sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 600 }} 
            />
            <Chip 
              icon={<CheckCircleOutlineIcon style={{ fontSize: '16px' }} />} 
              label="1 done" 
              size="small" 
              sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }} 
            />
          </Stack>

          {/* Integrated Progress Indicator */}
          <Box sx={{ width: { xs: '100%', sm: 180 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: '100%' }}>
              <LinearProgress 
                variant="determinate" 
                value={defaultProgress} 
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: 'primary.main'
                  }
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, minWidth: 32 }}>
              {defaultProgress}%
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 3, bgcolor: '#fafafa' }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
Use code with caution.
2.3 Refactored Teacher Section Header Component
Normalizes section titles and embeds contextual review badges directly inline, replacing loose global alert layers.
jsx
import React from 'react';
import { Box, Typography, Stack, Chip, IconButton, Tooltip, Divider } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import GroupIcon from '@mui/icons-material/Group';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function SectionHeader({ title, period, roomCode, status, studentCount, flaggedCount }) {
  const getStatusConfig = (statusStr) => {
    switch(statusStr?.toLowerCase()) {
      case 'excelling':
        return { label: 'Excelling', color: 'success', variant: 'filled' };
      case 'passing':
        return { label: 'Passing', color: 'info', variant: 'outlined' };
      default:
        return { label: 'Needs Review', color: 'warning', variant: 'filled' };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2.5, borderRadius: '12px 12px 0 0', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              • Period {period}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary' }}>
            {roomCode}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
          <Chip label={statusConfig.label} color={statusConfig.color} variant={statusConfig.variant} size="small" sx={{ fontWeight: 700 }} />
          
          {flaggedCount > 0 && (
            <Chip 
              icon={<FlagIcon style={{ fontSize: '14px' }} />}
              label={`${flaggedCount} Flagged`}
              color="error"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
            <GroupIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {studentCount} Students
            </Typography>
          </Stack>

          <Tooltip title="Options">
            <IconButton size="small" edge="end">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
Use code with caution.
2.4 Compact Student Activity & Rankings Matrix Table
Condenses independent student cards into a single matrix, eliminating up to 60% of unnecessary vertical scrolling.
jsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Avatar, 
  Stack, 
  Typography,
  LinearProgress,
  Box
} from '@mui/material';

export default function CompactStudentTable({ studentData }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table size="small" aria-label="student performance matrix table">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Recent Activity Focus</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Performance Matrix</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Rank</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {studentData.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar src={row.avatarUrl} sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
                    {row.name.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {row.name}
                  </Typography>
                </Stack>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {row.currentUnit || 'No activity log'}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, width: '100%', maxWidth: 140 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={row.score} 
                    color={row.score >= 80 ? 'success' : row.score >= 60 ? 'warning' : 'error'}
                    sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'action.disabledBackground' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 28 }}>
                    {row.score}%
                  </Typography>
                </Box>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  #{row.rankPosition}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
Use code with caution.
2.5 Parent Section Card Module Wrapper
Assembles headers, tracking metrics, and data tables into a clean layout structure.
jsx
import React from 'react';
import { Card, CardContent, Grid, Box, Typography, LinearProgress, Stack, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PeerReviewIcon from '@mui/icons-material/RateReview';

import SectionHeader from './SectionHeader';
import CompactStudentTable from './CompactStudentTable';

export default function ParentSectionCard({ sectionData }) {
  const { title, period, roomCode, status, studentCount, flaggedCount, avgGrade, attendance, students } = sectionData;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 4, bgcolor: 'background.paper' }}>
      <SectionHeader title={title} period={period} roomCode={roomCode} status={status} studentCount={studentCount} flaggedCount={flaggedCount} />
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Avg Grade</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>{avgGrade}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={avgGrade} color="success" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Attendance</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{attendance}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={attendance} color="primary" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          </Grid>
        </Grid>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Student Standings</Typography>
        <CompactStudentTable studentData={students} />
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<AutoAwesomeIcon />}>Skills Grid</Button>
              <Button size="small" variant="outlined" startIcon={<PeerReviewIcon />}>Peer Review</Button>
            </Stack>
            <Button variant="contained" color="primary" endIcon={<OpenInNewIcon />} sx={{ fontWeight: 'bold', px: 3 }}>Manage Section</Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
Use code with caution.
Would you like to explore configuring a custom Material UI Theme Palette object Override file to align these status indicators (success.main, warning.main, error.main) with your app's brand guidelines?
Applying modern UX practices can dramatically clean up this interface, minimize visual noise, and make critical items easier to act upon immediately.
🚨 1. Consolidate "Needs Attention" Alerts
The global red alert box at the top ("Needs attention") calls out content flagged for review across 2 items, and then lists units below it.
• The Fix: Move section-specific alerts directly inside that class section's card instead of floating them globally at the very top. For example, a high-contrast badge or micro-banner can sit directly under the "Spanish 101" title bar. This gives the teacher instant contextual relevance without forcing them to look back and forth between the global header and the class section blocks.
📊 2. Streamline the Progress/Grade Bars
Each section currently uses multiple thick, stacked progress tracks ("Avg Grade", "Attendance", and separate lines for "CLASS PROGRESS BY UNIT"). This creates a heavy, horizontal grid-line pattern that tires the eyes when scrolling.
• The Fix: Combine metrics where possible. You can condense the "Avg Grade" and "Attendance" status bars into smaller, inline numerical stats side-by-side or format them into clean, circular progress rings (Donut Charts) next to the class title to break up the monotonous horizontal blocks.
👥 3. Group and Clean "Recent Activity" and "Top Students"
The list format for individual students under "Recent Activity" and "Top Students" takes up massive vertical screen space.
• The Fix: Convert these listings into a clean, multi-column Data Table or a split grid.
• Contrast Text: Instead of highlighting every single percentage or duration with colorful backgrounds or colored bars on the right, use plain text with color-coded trends (e.g., simple green/amber text indicators) only for items that explicitly require the teacher's attention.
🎨 4. Leverage Standard Material UI Layouts
Since you are utilizing Material UI, you can refine the overall visual container system to make information parsing easier:
• Card Separation: Wrap each complete class section (e.g., Spanish 101 - Period 1) inside a distinct Card with a subtle elevation or outline. Adding a distinct background shade (like #f8fafc) to the card body helps segment where one class section ends and another begins.
• Standardize Headers: Keep the right-aligned headers uniform. In some rows, you have text like "4 passing" or "Excelling" floating in boxes. Use MUI Chip components with consistent rounded styles and defined theme colors (success, warning, info) to normalize these tags across Spanish and French sections.
🖱️ 5. Clean Up Action Buttons
The primary footer controls ("Manage Section", "Skills", "Peer Review") repeat identically at the bottom of every card.
• The Fix: Keep the section footer clean. Make "Manage Section" the clear, prominent button target, and hide secondary configurations (like specific skills breakdowns or advanced settings) inside an icon-based menu dropdown or a gear icon next to the section header. This keeps the lower margin light and tidy.

📋 Section 3: Session Implementation Log (verified against actual source + live Storybook render, Oct 2026)

📍 Current Status: Teacher/Instructor Dashboard refactor and the Card Thumbnail Consolidation are both DONE and live-verified. Student Dashboard duplication fixes (global "Your next step" banner, Late/Overdue chip dedup + accordion aggregate chip, duplicate completion %) are confirmed as real bugs but NOT yet implemented — these are next up. Two optional cleanups (UnitListCard extraction, Dashboard barrel exports) are flagged but deferred, not blocking.

✅ Teacher/Instructor Dashboard — DONE
• New components in src/components/Dashboard/: SectionHeader.tsx, CompactStudentTable.tsx, ParentSectionCard.tsx, GradeDonut.tsx. Wired into InstructorDashboard.jsx only (not the student dashboard).
• GradeDonut renders the avg-grade donut ring next to the section title in SectionHeader (replaces the old in-body LinearProgress "Avg Grade" bar).
• Flagged content (moderation-flagged grades/chats) now shown per-section inline instead of one global banner; global banner now only covers gamification draft-unit warnings.
• "Recent Activity" converted from a stacked list to a compact Table.
• Collapsible card body given a subtle bgcolor: "grey.50" shade for segmentation.
• Footer consolidated: "Manage Section" stays the sole prominent contained button; "Peer Review" moved into an overflow menu; "Skills" kept as a de-emphasized outlined button (not nested in the menu, to avoid an interactive-in-interactive a11y issue with its own Dialog).
• CourseAccordion (plan 2.2): not duplicated as a new component — but the teacher dashboard's ParentSectionCard was converted from a Card+Collapse pattern into a REAL MUI Accordion/AccordionSummary/AccordionDetails (matching the CourseAccordion blueprint). Radius is set once via a new `MuiAccordion` theme override (`semanticComponentOverrides` in semanticTheme.ts, using `SEMANTIC_THEME.radius.panel`) instead of a per-instance `borderRadius: '...px !important'` sx hack — both ParentSectionCard.tsx and SectionPanel.tsx (student dashboard) now inherit the radius from the theme with no `!important` anywhere. SectionHeader is now pure AccordionSummary content (its old mobile-only "View details" toggle button was removed — the whole header row is now the clickable toggle, consistent with SectionPanel.tsx's existing accordion).
• Caught during live verification: the per-section flagged-content Chips (sectionFlaggedGrades/sectionFlaggedChats) were passing BOTH `icon` and `avatar` props simultaneously — MUI logs "The Chip component can not handle the avatar and the icon prop at the same time" and only renders one. Fixed by dropping the redundant `icon` prop (kept `avatar`, which is more informative — shows the student). Removed now-dead `ChatBubbleOutlineIcon` import as a result.
• AssignmentCard (plan 2.1): the real src/components/Dashboard/AssignmentCard.tsx is a different, pre-existing production component (real data props) — left untouched.

✅ Card Thumbnail Consolidation — DONE
• New shared component CardMediaThumbnail.tsx: fixed 160×160, object-fit: cover, hidden on mobile — the single reusable left-anchored thumbnail slot.
• Fixed a real, confirmed bug: thumbnails were rendering on the RIGHT (last flex child) instead of the left in CommunityUnitCard.tsx, SharedUnitCard.tsx, UnitsClient.jsx (all 3 card blocks: published/draft/archived), and SectionsClient.jsx.
• PublishedUnitHtmlThumbnail.jsx (used by AssignmentCardView via AssignmentCard.tsx) refactored to delegate sizing/cover-fit/empty-state to CardMediaThumbnail.
• AssignmentCardView.tsx: removed its now-redundant outer thumbnail wrapper Box; Card minHeight bumped 140→160 to match the shared size.
• Verified live in Storybook via DOM measurement on the Units and Sections story pages: 160×160, object-fit cover, left-anchored, 0 console errors.

⚠️ Student Dashboard — PARTIALLY FIXED
• DashboardClient.jsx still renders a global "Your next step" Paper banner (~line 712) that duplicates the exact same unit/section/due-date/Start info already shown in DashboardHeroView's consolidated hero (nextStep prop) — confirmed via live render text dump, same unit appears 2-3x on one page load. NOT YET FIXED: remove the redundant global banner, keep only the hero's version.
• FIXED: AssignmentCardView.tsx was rendering BOTH a "Late" chip (windowState.isLate) AND a separate inline "Overdue · {date}" chip (dueStatus) for the same overdue assignment. Now the "Late" chip is suppressed whenever an overdue indicator (floating badge or inline chip) is already shown (showsOverdueIndicator check), so only one renders.
• FIXED: SectionPanel.tsx's accordion header now has an aggregate "X overdue" Chip (computed from pending assignments past their due date), visible without expanding the section.
• SectionPanel.tsx accordion header still shows the completion percentage twice (a Chip AND inline text beside the LinearProgress bar) — minor redundancy, NOT yet fixed.
• FIXED (Contrast Text instruction): CompactStudentTable.tsx and InstructorDashboard.jsx's Recent Activity table no longer use colorful Chip backgrounds for every score — replaced with plain Typography text, colored (warning/error) only when the score is below 80% (i.e. only items that need attention), plain text.primary otherwise.

❌ Items from the original critique that do NOT apply (verified false via source + live render — do not "fix" these)
• Raw i18n key leakage (pages.index.greetingAfternoon, components.assignmentCard.discussion/requestAssistance): these exact keys/paths don't exist in the code; the real calls (t("discuss"), t("requestGuidance"), t(greetingKey,...)) resolve correctly.
• "Today"/"Next Step" duplication at the very top: already consolidated into one DashboardHeroView hero (the REAL duplication is the separate lower-page "Your next step" banner noted above, not the hero itself).
• Primary vs. secondary button weighting on AssignmentCardView: already correct (outlined ghost buttons vs. a separate contained Start button).
• Dense diagnostic/debug sidebar panel ("EASY TO TURN OFF"): does not exist anywhere in this codebase.

🔜 Open / Deferred (flagged, not implemented yet)
• Remove the duplicate "Your next step" banner in DashboardClient.jsx.
• Remove/simplify the duplicate completion % display in SectionPanel's accordion header.
• UnitsClient.jsx's three unit-card blocks (published/draft/archived) are ~95% duplicate JSX — good candidate for extracting one reusable UnitListCard component, parametrized by button set. Not yet done.
• Dashboard/index.ts barrel file doesn't yet re-export SectionHeader/CompactStudentTable/ParentSectionCard/GradeDonut/CardMediaThumbnail like its sibling components do. Not yet done.
• Cards need a proper mobile view: thumbnail should stack full-width on top on mobile (not hide), content below, matching the Desktop (Image Left) / Mobile (Image Top) blueprint. Applies to CardMediaThumbnail + every Card using it (CommunityUnitCard, SharedUnitCard, UnitsClient x3, SectionsClient) and AssignmentCardView.

📱 Section 4: Additional Critique — Assignment Card Typography, CTA, Image & Spacing

🎨 Component-by-Component Upgrades
1. Fix the Typography & Hierarchy
• Un-jam the top line: Break the date/time and the title into separate vertical lines.
• Style the metadata: Make the date smaller, lighter (e.g., a muted gray text color), and place it above the title.
• Clean the time string: Format it cleanly to "Jan 25, 2024 • 3:59 PM" or just "Due: 01/25/2024".

2. Elevate the Action Button (CTA)
• Turn text into a button: Upgrade viewWorkbook from a plain text link to an outlined or subtly filled button component.
• Create a clear target: Give it uniform padding, rounded corners (border-radius: 6px or 8px), and a distinct hover state to make it look highly interactive.

3. Standardize the Image Box
• Enforce consistent constraints: Set a fixed aspect ratio for the image containers (like aspect-ratio: 16/9 or 4/3).
• Use smart scaling: Apply object-fit: cover so different user-uploaded or placeholder images scale gracefully without distorting or clipping weirdly.

4. Card Spacing & Polish
• Add inner breathing room: Increase the card's internal padding (padding: 24px or 1.5rem) so text doesn't hug the borders.
• Soften the borders: Change harsh dark borders to a lighter, subtle gray border, or use a soft box-shadow on a clean white background for a modern, lightweight feel.

🛠️ Core Visual & Functional Issues
• Information Cramming: The date, time, and lesson title are jammed into a single bold line, making it hard to quickly distinguish the topic from the due date.
• Over-Precise Metadata: Displaying seconds (3:59:00 PM) adds unnecessary cognitive noise.
• Weak Call-to-Action (CTA): The "View Workbook" link sits flat at the bottom — it doesn't look like a clear, clickable target button.

📱 Section 5: Mobile View Blueprint (Image Left Desktop / Image Top Mobile)

The cards need a proper mobile view — currently CardMediaThumbnail hides the image entirely below the sm breakpoint instead of stacking it full-width on top. Below is the reference blueprint supplied for the ideal responsive behavior.

🖥️ The Desktop (Image Left) Blueprint
```
+-------------------------------------------------------------------------+
|  +-----------+    📅 Due: Jan 25, 2024 • 3:59 PM                        |
|  |           |                                                          |
|  |   IMAGE   |    Introduction to Japanese Greetings                    |
|  |  (Fixed)  |    Learn basic Japanese greetings and phrases.           |
|  |           |                                                          |
|  +-----------+    [ Button: View Workbook ]                             |
+-------------------------------------------------------------------------+
```

💻 Code Implementation (reference — Tailwind, this codebase uses MUI sx props instead)
Structure so it sits side-by-side on desktop with the image on the left, and folds cleanly on mobile — image first in the DOM so it stays on top when stacked.
```html
<div class="flex flex-col md:flex-row bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-4 md:p-6 gap-6 items-stretch">
  <!-- Image container (Now first in DOM: stays top on mobile, sits left on desktop) -->
  <div class="w-full md:w-56 h-40 md:h-auto shrink-0">
    <img
      src="path-to-your-image.jpg"
      alt="Lesson thumbnail"
      class="w-full h-full object-cover rounded-lg"
    />
  </div>

  <!-- Content container (Fills remaining space to the right) -->
  <div class="flex flex-col flex-1 min-w-0 justify-between">
    <div>
      <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
        Due: Jan 25, 2024 • 3:59 PM
      </span>
      <h3 class="text-lg font-bold text-gray-900 leading-snug mb-2">
        Introduction to Japanese Greetings
      </h3>
      <p class="text-sm text-gray-600 mb-4 line-clamp-2">
        Learn basic Japanese greetings and self-introduction phrases.
      </p>
    </div>
    <div>
      <button class="w-full md:w-auto inline-flex items-center justify-center px-5 py-2 border border-blue-600 text-sm font-semibold rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
        View Workbook
      </button>
    </div>
  </div>
</div>
```

✨ Why This works much better than before
1. Natural Visual Flow: The eye hits the thumbnail graphic, scans the assignment title immediately next to it, and drops directly down to the primary button.
2. Safer Mobile Behavior: Because the image is now at the top of the card code (no `order` configurations needed), it naturally stacks right above the text when scaled down to a smartphone viewport.
3. Clean Alignment: All text headlines share a perfectly uniform left margin, making the whole dashboard feel less cluttered.

📋 Section 6: Session Implementation Log (continued)

✅ Teacher Accordion Conversion + Semantic Radii — DONE
• ParentSectionCard converted from a Card+Collapse pattern into a REAL MUI Accordion/AccordionSummary/AccordionDetails (matching the CourseAccordion blueprint). SectionHeader is now pure AccordionSummary content — its old mobile-only "View details" toggle button was removed, since the whole header row is now the clickable toggle (consistent with SectionPanel.tsx's existing accordion). Wired InstructorDashboard.jsx to the new API (removed the now-redundant Collapse wrapper).
• Radius is set once via a `MuiAccordion` theme override (`semanticComponentOverrides` in src/themes/semanticTheme.ts, using `SEMANTIC_THEME.radius.panel`) instead of a per-instance `borderRadius: '...px !important'` hack — both ParentSectionCard.tsx and SectionPanel.tsx inherit the radius from the theme with no `!important` anywhere. Lesson recorded in memory: if an `sx` override needs `!important`, it belongs in `theme.components.<Component>.styleOverrides` instead.
• Caught during live verification: the per-section flagged-content Chips (sectionFlaggedGrades/sectionFlaggedChats) were passing BOTH `icon` and `avatar` props simultaneously — MUI logs "The Chip component can not handle the avatar and the icon prop at the same time" and only renders one. Fixed by dropping the redundant `icon` prop (kept `avatar`, more informative — shows the student). Removed now-dead `ChatBubbleOutlineIcon` import as a result.

✅ Stacked Accordion Grouping (per hand-drawn spec) — DONE
• Removed gaps between adjacent accordions in a list: InstructorDashboard's `<Stack spacing={3}>` → `spacing={0}`; SectionPanel's own `mb: 2` removed. Rows now sit flush (0px gap).
• Extended the `MuiAccordion` theme override so ONLY the group's first row gets top-rounded corners and ONLY the last row gets bottom-rounded corners (`&:not(:first-of-type)` / `&:not(:last-of-type)` force the other two corners to 0). Middle rows are fully square.
• Added subtle alternating-row backgrounds via `&:nth-of-type(even) { backgroundColor: theme.palette.action.hover }`. Removed SectionPanel's hardcoded `#ffffff` (AccordionSummary) / `#fafafa` (AccordionDetails) backgrounds that were opaquely covering the zebra tint.
• Verified live via DOM measurement on both the teacher (3 sections, InstructorDashboard) and student (2 sections, SectionPanel) dashboards: 0px gap between rows, 12px radius only on the outer corners of the first/last row, alternating white/`rgba(0,0,0,0.04)` row backgrounds.

🔜 Planned — Not Yet Implemented

1. Pill (Chip) Alignment
• The stat pills/chips in the accordion headers (SectionHeader, SectionPanel summary) need to align centered with each other (same vertical baseline) and as a group be right-aligned within the header row.

2. Progress Visualization: Bars → Segmented Donut
• Replace the Grade Distribution breakdown bar (GradeDistributionBar in InstructorDashboard.jsx — the stacked A/B/C/F segments) and other progress bars (e.g. completion % LinearProgress in SectionPanel/SectionHeader, class-progress-by-unit bars) with a segmented donut chart instead of a linear bar.
• Scope to confirm before implementing: which specific bars convert (grade distribution is the clearest fit for "segmented" since it already has multiple colored bands; plain single-value completion % bars may become a simple ring rather than multi-segment).

3. Rounded Corners Must Use Semantic Values
• Audit every hardcoded `borderRadius` across the dashboard/card components (and ideally the whole app) and replace magic numbers/strings (e.g. `borderRadius: 2`, `'12px'`, `'8px'`) with the corresponding `SEMANTIC_THEME.radius.*` token (panel/card/control/chip/progress/modal) or a `theme.components.<Component>.styleOverrides` entry, following the same pattern established for `MuiAccordion`. No component should hand-roll its own radius value.

4. Units / Sections / Section Detail (Student + Instructor) Need a Similar Revamp
Survey of the three remaining list/detail pages (read-only, not yet implemented):
• **UnitsClient.jsx** (~990 lines, unified view, no student/instructor branching): three nearly-identical card-rendering blocks for published/draft/archived units (~100 lines each, same button styles/badge rendering) — the clearest `<UnitCard>` extraction candidate in the app. Published units are wrapped in `<ContentLockCard>` with extra padding while draft/archived render a naked `Card`, creating a visual size/spacing mismatch between tabs. Hardcoded `borderRadius: 2`/`3` throughout (not semantic tokens). No Accordion/pill-alignment concerns here.
• **SectionsClient.jsx** (~843 lines, role-branched via `isInstructor`): consistent `CardMediaThumbnail` card layout already, but uses `Chip` for archived-status and join-code display with hardcoded `borderRadius: 2` (not semantic). Moderate duplication between the main section card block and a near-identical empty-state Card. `InstructorDashboard` is conditionally injected for instructors — no duplicate subscriptions.
• **SectionDetailClient.jsx** (~2,850+ lines, dual-mode via a `viewAsStudent` toggle + `isOwner` instructor flag): by far the largest and most complex — full gradebook, grade overrides, bulk date editor, roster/accommodation management, and gamification controls for instructors; read-only assignment table with grades/locked-state for students. Custom `<FeaturedImage>` drag-drop uploader instead of the shared `CardMediaThumbnail`/`CardMedia` pattern. Chips used for chapter links and accommodation badges. High duplication in skeleton loaders and per-student/per-assignment grade-cell rendering (repetitive Chip/Tooltip/IconButton combos). Mostly already uses semantic-ish radius (minimal hardcoding found).
• **Scope note**: these three pages are large and structurally different from the dashboard work (no shared Accordion pattern here) — a revamp should be scoped per-page rather than assumed to be a single pass, starting with the highest-value, lowest-risk win: extracting `<UnitCard>` from UnitsClient.jsx's triplicated block.

📄 Section 7: SectionDetailClient (Instructor View) Critique — "Section Overlap"

2. Structural Fix: Severe "Section Overlap"
Right now there are 6 distinct massive modules stacked sequentially on a single scrolling axis:
1. Course Header Banner
2. Students Table
3. Gradebook Heatmap Matrix
4. Completion Overview
5. Leaderboard Track
6. Open Database Detail Query Table
7. Assignments Feed
• The Problem: A user has to scroll past roughly 40 rows of grid data just to find the individual assignment buttons at the bottom. This causes extreme fatigue.
• The Strategy (Tabbed Navigation): Don't show the Students list, Gradebook, Leaderboard, and Assignments all at the same time. Wrap these components into an upper MUI `Tabs` layout navigation bar. Let the main tab default to "Assignments", and place deep tracking elements like "Gradebook" and "Leaderboard" behind separate dashboard tab paths.

📊 3. Compress the Gradebook & Completion Feeds
Currently there's a full Gradebook block displaying color percentages, followed immediately by a Completion Overview block displaying identical information via "Complete"/"In Progress" button pills.
• The Problem: Redundant information architecture — the exact same student status data points are shown twice using different shapes.
• The Strategy: Merge these two matrices into a single Master Gradebook Grid Table. Place the color-coded performance percentage in a row box, and a tiny completion-status badge icon directly next to or above it inside the same data cell.

🏆 4. Clean Up the Leaderboard Matrix
The current Leaderboard uses loose visual rows that look identical to a generic data list.
• The Problem: Doesn't look like an engaging achievement system — just adds more horizontal stripes to a page already dominated by horizontal lines.
• The Strategy: Make it look distinct from a data sheet. Reduce it to a compact, multi-column sidebar card. Use standard gold/silver/bronze background circles for ranks #1, #2, #3 instead of printing plain text strings, turning it into a lightweight visual asset.

🎴 5. Final Step: Polish the Assignment Cards (Image-Left)
The assignment feed at the bottom is still using the unoptimized "Image-on-the-Right" layout with cramped metadata.
• Fix: Pull the code block from Section 2.1 of this planning guide to flip those thumbnails to the left margin, break up the date/time strings onto their own lines, and style the workbook links into explicit interactive button footprints.

📄 Section 8: SectionDetailClient (Student View) Critique

🚨 1. The Critical Flaw: The Chronological Timeline Bug
Due Dates in the bottom Assignments feed:
• Card 1: 1/25/2024
• Card 2: 1/30/2024
• Card 3: 2/5/2024
• Card 4: 12/31/2050
• Card 5: 2/15/2024
• The Issue: The timeline breaks at Card 4 with a distant placeholder date (2050), followed by a card that jumps backward to 2/15/2024.
• The Fix: Ensure the sorting function explicitly sorts assignments strictly by chronological order (`Date.parse()`). If `12/31/2050` is a placeholder for a "Draft"/"Undated" assignment, it should either be filtered out of the active student view entirely or labeled cleanly as "No Due Date" and pushed to the very bottom of the stack.

📊 2. The UX Flaw: Disconnected Table Headers
In the Completion Overview matrix, the top column headers (e.g. "Introduction to Japanese Greetings" | "Japanese Numbers and Counting" | "Daily Activities Vocabulary") match individual assignments exactly, but completely disappear as soon as a user scrolls down to the Leaderboard, Open Collaboration Rooms, or Assignments lists.
• The Fix: Another strong behavioral argument for tabbed navigation. If Gradebook, Completion Overview, and Leaderboard are bundled into a single "Analytics" Tab, freeze the header row (`position: sticky; top: 0; z-index: 10;`) so teachers don't lose context of which column represents which assignment while analyzing class records.

🎨 3. UI Refinements for Clean Material UI Parsing
• The Gradebook Row Alignment: Inside the first table block (Gradebook), the rows have a high-contrast dark text block for assignment names, but the Chapter Metrics text labels look tiny and tightly squeezed next to the right-aligned chevron dropdown icon. Increase the horizontal spacing (`paddingRight`) on the cell values to keep the elements balanced.
• Open Collaboration Rooms Button Row: The controls under the Collaboration block ("Unit" dropdown, "Random Assign", "Reset") are floating loosely on a plain white field without an outer border wrapper. Consider containing this row inside an explicit toolbar or a unified grey action block (`bgcolor: 'action.hover'`) to make the interactive controls distinct from standard text lists.
• Muted Icon Contrast: The small icons next to assignment actions (like the tiny notebook graphic by "View Workbook") are currently dark black, matching the bold weight of the headline text. Lighten these icons subtly to a medium gray color (`color: 'text.secondary'`) so they assist the eye rather than drawing attention away from the assignment titles.

🔀 4. Student/Instructor View Toggle Is Unclear
Current implementation (SectionDetailClient.jsx, `isOwner` only): a single `Button` whose variant flips between `outlined`/`contained` and whose label swaps between `t("sectionDetail.studentView")` / `t("sectionDetail.instructorView")` when clicked (`viewAsStudent` state).
• The Problem: A single toggle button is ambiguous — it's unclear whether the label describes the view you're currently in or the view you'll switch to when clicked.
• The Fix: Replace the toggle Button with a dropdown (MUI `Select`) offering both options explicitly labeled "Show Student View" / "Show Instructor View", so the current state and the action are unambiguous at a glance.
