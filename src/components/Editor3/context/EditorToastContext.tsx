"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Alert, { type AlertColor } from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Portal from "@mui/material/Portal";
import { useTheme } from "@mui/material/styles";

export interface EditorToastOptions {
  message: ReactNode;
  severity: AlertColor;
  autoHideDuration?: number | null;
  action?: (dismiss: () => void) => ReactNode;
}

interface EditorToast extends EditorToastOptions {
  id: number;
}

interface EditorToastContextValue {
  showToast: (toast: EditorToastOptions) => number;
  dismissToast: (id: number) => void;
}

const EditorToastContext = createContext<EditorToastContextValue | null>(null);

function EditorToastItem({
  toast,
  onDismiss,
}: {
  toast: EditorToast;
  onDismiss: (id: number) => void;
}) {
  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    if (toast.autoHideDuration == null) return;

    const timeout = window.setTimeout(dismiss, toast.autoHideDuration);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.autoHideDuration]);

  const theme = useTheme();

  return (
    <Alert
      data-severity={toast.severity}
      onClose={dismiss}
      severity={toast.severity}
      variant="standard"
      action={toast.action?.(dismiss)}
      sx={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        borderInlineStart: `4px solid ${theme.palette[toast.severity].main}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[6],
        alignItems: "center",
        "& .MuiAlert-icon": {
          color: theme.palette[toast.severity].main,
        },
        "& .MuiAlert-message": {
          minWidth: 0,
          overflowWrap: "anywhere",
        },
      }}
    >
      {toast.message}
    </Alert>
  );
}

export function EditorToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<EditorToast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: EditorToastOptions) => {
    const id = ++nextId.current;
    setToasts((current) => [
      ...current,
      {
        ...options,
        autoHideDuration:
          options.autoHideDuration === undefined
            ? 5000
            : options.autoHideDuration,
        id,
      },
    ]);
    return id;
  }, []);

  const contextValue = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  return (
    <EditorToastContext.Provider value={contextValue}>
      {children}
      <Portal>
        <Box
          data-testid="editor-toast-stack"
          sx={(theme) => ({
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
            zIndex: theme.zIndex.snackbar,
            width: { xs: "calc(100vw - 2rem)", sm: 440 },
            maxHeight: "calc(100dvh - 2rem)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pointerEvents: "none",
            "& > *": { pointerEvents: "auto" },
          })}
        >
          {toasts.map((toast) => (
            <EditorToastItem
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </Box>
      </Portal>
    </EditorToastContext.Provider>
  );
}

export function useEditorToast(): EditorToastContextValue {
  const context = useContext(EditorToastContext);
  if (!context) {
    throw new Error("useEditorToast must be used within EditorToastProvider");
  }
  return context;
}
