'use strict';
import React from 'react';
import { AuthModeStrategyType, DataStore } from 'aws-amplify/datastore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import { FileDownload, Refresh, Search, UploadFile, UnfoldMore as UnfoldMoreIcon, UnfoldLess as UnfoldLessIcon, ExpandMore, ExpandLess, SelectAll, Deselect, Description } from '@mui/icons-material';
import FilesContext from '../context/fileContext';
import QuestionContext from '../context/dictionaryContext';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import SearchIcon from '@mui/icons-material/Search';
import { Collapse, Dialog, DialogTitle, DialogContent, Menu, MenuItem, Checkbox, Tooltip, Divider } from '@mui/material';

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode,
  ElementNode,
  NodeKey,
  LexicalNode,
  SerializedElementNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  $isTextNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  $createRangeSelection,
  $getNodeByKey,
  TextFormatType
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import LanguageEditorTheme from './Editor3/components/LanguageEditorTheme';
import { DisplayOrEditAnswer } from './DisplayOrEditAnswer';
import { DisplayOrEditPrompt } from './DisplayOrEditPrompt';
import { DisplayOrEditHint } from './DisplayOrEditHint';

import { createHash } from 'crypto';
import { Question } from '../models';

import CircularProgress from '@mui/material/CircularProgress';

import { uploadData, remove as _remove } from 'aws-amplify/storage';
import getCachedUrl from '../utils/getCachedUrl';
import UnitContext from '../context/unitContext';

import { generateAudioFile } from '../graphql/mutations';

import { generateClient } from 'aws-amplify/api';
import { hexToRgb } from '../utils/hexToRgb';
import DictionaryContext from '../context/dictionaryContext';

const client = generateClient();

// Custom Field Node Types
class QuestionFieldNode extends ElementNode {
  __fieldType;
  __fieldValue;
  __questionId;

  static getType() {
    return 'question-field';
  }

  static clone(node) {
    return new QuestionFieldNode(
      node.__fieldType,
      node.__fieldValue,
      node.__questionId,
      node.__key
    );
  }

  constructor(fieldType, fieldValue = '', questionId, key) {
    super(key);
    this.__fieldType = fieldType;
    this.__fieldValue = fieldValue;
    this.__questionId = questionId;
  }

  getFieldType() {
    return this.__fieldType;
  }

  getFieldValue() {
    return this.__fieldValue;
  }

  getQuestionId() {
    return this.__questionId;
  }

  setFieldValue(value) {
    const writable = this.getWritable();
    writable.__fieldValue = value;
  }

  createDOM(config) {
    const dom = document.createElement('div');
    dom.className = `question-field question-field-${this.__fieldType}`;
    
    // Apply field-specific styles
    if (this.__fieldType === 'hint') {
      dom.style.fontSize = '0.8125rem';
      dom.style.fontStyle = 'italic';
      dom.style.color = '#666';
    } else {
      dom.style.fontSize = '0.875rem';
    }
    
    dom.style.padding = '4px 8px';
    dom.style.minHeight = '1.2rem';
    dom.style.border = '1px solid transparent';
    dom.style.borderRadius = '4px';
    dom.style.margin = '2px 0';
    
    return dom;
  }

  updateDOM(prevNode, dom) {
    return false;
  }

  static importJSON(serializedNode) {
    const { fieldType, fieldValue, questionId } = serializedNode;
    return new QuestionFieldNode(fieldType, fieldValue, questionId);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      fieldType: this.__fieldType,
      fieldValue: this.__fieldValue,
      questionId: this.__questionId,
      type: 'question-field',
      version: 1,
    };
  }

  getTextContent() {
    return this.__fieldValue;
  }

  canBeEmpty() {
    return true;
  }

  isInline() {
    return false;
  }
}

function $createQuestionFieldNode(fieldType, fieldValue, questionId) {
  const node = new QuestionFieldNode(fieldType, fieldValue, questionId);
  const textNode = $createTextNode(fieldValue || '');
  node.append(textNode);
  return node;
}

function $isQuestionFieldNode(node) {
  return node instanceof QuestionFieldNode;
}

// Lexical editor configuration
function onError(error) {
  console.error('Lexical editor error:', error);
}

const initialConfig = {
  namespace: 'QuestionEditor',
  theme: {
    ...LanguageEditorTheme,
    questionField: {
      prompt: 'question-field-prompt',
      hint: 'question-field-hint',
      answer: 'question-field-answer',
    },
  },
  nodes: [QuestionFieldNode],
  onError,
};

