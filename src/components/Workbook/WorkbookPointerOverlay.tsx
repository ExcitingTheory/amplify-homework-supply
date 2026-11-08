import React from "react";
import { Box } from "@mui/material";
import NearMeIcon from "@mui/icons-material/NearMe";
import type { WorkbookCollaborationProvider } from "../../yjs/WorkbookCollaborationProvider";

interface WorkbookPointerOverlayProps {
  provider: WorkbookCollaborationProvider | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface Pointer {
  clientId: number;
  name: string;
  color: string;
  x: number;
  y: number;
}

export function WorkbookPointerOverlay({
  provider,
  containerRef,
}: WorkbookPointerOverlayProps) {
  const [pointers, setPointers] = React.useState<Pointer[]>([]);
  const [layout, setLayout] = React.useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!provider || !container) {
      setPointers([]);
      return;
    }

    const awareness = provider.getAwareness();
    let frame: number | null = null;
    let pending: { x: number; y: number } | null = null;

    const dimensions = () => {
      const style = window.getComputedStyle(container);
      const left = parseFloat(style.paddingLeft) || 0;
      const right = parseFloat(style.paddingRight) || 0;
      const top = parseFloat(style.paddingTop) || 0;
      const bottom = parseFloat(style.paddingBottom) || 0;
      return {
        left,
        top,
        width: container.scrollWidth - left - right,
        height: container.scrollHeight - top - bottom,
      };
    };

    const updateLayout = () => {
      const { width, height } = dimensions();
      setLayout({
        width,
        height,
        x: container.scrollLeft,
        y: container.scrollTop,
      });
    };

    const updatePointers = () => {
      const next: Pointer[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID || !state.user || !state.pointer)
          return;
        const { x, y } = state.pointer;
        if (
          typeof x !== "number" ||
          !Number.isFinite(x) ||
          x < 0 ||
          x > 1 ||
          typeof y !== "number" ||
          !Number.isFinite(y) ||
          y < 0 ||
          y > 1
        )
          return;
        next.push({
          clientId,
          name:
            typeof state.user.displayName === "string"
              ? state.user.displayName
              : typeof state.user.username === "string"
                ? state.user.username
                : "",
          color:
            typeof state.user.color === "string" ? state.user.color : "#6366f1",
          x,
          y,
        });
      });
      setPointers(next);
      updateLayout();
    };

    const onMove = (event: PointerEvent) => {
      const { left, top, width, height } = dimensions();
      if (event.pointerType === "touch" || width <= 0 || height <= 0) return;
      const rect = container.getBoundingClientRect();
      pending = {
        x: Math.max(
          0,
          Math.min(
            1,
            (event.clientX -
              rect.left -
              container.clientLeft -
              left +
              container.scrollLeft) /
              width,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            1,
            (event.clientY -
              rect.top -
              container.clientTop -
              top +
              container.scrollTop) /
              height,
          ),
        ),
      };
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        awareness.setLocalStateField("pointer", pending);
      });
    };

    const onLeave = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      pending = null;
      awareness.setLocalStateField("pointer", null);
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("scroll", updateLayout, { passive: true });
    window.addEventListener("resize", updateLayout);
    const unsubscribe = provider.onAwarenessChange(updatePointers);
    updatePointers();

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("scroll", updateLayout);
      window.removeEventListener("resize", updateLayout);
      unsubscribe();
      onLeave();
    };
  }, [containerRef, provider]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "sticky",
        top: 0,
        height: 0,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {pointers.map((pointer) => (
        <Box
          key={pointer.clientId}
          sx={{
            position: "absolute",
            left: pointer.x * layout.width - layout.x,
            top: pointer.y * layout.height - layout.y,
            color: pointer.color,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <NearMeIcon fontSize="small" />
          <Box
            sx={{
              bgcolor: pointer.color,
              color: "white",
              px: 0.5,
              borderRadius: 1,
              fontSize: "0.7rem",
            }}
          >
            {pointer.name}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
