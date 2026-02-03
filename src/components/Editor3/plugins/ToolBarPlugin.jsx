/**
 * @fileoverview ToolBarPlugin - Rich text editor toolbar with formatting controls.
 * @module ToolBarPlugin
 * 
 * Provides a comprehensive toolbar for the Lexical editor with controls for:
 * - Text formatting (bold, italic, underline, strikethrough, subscript, superscript)
 * - Block types (headings, lists, quotes, code)
 * - Alignment and indentation
 * - Links and embeds
 * - Custom educational nodes (quizzes, answers, word blocks, etc.)
 * - Undo/redo operations
 */

import {
    $createCodeNode,
    $isCodeNode,
    CODE_LANGUAGE_FRIENDLY_NAME_MAP,
    CODE_LANGUAGE_MAP,
    getLanguageFriendlyName,
} from '@lexical/code';
import { isShortcut } from '../utils/keyboardUtils';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
    $isListNode,
    INSERT_CHECK_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListNode,
    REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
    $isQuoteNode,
} from '@lexical/rich-text';
import {
    $getSelectionStyleValueForProperty,
    $isParentElementRTL,
    $patchStyleText,
    $setBlocksType,
} from '@lexical/selection';
import { $isTableNode } from '@lexical/table';
import {
    $findMatchingParent,
    $getNearestBlockElementAncestorOrThrow,
    $getNearestNodeOfType,
    mergeRegister,
} from '@lexical/utils';
import {
    $createParagraphNode,
    $getNodeByKey,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    $isRootOrShadowRoot,
    $isTextNode,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_NORMAL,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,
    KEY_MODIFIER_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useState, useContext, useRef } from 'react';
import * as React from 'react';
import { useTranslation } from 'next-i18next';

import Head from 'next/head'
import { useRouter } from 'next/router'
import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Toolbar,
    // AppBar,
    Menu,
    Link,
    Card,
    Stack,
    CardContent,
    Modal,
    Typography,
    TextField,
} from '@mui/material';

import MainToolbar from '../../MainToolbar';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PreviewIcon from '@mui/icons-material/Preview';
import ParagraphIcon from '@mui/icons-material/Subject';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import AddLinkIcon from '@mui/icons-material/AddLink';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
// import AttachmentIcon from '@mui/icons-material/Attachment';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import WordBlockIcon from '@mui/icons-material/FlipToFront';
import QuizIcon from '@mui/icons-material/Quiz';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ColumnsIcon from '@mui/icons-material/ViewColumn';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FontDownloadIcon from '@mui/icons-material/FontDownload';

import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';

import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';

import DeleteIcon from '@mui/icons-material/Delete';
import { forwardRef } from 'react';
import DraftIcon from '@mui/icons-material/Drafts';
import PublishedIcon from '@mui/icons-material/CloudUpload';
import ArchivedIcon from '@mui/icons-material/Archive';

import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

import CalendarIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';

// import { $isAtNodeEnd } from '@lexical/selection';

import UnitContext from '../../../context/unitContext';
// import SectionContext from '../../../context/sectionContext';

import { Save } from '../components/Save';


import {INSERT_LAYOUT_COMMAND} from '../plugins/LayoutPlugin';

import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';

import {
    INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND
} from './MeaningAssociationPlugin';

import {
    INSERT_WORD_BLOCK_COMMAND
} from './WordBlockPlugin';

import {
    INSERT_PLAYLIST_COMMAND
} from './PlaylistPlugin';

import {
    INSERT_QUIZ_COMMAND
} from './QuizPlugin';

import {
    InsertNewTableDialog,
} from './TablePlugin';



import { $isAtNodeEnd } from '@lexical/selection';
const drawerWidth = 400;

const notoSansJp = {
  style: { fontFamily: '"Noto Sans JP", sans-serif' }
}

const oswald = {
  style: { fontFamily: '"Oswald", sans-serif' }
}

const cormorant = {
  style: { fontFamily: '"Cormorant", serif' }
}

const dmSans = {
  style: { fontFamily: '"DM Sans", sans-serif' }
}

const inter = {
  style: { fontFamily: '"Inter", sans-serif' }
}


export function getSelectedNode(
    selection,
) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
    }
}

// import catTypingGif from '../../images/cat-typing.gif';
// import { $createStickyNode } from '../../nodes/StickyNode';
// import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../utils/url';
import { EmbedConfigs } from './AutoEmbedPlugin';
import App from 'next/app';
// import { INSERT_COLLAPSIBLE_COMMAND } from '../CollapsiblePlugin';
// import { InsertEquationDialog } from '../EquationsPlugin';
// import { INSERT_EXCALIDRAW_COMMAND } from '../ExcalidrawPlugin';
import {
    INSERT_IMAGE_COMMAND,
} from '../plugins/ImagesPlugin';
import ColorPicker from './ColorPicker';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IS_APPLE } from '../utils/dom';
import { object } from 'prop-types';
import { INSERT_ANSWER_BLOCK_COMMAND } from './AnswerPlugin';
import { INSERT_CUSTOM_ANSWER_BLOCK_COMMAND } from './CustomAnswerPlugin';
// import { InsertInlineImageDialog } from '../InlineImagePlugin';
// import { INSERT_PAGE_BREAK } from '../PageBreakPlugin';
// import { InsertPollDialog } from '../PollPlugin';
// import { InsertNewTableDialog, InsertTableDialog } from '../TablePlugin';

const blockTypeToBlockName = {
    bullet: 'Bulleted List',
    check: 'Check List',
    code: 'Code Block',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    number: 'Numbered List',
    paragraph: 'Normal',
    quote: 'Quote',
};

const rootTypeToRootName = {
    root: 'Root',
    table: 'Table',
};

function getCodeLanguageOptions() {
    const options = [];

    for (const [lang, friendlyName] of Object.entries(
        CODE_LANGUAGE_FRIENDLY_NAME_MAP,
    )) {
        options.push([lang, friendlyName]);
    }

    return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

const date = new Date();
const hour = date.getHours();
let greeting = '';
if (hour < 12) {
    greeting = 'おはよう';
} else if (hour < 18) {
    greeting = 'こんにちは';
} else {
    greeting = 'こんばんは';
}

const FONT_FAMILY_OPTIONS = [
    ['', 'Default'],
    [oswald.style.fontFamily, 'Oswald'],
    [dmSans.style.fontFamily, 'DM Sans'],
    [cormorant.style.fontFamily, 'Cormorant'],
    [inter.style.fontFamily, 'Inter'],
    [notoSansJp.style.fontFamily, `Noto Sans 「${greeting}」`],
    ['Arial', 'Arial'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
    ['Times New Roman', 'Times New Roman'],
    ['Trebuchet MS', 'Trebuchet MS'],
    ['Verdana', 'Verdana'],

];
// make a function to get font size options
const generateFontSizeOptions = (min, max) => {
    const options = [];
    for (let i = min; i <= max; i++) {
        options.push([`${i}px`, `${i}`]);
    }
    return options;
}

const FONT_SIZE_OPTIONS = generateFontSizeOptions(8, 144);

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));


