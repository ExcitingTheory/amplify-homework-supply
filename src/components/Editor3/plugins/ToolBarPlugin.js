import {
    $createCodeNode,
    $isCodeNode,
    CODE_LANGUAGE_FRIENDLY_NAME_MAP,
    CODE_LANGUAGE_MAP,
    getLanguageFriendlyName,
} from '@lexical/code';
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
    DEPRECATED_$isGridSelection,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,
    KEY_MODIFIER_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useState, useContext } from 'react';
import * as React from 'react';

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
import DraftIcon from '@mui/icons-material/Drafts';
import PublishedIcon from '@mui/icons-material/CloudUpload';
import ArchivedIcon from '@mui/icons-material/Archive';

import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

import CalendarIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';

// import { $isAtNodeEnd } from '@lexical/selection';

import UnitContext from '../../../context/unitContext';
// import SectionContext from '../../../context/sectionContext';

import { AutoSave } from '../components/AutoSave';


import {INSERT_LAYOUT_COMMAND} from '../plugins/LayoutPlugin';

import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';

import {
    INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND
} from './MeaningAssociationPlugin';

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

import { Noto_Sans_JP, Oswald, Cormorant, DM_Sans, Inter } from 'next/font/google'



const drawerWidth = 400;


const notoSansJp = Noto_Sans_JP({
  weight: '400',
  preload: false,
})

const oswald = Oswald({
  weight: '400',
  preload: false,
})

const cormorant = Cormorant({
  weight: '400',
  preload: false,
})

const dmSans = DM_Sans({
  weight: '400',
  preload: false,
})

const inter = Inter({
  weight: '400',
  preload: false,
})


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

// if morning say good morning
// if afternoon say good afternoon
// if evening say good evening

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
        
        onClick={handleOpen}
        >

                 <ColumnsIcon />
              <span className="text">Columns Layout</span>
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
                            Choose a layout
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
                            <Button variant='contained' color='primary' onClick={onClick}>Insert</Button>
                        </Stack>

                    </Card>
                </Modal>
            </Box>
        </>
    );

}

function DeleteModal() {
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
                            Are you sure you want to delete this Unit?
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
                            <Button variant='contained' color='error' onClick={handleDelete}>Delete</Button>
                            <Box sx={{ margin: '1rem' }} />
                            <Button variant='contained' color='primary' onClick={handleClose}>Cancel</Button>
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
                        height: '100vh',
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
                            Close Preview of {name || 'Untitled Unit'}
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
        <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Head>
                <title>{name}</title>
            </Head>
            {!editName &&
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} onClick={(event) => {
                    setEditName(true)
                }}>
                    {newName || 'Untitled Unit'}
                </Typography>
            }
            {editName &&
                <TextField
                    size='small'
                    variant='standard'
                    fullWidth
                    value={newName}
                    placeholder='Untitled Unit'
                    onChange={(event) => { onNameChange(event) }}
                    inputRef={(input) => {
                        if (input != null) {
                            input.focus();
                        }
                    }}
                    onBlur={async (event) => {
                        event.preventDefault()
                        await saveName(newName || 'Untitled Unit')
                        setEditName(false)
                        // console.log('name saved', name)
                    }}
                />
            }

            {!editDescription &&
                <Typography variant="p" component="div" sx={{ flexGrow: 1 }} onClick={(event) => {
                    // event.preventDefault()
                    setEditDescription(true)
                }}>
                    {newDescription || 'Add Descripton'}
                </Typography>
            }
            {editDescription &&
                <TextField
                    size='small'
                    variant='standard'
                    fullWidth
                    // label={`Answer ${index + 1}`}
                    value={newDescription}
                    placeholder='Add Description'
                    onChange={(event) => { onDescriptionChange(event) }}
                    inputRef={(input) => {
                        if (input != null) {
                            input.focus();
                        }
                    }}
                    onBlur={async (event) => {
                        event.preventDefault()
                        await saveDescription(newDescription || 'Add Descripton')
                        setEditDescription(false)
                        // console.log('description saved', description)
                    }}
                />
            }
        </Box>
    )
}

