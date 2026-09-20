import { lazy, Suspense, useState, useEffect, useRef, useContext } from "react";
import "@excalidraw/excalidraw/index.css";
import { verifySketchImage } from "../../../../app/actions/grading";
import { uploadStudentSubmission } from "../../../utils/userSubmissionStorage";
import UnitContext from "../../../context/unitContext";
import { Button, Box, Typography, Skeleton } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";

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
}) => {
  const t = useTranslations("editor.shared");
  const { mode } = useColorScheme();
  const [isHovering, setIsHovering] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);
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
    // Always upload drawings to S3 with private storage
    if (grade && questionID) {
      try {
        console.log("[SketchPad] Uploading drawing to S3...");

        // Convert base64 to Blob
        const byteCharacters = atob(justBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        const base64Size = justBase64.length * 0.75; // Approximate size in bytes

        // Upload to user-submissions storage
        const uploadResult = await uploadStudentSubmission({
          file: blob,
          gradeId: grade.id,
          nodeKey: questionID,
          fileType: "png",
          metadata: {
            type: "drawing",
            expect: expect || "",
          },
        });

        console.log("[SketchPad] Drawing uploaded:", uploadResult?.path);

        // Store S3 path in persistData
        // This will be picked up by the parent component to update grade.files[]
        if (uploadResult?.path) {
          persistData({
            elements,
            appState,
            version: nextVersion,
            s3Path: uploadResult.path,
            imageSize: base64Size,
          });
        }
      } catch (error) {
        console.error("[SketchPad] S3 upload failed:", error);
      }
    }

    try {
      const feedbackData = await verifySketchImage({
        expected: expect,
        imageBase64: justBase64,
      });

      setFeedback(feedbackData);
    } catch (error) {
      console.error(error);
      setFeedback({ error: error.message });
    }
  };

  const handleCancelSubmission = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
    setCountdown(null);
    setPendingSubmission(null);
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
    setPendingSubmission(null);
    setImageData(justBase64);
    await submitDrawing(justBase64, elements, appState);
    setIsHovering(false);
  };

  const startSubmissionCountdown = (justBase64, elements, appState) => {
    setPendingSubmission({ justBase64, elements, appState });
    setCountdown(10);

    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          // Submit the drawing
          submitDrawing(justBase64, elements, appState);
          setPendingSubmission(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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

  // set excalidrawData to the initial data passed in
  useEffect(() => {
    setExcalidrawData(excalidrawData);
  }, []);

  // render canvas when not hovering, excalidraw when hovering
  if (!isHovering) {
    return (
      <Box
        ref={drawingPanelRef}
        sx={{
          m: 2,
          position: "relative",
          width: "100%",
          maxWidth: 640,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          overflow: "hidden",
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
            border: "2px dashed #ccc",
            borderRadius: "4px",
            border: "2px solid #ccc", // Restore the outer panel border in active drawing mode
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
              alt="sketch"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("sketchPad.hoverToStartDrawing")}
            </Typography>
          )}
        </div>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            p: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {countdown !== null ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={handleCancelSubmission}
                >
                  {`${t("sketchPad.cancelSubmission")} ${countdown}`}
                </Button>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Drawing ready to submit.
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={submitCurrentDrawing}
            disabled={!excalidrawRef.current.elements?.length}
          >
            Submit
          </Button>
        </Box>
      </Box>
    );
  } else {
    return (
      <Box
        ref={drawingPanelRef}
        sx={{
          m: 2,
          position: "relative",
          width: "100%",
          maxWidth: 640,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Box
          onMouseLeave={async () => {
            const elements = excalidrawRef.current.elements;
            const appState = excalidrawRef.current.state;
            const files = excalidrawAPI?.getFiles();

            // Check if anything was drawn - if not, just close without submitting
            if (!elements || elements.length === 0) {
              setIsHovering(false);
              return;
            }

            const { exportToCanvas } = await loadExcalidraw();
            const canvas = await exportToCanvas({
              elements,
              appState,
              files,
            });

            const dataUrl = await canvas.toDataURL("image/png");
            const justBase64 = dataUrl.split(",")[1];
            setImageData(justBase64);
            setIsHovering(false);

            // Start 10-second countdown before submitting
            startSubmissionCountdown(justBase64, elements, appState);
          }}
          sx={{
            height: 240,
            width: "100%",
            position: "relative",
            p: 0.5,
            boxSizing: "border-box",
            border: "2px dashed white",
            borderRadius: 1,
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
                appState: {
                  ...excalidrawData?.appState,
                  activeTool: {
                    type: "freedraw",
                    locked: false,
                  },
                },
              }}
              onChange={(elements, state) => {
                excalidrawRef.current = { elements, state };
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            p: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {countdown !== null ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={handleCancelSubmission}
                >
                  {`${t("sketchPad.cancelSubmission")} ${countdown}`}
                </Button>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Draw your answer, then submit when ready.
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={submitCurrentDrawing}
            disabled={!excalidrawRef.current.elements?.length}
          >
            Submit
          </Button>
        </Box>
      </Box>
    );
  }
};

export default SketchPad;
