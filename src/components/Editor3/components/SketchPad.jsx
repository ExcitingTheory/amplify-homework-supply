import { lazy, Suspense, useState, useEffect, useRef, useContext } from "react";
import "@excalidraw/excalidraw/index.css";
import { verifySketchImage } from "../../../../app/actions/grading";
import UnitContext from "../../../context/unitContext";
import { Box, Typography, Skeleton } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import ExerciseResponsePanel from "./ExerciseResponsePanel";
import {
  createStrokeLog,
  encodeStrokes,
  updateStrokeLog,
} from "../../../utils/strokeLog";

const FREEDRAW_TOOL = "freedraw";

let excalidrawModulePromise;
const loadExcalidraw = () => {
  if (!excalidrawModulePromise) {
    excalidrawModulePromise = import("@excalidraw/excalidraw");
  }
  return excalidrawModulePromise;
};

const LazyExcalidraw = lazy(() =>
  loadExcalidraw().then((mod) => ({ default: mod.Excalidraw })),
);
// TODO Add a version to the data so that we can update the data when the version is higher than the current working copy, which should be one above the last saved version

const SketchPad = ({
  excalidrawData,
  persistData = () => {},
  expect,
  setFeedback,
  feedback,
  questionID,
  // Called after a submission is graded with { strokes, result } so the
  // parent can store the drawing with the answer in grade.data. `strokes` is
  // encodeStrokes() output: every stroke in drawing order, with timing. It is
  // the drawing itself; images are rendered from it when needed.
  onDrawingSaved,
}) => {
  const t = useTranslations("editor.shared");
  const { mode } = useColorScheme();
  const [isHovering, setIsHovering] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const countdownTimer = useRef(null);
  const drawingPanelRef = useRef(null);

  useEffect(() => {
    const panel = drawingPanelRef.current;
    if (!panel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadExcalidraw().catch((error) => {
            console.warn("Unable to preload drawing editor:", error);
          });
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const { grade } = useContext(UnitContext);

  const [_excalidrawData, setExcalidrawData] = useState(
    excalidrawData || {
      elements: [],
      appState: {},
      version: 0,
    },
  );
  const canvasRef = useRef(null);
  const excalidrawRef = useRef(
    excalidrawData || {
      elements: [],
      appState: {},
      version: 0,
    },
  );
  // const updateTimeout = useRef(null);
  // const t = useTranslations();
  // const theme = useTheme();

  // Every stroke in the order it was drawn, with timing. Seeded from any saved
  // scene so a reopened drawing keeps its earlier strokes first.
  const strokeLogRef = useRef(null);
  if (strokeLogRef.current === null) {
    const now = Date.now();
    strokeLogRef.current = createStrokeLog(now);
    if (excalidrawData?.elements?.length) {
      updateStrokeLog(strokeLogRef.current, excalidrawData.elements, now, {
        restored: true,
      });
    }
  }

  const thisVersion = _excalidrawData.version;
  const nextVersion = thisVersion + 1;

  const exportCanvas = async (elements, appState) => {
    console.log("exporting canvas");
    console.log("elements", elements);
    console.log("appState", appState);

    const { exportToCanvas } = await loadExcalidraw();
    const canvas = exportToCanvas({
      elements,
      appState,
    });
    canvasRef.current = canvas;
  };

  const updateExcalidrawData = (elements, appState, files, svg) => {
    // if the version is higher than the current version, update the version
    console.log("thisVersion", thisVersion);
    console.log("nextVersion", nextVersion);
    console.log("elements", elements);
    console.log("appState", appState);
    console.log("files", files);
    console.log("svg", svg);

    if (nextVersion > thisVersion) {
      console.log("updating data");

      setExcalidrawData({ elements, appState, version: nextVersion });
      persistData({ elements, appState, version: nextVersion });
      exportCanvas(elements, appState);
    }
  };

  const submitDrawing = async (justBase64, elements, appState) => {
    // The strokes are the original input; the PNG sent to the grader is only
    // a rendering of them, so it is not stored.
    const strokes = encodeStrokes(strokeLogRef.current);
    persistData({ elements, appState, version: nextVersion, strokes });

    let result;
    try {
      result = await verifySketchImage({
        expected: expect,
        imageBase64: justBase64,
      });
    } catch (error) {
      console.error(error);
      result = { error: error.message };
    }

    // Report the drawing and the grade in the same tick so the parent stores
    // both in one save.
    onDrawingSaved?.({ strokes, result });
    setFeedback(result);
  };

  const handleCancelSubmission = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
    setCountdown(null);
    setImageData(null); // Clear the image so user can draw again
  };

  const submitCurrentDrawing = async () => {
    const elements = excalidrawRef.current.elements;
    const appState = excalidrawRef.current.state;
    const files = excalidrawAPI?.getFiles();
    if (!elements || elements.length === 0) return;

    const { exportToCanvas } = await loadExcalidraw();
    const canvas = await exportToCanvas({ elements, appState, files });
    const dataUrl = await canvas.toDataURL("image/png");
    const justBase64 = dataUrl.split(",")[1];

    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setCountdown(null);
    setImageData(justBase64);
    await submitDrawing(justBase64, elements, appState);
    setIsHovering(false);
  };

  const startSubmissionCountdown = (justBase64, elements, appState) => {
    setCountdown(10);

    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          // Submit the drawing
          submitDrawing(justBase64, elements, appState);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const queueCurrentDrawing = async () => {
    const elements = excalidrawRef.current.elements;
    const appState = excalidrawRef.current.state;
    const files = excalidrawAPI?.getFiles();
    if (!elements || elements.length === 0) return;

    const { exportToCanvas } = await loadExcalidraw();
    const canvas = await exportToCanvas({ elements, appState, files });
    const dataUrl = await canvas.toDataURL("image/png");
    const justBase64 = dataUrl.split(",")[1];

    setImageData(justBase64);
    setIsHovering(false);
    startSubmissionCountdown(justBase64, elements, appState);
  };

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (excalidrawAPI) {
      // Auto-select the pencil (freedraw) tool and update app state
      excalidrawAPI.updateScene({
        appState: {
          viewModeEnabled: false,
          zenModeEnabled: true,
          gridSize: null,
          activeTool: {
            type: "freedraw",
            locked: false,
          },
          currentItemStrokeColor: "#000000",
          currentItemBackgroundColor: "transparent",
        },
      });

      // Also explicitly set the active tool
      setTimeout(() => {
        excalidrawAPI.setActiveTool({ type: "freedraw" });
      }, 100);
    }
  }, [excalidrawAPI]);

  // render canvas when not hovering, excalidraw when hovering
  if (!isHovering) {
    return (
      <ExerciseResponsePanel
        ref={drawingPanelRef}
        countdown={countdown}
        onCancel={handleCancelSubmission}
        onSubmit={
          countdown === null ? queueCurrentDrawing : submitCurrentDrawing
        }
        submitDisabled={!excalidrawRef.current.elements?.length}
        sx={{
          m: 2,
          maxWidth: 640,
        }}
        onMouseEnter={() => {
          loadExcalidraw().catch((error) => {
            console.warn("Unable to preload drawing editor:", error);
          });
        }}
      >
        <div
          onMouseEnter={() => {
            if (imageData) {
              return;
            }
            setIsHovering(true);
          }}
          style={{
            height: "240px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: "#f9f9f9",
            minHeight: "240px",
            maxWidth: "100%",
          }}
        >
          {imageData ? (
            <img
              src={`data:image/png;base64,${imageData}`}
              alt={t("sketchPad.sketchAlt")}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("sketchPad.hoverToStartDrawing")}
            </Typography>
          )}
        </div>
      </ExerciseResponsePanel>
    );
  } else {
    return (
      <ExerciseResponsePanel
        ref={drawingPanelRef}
        countdown={countdown}
        onCancel={handleCancelSubmission}
        onSubmit={
          countdown === null ? queueCurrentDrawing : submitCurrentDrawing
        }
        submitDisabled={!excalidrawRef.current.elements?.length}
        sx={{
          m: 2,
          maxWidth: 640,
        }}
      >
        <Box
          onMouseLeave={async () => {
            const elements = excalidrawRef.current.elements;

            // Check if anything was drawn - if not, just close without submitting
            if (!elements || elements.length === 0) {
              setIsHovering(false);
              return;
            }
            await queueCurrentDrawing();
          }}
          sx={{
            height: 240,
            width: "100%",
            position: "relative",
            boxSizing: "border-box",
            transition: "border-color 180ms ease",
            "& .App-menu_top, & .App-menu_bottom, & .App-toolbar, & .FixedSideContainer, & .Island, & .Sidebar, & .HelpDialog":
              {
                display: "none !important",
              },
            "& .excalidraw": {
              "--ui-font-family": "inherit",
            },
          }}
        >
          <Suspense
            fallback={
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
                sx={{ borderRadius: "4px" }}
              />
            }
          >
            <LazyExcalidraw
              initialData={{
                ...excalidrawData,
                // Reopening the pad (for example after cancelling the
                // countdown) keeps the strokes drawn so far.
                elements: excalidrawRef.current.elements?.length
                  ? excalidrawRef.current.elements
                  : excalidrawData?.elements,
                appState: {
                  ...excalidrawData?.appState,
                  activeTool: {
                    type: FREEDRAW_TOOL,
                    locked: false,
                  },
                },
              }}
              onChange={(elements, state) => {
                excalidrawRef.current = { elements, state };
                updateStrokeLog(strokeLogRef.current, elements, Date.now());
              }}
              clearCanvas={true}
              autoFocus={true}
              excalidrawAPI={(api) => {
                setExcalidrawAPI(api);
              }}
              UIOptions={{
                canvasActions: {
                  changeViewBackgroundColor: false,
                  clearCanvas: false,
                  export: false,
                  loadScene: false,
                  saveToActiveFile: false,
                  theme: false,
                  saveAsImage: false,
                },
                dockedSidebarBreakpoint: Infinity,
                welcomeScreen: false,
                tools: {
                  image: false,
                  text: false,
                  arrow: false,
                  line: false,
                  rectangle: false,
                  diamond: false,
                  ellipse: false,
                  freedraw: true,
                  selection: false,
                  eraser: true,
                },
                mainMenu: [],
              }}
              viewModeEnabled={false}
              theme={mode === "dark" ? "dark" : "light"}
              zenModeEnabled={true}
              gridModeEnabled={false}
            ></LazyExcalidraw>
          </Suspense>
        </Box>
      </ExerciseResponsePanel>
    );
  }
};

export default SketchPad;