const StatusSelect = () => {
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
                    <InputLabel id="formatting-select-label">Status</InputLabel>
                    <Select
                        labelId="status-select-label"
                        id="status-select"
                        value={status}
                        label="Status"
                        onChange={handleChange}
                    >

                        <MenuItem
                            value="DRAFT"
                        >
                            <DraftIcon />&nbsp;
                            <span className='text'>Draft</span>
                        </MenuItem>

                        <MenuItem
                            value="PUBLISHED"
                        >
                            <PublishedIcon />&nbsp;
                            <span className='text'>Published</span>
                        </MenuItem>

                        <MenuItem
                            value="ARCHIVED"
                        >
                            <ArchivedIcon />&nbsp;
                            <span className='text'>Archived</span>
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
                title="Text Alignment"
                aria-label="Formatting options for text alignment"
                color='inherit'
            >
                <FormatAlignLeftIcon />&nbsp;
                <span className="text">Align</span>
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
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
                    }}
                >
                    <FormatAlignLeftIcon />&nbsp;
                    <span className="text">Left Align</span>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                    }}
                >
                    <FormatAlignCenterIcon />&nbsp;
                    <span className="text">Center Align</span>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                    }}
                >
                    <FormatAlignRightIcon />&nbsp;
                    <span className="text">Right Align</span>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                    }}
                >
                    <FormatAlignJustifyIcon />&nbsp;
                    <span className="text">Justify Align</span>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                    }}
                    className="item">
                    {isRTL ? (
                        <FormatIndentIncreaseIcon />
                    ) : (
                        <FormatIndentDecreaseIcon />
                    )
                    }
                    <span className="text">Outdent</span>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
                    }}
                    className="item">
                    <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
                    {isRTL ? (
                        <FormatIndentDecreaseIcon />
                    ) : (
                        <FormatIndentIncreaseIcon />
                    )
                    }
                    <span className="text">Indent</span>
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
                title="Insert Item"
                aria-label="Insert Item Menu"
                color='inherit'
            >
                <AddIcon />&nbsp;
                <span className="text">Insert</span>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >

                <MenuItem
                    onClick={() => {
                        setTabValue(0)
                        setOpenTab(true)
                        handleClose()
                    }}
                    className="item"
                    title="Due Date"
                    aria-label="Due Date">
                    <CalendarIcon />&nbsp;
                    <span className="text">Due Date</span>

                </MenuItem>

                <MenuItem
                    onClick={() => {
                        setTabValue(0)
                        setOpenTab(true)
                        handleClose()
                    }}
                    className="item"
                    title="Timer"
                    aria-label="Timer">
                    <TimerIcon />&nbsp;
                    <span className="text">Timer</span>

                </MenuItem>

                <MenuItem
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND,
                            undefined,
                        );
                    }}
                    title="Meaning Association"
                    aria-label="Meaning Association">
                    <WordBlockIcon />&nbsp;
                    <span className="text">Meaning Association</span>
                </MenuItem>

                 {/**
                  * Add Short Answer Menu Item
                  */}

                  <MenuItem
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
                    <span className="text">Short Answer: Vocabulary</span>
                </MenuItem>

                <MenuItem
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
                    <span className="text">Short Answer: Custom</span>
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
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_PLAYLIST_COMMAND,
                            undefined,
                        );
                    }}
                    title="Audio"
                    aria-label="Audio">
                    <AudiotrackIcon />&nbsp;
                    <span className="text">Audio Playlist</span>
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_QUIZ_COMMAND,
                            undefined,
                        );
                    }}
                    title="Quiz"
                    aria-label="Quiz">
                    <QuizIcon />&nbsp;
                    <span className="text">Multiple Choice Quiz</span>
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        editor.dispatchCommand(
                            INSERT_HORIZONTAL_RULE_COMMAND,
                            undefined,
                        );
                    }}
                    className="item">
                    <HorizontalRuleIcon />&nbsp;
                    <span className="text">Horizontal Rule</span>
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
                title="More Text Formatting"
                aria-label="Formatting options for text styles"
                color='inherit'
            >
                <MoreVertIcon />
                <span className="text">Text</span>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
            >
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(
                            FORMAT_TEXT_COMMAND,
                            'strikethrough',
                        );
                    }}
                    className={isStrikethrough ? 'active' : ''}
                    title="Strikethrough"
                    aria-label="Format text with a strikethrough">
                    <FormatStrikethroughIcon />&nbsp;
                    <span className="text">Strikethrough</span>

                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                    }}
                    className={isSubscript ? 'active' : ''}
                    title="Subscript"
                    aria-label="Format text with a subscript">
                    <SubscriptIcon />&nbsp;
                    <span className="text">Subscript</span>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        activeEditor.dispatchCommand(
                            FORMAT_TEXT_COMMAND,
                            'superscript',
                        );
                    }}
                    className={isSuperscript ? 'active' : ''}
                    title="Superscript"
                    aria-label="Format text with a superscript">
                    <SuperscriptIcon />&nbsp;
                    <span className="text">Superscript</span>
                </MenuItem>
                <MenuItem
                    onClick={clearFormatting}
                    className="item"
                    title="Clear text formatting"
                    aria-label="Clear all text formatting">
                    <FormatClearIcon />&nbsp;
                    <span className="text">Clear Formatting</span>
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
                $isRangeSelection(selection) ||
                DEPRECATED_$isGridSelection(selection)
            ) {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
    };

    const formatHeading = (headingSize) => {
        if (blockType !== headingSize) {
            editor.update(() => {
                const selection = $getSelection();
                if (
                    $isRangeSelection(selection) ||
                    DEPRECATED_$isGridSelection(selection)
                ) {
                    $setBlocksType(selection, () => $createHeadingNode(headingSize));
                }
            });
        }
    };

    const formatWordList = () => {
        if (blockType !== 'word') {
            editor.dispatchCommand(INSERT_WORD_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatBulletList = () => {
        if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatCheckList = () => {
        if (blockType !== 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatNumberedList = () => {
        if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatQuote = () => {
        if (blockType !== 'quote') {
            editor.update(() => {
                const selection = $getSelection();
                if (
                    $isRangeSelection(selection) ||
                    DEPRECATED_$isGridSelection(selection)
                ) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            });
        }
    };

    const formatCode = () => {
        if (blockType !== 'code') {
            editor.update(() => {
                let selection = $getSelection();

                if (
                    $isRangeSelection(selection) ||
                    DEPRECATED_$isGridSelection(selection)
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
    };

    return (
        <>
            <style global jsx>{`
        #block-format-select {
            padding: 0.25rem 1rem 0.25rem 0.25rem;
            height: 2rem;
        }

        #block-format-select > span.icon {
            font-size: 1.25rem;
            margin-left: 0.25rem;
        }

        ul[aria-labelledby="block-format-select-label"] > li > span.menu-htext,
        ul[aria-labelledby="block-format-select-label"] > li > span.text,
        #block-format-select > span.text,
        #block-format-select > span.menu-htext {
            color: #505050;
        }

        #block-format-select > svg,
        #block-format-select > span.icon,
        #block-format-select > span.menu-htext {
            position: relative;
            top: 0.25rem;
        }

        `}</style>
            <FormControl
                id='block-format-form'
                style={{
                    width: '10rem',
                    margin: '0.25rem',
                }}
            >
                <InputLabel id="block-format-select-label">Block Format</InputLabel>
                <Select
                    labelId="block-format-select-label"
                    id="block-format-select"
                    value={blockType}
                    label="Block Format"
                >

                    <MenuItem
                        value="paragraph"
                        onClick={formatParagraph}
                    >
                        <ParagraphIcon />&nbsp;
                        <span className='text'>Normal</span>
                    </MenuItem>
                    <MenuItem
                        value="h1"
                        onClick={() => formatHeading('h1')}
                    >
                        <span className='icon'>H1</span>&nbsp;
                        <span className='menu-htext'>Heading 1</span>
                    </MenuItem>
                    <MenuItem
                        value='h2'
                        onClick={() => formatHeading('h2')}
                    >
                        <span className='icon'>H2</span>&nbsp;
                        <span className='menu-htext'>Heading 2</span>
                    </MenuItem>
                    <MenuItem
                        value='h3'
                        onClick={() => formatHeading('h3')}
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
                    >
                        <FormatListBulletedIcon />&nbsp;
                        <span className='text'>Bulleted</span>
                    </MenuItem>
                    <MenuItem
                        value='number'
                        onClick={formatNumberedList}
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
                        onClick={formatQuote}
                    >
                        <FormatQuoteIcon />&nbsp;
                        <span className="text">Quote</span>
                    </MenuItem>
                    <MenuItem
                        value='code'
                        onClick={formatCode}
                    >
                        <CodeIcon />&nbsp;
                        <span className="text">Code Block</span>
                    </MenuItem>
                </Select>
            </FormControl>
        </>
    );
}

function FontDropDown({
    editor,
    value,
    style,
    disabled = false,
}) {
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
            handleClose();
        },

        [editor, style],
    );

    const buttonAriaLabel =
        style === 'font-family'
            ? 'Formatting options for font family'
            : 'Formatting options for font size';

    return (
        <>
        <style jsx global>{`
            html {
              font-family: ${notoSansJp.style.fontFamily} ${cormorant.style.fontFamily} ${inter.style.fontFamily} ${dmSans.style.fontFamily} ${oswald.style.fontFamily};
            }            
        `}</style>

            <Button
                aria-controls="font-menu"
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleOpen}
                disabled={disabled}
                className={'toolbar-item ' + style}
                title={style === 'font-family' ? 'Font' : 'Size'}
                aria-label={buttonAriaLabel}
                color='inherit'
            >
                {style === 'font-family' ? (
                    <FontDownloadIcon />
                ) : (
                    <FormatSizeIcon />
                )}
                <span className="text">
                    {style === 'font-family' ? 'Font' : 'Size'}
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


export default function ToolarPlugin({
    open,
    setOpen,
    setTabValue,
}) {
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
            setIsRTL($isParentElementRTL(selection));

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
                $updateToolbar();
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

    useEffect(() => {
        return activeEditor.registerCommand(
            KEY_MODIFIER_COMMAND,
            (payload) => {
                const event = payload;
                const { code, ctrlKey, metaKey } = event;

                if (code === 'KeyK' && (ctrlKey || metaKey)) {
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
    }, [activeEditor, isLink]);

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
                min-width: 1rem;
                padding: 0.2rem;
                margin: 0 0.2rem;
            }

            .editor-toolbar button.active {
                background-color: #e0e0e0;
            }
            `}</style>
            <AppBar
                position="fixed"
                color="default"
                sx={{
                    overflowX: 'visible',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(7px)',
                }}
            >
                <MainToolbar>
                    <UnitTitleDescriptionEditor />
                </MainToolbar>
            </AppBar>
            <AppBar
                position="fixed"
                color="default"
                sx={{
                    overflowX: 'auto',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    top: '5.5rem',
                    paddingTop: '0.5rem',
                    boxShadow: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.25rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(7px)',
                }}
            >
                <Toolbar
                    className='editor-toolbar'
                    variant="dense"
                    disableGutters={true}
                    sx={{
                        margin: 'auto'
                    }}
                >
                    <Button
                        color="inherit"
                        onClick={() => {
                            setOpen(!open);
                        }}
                        title="Toggle Sidebar"
                        aria-label="Toggle Sidebar"
                    > {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </Button>

                    <Button
                        color="inherit"
                        disabled={!canUndo || !isEditable}
                        onClick={() => {
                            activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
                        }}
                        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}

                    >
                        <UndoIcon />
                    </Button>
                    <Button
                        color="inherit"
                        disabled={!canRedo || !isEditable}
                        onClick={() => {
                            activeEditor.dispatchCommand(REDO_COMMAND, undefined);
                        }}
                        title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'}

                    >
                        <RedoIcon />
                    </Button>

                    <AutoSave />

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
                        title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'}
                        type="button"
                        aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'
                            }`}>
                        <FormatBoldIcon />
                    </Button>
                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={() => {
                            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                        }}
                        className={(isItalic ? 'active' : '')}
                        title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'}
                        type="button"
                        aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'
                            }`}>
                        <FormatItalicIcon />
                    </Button>
                    <Button
                        disabled={!isEditable}
                        color="inherit"
                        onClick={() => {
                            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                        }}
                        className={(isUnderline ? 'active' : '')}
                        title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'}
                        type="button"
                        aria-label={`Format text to underlined. Shortcut: ${IS_APPLE ? '⌘U' : 'Ctrl+U'
                            }`}>
                        <FormatUnderlinedIcon />
                    </Button>

                    <DropdownColorPicker
                        disabled={!isEditable}
                        buttonAriaLabel="Formatting text color"
                        color={fontColor}
                        onChange={onFontColorSelect}
                        title="text color"
                        editor={activeEditor}
                    />
                    <DropdownColorPicker
                        disabled={!isEditable}
                        buttonAriaLabel="Formatting background color"
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
                        aria-label="Insert link"
                        title="Insert link"
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
            </AppBar>
        </>






        //     {blockType === 'code' ? (
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

    );
}