const LAYOUTS = [
    {label: '2 columns (equal width)', value: '1fr 1fr'},
    {label: '2 columns (25% - 75%)', value: '1fr 3fr'},
    {label: '3 columns (equal width)', value: '1fr 1fr 1fr'},
    {label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr'},
    {label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr'},
];


function LayoutModal({editor}) {
    const { t } = useTranslation('editor.authoring');
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [openMenu, setOpenMenu] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setOpenMenu(true);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setOpenMenu(false);
    };

    const [layout, setLayout] = useState(LAYOUTS[0].value);
    const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;

    const handleChange = (event) => {
        setLayout(event.target.value);
      };

    const onClick = () => {
        editor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
        // onClose();
        handleClose();
        handleMenuClose();
    };

    return (
        <>
        <MenuItem
        tabIndex={-1}
        onClick={handleOpen}
        >

                 <ColumnsIcon />
              <span className="text">{t('toolBarPlugin.columnsLayout')}</span>
            </MenuItem>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Card sx={{
                        minWidth: 'min-content',
                        minHeight: 'min-content',
                        width: '30vw',
                        margin: '20vh auto',
                        verticalAlign: 'middle',
                        padding: '2rem',

                    }}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            {t('toolBarPlugin.chooseLayout')}
                        </Typography>

                        <Select
                        value={layout}
                        label='Layout'
                        variant='standard'
                        style={{
                            width: '100%',
                        }}
                        onChange={handleChange}
                        >
                            {LAYOUTS.map(({label, value}) => (
                                <MenuItem
                                    key={label}
                                    value={value}
                                    label={label}
                                    tabIndex={-1}
                                    onClick={() => {
                                        setLayout(value);
                                        handleMenuClose();
                                        // handleClose();
                                    }}
                                >
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                        <Stack
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                marginTop: '1rem',
                                overflowY: 'auto'
                            }}
                        >
                            <Button variant='contained' color='primary' onClick={onClick}>{t('toolBarPlugin.insert')}</Button>
                        </Stack>

                    </Card>
                </Modal>
            </Box>
        </>
    );

}

function DeleteModal() {
    const { t } = useTranslation('editor.authoring');
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const {
        handleDelete,
    } = useContext(UnitContext)


    return (
        <>
            <Button onClick={handleOpen}
                color='inherit'
                sx={{
                    minWidth: '1rem'
                }}
            >
                <DeleteIcon />
            </Button>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Card sx={{
                        minWidth: 'min-content',
                        minHeight: 'min-content',
                        width: '30vw',
                        margin: '20vh auto',
                        verticalAlign: 'middle',
                        padding: '2rem',

                    }}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            {t('toolBarPlugin.deleteUnitConfirmation')}
                        </Typography>
                        <Stack
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                marginTop: '1rem',
                                overflowY: 'auto'
                            }}
                        >
                            <Button variant='contained' color='error' onClick={handleDelete}>{t('toolBarPlugin.delete')}</Button>
                            <Box sx={{ margin: '1rem' }} />
                            <Button variant='contained' color='primary' onClick={handleClose}>{t('toolBarPlugin.cancel')}</Button>
                        </Stack>

                    </Card>
                </Modal>
            </Box>
        </>
    );
}



const IFrame = ({
    src,
    title,
    width,
    height,
    allowFullScreen,
    frameBorder,
    allow,
    sandbox,
    style,
    ...props
}) => {
    return (
        <iframe
            src={src}
            title={title}
            width={width}
            height={height}
            allowFullScreen={allowFullScreen}
            frameBorder={frameBorder}
            allow={allow}
            sandbox={sandbox}
            style={style}
            {...props}
        />
    );
};


const PreviewModal = () => {
    const { t } = useTranslation('editor.authoring');
    const {
        name,
        unit,
    } = useContext(UnitContext);

    const [previewOpen, setPreviewOpen] = useState(false);

    const handleOpenPreview = () => {
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
    };

    return (
        <>
            <Button
                color="inherit"
                onClick={handleOpenPreview}
            >
                <PreviewIcon />
            </Button>

            <Modal
                open={previewOpen}
                onClose={handleClosePreview}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <Card
                    sx={{
                        width: '100vw',
                        height: '100%',
                        overflow: 'auto',
                        position: 'relative',
                    }}
                >
                    <CardContent>
                        <Button
                            onClick={handleClosePreview}
                            variant='contained'
                            sx={{
                                width: '100%',
                            }}
                        >
                            {t('toolBarPlugin.closePreview', { name: name || t('toolBarPlugin.untitledUnit') })}
                        </Button>
                    </CardContent>



                    <IFrame
                        width={'100%'}
                        height={'90%'}

                        src={unit?.id ? `/workbook/${unit.id}` : ''}
                    />
                </Card>
            </Modal>

        </>
    )
}



const UnitTitleDescriptionEditor = () => {
    const { t } = useTranslation('editor.authoring');
    const {
        name,
        description,
        saveName,
        saveDescription,
    } = useContext(UnitContext);

    const [editName, setEditName] = useState(false);
    const [editDescription, setEditDescription] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        // console.log('useEffect.description', description)
        setNewDescription(description)
    }, [description])

    useEffect(() => {
        // console.log('useEffect.changeName', name)
        setNewName(name)
    }, [name])

    const onNameChange = (event) => {
        const value = event.target.value;
        // console.log('changeName', value)
        setNewName(value)
    }

    const onDescriptionChange = (event) => {
        const value = event.target.value;
        // console.log('onDescriptionChange', value)
        setNewDescription(value)
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Head>
                <title>{name}</title>
            </Head>
            <Box sx={{ flexGrow: 1, px: 2, py: 0.5, minHeight: '2.5rem', display: 'flex', alignItems: 'center' }}>
                {!editName &&
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, lineHeight: '2rem', borderBottom: '1px solid transparent', pb: '2px' }} onClick={(event) => {
                        setEditName(true)
                    }}>
                        {newName || t('toolBarPlugin.untitledUnit')}
                    </Typography>
                }
                {editName &&
                    <TextField
                        size='small'
                        variant='standard'
                        fullWidth
                        value={newName || ''}
                        placeholder={t('toolBarPlugin.untitledUnit')}
                        onChange={(event) => { onNameChange(event) }}
                        InputProps={{
                            sx: { fontSize: '1.25rem', fontWeight: 400 }
                        }}
                        inputRef={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        onBlur={async (event) => {
                            event.preventDefault()
                            await saveName(newName || t('toolBarPlugin.untitledUnit'))
                            setEditName(false)
                            // console.log('name saved', name)
                        }}
                    />
                }
            </Box>

            <Box sx={{ flexGrow: 1, px: 2, py: 0.5, minHeight: '2rem', display: 'flex', alignItems: 'center' }}>
                {!editDescription &&
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1, lineHeight: '1.5rem', borderBottom: '1px solid transparent', pb: '2px' }} onClick={(event) => {
                        // event.preventDefault()
                        setEditDescription(true)
                    }}>
                        {newDescription || t('toolBarPlugin.addDescription')}
                    </Typography>
                }
                {editDescription &&
                    <TextField
                        size='small'
                        variant='standard'
                        fullWidth
                        // label={`Answer ${index + 1}`}
                        value={newDescription || ''}
                        placeholder={t('toolBarPlugin.addDescription')}
                        onChange={(event) => { onDescriptionChange(event) }}
                        InputProps={{
                            sx: { fontSize: '0.875rem' }
                        }}
                        inputRef={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        onBlur={async (event) => {
                            event.preventDefault()
                            await saveDescription(newDescription || t('toolBarPlugin.addDescription'))
                            setEditDescription(false)
                            // console.log('description saved', description)
                        }}
                    />
                }
            </Box>
        </Box>
    )
}

