/**
 * @fileoverview DataPlugin - Initial load and version checking.
 * @module DataPlugin
 * 
 * Handles initial editor state load from unit data.
 * After initial load, only checks version numbers from subscription updates.
 * Ignores updates where version <= current version (our own saves coming back).
 */

import React, { useRef } from "react";
import { useEffect, useContext } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';


export default function DataPlugin() {

    const { unit, versionRef } = useContext(UnitContext);
    const [editor] = useLexicalComposerContext();
    const hasLoadedInitialState = useRef(false);
  
    useEffect(() => {
        if (!unit?.data?.root) {
            return;
        }
        
        const unitVersion = unit._version;
        
        // Parse data if it's a string, otherwise use as-is
        let parsedData;
        if (typeof unit.data === 'string') {
            try {
                parsedData = JSON.parse(unit.data);
            } catch (e) {
                console.error('[DataPlugin] Failed to parse unit.data', e);
                return;
            }
        } else {
            parsedData = unit.data;
        }
        
        const data = JSON.stringify(parsedData);
        
        // INITIAL LOAD ONLY - first time seeing data with root
        if (!hasLoadedInitialState.current) {
            console.log('[DataPlugin] Initial load of unit data, version:', unitVersion);
            
            try {
                const editorState = editor.parseEditorState(data);
                
                queueMicrotask(() => {
                    editor.setEditorState(editorState, { tag: 'initial-load' });
                });
                
                hasLoadedInitialState.current = true;
                versionRef.current = unitVersion;
            } catch (error) {
                console.error('[DataPlugin] Error setting initial editor state', error);
            }
            return;
        }
        
        // AFTER INITIAL LOAD - only check versions, ignore same/older
        if (unitVersion <= versionRef.current) {
            console.log('[DataPlugin] Ignoring subscription update - version same or older:', unitVersion, 'current:', versionRef.current);
            return;
        }
        
        // Newer version from external source (another device/user)
        console.log('[DataPlugin] Newer version detected from external source:', unitVersion, 'current:', versionRef.current);
        // Don't apply it - just log for now
        
    }, [editor, unit, versionRef]);

    return null;
}