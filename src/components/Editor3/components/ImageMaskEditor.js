import React, { useRef, useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Toolbar,
    Slider,
    Typography,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
} from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ClearIcon from '@mui/icons-material/Clear';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

/**
 * Image Mask Editor component for selecting areas of an image to regenerate
 * Allows user to paint a mask over parts of an image they want to change
 * Returns the mask data that can be sent with the regeneration request
 */
export default function ImageMaskEditor({
    imageUrl,
    onMaskComplete,
    onCancel,
    width = 800,
    height = 600,
}) {
    const canvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!canvas || !maskCanvas || !imageUrl) return;
        
        const ctx = canvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');
        
        // Load and draw the image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            maskCanvas.width = img.width;
            maskCanvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            // Initialize mask canvas with transparent background
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            // Save initial state
            saveToHistory();
        };
        img.src = imageUrl;
    }, [imageUrl]);
    
    const saveToHistory = () => {
        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas) return;
        
        const imageData = maskCanvas.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };
    
    const undo = () => {
        if (historyIndex <= 0) return;
        
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        
        const maskCanvas = maskCanvasRef.current;
        const maskCtx = maskCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            maskCtx.drawImage(img, 0, 0);
        };
        img.src = history[newIndex];
    };
    
    const redo = () => {
        if (historyIndex >= history.length - 1) return;
        
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        
        const maskCanvas = maskCanvasRef.current;
        const maskCtx = maskCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            maskCtx.drawImage(img, 0, 0);
        };
        img.src = history[newIndex];
    };
    
    const clearMask = () => {
        const maskCanvas = maskCanvasRef.current;
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        saveToHistory();
    };
    
    const getCanvasPoint = (e) => {
        const canvas = maskCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Account for zoom and pan
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        
        return { x, y };
    };
    
    const startDrawing = (e) => {
        if (e.shiftKey) {
            // Shift key for panning
            setIsPanning(true);
            setLastPanPoint({ x: e.clientX, y: e.clientY });
            return;
        }
        
        setIsDrawing(true);
        const point = getCanvasPoint(e);
        draw(point.x, point.y, false);
    };
    
    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
        setIsPanning(false);
    };
    
    const handleMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - lastPanPoint.x;
            const dy = e.clientY - lastPanPoint.y;
            setPanOffset({
                x: panOffset.x + dx,
                y: panOffset.y + dy,
            });
            setLastPanPoint({ x: e.clientX, y: e.clientY });
            return;
        }
        
        if (!isDrawing) return;
        
        const point = getCanvasPoint(e);
        draw(point.x, point.y, true);
    };
    
    const draw = (x, y, continuous) => {
        const maskCanvas = maskCanvasRef.current;
        const maskCtx = maskCanvas.getContext('2d');
        
        maskCtx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        maskCtx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red for mask
        
        if (continuous) {
            maskCtx.lineTo(x, y);
            maskCtx.stroke();
        } else {
            maskCtx.beginPath();
            maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            maskCtx.fill();
            maskCtx.beginPath();
            maskCtx.moveTo(x, y);
            maskCtx.lineWidth = brushSize;
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
        }
    };
    
    const handleZoomIn = () => {
        setZoom(Math.min(zoom * 1.2, 5));
    };
    
    const handleZoomOut = () => {
        setZoom(Math.max(zoom / 1.2, 0.2));
    };
    
    const handleComplete = () => {
        const maskCanvas = maskCanvasRef.current;
        
        // Convert mask to image data
        const maskData = maskCanvas.toDataURL('image/png');
        
        // Also provide the original canvas for context
        const imageCanvas = canvasRef.current;
        const imageData = imageCanvas.toDataURL('image/png');
        
        onMaskComplete({
            mask: maskData,
            image: imageData,
        });
    };
    
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <Toolbar sx={{ gap: 2, flexWrap: 'wrap', bgcolor: 'background.paper' }}>
                <ToggleButtonGroup
                    value={tool}
                    exclusive
                    onChange={(e, value) => value && setTool(value)}
                    size="small"
                >
                    <ToggleButton value="brush">
                        <BrushIcon />
                    </ToggleButton>
                    <ToggleButton value="eraser">
                        <ClearIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
                
                <Box sx={{ width: 200 }}>
                    <Typography variant="caption" gutterBottom>
                        Brush Size: {brushSize}
                    </Typography>
                    <Slider
                        value={brushSize}
                        onChange={(e, value) => setBrushSize(value)}
                        min={5}
                        max={100}
                        size="small"
                    />
                </Box>
                
                <Tooltip title="Undo">
                    <span>
                        <IconButton
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            size="small"
                        >
                            <UndoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                
                <Tooltip title="Redo">
                    <span>
                        <IconButton
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            size="small"
                        >
                            <RedoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                
                <Tooltip title="Clear mask">
                    <IconButton onClick={clearMask} size="small">
                        <ClearIcon />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Zoom in">
                    <IconButton onClick={handleZoomIn} size="small">
                        <ZoomInIcon />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Zoom out">
                    <IconButton onClick={handleZoomOut} size="small">
                        <ZoomOutIcon />
                    </IconButton>
                </Tooltip>
                
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                    Zoom: {(zoom * 100).toFixed(0)}% | Hold Shift to pan
                </Typography>
            </Toolbar>
            
            {/* Canvas container */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    position: 'relative',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        cursor: isPanning ? 'grabbing' : tool === 'brush' ? 'crosshair' : 'pointer',
                        transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        transformOrigin: 'center',
                    }}
                >
                    {/* Original image canvas */}
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            maxWidth: width,
                            maxHeight: height,
                        }}
                    />
                    
                    {/* Mask overlay canvas */}
                    <canvas
                        ref={maskCanvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={handleMouseMove}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            maxWidth: width,
                            maxHeight: height,
                        }}
                    />
                </Box>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end', bgcolor: 'background.paper' }}>
                <Button onClick={onCancel} variant="outlined">
                    Cancel
                </Button>
                <Button onClick={handleComplete} variant="contained">
                    Apply Mask & Regenerate
                </Button>
            </Box>
            
            {/* Instructions */}
            <Box sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography variant="caption">
                    <strong>Instructions:</strong> Paint over the areas you want to regenerate. 
                    Use the eraser to remove parts of the mask. Hold Shift and drag to pan. 
                    Use zoom buttons to get closer detail.
                </Typography>
            </Box>
        </Box>
    );
}