const StatusSelect = () => {
    const { t } = useTranslation('editor.authoring');
    const {
        unit,
        handleStatusChange
    } = useContext(UnitContext);

    const inputStatus = unit?.status || 'DRAFT'

    const [status, setStatus] = useState(inputStatus);

    const handleChange = async (event) => {
        setStatus(event.target?.value)
        await handleStatusChange(event.target?.value)
    };

    useEffect(() => {
        setStatus(inputStatus)
    }, [inputStatus])

    return (
        <>
            <style global jsx>{`
                #status-select {
                    padding: 0.25rem 1rem 0.25rem 0.5rem;
                    height: 2rem;
                }

                #status-select > span.text {
                    color: #505050;
                }

                #status-select > svg {
                    position: relative;
                    top: 0.25rem;
                }



            `}</style>
            <Box
                // onClick={(e) => {
                //     e.preventDefault();
                //     e.stopPropagation();
                // }}
                id='status-select-box'
                style={{ minWidth: '7rem', margin: '0.25rem' }}
            >
                <FormControl fullWidth>
                    <InputLabel id="status-select-label">{t('toolBarPlugin.status')}</InputLabel>
                    <Select
                        labelId="status-select-label"
                        id="status-select"
                        value={status}
                        label={t('toolBarPlugin.status')}
                        onChange={handleChange}
                    >

                        <MenuItem
                            value="DRAFT"
                            tabIndex={-1}
                        >
                            <DraftIcon />&nbsp;
                            <span className='text'>{t('toolBarPlugin.draft')}</span>
                        </MenuItem>

                        <MenuItem
                            value="PUBLISHED"
                            tabIndex={-1}
                        >
                            <PublishedIcon />&nbsp;
                            <span className='text'>{t('toolBarPlugin.published')}</span>
                        </MenuItem>

                        <MenuItem
                            value="ARCHIVED"
                            tabIndex={-1}
                        >
                            <ArchivedIcon />&nbsp;
                            <span className='text'>{t('toolBarPlugin.archived')}</span>
                        </MenuItem>


                    </Select>
                </FormControl>
            </Box>
        </>
    );
}


const TextAlignmentDropdown = ({
    activeEditor,
    disabled = false,
    isRTL,
}) => {
    const { t } = useTranslation('editor.authoring');

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                aria-controls="text-alignment-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                disabled={disabled}
                className={'toolbar-item text-alignment'}
                title={t('toolBarPlugin.textAlignment')}
                aria-label={t('toolBarPlugin.textFormatting')}
                color='inherit'
            >
                <FormatAlignLeftIcon />&nbsp;
                <span className="text">{t('toolBarPlugin.align')}</span>
            </Button>
            <Menu
                disabled={disabled}
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            // buttonLabel="Align"
            // buttonAriaLabel="Formatting options for text alignment"
            >
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
                        activeEditor.focus();
                        handleClose();
                    }}
                    label="Left Align"
                    aria-label="Left Align"
                >
                    <FormatAlignLeftIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.alignLeft')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                        activeEditor.focus();
                        handleClose();
                    }}
                    label="Center Align"
                    aria-label="Center Align"
                >
                    <FormatAlignCenterIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.alignCenter')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                        activeEditor.focus();
                        handleClose();
                    }}
                    label="Right Align"
                    aria-label="Right Align"
                >
                    <FormatAlignRightIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.alignRight')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                        activeEditor.focus();
                        handleClose();
                    }}
                    label="Justify Align"
                    aria-label="Justify Align"
                >
                    <FormatAlignJustifyIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.justifyAlign')}</span>
                </MenuItem>
                <Divider />
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                        activeEditor.focus();
                        handleClose();
                    }}
                    className="item"
                    label={isRTL ? 'Indent' : 'Outdent'}
                    aria-label="Outdent"
                    >
                    {isRTL ? (
                        <FormatIndentIncreaseIcon />
                    ) : (
                        <FormatIndentDecreaseIcon />
                    )
                    }
                    <span className="text">{t('toolBarPlugin.outdent')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
                        activeEditor.focus();
                        handleClose();
                    }}
                    className="item"
                    label={isRTL ? 'Outdent' : 'Indent'}
                    aria-label="Indent"
                    >
                    <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
                    {isRTL ? (
                        <FormatIndentDecreaseIcon />
                    ) : (
                        <FormatIndentIncreaseIcon />
                    )
                    }
                    <span className="text">{t('toolBarPlugin.indent')}</span>
                </MenuItem>
            </Menu>
        </>
    )
}

const DropdownColorPicker = ({
    disabled = false,
    isBackgroundColor,
    color,
    onChange,
    title,
    ariaLabel,
    buttonAriaLabel,
    editor,
}) => {

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                aria-controls="color-picker-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                disabled={disabled}
                // className={'insert-node'}
                title={buttonAriaLabel}
                aria-label={buttonAriaLabel}
                color='inherit'
            >
                {isBackgroundColor ? (
                    <FormatColorFillIcon />
                ) : (
                    <FormatColorTextIcon />
                )
                }
                {/* <span className="text">{title}</span> */}
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >

                <ColorPicker
                    color={color}
                    editor={editor}
                    onChange={onChange}
                />


            </Menu>
        </>
    )
}


const InsertNodeDropDown = ({
    editor,
    disabled = false,
    blockType,
    setTabValue,
    setOpenTab,
}) => {
    const { t } = useTranslation('editor.authoring');

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                aria-controls="insert-node-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                disabled={disabled}
                // className={'insert-node'}
                title={t('toolBarPlugin.insert')}
                aria-label="Insert Item Menu"
                color='inherit'
            >
                <AddIcon />&nbsp;
                <span className="text">{t('toolBarPlugin.insert')}</span>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        setTabValue(0)
                        setOpenTab(true)
                        handleClose()
                    }}
                    className="item"
                    title="Due Date"
                    aria-label="Due Date">
                    <CalendarIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.dueDate')}</span>

                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        setTabValue(0)
                        setOpenTab(true)
                        handleClose()
                    }}
                    className="item"
                    title="Timer"
                    aria-label="Timer">
                    <TimerIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.timer')}</span>

                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND,
                            undefined,
                        );
                    }}
                    title="Meaning Association"
                    aria-label="Meaning Association">
                    <WordBlockIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.meaningAssociation')}</span>
                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_WORD_BLOCK_COMMAND,
                            'placeholder-word-id',
                        );
                        handleClose();
                    }}
                    title="Word Block"
                    aria-label="Insert Word Block">
                    <FontDownloadIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.wordBlock')}</span>
                </MenuItem>

                 {/**
                  * Add Short Answer Menu Item
                  */}

                  <MenuItem
                    tabIndex={-1}
                    onClick={() => {    
                        editor.dispatchCommand(
                            INSERT_ANSWER_BLOCK_COMMAND,
                            [],
                        );
                    }
                    }
                    title="Short Answer"
                    aria-label="Short Answer based on Vocabulary words">
                    <FormatSizeIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.shortAnswerVocabulary')}</span>
                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {    
                        editor.dispatchCommand(
                            INSERT_CUSTOM_ANSWER_BLOCK_COMMAND,
                            [],
                        );
                    }
                    }
                    title="Short Answer"
                    aria-label="Short Answer based on custom prompts">
                    <FormatSizeIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.shortAnswerCustom')}</span>
                </MenuItem>

                {/**
                 * Add Long Answer Menu Item
                 */}

                {/* <MenuItem
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_ANSWER_BLOCK_COMMAND,
                            [],
                            true
                        );
                    }}
                    title="Long Answer"
                    aria-label="Long Answer">
                    <FormatSizeIcon />&nbsp;
                    <span className="text">Long Answer</span>
                </MenuItem> */}


                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_PLAYLIST_COMMAND,
                            undefined,
                        );
                    }}
                    title="Audio"
                    aria-label="Audio">
                    <AudiotrackIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.audioPlaylist')}</span>
                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_QUIZ_COMMAND,
                            undefined,
                        );
                    }}
                    title="Quiz"
                    aria-label="Quiz">
                    <QuizIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.multipleChoiceQuiz')}</span>
                </MenuItem>

                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_HORIZONTAL_RULE_COMMAND,
                            undefined,
                        );
                    }}
                    className="item">
                    <HorizontalRuleIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.horizontalRule')}</span>
                </MenuItem>

            <LayoutModal
                editor={editor}
            />

            <InsertNewTableDialog
                editor={editor}
                onClose={handleClose}
            />
                {/**
                  * TODO
                  * Add handwriting practice
                  */}

            </Menu>
        </>
    )
}


