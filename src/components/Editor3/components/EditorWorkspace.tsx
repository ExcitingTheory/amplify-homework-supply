import * as React from "react";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslations } from "next-intl";

const RAIL_WIDTH = 40;

interface WorkspaceSidebar {
  content: React.ReactNode;
  open: boolean;
  width: number;
  label: string;
  onClose: () => void;
}

interface EditorWorkspaceProps {
  appBarHeight: number;
  toolbar: React.ReactNode;
  left: WorkspaceSidebar;
  right: WorkspaceSidebar;
  children: React.ReactNode;
}

export default function EditorWorkspace({
  appBarHeight,
  toolbar,
  left,
  right,
  children,
}: EditorWorkspaceProps): React.ReactElement {
  const t = useTranslations("common");
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  const previousOpen = React.useRef({ left: left.open, right: right.open });
  const overlayMaxWidth = width === null ? undefined : Math.max(0, width - 2 * RAIL_WIDTH);
  // Panels float over the document, so two open panels may only coexist when they don't overlap.
  const panelsOverlap =
    overlayMaxWidth !== undefined && left.width + right.width > overlayMaxWidth;

  React.useEffect(() => {
    const node = workspaceRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (panelsOverlap && left.open && right.open) {
      if (!previousOpen.current.right) {
        left.onClose();
      } else {
        right.onClose();
      }
    }
    previousOpen.current = { left: left.open, right: right.open };
  }, [panelsOverlap, left, right]);

  const renderSidebar = (
    side: "left" | "right",
    sidebar: WorkspaceSidebar,
  ): React.ReactNode => (
    // The rail keeps its place in the layout; the open panel overlays the document without a
    // modal or backdrop so items can still be dragged onto the visible part of the lesson.
    <Box
      data-sidebar-rail={side}
      sx={{
        position: "relative",
        width: `${RAIL_WIDTH}px`,
        flexShrink: 0,
        height: "100%",
        zIndex: (theme) => theme.zIndex.drawer,
      }}
    >
      <MuiDrawer
        anchor={side}
        variant="permanent"
        open
        sx={(theme) => ({
          position: "absolute",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: sidebar.open ? sidebar.width : RAIL_WIDTH,
          maxWidth: sidebar.open ? overlayMaxWidth : undefined,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: sidebar.open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          "& .MuiDrawer-paper": {
            position: "relative",
            width: "100%",
            height: "100%",
            overflowX: "hidden",
            border: "none",
            boxShadow: sidebar.open ? theme.shadows[8] : "none",
          },
        })}
        slotProps={{
          paper: {
            role: "complementary",
            "aria-label": sidebar.label,
            "data-open": sidebar.open,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (sidebar.open && event.key === "Escape" && !event.defaultPrevented) {
                sidebar.onClose();
              }
            },
          } as React.HTMLAttributes<HTMLDivElement>,
        }}
      >
        {sidebar.open && (
          <Box sx={{ display: "flex", alignItems: "center", px: 1.5, py: 0.5, borderBottom: 1, borderColor: "divider", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {sidebar.label}
            </Typography>
            <IconButton size="small" onClick={sidebar.onClose} aria-label={t("actions.close")}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          {sidebar.content}
        </Box>
      </MuiDrawer>
    </Box>
  );

  return (
    <Box
      ref={workspaceRef}
      data-testid="editor-workspace"
      sx={{
        display: "flex",
        overflow: "hidden",
        height: `calc(100dvh - ${appBarHeight}px)`,
        minHeight: 0,
        bgcolor: "background.default",
      }}
    >
      {toolbar}
      {renderSidebar("left", left)}
      <Box
        component="main"
        data-testid="editor-workspace-main"
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "action.hover",
        }}
      >
        {children}
      </Box>
      {renderSidebar("right", right)}
    </Box>
  );
}
