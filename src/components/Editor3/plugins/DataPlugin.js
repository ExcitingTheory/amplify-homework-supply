import React, { useRef } from "react";
import { useEffect, useContext, usePrevious } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';
import { $setSelection } from "lexical";


export default function DataPlugin() {

    const { unit, editorSelectionRef } = useContext(UnitContext);
    const [editor] = useLexicalComposerContext();

    const data = JSON.stringify(unit?.data);
    const previousData = useRef(null);
  
    useEffect(() => {
        console.log('DataPlugin useEffect', data)

        if (!unit?.data?.root) return
        if (data === previousData.current) return
        const currentState = editor.getEditorState();
        if (data === JSON.stringify(currentState)) return

        previousData.current = data;
                
        setTimeout(() => {
            const _editorState = editor.parseEditorState(data);

            console.log('DataPlugin setTimeout', _editorState)
            
            if (editorSelectionRef.current) {
                _editorState.clone(editorSelectionRef.current);
            }

            editor.setEditorState(_editorState);
        });
    }, [data, editor, unit?.data?.root]);

}