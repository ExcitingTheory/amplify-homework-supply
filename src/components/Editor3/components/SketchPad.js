import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useState, useEffect, useRef, useContext } from "react";
import { exportToCanvas } from "@excalidraw/excalidraw";
import { generateClient } from "aws-amplify/api";
import { verifyImage } from "../../../graphql/queries";
import { uploadStudentSubmission } from "../../../utils/userSubmissionStorage";
import UnitContext from "../../../context/unitContext";
import { Button, Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

const client = generateClient();
// TODO Add a version to the data so that we can update the data when the version is higher than the current working copy, which should be one above the last saved version

const SketchPad = ({ excalidrawData,
    persistData = () => {},
    expect,
    setFeedback,
    feedback,
    questionID
 }) => {
    const { t } = useTranslation('editor');
    const [isHovering, setIsHovering] = useState(false);
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [pendingSubmission, setPendingSubmission] = useState(null);
    const countdownTimer = useRef(null);
    
    const { grade } = useContext(UnitContext);

    const [_excalidrawData, setExcalidrawData] = useState(excalidrawData || {
        elements: [],
        appState: {},
        version: 0,
    });
    const canvasRef = useRef(null);
    const excalidrawRef = useRef(excalidrawData || {
        elements: [],
        appState: {},
        version: 0,
    });
    // const updateTimeout = useRef(null);
    // const { t } = useTranslation();
    // const theme = useTheme();

    const thisVersion = _excalidrawData.version;
    const nextVersion = thisVersion + 1;

    const exportCanvas = (elements, appState) => {
        console.log("exporting canvas");
        console.log("elements", elements);
        console.log("appState", appState);
        
        const canvas = exportToCanvas({
            elements,
            appState,
        });
        canvasRef.current = canvas;
    }

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
            persistData({ elements, appState, version: nextVersion  });
            exportCanvas(elements, appState);
        }
    }

    const submitDrawing = async (justBase64, elements, appState) => {
        // Always upload drawings to S3 with private storage
        if (grade && questionID) {
            try {
                console.log('[SketchPad] Uploading drawing to S3...');
                
                // Convert base64 to Blob
                const byteCharacters = atob(justBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/png' });
                const base64Size = justBase64.length * 0.75; // Approximate size in bytes
                
                // Upload to user-submissions storage
                const uploadResult = await uploadStudentSubmission({
                    file: blob,
                    gradeId: grade.id,
                    nodeKey: questionID,
                    fileType: 'png',
                    metadata: {
                        type: 'drawing',
                        expect: expect || '',
                    }
                });
                
                console.log('[SketchPad] Drawing uploaded:', uploadResult?.path);
                
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
                console.error('[SketchPad] S3 upload failed:', error);
            }
        }

        try {
            const response = await client.graphql({
                query: verifyImage,
                variables: {
                    expected: expect,
                    image: justBase64,
                    model: "gpt-4o",
                },
            });
            
            if (!response?.data?.verifyImage) {
                throw new Error('No response from verification API');
            }
            
            const mainData = JSON.parse(response.data.verifyImage);
            
            if (!mainData?.choices?.[0]?.message?.content) {
                throw new Error('Invalid API response format');
            }
            
            const data = JSON.parse(mainData.choices[0].message.content);
            
            setFeedback(data);
        } catch (error) {
            console.error(error);
            setFeedback({ error: error.message });
        }
    }

    const handleCancelSubmission = () => {
        if (countdownTimer.current) {
            clearInterval(countdownTimer.current);
        }
        setCountdown(null);
        setPendingSubmission(null);
        setImageData(null); // Clear the image so user can draw again
    }

    const startSubmissionCountdown = (justBase64, elements, appState) => {
        setPendingSubmission({ justBase64, elements, appState });
        setCountdown(10);
        
        countdownTimer.current = setInterval(() => {
            setCountdown(prev => {
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
    }

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
            excalidrawAPI.setActiveTool({ type: "freedraw" });
            // Update app state to hide UI elements
            excalidrawAPI.updateScene({
                appState: {
                    viewModeEnabled: false,
                    zenModeEnabled: true,
                    gridSize: null,
                }
            });
        }
    }, [excalidrawAPI]);

    // set excalidrawData to the initial data passed in
    useEffect(() => {
        setExcalidrawData(excalidrawData);
    }, []);

    // render canvas when not hovering, excalidraw when hovering
    if (!isHovering) {
        return (
        <Box>
            <div
                onMouseEnter={() => { 
                    if(imageData) {
                        return
                    }
                    setIsHovering(true);
                }}
                style={{
                    height: "400px", 
                    width: "600px",
                    border: "2px dashed #ccc",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#f9f9f9",
                }} 
            >
                {imageData ? (
                    <img src={`data:image/png;base64,${imageData}`} alt="sketch" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {t('sketchPad.hoverToStartDrawing')}
                    </Typography>
                )}
            </div>
            {countdown !== null && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3cd", borderRadius: 1, border: "1px solid #ffc107" }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        {t('sketchPad.submittingInSeconds', { countdown })}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="warning"
                        onClick={handleCancelSubmission}
                    >
                        {t('sketchPad.cancelSubmission')}
                    </Button>
                </Box>
            )}
        </Box>
        );
    } else {
        return (
        <div 
        onMouseLeave={async () => {
            const elements = excalidrawRef.current.elements;
            const appState = excalidrawRef.current.state;
            const files = excalidrawAPI?.getFiles();

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
        style={{ 
            height: "400px", 
            width: "600px",
            border: "3px solid #2196f3",
            borderRadius: "4px",
            boxShadow: "0 0 10px rgba(33, 150, 243, 0.5)",
            position: "relative",
            overflow: "hidden",
        }}>
            <Excalidraw
            initialData={excalidrawData}
            onChange={(elements, state) => {
                excalidrawRef.current = { elements, state };
            }}
            clearCanvas={true}
            autoFocus={true}
            excalidrawAPI={(api) => {
                setExcalidrawAPI(api)}}
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
                dockedSidebarBreakpoint: 0,
                welcomeScreen: false,
            }}
            viewModeEnabled={false}
            zenModeEnabled={false}
            gridModeEnabled={false}
            >
            </Excalidraw>
        </div>
        );
    }
}

export default SketchPad;
