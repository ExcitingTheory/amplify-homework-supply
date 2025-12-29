/**
 * @fileoverview DataPlugin - Synchronizes editor state with unit data.
 * @module DataPlugin
 * 
 * Loads and syncs the editor content from unit data stored in the database.
 * Prevents unnecessary re-renders by tracking data versions.
 */

import React, { useRef } from "react";
import { useEffect, useContext } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';


export default function DataPlugin() {

    const { unit, editorSelectionRef } = useContext(UnitContext);
    const [editor] = useLexicalComposerContext();

    const previousData = useRef(null);
    const unitVersionRef = useRef(null);
    const isInitializedRef = useRef(false);
  
    useEffect(() => {
        // Guard: ensure unit has data with root node
        if (!unit?.data?.root) {
            console.log('[DataPlugin] No unit data or root found');
            return;
        }
        
        // Parse data if it's a string, otherwise use as-is
        let parsedData;
        if (typeof unit.data === 'string') {
            try {
                parsedData = JSON.parse(unit.data);
            } catch (e) {
                console.error('DataPlugin: Failed to parse unit.data', e);
                return;
            }
        } else {
            parsedData = unit.data;
        }
        
        const data = JSON.stringify(parsedData);
        const unitVersion = unit._version;
        
        console.log('[DataPlugin] Checking unit data, version:', unitVersion, 'has data:', !!parsedData.root.children);
        
        // Skip if data hasn't changed
        if (data === previousData.current && unitVersion === unitVersionRef.current) {
            console.log('[DataPlugin] Data unchanged, skipping');
            return;
        }
        
        const currentState = editor.getEditorState();
        const currentStateStr = JSON.stringify(currentState);
        
        // Skip if editor already has this state
        if (data === currentStateStr) {
            console.log('[DataPlugin] Editor already has this state');
            previousData.current = data;
            unitVersionRef.current = unitVersion;
            isInitializedRef.current = true;
            return;
        }

        previousData.current = data;
        unitVersionRef.current = unitVersion;
                
        // Use editor.update instead of setTimeout for proper Lexical state management
        try {
            const _editorState = editor.parseEditorState(data);
            
            // Validate the editor state has content
            const stateJSON = _editorState.toJSON();
            const rootChildren = stateJSON?.root?.children;
            
            console.log('[DataPlugin] Parsed state, children count:', rootChildren?.length || 0);
            
            if (!rootChildren || rootChildren.length === 0) {
                console.warn('[DataPlugin] Parsed editor state is empty, but continuing anyway');
            }
            
            if (editorSelectionRef.current) {
                _editorState.clone(editorSelectionRef.current);
            }

            console.log('[DataPlugin] Setting editor state');
            // Use queueMicrotask to avoid flushSync warning in React 18+
            queueMicrotask(() => {
                editor.setEditorState(_editorState);
                
                // Trigger a small update to ensure code highlighting is applied
                setTimeout(() => {
                    editor.update(() => {
                        // This empty update will trigger the update listeners
                        // which will cause CodeHighlightPlugin to re-process code blocks
                    });
                }, 50);
            });
            isInitializedRef.current = true;
        } catch (error) {
            console.error('DataPlugin: Error setting editor state', error);
        }
    }, [editor, unit]);

}