// Plugin to manage all question fields in a single editor
function UnifiedQuestionPlugin({ question, fieldsToShow = ['prompt', 'hint', 'answer'], onSave, sharedHistory }) {
  const [editor] = useLexicalComposerContext();
  const [focusedField, setFocusedField] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const saveTimeoutRef = React.useRef(null);
  const currentVersionRef = React.useRef(null);
  const currentQuestionIdRef = React.useRef(null);
  const pendingChangesRef = React.useRef(false);
  
  // Initialize editor content when question changes
  React.useEffect(() => {
    if (!question || isEditing) return;

    // Check if this is a different question or a newer version
    const questionId = question.id;
    const questionVersion = question._version;
    
    const isDifferentQuestion = currentQuestionIdRef.current !== questionId;
    const isNewerVersion = questionVersion > (currentVersionRef.current + 1);
    
    // Only update if it's a different question or a significantly newer version
    if (isDifferentQuestion || isNewerVersion) {
      console.log('Updating editor content:', {
        questionId,
        questionVersion,
        currentVersion: currentVersionRef.current,
        isDifferentQuestion,
        isNewerVersion
      });
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Create field nodes only for requested fields
        if (fieldsToShow.includes('prompt')) {
          const promptNode = $createQuestionFieldNode('prompt', question.prompt || '', question.id);
          root.append(promptNode);
        }
        if (fieldsToShow.includes('hint')) {
          const hintNode = $createQuestionFieldNode('hint', question.hint || '', question.id);
          root.append(hintNode);
        }
        if (fieldsToShow.includes('answer')) {
          const answerNode = $createQuestionFieldNode('answer', question.answer || '', question.id);
          root.append(answerNode);
        }
      });
      
      // Update our version tracking
      currentVersionRef.current = questionVersion;
      currentQuestionIdRef.current = questionId;
    } else {
      console.log('Skipping editor update - version not newer:', {
        questionId,
        questionVersion,
        currentVersion: currentVersionRef.current
      });
    }
  }, [question, editor, isEditing, fieldsToShow]);
  
  // Handle field focus and data synchronization
  React.useEffect(() => {
    const handleNodeChange = () => {
      if (!isEditing) return;
      
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        const updates = {};
        children.forEach((child) => {
          if ($isQuestionFieldNode(child)) {
            const fieldType = child.getFieldType();
            // Get text content from child text nodes, not the field node itself
            let textContent = '';
            const childNodes = child.getChildren();
            childNodes.forEach((textNode) => {
              if ($isTextNode(textNode)) {
                textContent += textNode.getTextContent();
              }
            });
            updates[fieldType] = textContent;
          }
        });
        
        // Save all field updates with optimistic version increment
        if (Object.keys(updates).length > 0) {
          // Increment version optimistically to prevent stale data overwrites
          if (currentVersionRef.current !== null) {
            currentVersionRef.current += 1;
          }
          onSave(updates);
        }
      });
    };
    
    const handleFocus = () => {
      setIsEditing(true);
      // Clear any pending save timeout when user starts editing
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
    
    const handleBlur = () => {
      setIsEditing(false);
      
      // Save immediately on blur if there are pending changes
      if (pendingChangesRef.current) {
        // Clear any pending timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        
        // Trigger immediate save
        handleNodeChange();
        pendingChangesRef.current = false;
      }
    };

    // Also set up a debounced save on content change
    const handleContentChange = () => {
      if (!isEditing) return;
      
      pendingChangesRef.current = true;
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout to save after 800ms of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        handleNodeChange();
        pendingChangesRef.current = false;
        saveTimeoutRef.current = null;
      }, 800);
    };
    
    const removeListener = editor.registerRootListener((rootElement) => {
      if (rootElement) {
        rootElement.addEventListener('focus', handleFocus, true);
        rootElement.addEventListener('blur', handleBlur, true);
        return () => {
          rootElement.removeEventListener('focus', handleFocus, true);
          rootElement.removeEventListener('blur', handleBlur, true);
        };
      }
    });

    // Register content change listener for auto-save
    const removeUpdateListener = editor.registerUpdateListener(({editorState}) => {
      handleContentChange();
    });

    return () => {
      removeListener();
      removeUpdateListener();
      // Clear any pending save timeout when component unmounts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, isEditing, onSave]);
  
  return null;
}

// Shared history context for unified editing experience
const SharedHistoryContext = React.createContext();