function TextFormatDropDown({
    activeEditor,
    style,
    disabled = false,
    // isBold,
    // isItalic,
    // isUnderline,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    clearFormatting,
}) {
    const { t } = useTranslation('editor.authoring');

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    return (
        <>
            <Button
                aria-controls="text-format-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                disabled={disabled}
                className={'toolbar-item ' + style}
                title={t('toolBarPlugin.moreTextFormatting')}
                aria-label={t('toolBarPlugin.formatTextStyles')}
                color='inherit'
            >
                <MoreVertIcon />
                <span className="text">{t('toolBarPlugin.text')}</span>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(
                            FORMAT_TEXT_COMMAND,
                            'strikethrough',
                        );
                        activeEditor.focus();
                        handleClose();
                    }}
                    className={isStrikethrough ? 'active' : ''}
                    title={t('toolBarPlugin.strikethroughTitle')}
                    aria-label={t('toolBarPlugin.formatStrikethrough')}>
                    <FormatStrikethroughIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.strikethrough')}</span>

                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                        activeEditor.focus();
                        handleClose();
                    }}
                    className={isSubscript ? 'active' : ''}
                    title={t('toolBarPlugin.subscript')}
                    aria-label={t('toolBarPlugin.formatSubscript')}>
                    <SubscriptIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.subscript')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        activeEditor.dispatchCommand(
                            FORMAT_TEXT_COMMAND,
                            'superscript',
                        );
                        activeEditor.focus();
                        handleClose();
                    }}
                    className={isSuperscript ? 'active' : ''}
                    title={t('toolBarPlugin.superscript')}
                    aria-label={t('toolBarPlugin.formatSuperscript')}>
                    <SuperscriptIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.superscript')}</span>
                </MenuItem>
                <MenuItem
                    tabIndex={-1}
                    onClick={() => {
                        clearFormatting();
                        activeEditor.focus();
                        handleClose();
                    }}
                    className="item"
                    title={t('toolBarPlugin.clearTextFormatting')}
                    aria-label={t('toolBarPlugin.clearAllTextFormatting')}>
                    <FormatClearIcon />&nbsp;
                    <span className="text">{t('toolBarPlugin.clearFormatting')}</span>
                </MenuItem>
            </Menu>
        </>
    );
}

function BlockFormatDropDown({
    editor,
    blockType: blockTypeProp = 'paragraph',
    rootType,
    disabled = false,
}) {

    // const [open, setOpen] = useState(false);
    // const [anchorEl, setAnchorEl] = useState(null);
    const [blockType, setBlockType] = useState(blockTypeProp);

    useEffect(() => {
        setBlockType(blockTypeProp)
    }, [blockTypeProp])

    const formatParagraph = () => {
        editor.update(() => {
            const selection = $getSelection();
            if (
                $isRangeSelection(selection)
            ) {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
        editor.focus();
    };

    const formatHeading = (headingSize) => {
        if (blockType !== headingSize) {
            editor.update(() => {
                const selection = $getSelection();
                if (
                    $isRangeSelection(selection)
                ) {
                    $setBlocksType(selection, () => $createHeadingNode(headingSize));
                }
            });
        }
        editor.focus();
    };

    const formatWordList = () => {
        if (blockType !== 'word') {
            editor.dispatchCommand(INSERT_WORD_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        editor.focus();
    };

    const formatBulletList = () => {
        if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        editor.focus();
    };

    const formatCheckList = () => {
        if (blockType !== 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        editor.focus();
    };

    const formatNumberedList = () => {
        if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
        editor.focus();
    };

    const formatQuote = () => {
        if (blockType !== 'quote') {
            editor.update(() => {
                const selection = $getSelection();
                if (
                    $isRangeSelection(selection)
                ) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            });
        }
        editor.focus();
    };

    const formatCode = () => {
        if (blockType !== 'code') {
            editor.update(() => {
                let selection = $getSelection();

                if (
                    $isRangeSelection(selection)
                ) {
                    if (selection.isCollapsed()) {
                        $setBlocksType(selection, () => $createCodeNode());
                    } else {
                        const textContent = selection.getTextContent();
                        const codeNode = $createCodeNode();
                        selection.insertNodes([codeNode]);
                        selection = $getSelection();
                        if ($isRangeSelection(selection))
                            selection.insertRawText(textContent);
                    }
                }
            });
        }
        // Use requestAnimationFrame to ensure focus happens after DOM updates are complete
        requestAnimationFrame(() => editor.focus());
    };

    return (
        <>
            <style global jsx>{`
        #block-format-select {
            padding: 0.25rem 1rem 0.25rem 0.5rem;
            height: 2rem;
        }

        /* Hide text labels in closed select, show only icons */
        #block-format-select > span.text,
        #block-format-select > span.menu-htext {
            display: none;
        }

        #block-format-select > span.icon {
            color: #505050;
        }

        #block-format-select > svg,
        #block-format-select > span.icon {
            position: relative;
            top: 0.25rem;
        }

        /* Styles for expanded menu items - show everything */
        ul[aria-labelledby="block-format-select-label"] li {
            display: flex !important;
            align-items: center !important;
        }

        ul[aria-labelledby="block-format-select-label"] li span.text,
        ul[aria-labelledby="block-format-select-label"] li span.menu-htext {
            display: inline !important;
            color: #505050 !important;
            margin-left: 0.5rem;
        }

        ul[aria-labelledby="block-format-select-label"] li svg,
        ul[aria-labelledby="block-format-select-label"] li span.icon {
            color: #505050 !important;
        }

        `}</style>
            <Box
                id='block-format-select-box'
                style={{ minWidth: 'auto', margin: '0.25rem' }}
            >
                <FormControl sx={{ minWidth: 'auto' }}>
                    <InputLabel id="block-format-select-label" sx={{ display: 'none' }}>
                        Block format
                    </InputLabel>
                    <Select
                        labelId="block-format-select-label"
                        id="block-format-select"
                        value={blockType}
                        aria-label="Block format"
                    >

                    <MenuItem
                        value="paragraph"
                        onClick={formatParagraph}
                        name='paragraph format'
                        tabIndex={-1}
                    >
                        <ParagraphIcon />&nbsp;
                        <span className='text'>Normal</span>
                    </MenuItem>
                    <MenuItem
                        value="h1"
                        onClick={() => formatHeading('h1')}
                        name="h1"
                        tabIndex={-1}
                    >
                        <span className='icon'>H1</span>&nbsp;
                        <span className='menu-htext'>Heading 1</span>
                    </MenuItem>
                    <MenuItem
                        value='h2'
                        onClick={() => formatHeading('h2')}
                        name="h2"   
                        tabIndex={-1}
                    >
                        <span className='icon'>H2</span>&nbsp;
                        <span className='menu-htext'>Heading 2</span>
                    </MenuItem>
                    <MenuItem
                        value='h3'
                        onClick={() => formatHeading('h3')}
                        name="h3"
                        tabIndex={-1}
                    >
                        <span className='icon'>H3</span>&nbsp;
                        <span className='menu-htext'>Heading 3</span>
                    </MenuItem>

                    <MenuItem
                        value='bullet'
                        onClick={() => {
                            console.log('bullet')
                            formatBulletList()
                        }}
                        name="bullet"
                        tabIndex={-1}
                    >
                        <FormatListBulletedIcon />&nbsp;
                        <span className='text'>Bulleted</span>
                    </MenuItem>
                    <MenuItem
                        value='number'
                        onClick={formatNumberedList}
                        name="number"
                        tabIndex={-1}
                    >
                        <FormatListNumberedIcon />&nbsp;
                        <span className="text">Numbered</span>
                    </MenuItem>

                    {/* TODO 
                Fix check list
                */}
                    {/* <MenuItem
                    value='check'
                    onClick={formatCheckList}
                >
                    <ChecklistIcon />&nbsp;
                    <span className="text">Check List</span>
                </MenuItem> */}
                    <MenuItem
                        value='quote'
                        name="quote"
                        onClick={formatQuote}
                        tabIndex={-1}
                    >
                        <FormatQuoteIcon />&nbsp;
                        <span className="text">Quote</span>
                    </MenuItem>
                    <MenuItem
                        value='code'
                        name="code"
                        onClick={formatCode}
                        tabIndex={-1}
                    >
                        <CodeIcon />&nbsp;
                        <span className="text">Code Block</span>
                    </MenuItem>
                </Select>
            </FormControl>
            </Box>
        </>
    );
}

function FontDropDown({
    editor,
    value,
    style,
    disabled = false,
}) {
    const { t } = useTranslation('editor.authoring');
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };


    const handleClick = useCallback(
        (option) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, {
                        [style]: option,
                    });
                }
            });
            editor.focus();
            handleClose();
        },

        [editor, style],
    );

    const buttonAriaLabel =
        style === 'font-family'
            ? t('toolBarPlugin.formattingFont')
            : t('toolBarPlugin.formattingSize');

    return (
        <>
        <style jsx global>{`
            html {
              font-family: ${notoSansJp.style.fontFamily.split(',')[0]} ${cormorant.style.fontFamily.split(',')[0]} ${inter.style.fontFamily.split(',')[0]} ${dmSans.style.fontFamily.split(',')[0]} ${oswald.style.fontFamily.split(',')[0]};
            }            
        `}</style>

            <Button
                aria-controls="font-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleOpen}
                disabled={disabled}
                className={'toolbar-item ' + style}
                title={style === 'font-family' ? t('toolBarPlugin.font') : t('toolBarPlugin.size')}
                aria-label={buttonAriaLabel}
                color='inherit'
            >
                {style === 'font-family' ? (
                    <FontDownloadIcon />
                ) : (
                    <FormatSizeIcon />
                )}
                <span className="text">
                    {style === 'font-family' ? t('toolBarPlugin.font') : t('toolBarPlugin.size')}
                </span>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >
                {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
                    ([option, text]) => (
                        <MenuItem
                            tabIndex={-1}
                            onClick={() => handleClick(option)}
                            key={option}>
                            {style === 'font-family' ? (
                            <span
                                style={{
                                    fontFamily: option,
                                }}
                            >
                                {text}
                            </span>
                        ) : (

                        
                            <span className="text">{text}</span>)
                        } 
                        </MenuItem>
                    ),
                )}
            </Menu>

        </>
    );
}

