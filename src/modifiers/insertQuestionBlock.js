'use strict';

import {
  AtomicBlockUtils,
  EditorState,
} from 'draft-js';

let count = 0;
const examples = [
  [
    {answer: "This text", correct: true},
    {answer: "Some text", correct: false},
    {answer: "Some text", correct: false}
  ],
  [
    {answer: "Some text again", correct: true},
    {answer: "Not this one", correct: false}
  ],
  [
    {answer: "Another interesting option", correct: true}
  ]
];



// var selectionState = editorState.getSelection();
// var anchorKey = selectionState.getAnchorKey();
// var currentContent = editorState.getCurrentContent();
// var currentContentBlock = currentContent.getBlockForKey(anchorKey);
// var start = selectionState.getStartOffset();
// var end = selectionState.getEndOffset();
// var selectedText = currentContentBlock.getText().slice(start, end);

export function insertQuestionBlock(editorState) {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();
  const nextFormula = count++ % examples.length;
  const contentStateWithEntity = contentState.createEntity(
    'TOKEN',
    'IMMUTABLE',
    {content: examples[nextFormula]},
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const newEditorState = EditorState.set(
    editorState,
    {currentContent: contentStateWithEntity},
  );
  return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');

}