// Unified question editor component with custom field nodes
function UnifiedQuestionEditor({ question, searchTerm, fieldsToShow = ['prompt', 'hint', 'answer'], sx = {}, sharedHistory }) {
  const contentEditableRef = React.useRef(null);
  const [isEditorFocused, setIsEditorFocused] = React.useState(false);
  
  const handleSave = async (updates) => {
    try {
      console.log('Saving question updates:', updates);
      await DataStore.save(
        Question.copyOf(question, (updated) => {
          Object.keys(updates).forEach(field => {
            updated[field] = updates[field];
          });
        })
      );
      console.log('Question saved successfully');
    } catch (error) {
      console.error('Error saving question:', error);
      // You might want to show a toast notification here
    }
  };

  // Check if any field matches the search
  const hasMatch = searchTerm && (
    (question?.prompt && question.prompt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (question?.hint && question.hint.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (question?.answer && question.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  console.log('UnifiedQuestionEditor - searchTerm:', searchTerm, 'hasMatch:', hasMatch, 'question:', question?.prompt);
  
  return (
    <Box 
      className="unified-editor-container"
      ref={contentEditableRef}
      sx={{
        border: '1px solid transparent',
        borderRadius: 1,
        minHeight: fieldsToShow.length > 1 ? '4rem' : '1.5rem',
        cursor: 'text',
        position: 'relative',
        '&:hover': {
          border: '1px solid',
          borderColor: 'divider',
        },
        '&:focus-within': {
          border: '1px solid',
          borderColor: 'primary.main',
        },
        '& .question-field': {
          margin: '2px 0',
          padding: '4px 8px',
          borderRadius: '4px',
          minHeight: '1.2rem',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '&:focus-within': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            border: '1px solid',
            borderColor: 'primary.main',
          },
        },
        '& .question-field-prompt': {
          fontSize: '0.875rem',
          fontWeight: 500,
          '&::before': {
            content: fieldsToShow.length > 1 ? '"Prompt: "' : '""',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
          },
        },
        '& .question-field-hint': {
          fontSize: '0.8125rem',
          fontStyle: 'italic',
          color: 'text.secondary',
          '&::before': {
            content: '"Hint: "',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
          },
        },
        '& .question-field-answer': {
          fontSize: '0.875rem',
          '&::before': {
            content: '"Answer: "',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
          },
        },
        ...sx
      }}
      onClick={(e) => {
        const contentEditable = e.currentTarget.querySelector('[contenteditable="true"]');
        if (contentEditable && !contentEditable.contains(e.target)) {
          contentEditable.focus();
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              style={{
                outline: 'none',
                padding: '8px',
                minHeight: fieldsToShow.length > 1 ? '4rem' : '1.2rem',
                cursor: 'text',
                width: '100%',
              }}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
            />
          }
          placeholder={
            <div style={{ 
              padding: '8px', 
              color: '#999', 
              fontSize: '0.875rem', 
              pointerEvents: 'none' 
            }}>
              {fieldsToShow.length > 1 ? 'Click to edit question fields...' : 'Question prompt...'}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <UnifiedQuestionPlugin question={question} fieldsToShow={fieldsToShow} onSave={handleSave} sharedHistory={sharedHistory} />
        {hasMatch && (
          <SearchHighlightPlugin searchTerm={searchTerm} />
        )}
      </LexicalComposer>
    </Box>
  );
}

// Search highlight plugin using Lexical's native text styling
function SearchHighlightPlugin({ searchTerm }) {
  const [editor] = useLexicalComposerContext();
  
  React.useEffect(() => {
    if (!searchTerm) {
      // Clear all highlighting when no search term
      editor.update(() => {
        const root = $getRoot();
        const textNodes = [];
        
        // Collect all text nodes
        function collectTextNodes(node) {
          if ($isTextNode(node)) {
            textNodes.push(node);
          } else if (node.getChildren) {
            node.getChildren().forEach(collectTextNodes);
          }
        }
        
        root.getChildren().forEach(collectTextNodes);
        
        // Remove highlight formatting from all text nodes
        textNodes.forEach(textNode => {
          if (textNode.hasFormat('highlight')) {
            const selection = $createRangeSelection();
            selection.setTextNodeRange(textNode, 0, textNode, textNode.getTextContentSize());
            $setSelection(selection);
            selection.formatText('highlight');
          }
        });
        
        $setSelection(null);
      });
      return;
    }
    
    // Apply highlighting when there's a search term
    editor.update(() => {
      const root = $getRoot();
      const textNodes = [];
      
      // Collect all text nodes
      function collectTextNodes(node) {
        if ($isTextNode(node)) {
          textNodes.push(node);
        } else if (node.getChildren) {
          node.getChildren().forEach(collectTextNodes);
        }
      }
      
      root.getChildren().forEach(collectTextNodes);
      
      // Clear previous highlighting first
      textNodes.forEach(textNode => {
        if (textNode.hasFormat('highlight')) {
          const selection = $createRangeSelection();
          selection.setTextNodeRange(textNode, 0, textNode, textNode.getTextContentSize());
          $setSelection(selection);
          selection.formatText('highlight');
        }
      });
      
      // Apply new highlighting to matching text
      const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      
      textNodes.forEach(textNode => {
        const text = textNode.getTextContent();
        let match;
        
        while ((match = searchRegex.exec(text)) !== null) {
          const startOffset = match.index;
          const endOffset = match.index + match[0].length;
          
          const selection = $createRangeSelection();
          selection.setTextNodeRange(textNode, startOffset, textNode, endOffset);
          $setSelection(selection);
          selection.formatText('highlight');
        }
      });
      
      $setSelection(null);
    });
    
  }, [editor, searchTerm]);
  
  return null;
}

// Legacy QuestionFieldEditor for backwards compatibility during transition
function QuestionFieldEditor({ question, field, placeholder, searchTerm, sx = {}, sharedHistory }) {
  // For now, use the unified editor but simulate individual field behavior
  return <UnifiedQuestionEditor question={question} searchTerm={searchTerm} sx={sx} sharedHistory={sharedHistory} />;
}

// Helper component to highlight search terms (kept for compatibility)
function HighlightedText({ text, searchTerm }) {
  if (!searchTerm || !text) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <Box
            key={i}
            component="span"
            sx={{
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
              fontWeight: 600,
              px: 0.5,
              borderRadius: 0.5,
            }}
          >
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Wrapper to add highlighting to any text content
function HighlightWrapper({ children, text, searchTerm }) {
  if (!searchTerm || !text || !text.toLowerCase().includes(searchTerm.toLowerCase())) {
    return children;
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      <style jsx>{`
        :global(.MuiTypography-root) {
          background: linear-gradient(transparent 60%, rgba(255, 235, 59, 0.3) 60%) !important;
        }
      `}</style>
    </Box>
  );
}

function getTextWidth(text) {
  const element = document.createElement('span');
  element.style.position = 'absolute';
  element.style.visibility = 'hidden';
  element.style.whiteSpace = 'nowrap';
  element.textContent = text;
  document.body.appendChild(element);
  const style = getComputedStyle(element);
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  document.body.removeChild(element);
  return metrics.width;
}

const deduplicateUrls = (urls) => {
  const set = new Set(urls);
  const newArr = Array.from(set);

  return newArr;
}

function QuestionListItem({ entry, i, audioFiles, setPresignedUrl, identityId, isExpanded, onToggleExpand, isEvenRow, searchTerm, isSelected, onToggleSelect, sharedHistory }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [audioFilesToUpload, setAudioFilesToUpload] = React.useState([]);

  const { unit } = React.useContext(UnitContext);


  const questionAudio = entry[1]?.audio || [];

  console.log('questionAudio', questionAudio);

  React.useEffect(() => {

    const asyncFunc = async () => {
      // when audio files change, upload them to S3
      // and update the entry in the database
      console.log('audioFilesToUpload', audioFilesToUpload);

      if (audioFilesToUpload.length === 0) {
        return;
      }

      const audioFileKeys = await Promise.allSettled(audioFilesToUpload.map(async (fileInput) => {
        const newFilename = `audio/${fileInput.file.name}`
        console.log('uploading newFilename', newFilename);
        console.log('uploading file', fileInput);
        console.log('fileOperations', fileOperations);

        const { file } = fileInput;

        // Upload a file with access level `guest` as  the equivalent of `public` in v5
        const result = await uploadData({
          key: newFilename,
          data: file,
          options:  {
            contentType: file.type,
            contentLength: file.size,
            identityId,
            accessLevel: 'protected',
            progressCallback(progress) {
              console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
  
              setFileOperations((prev) => {
                const newFileOperations = [...prev];
                newFileOperations[fileInput.index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                return newFileOperations;
              })
            }
          }
          }).result;
          console.log('result!!___', result);
          return result.key;
      }));

      let _urls = []

      audioFileKeys.forEach((promise) => {
        if (promise.status === 'fulfilled') {
          _urls.push(promise.value);
        }
      });


      console.log('audioFileKeys', audioFileKeys);

      const _eistingAudioUrls = entry[1].audio || [];

      const newAudioUrls = [..._eistingAudioUrls, ..._urls]

      console.log('newAudioUrls', newAudioUrls);

      if (_urls.length === 0) {
        return;
      }
      await DataStore.save(Question.copyOf(entry[1], (updated) => {
        updated.audio = newAudioUrls;
      }
      ));

      // await refreshAudioFiles();

      // timeout to allow for the UI to update, find a better way to do this
      setTimeout(() => {
        setAudioFilesToUpload([]);
        setFileOperations([]);
      }, 1000);
    };

    asyncFunc();

  }, [audioFilesToUpload]);

  // const audioUrls = entry?.audioUrls || [];

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (event) => {
    console.log('dropped');
    event.preventDefault();
    event.stopPropagation();

    console.log(event.dataTransfer.files);

    const files = Array.from(event.dataTransfer.files);

    console.log('files>>>>', files);

    const _toupload = files.map((f, index) => {
      return {
        file: f,
        index,
      }
    });

    const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));


    console.log('_toupload', _toupload);
    console.log('_fileOperations', _fileOperations);

    setAudioFilesToUpload(_toupload);
    setFileOperations(_fileOperations);

    setIsDragging(false);
  };

  if (!entry[1]) return null;
  console.log('            Object.entries(dictionary).map', entry);
  console.log('i', i);
  const answer = entry[1].answer;
  const prompt = entry[1].prompt;
  const hint = entry[1].hint;
  // const hasAudio = entry[1].audio?.length > 0;
  const audioUrls = entry[1].audio || [];
  // const audioFiles = entry[1].audioFiles

  console.log('audioUrls', audioUrls);

  let lookupMp3 = ''
  if (audioUrls.length > 0) {
    lookupMp3 = audioUrls[0];
    console.log('lookupMp3', lookupMp3);
    // TODO: handle multiple audio files, or just say you can have one and this is the history?

  }
  const mp3File = audioFiles[lookupMp3]?.key;

  // console.log('mp3File', mp3File)
  console.log('mp3File', mp3File);

  console.log('entry', entry);
  console.log('i', i);

  console.log('audioFiles', audioFiles);
  console.log('hint', hint);
  
  // Check if this question matches the search
  const matchesSearch = searchTerm && (
    (prompt && prompt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (answer && answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (hint && hint.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const hasAudio = audioUrls.length > 0;
  const hasFileOperations = fileOperations.length > 0;

  console.log('hasAudio', hasAudio);
  console.log('hasFileOperations', hasFileOperations);

  const liClassName = (hasAudio || hasFileOperations) ? 'noborder' : '';
  const operationsClassName = hasAudio ? 'noborder' : '';
  console.log('liClassName', liClassName);
  console.log('operationsClassName', operationsClassName, entry[1].prompt);

  const confirmDeleteQuestion = async (question) => {
    console.log('question', question);
    // possibly nicer modal with a cancel button?
    const confirmed = window.confirm(`Are you sure you want to delete ${question.prompt}?`);

    if (!confirmed) return;
      // for each audio file, delete it. 
      // what if the user has multiple audio files?
      // what if another user has audio files for this question?
      // then delete the question
      try {
        await DataStore.delete(question);
      } catch (error) {
        console.error(error);
      }
  };


  // List prompt, answer, and hint
  return <>
    <ListItem
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(e) => {
        console.log('onDragLeaveListItem');
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      ContainerProps={{
        className: liClassName,
      }}
      sx={{
        backgroundColor: isEvenRow ? 'background.paper' : 'grey.50',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 0,
        margin: 0,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
      key={i}>

      {/* Question Header Bar */}
      <Box
        sx={{
          backgroundColor: isEvenRow ? 'grey.100' : 'grey.200',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Controls Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 1,
            gap: 0,
            justifyContent: 'space-between',
            padding: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 24,
          }}
        >

                    <Box sx={{ display: 'flex', gap: 0, alignItems: 'center', flexShrink: 1 }}>


            <Checkbox
              size="small"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              sx={{ p: 0.25, flexShrink: 1 }}
            />
            <IconButton
              size="small"
              title={isExpanded ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(!isExpanded);
              }}
              sx={{ paddingLeft: 1, flexShrink: 1 }}
            >
              {!isExpanded ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
            {hasAudio && (
              <Typography variant="caption" color="primary.main">
                🎵 Audio
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Title Row */}
        <Box
          sx={{
            px: 2,
            py: 1,
            cursor: 'text',
          }}
          onClick={(e) => {
            // Check if click was on the editor content area
            const isEditorClick = e.target.closest('[contenteditable="true"]') || 
                                 e.target.closest('.editor-container');
            
            if (!isEditorClick && !isExpanded) {
              // Only expand if click was not on editor and not already expanded
              onToggleExpand(!isExpanded);
            }
            // Don't stop propagation - allow editor to handle its own clicks
          }}
        >
          <UnifiedQuestionEditor 
            question={entry[1]} 
            fieldsToShow={['prompt']}
            searchTerm={searchTerm}
            sharedHistory={sharedHistory}
            sx={{
              border: 'none',
              '&:hover': { border: 'none' },
              '&:focus-within': { border: 'none' },
            }}
          />
        </Box>
      </Box>

      {/* Question Content */}
      {isExpanded && (
        <Box sx={{ px: 2, py: 1.5, width: '100%' }}>
          {isDragging && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={(e) => {
              console.log('onDragLeavediv');
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            style={{
              color: '#000',
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 100,
              backgroundColor: 'rgb(255, 255, 255, 0.5)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {`Upload Ogg Audio for ${prompt} (${hint})`}
          </div>
        )}
        
        {/* Unified editor for all fields when expanded */}
        {isExpanded && (
          <Box sx={{ mb: 1 }}>
            <UnifiedQuestionEditor 
              question={entry[1]} 
              fieldsToShow={['hint', 'answer']}
              searchTerm={searchTerm}
              sharedHistory={sharedHistory}
            />
          </Box>
        )}
      </Box>
      )}
    </ListItem>
    

    {fileOperations.length > 0 &&
      fileOperations.map((op, i) => {
        return <li
          style={{
            margin: '0 1rem',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          key={i}
          className={operationsClassName}
        >
          <ListItemText
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            primary={op?.name} secondary={op?.progress} />
        </li>
      })
    }

    {audioUrls.length > 0 &&
      <ListItem
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '1rem',
        }}
      >
        {
          audioUrls.map((u, i) => {
            console.log('audioUrls.u', u);
            return <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <ListItemText
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                key={i} primary={`audio-file-${i+1}.mp3`} />
                {/**
                 * TODO: add a way to save the original file name 
                 */}

              <div
                // onClick={}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                <IconButton
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    console.log('IconButton.u', u);

                    const _url = await getCachedUrl(u, 'protected', unit?.identityId)

                    setPresignedUrl(_url);
                  }}
                  edge="end" aria-label="play">
                  <PlayCircleIcon
                    color='primary' />
                </IconButton>

                <IconButton
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    const confirmed = window.confirm('Are you sure you want to delete this audio file?');

                    if (!confirmed) return;

                    // delete from s3
                    const remove = await _remove(u, {
                      // level: 'protected',
                    });

                    console.log('remove', remove);

                    // remove from audioUrls
                    const _audioUrls = audioUrls.filter(_u => _u !== u);
                    
                    try {
                      await DataStore.save(
                        Question.copyOf(entry[1], (question) => {
                          question.audio = _audioUrls;
                        })
                      )
                    } catch (error) {
                      console.log('error', error);
                    }

                  }} >
                  <DeleteIcon />
                  </IconButton>

              </div>
            </div>
          })
        }

      </ListItem>
    }


  </>;

}


export function QuestionEditor() {

  const [open, setOpen] = React.useState(false);
  const [isHelpOpen, setHelpOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState(new Set());
  const [filteredQuestionBank, setFilteredQuestionBank] = React.useState(null);
  const [selectedItems, setSelectedItems] = React.useState(new Set());
  const [contextMenu, setContextMenu] = React.useState(null);
  const [sharedHistoryState, setSharedHistoryState] = React.useState(new Map());

  const theme = useTheme();
  const mainColor = theme.palette.primary.main;

  console.log('QuestionEditor.mainColor', mainColor);

  const rgbColor = hexToRgb(mainColor); // Replace 'primary.main' with the color you want to convert
  console.log('rgbColor, rgbColor'); // Output: "rgb(33, 150, 243)"
  const _r = rgbColor.r;
  const _g = rgbColor.g;
  const _b = rgbColor.b;

  const [search, setSearch] = React.useState('');

  const [newPrompt, setNewPrompt] = React.useState('');
  const [newAnswer, setNewAnswer] = React.useState('');
  const [newHint, setNewHint] = React.useState('');
  const [editFile, setEditFile] = React.useState(null);
  const [isWorking, setIsWorking] = React.useState(false);

  const [audioSrc, setAudioSrc] = React.useState(null);
  const [newQuestionFormOpen, setNewQuestionFormOpen] = React.useState(false);

  const [fileOperations, setFileOperations] = React.useState([]);

  const {
    setFilter,
    searching,
    setSearching,
    questionBank
  } = React.useContext(DictionaryContext);

  const { audioFiles, refreshAudioFiles, session } = React.useContext(FilesContext);
  const { editorRef } = React.useContext(UnitContext) || {};
  const {
    identityId,
    idToken
  } = session

  console.log('FilesContext. session', session);

  console.log('FilesContext. identityId', identityId);
  console.log('FilesContext. idToken', idToken);
  console.log('FilesContext. idToken', idToken.toString());

  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const audioRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  // const timelineRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const sourceRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const fileInput = React.createRef(null);


  React.useEffect(() => {

    const audio = audioRef.current;

    if (!audio) {
      return;
    } else if (audio.srcObject) {
      const tracks = audio.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      audio.srcObject = null;
    }

    const audioContext = audioContextRef.current || new AudioContext();
    const source = sourceRef.current || audioContext.createMediaElementSource(audio);
    const analyser = analyserRef.current || audioContext.createAnalyser();

    sourceRef.current = source;
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const canvas = canvasRef.current;
    // const timeline = timelineRef.current;
    const canvasCtx = canvas.getContext('2d');
    // const timelineCtx = timeline.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    // const timelineDataArray = new Uint8Array(bufferLength);

    // setDataArray(dataArray);
    const draw = () => {
      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      // TODO make this white or black depending on if its light or dark mode
      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Find the maximum value in the dataArray
      const max = Math.max(...dataArray);

      // Reflect the canvas horizontally
      canvasCtx.scale(-1, 1);
      canvasCtx.translate(-canvas.width, 0);

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / max) * canvas.height / 2;

        canvasCtx.fillStyle = `rgb(${barHeight + 100},${_g},${_b})`;
        canvasCtx.fillRect(canvas.width - (x + barWidth / 2), canvas.height / 2 - (barHeight / 2), barWidth, barHeight);

        x += barWidth + 1;
      }

      // Reset the canvas transformation
      canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    };

    draw();

    audio.addEventListener('canplaythrough', () => {
      console.log('canplaythrough');
      audio.play();
    });
  }, [audioSrc]);

  const handlePlay = () => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;

    source.connect(audioContext.destination);
    audioContext.resume();
  };

  const handlePause = () => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;

    source.disconnect(audioContext.destination);
    audioContext.suspend();
  };

  const handleCreateQuestion = async (event) => {
    setIsWorking(true)
    event.preventDefault()
    // event.stopPropagation()

    console.log('event', event)

    const prompt = newPrompt
    const hint = newHint
    const answer = newAnswer   

    // create an audio file for the prompt and answer.
    // use the generateAudioFile mutation

    // generateAudioFile(prompt: String!, voice: String!, model: String!): String @function(name: "openai-${env}")

    console.log('identityId', identityId);


    const voice = 'shimmer';
    const model = 'tts-1-hd';

    try {
      const fileGenerator = client.graphql({
        query: generateAudioFile,
        variables: {
          phrase: prompt,
          voice,
          model,
        }},
        {
          'x-api-identity': idToken.toString(),
        });

      const fileGeneratorAnswer = client.graphql({
        query: generateAudioFile,
        variables: {
          phrase: answer,
          voice,
          model,
        }},
        {
          'x-api-identity': idToken.toString(),
        });

        const hash = createHash('sha256')
        hash.update(model + voice + prompt);
        const promptHex = hash.digest('hex');

        const hashAnswer = createHash('sha256')
        hashAnswer.update(model + voice + answer);
        const answerHex = hashAnswer.digest('hex');

        // Generate audio file paths
        const promptAudioPath = `audio/${promptHex}.mp3`;
        const answerAudioPath = `audio/${answerHex}.mp3`;
        
      const [question, file, answerFile] = await Promise.allSettled([ dataSave, fileGenerator, fileGeneratorAnswer]);

      console.log('file', file);
      console.log('answerFile', answerFile);
      console.log('promptHex', promptHex);
      console.log('answerHex', answerHex);
      console.log('question', question);
      
      // Extract waveform data from backend responses
      const promptWaveformData = file.value?.data?.generateAudioFile?.waveformData || null;
      const answerWaveformData = answerFile.value?.data?.generateAudioFile?.waveformData || null;

        const dataSave = DataStore.save(
          new Question({
            prompt,
            hint,
            answer,
            identityId,
            audio: [promptAudioPath],
            audioWaveformData: promptWaveformData,
            answerAudio: [answerAudioPath],
            answerAudioWaveformData: answerWaveformData
          })
        );

      // If any errors are returned delete the question and files from S3?

      // if (file.errors) {
      //   console.error(file.errors);
      //   throw new Error(file.errors[0].message);
      // }

      // if (data.errors) {
      //   console.error(data.errors);
      //   throw new Error(data.errors[0].message);
      // }

      setIsWorking(false)
    } catch (errors) {
      console.error(errors)
      //   throw new Error(errors[0].message)
    }

    setOpen(false);
    setNewPrompt('');
    setNewAnswer('');
    setNewHint('');

  }

  const debounce = (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = React.useCallback(
    debounce((search) => {
      setFilter(search);
    }, 500),
    []
  );

  const handleSearch = (e) => {
    setSearch(e.target.value.trim());
    debouncedSearch(e.target.value.trim());
    setSearching(true);
  };


  function handleSubmit(event) {
    event.preventDefault();
    // Do something with the form data
  }

  const [_presignedUrl, _setPresignedUrl] = React.useState(null);

  React.useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch(_presignedUrl);
        console.log('response!!!', response)
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        console.log('url!!!', url)
        setAudioSrc(url);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAudio();
  }, [_presignedUrl]);

  const toggleNewQuestionFormOpen = () => {
    setNewQuestionFormOpen(!newQuestionFormOpen);
  };

  // Filter questions based on search term
  React.useEffect(() => {
    if (!questionBank) {
      setFilteredQuestionBank(null);
      return;
    }

    if (!search || search.trim() === '') {
      setFilteredQuestionBank(questionBank);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = {};
    const matchingIds = new Set();

    Object.entries(questionBank).forEach(([key, question]) => {
      const prompt = question.prompt || '';
      const answer = question.answer || '';
      const hint = question.hint || '';

      if (
        prompt.toLowerCase().includes(searchLower) ||
        answer.toLowerCase().includes(searchLower) ||
        hint.toLowerCase().includes(searchLower)
      ) {
        filtered[key] = question;
        matchingIds.add(key);
      }
    });

    setFilteredQuestionBank(filtered);
    
    // Auto-expand questions that match the search but aren't expanded
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      matchingIds.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [search, questionBank]);

  const handleFileClick = () => {
    console.log('clicked');
    fileInput.current.click();
  };

  const onFileInputChange = async (e) => {
    const files = e.target.files;
    console.log('files', files);

    // set in state for preview, then upload after question is created
    // setFiles(files);

    // for each file create an uploaded file tracking map in state

    const _fileOperations = []

    Object.values(files).forEach((file) => {
      _fileOperations.push({
        name: file.name,
        progress: 0,
      })

    })

    console.log('_fileOperations', _fileOperations);

    setFileOperations(_fileOperations)
  };




  const handleBulkDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedItems.size} question(s)?`);
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedItems).map(async (questionId) => {
        const question = filteredQuestionBank[questionId];
        if (question) {
          await DataStore.delete(question);
        }
      });
      await Promise.all(deletePromises);
      setSelectedItems(new Set());
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting questions:', error);
    }
  };

  const handleInsertCustomAnswer = async () => {
    const questionIds = Array.from(selectedItems);
    
    if (editorRef && editorRef.current) {
      // If we have editor access, dispatch command to insert/append custom answer block
      const { INSERT_CUSTOM_ANSWER_BLOCK_COMMAND } = await import('./Editor3/plugins/CustomAnswerPlugin');
      
      // Dispatch the command (plugin will handle append vs create logic)
      editorRef.current.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, questionIds);
      
      setSelectedItems(new Set());
      setContextMenu(null);
    } else {
      // Fallback: Just log a message if editor not available
      console.log('Would insert/append custom answer block with question IDs:', questionIds);
      alert(`Custom Answer block would be created/updated with ${questionIds.length} questions. Editor context not available in this view.`);
      setSelectedItems(new Set());
      setContextMenu(null);
    }
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleExpandAll = () => {
    if (filteredQuestionBank) {
      const allIds = Object.keys(filteredQuestionBank);
      setExpandedItems(new Set(allIds));
    }
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const handleSelectAll = () => {
    if (filteredQuestionBank) {
      const allIds = Object.keys(filteredQuestionBank);
      setSelectedItems(new Set(allIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  return (
    <>
        <Menu
          open={contextMenu !== null}
          onClose={handleContextMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem disabled>
            <Typography variant="caption" color="text.secondary">
              {selectedItems.size} selected
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleBulkDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Selected
          </MenuItem>
          <MenuItem onClick={handleInsertCustomAnswer}>
            Add to Custom Answer Block
          </MenuItem>
        </Menu>

        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >

          {_presignedUrl &&

            <>
              {/* <canvas
                ref={timelineRef}
              /> */}
              <canvas
                style={{
                  // width: '100%',
                  // height: '10vw',
                  margin: 'auto'
                }}
                ref={canvasRef} />
              <audio
                onClick={doNothing}
                style={{
                  backgroundColor: '#ffffff !important',
                  // width: '100%',
                  // margin: '1rem auto'
                }}
                ref={audioRef} src={audioSrc} controls />

            </>}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexShrink: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 0,
            padding: 1,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 1,
          }}
        >
          {/* Left side controls */}
          <Box sx={{ display: 'flex', gap: 0, alignItems: 'center', flexShrink: 1 }}>

            <Tooltip title="Select All">
              <Checkbox
                size="small"
                checked={filteredQuestionBank && Object.keys(filteredQuestionBank).length > 0 && selectedItems.size === Object.keys(filteredQuestionBank).length}
                indeterminate={selectedItems.size > 0 && selectedItems.size < Object.keys(filteredQuestionBank || {}).length}
                onChange={(e) => {
                  if (selectedItems.size === Object.keys(filteredQuestionBank || {}).length) {
                    handleDeselectAll();
                  } else {
                    handleSelectAll();
                  }
                }}
                disabled={!filteredQuestionBank || Object.keys(filteredQuestionBank).length === 0}
                sx={{ p: 0.25 }}
              />
            </Tooltip>

            <Tooltip title={expandedItems.size === 0 ? "Expand All" : "Collapse All"}>
              <IconButton
                size="small"
                onClick={expandedItems.size === 0 ? handleExpandAll : handleCollapseAll}
                disabled={!filteredQuestionBank || Object.keys(filteredQuestionBank).length === 0}
              >
                {expandedItems.size === 0 ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
              </IconButton>
            </Tooltip>
            

          </Box>

          <TextField
            value={search}
            onInput={handleSearch}
            onClick={doNothing}
            type='text'
            size="small"
            fullWidth
            placeholder="Search questions..."
            label="Search"
            />

          <Tooltip title="New Question">
            <IconButton
              onClick={toggleNewQuestionFormOpen}
              color="primary"
              size="small"
            >
              <Description />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actions">
            <IconButton
              onClick={(e) => setContextMenu(contextMenu ? null : { mouseX: e.clientX, mouseY: e.clientY })}
              size="small"
              disabled={selectedItems.size === 0}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>

        </Box>
        
        <Dialog 
          open={newQuestionFormOpen} 
          onClose={toggleNewQuestionFormOpen}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Question</DialogTitle>
          <DialogContent>
            <form onSubmit={handleCreateQuestion}>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >



                <TextField
                  value={newPrompt}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem',
                    marginTop: '1rem'
                  }}
                  label="Prompt"
                  variant="outlined" />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                >
                <TextField
                  value={newHint}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewHint(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem'
                  }}
                  label="Hint"
                  variant="outlined" />

                  </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                <TextField
                  value={newAnswer}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem'
                  }}
                  label="Answer"
                  variant="outlined" />


              </div>

              {/**
               * file upload
               */}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                {/* <input
                  type="file"
                  disabled
                  // disabled={fileOperations.length > 0}
                  accept="audio/mp3"
                  // required={fileOperations.length === 0}
                  onChange={onFileInputChange}
                  ref={fileInput} style={{ display: 'none' }} />
                <Button
                  disabled
                  onClick={handleFileClick}
                  variant='contained'
                  style={{
                    margin: '1rem 0'
                  }}

                >
                  Upload Audio
                </Button> */}

                <Button
                  
                  variant='contained'
                  type='submit'
                  // onClick={handleCreateQuestion}
                  style={{
                    margin: '1rem 0'
                  }}

                >
                  Create Question
                </Button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'columns',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                {fileOperations.length > 0 &&
                  <List
                    style={{
                      width: '100%',
                      // overflow: 'auto',
                    }}
                  >
                    {fileOperations.map((op, i) => {
                      return <ListItem key={i}>
                        <ListItemText primary={op?.name} secondary={op?.progress} />
                      </ListItem>
                    })
                    }
                  </List>

                }
              </div>

            </form>
          </DialogContent>
        </Dialog>



        <List
          className='dictionary-list'
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 0,
            margin: 0,
          }}
        >

          <style global jsx>{`
          .dictionary-list li {
            border-bottom: 1px solid #c7c7c7;
          }

          .dictionary-list li:last-child {
            border-bottom: none;
          }

          .dictionary-list li.noborder {
            border-bottom: none;
          }
          `}</style>

          {filteredQuestionBank && Object.keys(filteredQuestionBank).length > 0 &&
            Object.entries(filteredQuestionBank).map((entry, i) => <QuestionListItem
              key={entry[0]}
              audioFiles={audioFiles}
              entry={entry} i={i}
              setPresignedUrl={_setPresignedUrl}
              refreshAudioFiles={refreshAudioFiles}
              identityId={identityId}
              isExpanded={expandedItems.has(entry[0])}
              onToggleExpand={(expanded) => {
                const newSet = new Set(expandedItems);
                if (expanded) {
                  newSet.add(entry[0]);
                } else {
                  newSet.delete(entry[0]);
                }
                setExpandedItems(newSet);
              }}
              isEvenRow={i % 2 === 0}
              searchTerm={search}
              isSelected={selectedItems.has(entry[0])}
              onToggleSelect={() => {
                const newSet = new Set(selectedItems);
                if (newSet.has(entry[0])) {
                  newSet.delete(entry[0]);
                } else {
                  newSet.add(entry[0]);
                }
                setSelectedItems(newSet);
              }}
              sharedHistory={sharedHistoryState}
            />)}

        </List>
    </>
  );
}