const ToolBarPlugin = forwardRef(function ToolBarPlugin({
    open,
    setOpen,
    setTabValue,
}, ref) {
    const { t } = useTranslation('editor.authoring');
    const [editor] = useLexicalComposerContext();
    const [activeEditor, setActiveEditor] = useState(editor);
    const [blockType, setBlockType] =
        useState('paragraph');
    const [rootType, setRootType] =
        useState('root');
    const [selectedElementKey, setSelectedElementKey] = useState(
        null,
    );
    const [fontSize, setFontSize] = useState('15px');
    const [fontColor, setFontColor] = useState('#000');
    const [bgColor, setBgColor] = useState('#fff');
    const [fontFamily, setFontFamily] = useState('Arial');
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isSubscript, setIsSubscript] = useState(false);
    const [isSuperscript, setIsSuperscript] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    // const [modal, showModal] = useModal();
    const [isRTL, setIsRTL] = useState(false);
    const [codeLanguage, setCodeLanguage] = useState('');
    const [isEditable, setIsEditable] = useState(() => editor.isEditable());
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
    const [isDueDateDialogOpen, setIsDueDateDialogOpen] = useState(false);
    
    // Toolbar scroll state
    const toolbarRef = useRef(null);
    const firstAppBarRef = useRef(null);
    const secondAppBarRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [firstAppBarHeight, setFirstAppBarHeight] = useState(0);
    const [totalAppBarHeight, setTotalAppBarHeight] = useState(0);

    // Check toolbar overflow
    const checkToolbarOverflow = useCallback(() => {
        if (toolbarRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = toolbarRef.current;
            const hasOverflow = scrollWidth > clientWidth;
            setShowLeftArrow(hasOverflow && scrollLeft > 5);
            setShowRightArrow(hasOverflow && scrollLeft + clientWidth < scrollWidth - 5);
        }
    }, []);

    // Scroll toolbar smoothly
    const scrollToolbar = useCallback((direction) => {
        if (toolbarRef.current) {
            const scrollAmount = 200; // pixels to scroll
            const targetScroll = direction === 'left' 
                ? toolbarRef.current.scrollLeft - scrollAmount
                : toolbarRef.current.scrollLeft + scrollAmount;
            
            toolbarRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
            
            // Check overflow after scroll completes
            setTimeout(checkToolbarOverflow, 350);
        }
    }, [checkToolbarOverflow]);

    // Throttle function to limit observer frequency
    const throttle = useCallback((func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }, []);

    // Throttled height update function
    const updateAppBarHeight = useCallback(throttle((firstHeight, secondHeight = 56) => {
        setFirstAppBarHeight(firstHeight);
        const total = firstHeight + secondHeight;
        setTotalAppBarHeight(total);
        // Update CSS custom property for vertical tabs positioning
        document.documentElement.style.setProperty('--app-bar-height', `${total}px`);
    }, 100), [throttle]);

    // Calculate total height from both AppBars
    const calculateTotalHeight = useCallback(() => {
        const firstHeight = firstAppBarRef.current?.offsetHeight || 120;
        const secondHeight = secondAppBarRef.current?.offsetHeight || 56;
        updateAppBarHeight(firstHeight, secondHeight);
    }, [updateAppBarHeight]);

    // Check overflow on mount, resize, and when toolbar content changes
    useEffect(() => {
        const checkWithDelay = () => {
            // Small delay to ensure toolbar is rendered
            setTimeout(checkToolbarOverflow, 100);
        };
        
        checkWithDelay();
        window.addEventListener('resize', checkToolbarOverflow);
        
        // Observe toolbar content changes
        const observer = new MutationObserver(checkToolbarOverflow);
        if (toolbarRef.current) {
            observer.observe(toolbarRef.current, {
                childList: true,
                subtree: true,
            });
        }
        
        // Observe both AppBars height changes with throttling
        const resizeObserver = new ResizeObserver((entries) => {
            // Debounce multiple resize events
            setTimeout(calculateTotalHeight, 50);
        });
        
        if (firstAppBarRef.current) {
            resizeObserver.observe(firstAppBarRef.current);
        }
        
        if (secondAppBarRef.current) {
            resizeObserver.observe(secondAppBarRef.current);
        }
        
        // Set initial heights immediately to prevent shift
        calculateTotalHeight();
        
        return () => {
            window.removeEventListener('resize', checkToolbarOverflow);
            observer.disconnect();
            resizeObserver.disconnect();
        };
    }, [checkToolbarOverflow, calculateTotalHeight]);

    // const editorState = activeEditor.getEditorState();
    // const jsonString = JSON.stringify(editorState);

    // const {
    //     saveEditorContent,
    //     editorStateRef,
    // } = useContext(UnitContext);

    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let element =
                anchorNode.getKey() === 'root'
                    ? anchorNode
                    : $findMatchingParent(anchorNode, (e) => {
                        const parent = e.getParent();
                        return parent !== null && $isRootOrShadowRoot(parent);
                    });

            if (element === null) {
                element = anchorNode.getTopLevelElementOrThrow();
            }

            const elementKey = element.getKey();
            const elementDOM = activeEditor.getElementByKey(elementKey);

            // Update text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsSubscript(selection.hasFormat('subscript'));
            setIsSuperscript(selection.hasFormat('superscript'));
            setIsCode(selection.hasFormat('code'));
            // Note: $isParentElementRTL requires active editor context, cannot be called in .read()
            // setIsRTL($isParentElementRTL(selection));

            // Update links
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }

            const tableNode = $findMatchingParent(node, $isTableNode);
            if ($isTableNode(tableNode)) {
                setRootType('table');
            } else {
                setRootType('root');
            }

            if (elementDOM !== null) {
                setSelectedElementKey(elementKey);
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(
                        anchorNode,
                        ListNode,
                    );
                    const type = parentList
                        ? parentList.getListType()
                        : element.getListType();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element)
                        ? element.getTag()
                        : element.getType();
                    if (type in blockTypeToBlockName) {
                        setBlockType(type);
                    }
                    if ($isCodeNode(element)) {
                        const language =
                            element.getLanguage();
                        setCodeLanguage(
                            language ? CODE_LANGUAGE_MAP[language] || language : '',
                        );
                        return;
                    }
                }
            }
            // Handle buttons
            setFontSize(
                $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
            );
            setFontColor(
                $getSelectionStyleValueForProperty(selection, 'color', '#000'),
            );
            setBgColor(
                $getSelectionStyleValueForProperty(
                    selection,
                    'background-color',
                    '#fff',
                ),
            );
            setFontFamily(
                $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
            );
        }
    }, [activeEditor]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                newEditor.getEditorState().read(() => {
                    $updateToolbar();
                });
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL,
        );
    }, [editor, $updateToolbar]);

    useEffect(() => {
        return mergeRegister(
            editor.registerEditableListener((editable) => {
                setIsEditable(editable);
            }),
            activeEditor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            activeEditor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            activeEditor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        );
    }, [$updateToolbar, activeEditor, editor]);

    const applyStyleText = useCallback(
        (styles) => {
            activeEditor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, styles);
                }
            });
        },
        [activeEditor],
    );

    const clearFormatting = useCallback(() => {
        activeEditor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor;
                const focus = selection.focus;
                const nodes = selection.getNodes();

                if (anchor.key === focus.key && anchor.offset === focus.offset) {
                    return;
                }

                nodes.forEach((node, idx) => {
                    // We split the first and last node by the selection
                    // So that we don't format unselected text inside those nodes
                    if ($isTextNode(node)) {
                        if (idx === 0 && anchor.offset !== 0) {
                            node = node.splitText(anchor.offset)[1] || node;
                        }
                        if (idx === nodes.length - 1) {
                            node = node.splitText(focus.offset)[0] || node;
                        }

                        if (node.__style !== '') {
                            node.setStyle('');
                        }
                        if (node.__format !== 0) {
                            node.setFormat(0);
                            $getNearestBlockElementAncestorOrThrow(node).setFormat('');
                        }
                    } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
                        node.replace($createParagraphNode(), true);
                    } else if ($isDecoratorBlockNode(node)) {
                        node.setFormat('');
                    }
                });
            }
        });
    }, [activeEditor]);

    useEffect(() => {
        return activeEditor.registerCommand(
            KEY_MODIFIER_COMMAND,
            (payload) => {
                const event = payload;
                
                // Prevent browser defaults for Ctrl+Shift combinations EARLY
                // This must happen before context checks to prevent browser from handling these events
                if (event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey) {
                    // Check if it's one of our handled Ctrl+Shift shortcuts
                    const handledKeys = ['KeyX', 'Digit0', 'Digit1', 'Digit2', 'Digit3', 'KeyC', 'Digit7', 'Digit8', 'KeyL', 'KeyE', 'KeyR', 'KeyJ'];
                    if (handledKeys.includes(event.code)) {
                        event.preventDefault();
                    }
                }
                
                // Check if we're in a special context that should handle its own shortcuts
                const selection = activeEditor.getEditorState().read(() => $getSelection());
                
                if (!$isRangeSelection(selection)) {
                    return false; // Not a text selection
                }
                
                // Check if we're in a table or code block - let specialized handlers deal with it
                const anchorNode = selection.anchor.getNode();
                const parent = anchorNode.getParent();
                
                if ($isCodeNode(parent) || $isTableNode(parent)) {
                    return false; // Let specialized handlers deal with it
                }
                
                // TEXT FORMATTING SHORTCUTS (Ctrl/⌘ + Key)
                
                // Bold: Ctrl/⌘+B
                if (isShortcut(event, 'KeyB', { mod: true })) {
                    event.preventDefault();
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                    return true;
                }
                
                // Italic: Ctrl/⌘+I
                if (isShortcut(event, 'KeyI', { mod: true })) {
                    event.preventDefault();
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                    return true;
                }
                
                // Underline: Ctrl/⌘+U
                if (isShortcut(event, 'KeyU', { mod: true })) {
                    event.preventDefault();
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                    return true;
                }
                
                // Strikethrough: Ctrl+Shift+X (Ctrl-only to avoid conflicts)
                // preventDefault called early above
                if (isShortcut(event, 'KeyX', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                    return true;
                }
                
                // Clear formatting: Ctrl+Shift+0 (Ctrl-only, avoids conflicts)
                // preventDefault called early above
                if (isShortcut(event, 'Digit0', { ctrl: true, shift: true })) {
                    clearFormatting();
                    return true;
                }
                
                // BLOCK TYPE SHORTCUTS (Ctrl+Shift - works on Mac without conflicts!)
                
                // Heading 1: Ctrl+Shift+1 (uses Ctrl key on both Mac and Windows)
                // preventDefault called early above
                if (isShortcut(event, 'Digit1', { ctrl: true, shift: true })) {
                    activeEditor.update(() => {
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createHeadingNode('h1'));
                        }
                    });
                    return true;
                }
                
                // Heading 2: Ctrl+Shift+2
                // preventDefault called early above
                if (isShortcut(event, 'Digit2', { ctrl: true, shift: true })) {
                    activeEditor.update(() => {
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createHeadingNode('h2'));
                        }
                    });
                    return true;
                }
                
                // Heading 3: Ctrl+Shift+3
                // preventDefault called early above
                if (isShortcut(event, 'Digit3', { ctrl: true, shift: true })) {
                    activeEditor.update(() => {
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createHeadingNode('h3'));
                        }
                    });
                    return true;
                }
                
                // Quote: Ctrl+' (Ctrl-only, avoids conflicts)
                if (isShortcut(event, 'Quote', { ctrl: true })) {
                    event.preventDefault();
                    activeEditor.update(() => {
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createQuoteNode());
                        }
                    });
                    return true;
                }
                
                // Code Block: Ctrl+Shift+C (Ctrl-only on both platforms)
                // preventDefault called early above
                if (isShortcut(event, 'KeyC', { ctrl: true, shift: true })) {
                    activeEditor.update(() => {
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createCodeNode());
                        }
                    });
                    return true;
                }
                
                // LIST SHORTCUTS (Ctrl+Shift, not Cmd+Shift)
                
                // Bullet List: Ctrl+Shift+8
                // preventDefault called early above
                if (isShortcut(event, 'Digit8', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                    return true;
                }
                
                // Numbered List: Ctrl+Shift+7
                // preventDefault called early above
                if (isShortcut(event, 'Digit7', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                    return true;
                }
                
                // ALIGNMENT SHORTCUTS (Ctrl+Shift only - avoids Mac conflicts)
                
                // Align Left: Ctrl+Shift+L
                // preventDefault called early above
                if (isShortcut(event, 'KeyL', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
                    return true;
                }
                
                // Align Center: Ctrl+Shift+E
                // preventDefault called early above
                if (isShortcut(event, 'KeyE', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                    return true;
                }
                
                // Align Right: Ctrl+Shift+R
                // preventDefault called early above
                if (isShortcut(event, 'KeyR', { ctrl: true, shift: true })) {
                    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                    return true;
                }
                
                // Justify: Ctrl+Shift+J
                // preventDefault called early above
                if (isShortcut(event, 'KeyJ', { ctrl: true, shift: true})) {
                    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                    return true;
                }
                
                // LINK SHORTCUT (Ctrl/⌘+K)
                
                // Insert/Edit Link: Ctrl/⌘+K
                if (isShortcut(event, 'KeyK', { mod: true })) {
                    event.preventDefault();
                    return activeEditor.dispatchCommand(
                        TOGGLE_LINK_COMMAND,
                        sanitizeUrl('https://'),
                    );
                }
                
                return false;
            },
            COMMAND_PRIORITY_NORMAL,
        );
    }, [activeEditor, isLink, clearFormatting]);

    const onFontColorSelect = useCallback(
        (value) => {
            applyStyleText({ color: value });
        },
        [applyStyleText],
    );

    const onBgColorSelect = useCallback(
        (value) => {
            applyStyleText({ 'background-color': value });
        },
        [applyStyleText],
    );

    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'));
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    const onCodeLanguageSelect = useCallback(
        (value) => {
            activeEditor.update(() => {
                if (selectedElementKey !== null) {
                    const node = $getNodeByKey(selectedElementKey);
                    if ($isCodeNode(node)) {
                        node.setLanguage(value);
                    }
                }
            });
        },
        [activeEditor, selectedElementKey],
    );
    const insertGifOnClick = (payload) => {
        activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    };

    return (
        <>
            <style global jsx>{`
            .editor-toolbar button {
                min-width: 2.5rem;
                padding: 0.2rem 0.5rem;
                margin: 0 0.1rem;
                font-size: 0.875rem;
                white-space: nowrap;
            }

            .editor-toolbar button .text {
                margin-left: 0.25rem;
            }

            .editor-toolbar button:has(.text) {
                min-width: auto;
                padding: 0.25rem 0.75rem;
            }

            .editor-toolbar button.active {
                background-color: #e0e0e0;
            }
            `}</style>
            <div ref={ref}>
            <AppBar
                ref={firstAppBarRef}
                position="fixed"
                color="default"
                sx={{
                    overflowX: 'visible',
                    overflowY: 'visible',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(7px)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'auto',
                }}
            >
                <MainToolbar />
                <UnitTitleDescriptionEditor />
            </AppBar>
            <AppBar
                ref={secondAppBarRef}
                position="fixed"
                color="default"
                sx={{
                    overflowX: 'visible',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    top: firstAppBarHeight > 0 ? `${firstAppBarHeight}px` : 'auto',
                    opacity: firstAppBarHeight > 0 ? 1 : 0,
                    transition: 'opacity 0.1s ease-in-out',
                    paddingTop: '0.25rem',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.25rem',
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(7px)',
                }}
            >
                {/* Left scroll arrow */}
                {showLeftArrow && (
                    <Button
                        color="inherit"
                        onClick={() => scrollToolbar('left')}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            minWidth: '2.5rem',
                            height: '2rem',
                            padding: '0.2rem',
                            borderRadius: 0,
                            backgroundColor: '#ffffff',
                            border: '1px solid #e0e0e0',
                            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                            '&:hover': {
                                backgroundColor: '#f5f5f5',
                                boxShadow: '2px 0 6px rgba(0,0,0,0.15)',
                            },
                        }}
                        title="Scroll toolbar left"
                        aria-label="Scroll toolbar left"
                    >
                        <KeyboardArrowLeftIcon />
                    </Button>
                )}
                
                <Toolbar
                    ref={toolbarRef}
                    className='editor-toolbar'
                    variant="dense"
                    disableGutters={true}
                    onScroll={checkToolbarOverflow}
                    sx={{
                        margin: 'auto',
                        width: '100%',
                        maxWidth: '100%',
                        paddingLeft: '3rem',
                        paddingRight: '3rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        minHeight: '2.5rem',
                        overflowX: 'auto',
                        overflowY: 'visible',
                        scrollbarWidth: 'none', // Firefox
                        '&::-webkit-scrollbar': {
                            display: 'none' // Chrome, Safari
                        },
                        msOverflowStyle: 'none', // IE/Edge
                    }}
                >
                    <Button
                        color="inherit"
                        disabled={!canUndo || !isEditable}
                        onClick={() => {
                            activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
                        }}
                        title={IS_APPLE ? t('toolBarPlugin.undo') + ' (⌘Z)' : t('toolBarPlugin.undo') + ' (Ctrl+Z)'}

                    >
                        <UndoIcon />
                    </Button>
                    <Button
                        color="inherit"
                        disabled={!canRedo || !isEditable}
                        onClick={() => {
                            activeEditor.dispatchCommand(REDO_COMMAND, undefined);
                        }}
                        title={IS_APPLE ? t('toolBarPlugin.redo') + ' (⌘Y)' : t('toolBarPlugin.redo') + ' (Ctrl+Y)'}

                    >
                        <RedoIcon />
                    </Button>

                    <Save />

                    <BlockFormatDropDown
                        disabled={!isEditable}
                        blockType={blockType}
                        rootType={rootType}
                        editor={activeEditor}
                    />


                    <FontDropDown
                        disabled={!isEditable}
                        style={'font-family'}
                        value={fontFamily}
                        editor={activeEditor}
                    />

                    <FontDropDown
                        disabled={!isEditable}
                        style={'font-size'}
                        value={fontSize}
                        editor={activeEditor}
                    />
                    <Divider />
                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={() => {
                            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                        }}
                        className={(isBold ? 'active' : '')}
                        title={IS_APPLE ? t('toolBarPlugin.bold') + ' (⌘B)' : t('toolBarPlugin.bold') + ' (Ctrl+B)'}
                        type="button"
                        aria-label={t('toolBarPlugin.formatBold') + ` ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
                        <FormatBoldIcon />
                    </Button>
                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={() => {
                            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                        }}
                        className={(isItalic ? 'active' : '')}
                        title={IS_APPLE ? t('toolBarPlugin.italic') + ' (⌘I)' : t('toolBarPlugin.italic') + ' (Ctrl+I)'}
                        type="button"
                        aria-label={t('toolBarPlugin.formatItalic') + ` ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
                        <FormatItalicIcon />
                    </Button>
                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={() => {
                            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                        }}
                        className={(isUnderline ? 'active' : '')}
                        title={IS_APPLE ? t('toolBarPlugin.underline') + ' (⌘U)' : t('toolBarPlugin.underline') + ' (Ctrl+U)'}
                        type="button"
                        aria-label={t('toolBarPlugin.formatUnderline') + ` ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
                        <FormatUnderlinedIcon />
                    </Button>

                    <DropdownColorPicker
                        disabled={!isEditable}
                        buttonAriaLabel={t('toolBarPlugin.formattingTextColor')}
                        color={fontColor}
                        onChange={onFontColorSelect}
                        title="text color"
                        editor={activeEditor}
                    />
                    <DropdownColorPicker
                        disabled={!isEditable}
                        buttonAriaLabel={t('toolBarPlugin.formattingBackgroundColor')}
                        color={bgColor}
                        onChange={onBgColorSelect}
                        title="bg color"
                        isBackgroundColor={true}
                        editor={activeEditor}
                    />


                    <TextFormatDropDown
                        activeEditor={activeEditor}
                        isStrikethrough={isStrikethrough}
                        isSubscript={isSubscript}
                        isSuperscript={isSuperscript}
                        isCode={isCode}
                        disabled={!isEditable}
                        clearFormatting={clearFormatting}
                    />

                    <TextAlignmentDropdown
                        disabled={!isEditable}
                        activeEditor={activeEditor}
                        isRTL={isRTL}
                    />

                    <Divider sx={{ margin: '0.25rem' }} orientation="vertical" variant="middle" flexItem />

                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={insertLink}
                        className={(isLink ? 'active' : '')}
                        aria-label={t('toolBarPlugin.insertLink')}
                        title={t('toolBarPlugin.insertLink')}
                    >
                        <AddLinkIcon />
                    </Button>

                    <InsertNodeDropDown
                        disabled={!isEditable}
                        editor={editor}
                        blockType={blockType}
                        setOpenTab={setOpen}
                        setTabValue={setTabValue}
                    />

                    <Divider sx={{ margin: '0.25rem' }} orientation="vertical" variant="middle" flexItem />

                    <PreviewModal />

                    <StatusSelect />

                    <DeleteModal />

                </Toolbar>
                
                {/* Right scroll arrow */}
                {showRightArrow && (
                    <Button
                        color="inherit"
                        onClick={() => scrollToolbar('right')}
                        sx={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            minWidth: '2.5rem',
                            height: '2rem',
                            padding: '0.2rem',
                            borderRadius: 0,
                            backgroundColor: '#ffffff',
                            border: '1px solid #e0e0e0',
                            boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                            '&:hover': {
                                backgroundColor: '#f5f5f5',
                                boxShadow: '-2px 0 6px rgba(0,0,0,0.15)',
                            },
                        }}
                        title="Scroll toolbar right"
                        aria-label="Scroll toolbar right"
                    >
                        <KeyboardArrowRightIcon />
                    </Button>
                )}
            </AppBar>

        {/*






        {blockType === 'code' ? (
        //         <DropDown
        //             disabled={!isEditable}
        //             buttonClassName="toolbar-item code-language"
        //             buttonLabel={getLanguageFriendlyName(codeLanguage)}
        //             buttonAriaLabel="Select language">
        //             {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
        //                 return (
        //                     <MenuItem
        //                         className={`item ${dropDownActiveClass(
        //                             value === codeLanguage,
        //                         )}`}
        //                         onClick={() => onCodeLanguageSelect(value)}
        //                         key={value}>
        //                         <span className="text">{name}</span>
        //                     </MenuItem>
        //                 );
        //             })}
        //         </DropDown>
        //     ) : (
        //         

        //             <Divider />
        //             {rootType === 'table' && (
        //                 <>
        //                     <Menu
        //                         disabled={!isEditable}
        //                         buttonClassName="toolbar-item spaced"
        //                         buttonLabel="Table"
        //                         buttonAriaLabel="Open table toolkit"
        //                         buttonIconClassName="icon table secondary">
        //                         <MenuItem
        //                             onClick={() => {

        //                             }}
        //                             className="item">
        //                             <span className="text">TODO</span>
        //                         </MenuItem>
        //                     </Menu>
        //                     <Divider />
        //                 </>
        //             )}
        //             <Menu
        //                 disabled={!isEditable}
        //                 buttonClassName="toolbar-item spaced"
        //                 buttonLabel="Insert"
        //                 buttonAriaLabel="Insert specialized editor node"
        //                 buttonIconClassName="icon plus">
        //                 <MenuItem
        //                     onClick={() => {
        //                         activeEditor.dispatchCommand(
        //                             INSERT_HORIZONTAL_RULE_COMMAND,
        //                             undefined,
        //                         );
        //                     }}
        //                     className="item">
        //                     <i className="icon horizontal-rule" />
        //                     <span className="text">Horizontal Rule</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         activeEditor.dispatchCommand(INSERT_PAGE_BREAK, undefined);
        //                     }}
        //                     className="item">
        //                     <i className="icon page-break" />
        //                     <span className="text">Page Break</span>
        //                 </MenuItem>
        // <MenuItem
        //     onClick={() => {
        //         showModal('Insert Image', (onClose) => (
        //             <InsertImageDialog
        //                 activeEditor={activeEditor}
        //                 onClose={onClose}
        //             />
        //         ));
        //     }}
        //     className="item">
        //     <i className="icon image" />
        //     <span className="text">Image</span>
        // </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         showModal('Insert Inline Image', (onClose) => (
        //                             <InsertInlineImageDialog
        //                                 activeEditor={activeEditor}
        //                                 onClose={onClose}
        //                             />
        //                         ));
        //                     }}
        //                     className="item">
        //                     <i className="icon image" />
        //                     <span className="text">Inline Image</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() =>
        //                         insertGifOnClick({
        //                             altText: 'Cat typing on a laptop',
        //                             src: catTypingGif,
        //                         })
        //                     }
        //                     className="item">
        //                     <i className="icon gif" />
        //                     <span className="text">GIF</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         activeEditor.dispatchCommand(
        //                             INSERT_EXCALIDRAW_COMMAND,
        //                             undefined,
        //                         );
        //                     }}
        //                     className="item">
        //                     <i className="icon diagram-2" />
        //                     <span className="text">Excalidraw</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         showModal('Insert Table', (onClose) => (
        //                             <InsertTableDialog
        //                                 activeEditor={activeEditor}
        //                                 onClose={onClose}
        //                             />
        //                         ));
        //                     }}
        //                     className="item">
        //                     <i className="icon table" />
        //                     <span className="text">Table</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         showModal('Insert Table', (onClose) => (
        //                             <InsertNewTableDialog
        //                                 activeEditor={activeEditor}
        //                                 onClose={onClose}
        //                             />
        //                         ));
        //                     }}
        //                     className="item">
        //                     <i className="icon table" />
        //                     <span className="text">Table (Experimental)</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         showModal('Insert Poll', (onClose) => (
        //                             <InsertPollDialog
        //                                 activeEditor={activeEditor}
        //                                 onClose={onClose}
        //                             />
        //                         ));
        //                     }}
        //                     className="item">
        //                     <i className="icon poll" />
        //                     <span className="text">Poll</span>
        //                 </MenuItem>

        //                 <MenuItem
        //                     onClick={() => {
        //                         showModal('Insert Equation', (onClose) => (
        //                             <InsertEquationDialog
        //                                 activeEditor={activeEditor}
        //                                 onClose={onClose}
        //                             />
        //                         ));
        //                     }}
        //                     className="item">
        //                     <i className="icon equation" />
        //                     <span className="text">Equation</span>
        //                 </MenuItem>
        //                 <MenuItem
        //                     onClick={() => {
        //                         editor.update(() => {
        //                             const root = $getRoot();
        //                             const stickyNode = $createStickyNode(0, 0);
        //                             root.append(stickyNode);
        //                         });
        //                     }}
        //                     className="item">
        //                     <i className="icon sticky" />
        //                     <span className="text">Sticky Note</span>
        //                 </MenuItem>
        // <MenuItem
        //     onClick={() => {
        //         editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
        //     }}
        //     className="item">
        //     <i className="icon caret-right" />
        //     <span className="text">Collapsible container</span>
        // </MenuItem>
        // {EmbedConfigs.map((embedConfig) => (
        //     <MenuItem
        //         key={embedConfig.type}
        //         onClick={() => {
        //             activeEditor.dispatchCommand(
        //                 INSERT_EMBED_COMMAND,
        //                 embedConfig.type,
        //             );
        //         }}
        //         className="item">
        //         {embedConfig.icon}
        //         <span className="text">{embedConfig.contentName}</span>
        //     </MenuItem>
        // ))}
        //             </Menu>
        //         </>
        //     )}
        //     <Divider />
        */}
            </div>
        </>
    );
});

export default ToolBarPlugin;