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
  
    useEffect(() => {
        // Guard: ensure unit has data with root node
        if (!unit?.data?.root) {
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
        const unitVersion = unit?._version;
        
        // Skip if data hasn't changed
        if (data === previousData.current && unitVersion === unitVersionRef.current) return
        
        const currentState = editor.getEditorState();
        const currentStateStr = JSON.stringify(currentState);
        
        // Skip if editor already has this state
        if (data === currentStateStr) return

        previousData.current = data;
        unitVersionRef.current = unitVersion;
                
        setTimeout(() => {
            try {
                const _editorState = editor.parseEditorState(data);
                
                // Validate the editor state has content
                const stateJSON = _editorState.toJSON();
                const rootChildren = stateJSON?.root?.children;
                
                if (!rootChildren || rootChildren.length === 0) {
                    console.error('DataPlugin: Parsed editor state is empty');
                    return;
                }
                
                if (editorSelectionRef.current) {
                    _editorState.clone(editorSelectionRef.current);
                }

                editor.setEditorState(_editorState);
            } catch (error) {
                console.error('DataPlugin: Error setting editor state', error);
            }
        }, 0);
    }, [editor, unit?._version]);

}