#!/usr/bin/env tsx
/**
 * Add comprehensive UI metadata to English locale files
 * 
 * This script enhances English translation files with context about:
 * - Where each key appears in the UI
 * - Which components use the translation
 * - What user actions trigger this text
 * - Who sees this text (user roles)
 * 
 * IMPORTANT: This script extracts component descriptions from JSDoc/TSDoc docblocks
 * found at the top of component files in src/. Component functionality descriptions
 * are pulled from @fileoverview comments, not manually duplicated.
 * 
 * Based on comprehensive codebase analysis of:
 * - Component structure and usage patterns
 * - UI flows and user journeys
 * - Authentication and authorization rules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TranslationMetadata {
  value: string;
  _meta: {
    context: string;  // Where in UI this appears
    component: {
      location: string;  // File path(s) of component
      functionality: string;  // What the component does (from docblock)
    };
    usage: string;  // How this specific text is used
    impact: string;  // What happens/what this represents
    userType: 'all' | 'instructor' | 'student' | 'admin' | 'instructor+student';
    tone: 'casual' | 'polite-formal' | 'technical';
    category: 'button' | 'label' | 'heading' | 'message' | 'placeholder' | 'error' | 'status' | 'navigation';
  };
}

type LocaleData = Record<string, string | Record<string, any>>;
type MetadataMap = Record<string, TranslationMetadata | Record<string, any>>;

/**
 * Helper function to create metadata with component docblock lookup
 */
async function createMeta(
  value: string,
  context: string,
  componentLocation: string,
  usage: string,
  impact: string,
  userType: TranslationMetadata['_meta']['userType'],
  tone: TranslationMetadata['_meta']['tone'],
  category: TranslationMetadata['_meta']['category'],
  docblocks: Map<string, any>
): Promise<TranslationMetadata> {
  // Try to find component docblock
  const docblock = findDocblock(componentLocation, docblocks);
  
  return {
    value,
    _meta: {
      context,
      component: {
        location: componentLocation,
        functionality: docblock?.description || 'NEEDS_DOCBLOCK - Add @fileoverview comment to component file',
      },
      usage,
      impact,
      userType,
      tone,
      category,
    },
  };
}

/**
 * Auth namespace metadata
 * Based on: pages/profile.js, src/components/authenticator.js, cypress/e2e/workbook-spec.cy.ts
 */
async function getAuthMetadata(docblocks: Map<string, any>): Promise<MetadataMap> {
  return {
    sign_in: await createMeta(
      'Sign In',
      'Authentication modal primary action button',
      'src/components/Authenticator.js',
      'Button label clicked by users to submit credentials and authenticate',
      'Critical - primary authentication action. Initiates login flow to AWS Cognito',
      'all',
      'polite-formal',
      'button',
      docblocks
    ),
    sign_out: await createMeta(
      'Sign Out',
      'Header user menu dropdown action',
      'src/components/MainToolbar.js',
      'Menu item that logs user out of the platform',
      'Important - ends user session, clears DataStore, redirects to login',
      'all',
      'polite-formal',
      'button',
      docblocks
    ),
    sign_up: await createMeta(
      'Sign Up',
      'Authentication modal account creation button',
      'src/components/Authenticator.js',
      'Button that switches authentication modal to registration mode with name/email/password fields',
      'Important - initiates new user account creation flow',
      'all',
      'polite-formal',
      'button',
      docblocks
    ),
    username: {
      value: 'Username',
      _meta: {
        context: 'Login form field label (though app uses email as username)',
        component: {
          location: 'src/components/Authenticator.js, pages/profile.js',
          functionality: 'Authentication form component that handles AWS Cognito sign in/sign up flows',
        },
        usage: 'Label for authentication username input field',
        impact: 'Label for authentication username input field',
        userType: 'all',
        tone: 'polite-formal',
        category: 'label',
      },
    },
    password: {
      value: 'Password',
      _meta: {
        context: 'Login/signup form field label',
        component: {
          location: 'src/components/Authenticator.js, pages/profile.js',
          functionality: 'Authentication form and password change interface',
        },
        usage: 'Label for password input field during login or password change',
        impact: 'Label for password input field during login or password change',
        userType: 'all',
        tone: 'polite-formal',
        category: 'label',
      },
    },
    email: {
      value: 'Email',
      _meta: {
        context: 'Registration form, profile page email field',
        component: {
          location: 'src/components/Authenticator.js, pages/profile.js',
          functionality: 'Sign up form and user profile editor',
        },
        usage: 'Label for email input used as primary identifier (username)',
        impact: 'Label for email input used as primary identifier (username)',
        userType: 'all',
        tone: 'polite-formal',
        category: 'label',
      },
    },
  forgot_password: {
    value: 'Forgot Password?',
    _meta: {
      context: 'Link below login form password field',
      component: ['Authenticator'],
      impact: 'Initiates password reset flow, sends recovery email',
      userType: 'all',
      category: 'button',
    },
  },
  reset_password: {
    value: 'Reset Password',
    _meta: {
      context: 'Password recovery flow heading and submit button',
      component: ['Authenticator recovery flow'],
      impact: 'Confirms password reset submission after entering new password',
      userType: 'all',
      category: 'button',
    },
  },
  confirm_password: {
    value: 'Confirm Password',
    _meta: {
      context: 'Registration and password change forms',
      component: ['Authenticator signUp', 'ChangePasswordForm (profile.js)'],
      impact: 'Label for password confirmation field to prevent typos',
      userType: 'all',
      category: 'label',
    },
  },
};

/**
 * Common namespace metadata
 * Based on: pages/index.js, pages/section/[id].js, pages/profile.js, MainToolbar.js
 * App-wide UI elements used across multiple pages
 */
const commonMetadata: MetadataMap = {
  app: {
    name: {
      value: 'Homework Supply',
      _meta: {
        context: 'App title in header, browser tab title, about pages',
        component: ['MainToolbar', 'Head', 'common.app.tagline context'],
        impact: 'Primary branding, identifies the application',
        userType: 'all',
        category: 'heading',
      },
    },
    tagline: {
      value: 'eLearning Platform',
      _meta: {
        context: 'Subtitle beneath app name, marketing materials, about section',
        component: ['Landing pages', 'About pages'],
        impact: 'Describes platform purpose - eLearning platform for instructors and students',
        userType: 'all',
        category: 'heading',
      },
    },
  },
  actions: {
    save: {
      value: 'Save',
      _meta: {
        context: 'Form submission buttons, editor save button, profile updates',
        component: ['Editor Save button (ToolBarPlugin.js)', 'Profile forms', 'Unit/Section creation forms'],
        impact: 'Commits changes to database, persists user input',
        userType: 'all',
        category: 'button',
      },
    },
    cancel: {
      value: 'Cancel',
      _meta: {
        context: 'Dialog close buttons, form reset buttons',
        component: ['Modal dialogs', 'Profile forms', 'Confirmation dialogs'],
        impact: 'Discards changes, closes dialog without saving',
        userType: 'all',
        category: 'button',
      },
    },
    delete: {
      value: 'Delete',
      _meta: {
        context: 'Confirmation dialogs for removing units/sections/files',
        component: ['Unit management', 'Section management', 'File management'],
        impact: 'Permanently removes selected item from database',
        userType: 'instructor',
        category: 'button',
      },
    },
    edit: {
      value: 'Edit',
      _meta: {
        context: 'Action buttons on units/sections/profile to enter edit mode',
        component: ['Unit cards', 'Section cards', 'Quiz editor', 'Profile page'],
        impact: 'Switches to edit mode, enables modification of content',
        userType: 'instructor',
        category: 'button',
      },
    },
    submit: {
      value: 'Submit',
      _meta: {
        context: 'Form submission buttons, workbook completion, grade submission',
        component: ['Create forms (UnitCreateForm, SectionCreateForm)', 'Workbook submit button', 'Grade submission'],
        impact: 'Finalizes and sends data - creates records, submits grades for review',
        userType: 'all',
        category: 'button',
      },
    },
    close: {
      value: 'Close',
      _meta: {
        context: 'Dialog/modal close buttons, sidebar collapse buttons',
        component: ['Dialog headers', 'Modal overlays', 'ChatSidebar close button'],
        impact: 'Closes overlay or panel without saving changes',
        userType: 'all',
        category: 'button',
      },
    },
    create: {
      value: 'Create',
      _meta: {
        context: 'Primary action buttons for creating new units/sections/assignments',
        component: ['Unit creation page', 'Section creation page', 'New assignment flow'],
        impact: 'Initiates creation flow for new content or organizational structures',
        userType: 'instructor',
        category: 'button',
      },
    },
    upload: {
      value: 'Upload',
      _meta: {
        context: 'File upload buttons in chat, editor, file manager',
        component: ['ChatSidebar file upload', 'FileManager', 'Editor media upload'],
        impact: 'Opens file picker to select local files for S3 upload',
        userType: 'all',
        category: 'button',
      },
    },
    download: {
      value: 'Download',
      _meta: {
        context: 'File download buttons in file manager and document viewer',
        component: ['FileManager download action', 'PDF viewer', 'Grade export'],
        impact: 'Downloads file from S3 to user\'s device',
        userType: 'all',
        category: 'button',
      },
    },
    share: {
      value: 'Share',
      _meta: {
        context: 'Share buttons for units/sections/assignments with other users',
        component: ['Unit share dialog', 'Section join code display'],
        impact: 'Generates shareable link or join code for collaboration',
        userType: 'instructor',
        category: 'button',
      },
    },
    copy: {
      value: 'Copy',
      _meta: {
        context: 'Copy to clipboard buttons for join codes, share links, text content',
        component: ['Section join code copy button', 'Share dialog', 'Code blocks'],
        impact: 'Copies text to system clipboard',
        userType: 'all',
        category: 'button',
      },
    },
    send: {
      value: 'Send',
      _meta: {
        context: 'Chat message send button, feedback submission',
        component: ['ChatSidebar send button', 'Feedback forms'],
        impact: 'Sends chat message to AI or submits feedback',
        userType: 'all',
        category: 'button',
      },
    },
    add: {
      value: 'Add',
      _meta: {
        context: 'Add buttons for creating new items in lists (words, questions, files)',
        component: ['DictionaryEditor add word', 'Question bank add question', 'File associations'],
        impact: 'Creates new item in collection or associates existing item',
        userType: 'instructor',
        category: 'button',
      },
    },
    remove: {
      value: 'Remove',
      _meta: {
        context: 'Remove buttons in lists to delete individual items',
        component: ['Word list remove', 'Question list remove', 'File association remove'],
        impact: 'Removes item from list or breaks association (may not delete from DB)',
        userType: 'instructor',
        category: 'button',
      },
    },
    update: {
      value: 'Update',
      _meta: {
        context: 'Update profile button, refresh data buttons',
        component: ['Profile page update button', 'Data refresh actions'],
        impact: 'Saves modifications to existing records',
        userType: 'all',
        category: 'button',
      },
    },
    confirm: {
      value: 'Confirm',
      _meta: {
        context: 'Confirmation dialog accept buttons for destructive actions',
        component: ['Delete confirmation dialogs', 'Email verification', 'Clear cache confirmation'],
        impact: 'Proceeds with action that requires user acknowledgment',
        userType: 'all',
        category: 'button',
      },
    },
    clear: {
      value: 'Clear',
      _meta: {
        context: 'Clear form buttons, clear cache button in profile advanced settings',
        component: ['Form reset buttons (UnitCreateForm)', 'Profile page clear DataStore cache'],
        impact: 'Resets form fields or clears local data cache',
        userType: 'all',
        category: 'button',
      },
    },
    reset: {
      value: 'Reset',
      _meta: {
        context: 'Reset quiz/grade buttons, reset filter buttons',
        component: ['QuizEditor reset button', 'Filter reset in search'],
        impact: 'Reverts to initial state - clears quiz answers or search filters',
        userType: 'all',
        category: 'button',
      },
    },
    retry: {
      value: 'Retry',
      _meta: {
        context: 'Error recovery buttons after failed network requests',
        component: ['Error states', 'Failed upload retry'],
        impact: 'Attempts action again after failure',
        userType: 'all',
        category: 'button',
      },
    },
    back: {
      value: 'Back',
      _meta: {
        context: 'Navigation buttons to return to previous page/step',
        component: ['Multi-step forms', 'Breadcrumb navigation'],
        impact: 'Navigates to previous page or form step',
        userType: 'all',
        category: 'button',
      },
    },
    next: {
      value: 'Next',
      _meta: {
        context: 'Multi-step form progression buttons',
        component: ['Wizard flows', 'Pagination'],
        impact: 'Advances to next step or page',
        userType: 'all',
        category: 'button',
      },
    },
    finish: {
      value: 'Finish',
      _meta: {
        context: 'Final step button in multi-step processes',
        component: ['Onboarding completion', 'Setup wizards'],
        impact: 'Completes multi-step process',
        userType: 'all',
        category: 'button',
      },
    },
    continue: {
      value: 'Continue',
      _meta: {
        context: 'Proceed buttons in informational dialogs or interrupted flows',
        component: ['Confirmation prompts', 'Resume flows'],
        impact: 'Acknowledges message and proceeds',
        userType: 'all',
        category: 'button',
      },
    },
  },
  navigation: {
    home: {
      value: 'Home',
      _meta: {
        context: 'Main navigation link/button, breadcrumb root',
        component: ['MainToolbar', 'Navigation drawer'],
        impact: 'Navigates to home page (/) showing assignments and sections',
        userType: 'all',
        category: 'navigation',
      },
    },
    units: {
      value: 'Units',
      _meta: {
        context: 'Main navigation link to units library',
        component: ['MainToolbar', 'Navigation drawer'],
        impact: 'Navigates to units page showing all learning modules',
        userType: 'instructor',
        category: 'navigation',
      },
    },
    sections: {
      value: 'Sections',
      _meta: {
        context: 'Main navigation link to class sections',
        component: ['MainToolbar', 'Navigation drawer'],
        impact: 'Navigates to sections page (classes/groups of students)',
        userType: 'all',
        category: 'navigation',
      },
    },
    grades: {
      value: 'Grades',
      _meta: {
        context: 'Main navigation link to grades view',
        component: ['MainToolbar', 'Navigation drawer'],
        impact: 'Navigates to grades page showing student submissions and scores',
        userType: 'all',
        category: 'navigation',
      },
    },
    profile: {
      value: 'Profile',
      _meta: {
        context: 'User menu dropdown item',
        component: ['UserMenu (MainToolbar.js)'],
        impact: 'Navigates to profile page for account settings and preferences',
        userType: 'all',
        category: 'navigation',
      },
    },
    workbook: {
      value: 'Workbook',
      _meta: {
        context: 'Assignment card "View Workbook" button, navigation links',
        component: ['Assignment cards (index.js)', 'Direct /workbook/[id] routes'],
        impact: 'Opens student workbook view for completing assigned unit',
        userType: 'student',
        category: 'navigation',
      },
    },
  },
  status: {
    loading: {
      value: 'Loading...',
      _meta: {
        context: 'Loading states throughout app while fetching data',
        component: ['Data loading states', 'Async operations', 'Skeleton screens'],
        impact: 'Indicates data is being fetched from backend',
        userType: 'all',
        category: 'status',
      },
    },
    saving: {
      value: 'Saving...',
      _meta: {
        context: 'Displayed during DataStore save operations',
        component: ['Editor save', 'Form submissions', 'Profile updates'],
        impact: 'Indicates data is being persisted to database',
        userType: 'all',
        category: 'status',
      },
    },
    success: {
      value: 'Success',
      _meta: {
        context: 'Success snackbar notifications',
        component: ['Snackbar alerts', 'Toast notifications'],
        impact: 'Confirms operation completed successfully',
        userType: 'all',
        category: 'status',
      },
    },
    error: {
      value: 'Error',
      _meta: {
        context: 'Error state headings and notifications',
        component: ['Error boundaries', 'Snackbar errors', 'Form validation'],
        impact: 'Indicates operation failed, may show details',
        userType: 'all',
        category: 'status',
      },
    },
    processing: {
      value: 'Processing...',
      _meta: {
        context: 'Long-running operations like document analysis, AI generation',
        component: ['Document analysis status (ChatSidebar)', 'AI content generation', 'Batch operations'],
        impact: 'Indicates complex operation in progress (may take several seconds)',
        userType: 'all',
        category: 'status',
      },
    },
    uploading: {
      value: 'Uploading...',
      _meta: {
        context: 'File upload progress indicators',
        component: ['S3 upload progress', 'FileUploadUtils', 'ChatSidebar file upload'],
        impact: 'Shows file is being transferred to cloud storage',
        userType: 'all',
        category: 'status',
      },
    },
    downloading: {
      value: 'Downloading...',
      _meta: {
        context: 'File download progress indicators',
        component: ['S3 download', 'Export operations'],
        impact: 'Shows file is being retrieved from storage',
        userType: 'all',
        category: 'status',
      },
    },
    complete: {
      value: 'Complete',
      _meta: {
        context: 'Grade completion status, workbook completion badge',
        component: ['Grade status display', 'Assignment completion indicators'],
        impact: 'Indicates student has submitted/completed all required work',
        userType: 'all',
        category: 'status',
      },
    },
    incomplete: {
      value: 'Incomplete',
      _meta: {
        context: 'Grade status for in-progress or unstarted work',
        component: ['Grade status display', 'Assignment progress indicators'],
        impact: 'Shows work is not yet finished or submitted',
        userType: 'all',
        category: 'status',
      },
    },
    pending: {
      value: 'Pending',
      _meta: {
        context: 'Status for work awaiting review or processing',
        component: ['Grade review queue', 'Approval workflows'],
        impact: 'Indicates item requires action or is queued',
        userType: 'all',
        category: 'status',
      },
    },
  },
  time: {
    created: {
      value: 'Created',
      _meta: {
        context: 'Timestamp label showing when record was created',
        component: ['Unit cards', 'Section details', 'File metadata'],
        impact: 'Displays creation date/time for content',
        userType: 'all',
        category: 'label',
      },
    },
    updated: {
      value: 'Updated',
      _meta: {
        context: 'Timestamp label showing last modification',
        component: ['Unit cards', 'Section details', 'File metadata'],
        impact: 'Displays last edit date/time',
        userType: 'all',
        category: 'label',
      },
    },
    due: {
      value: 'Due',
      _meta: {
        context: 'Assignment due date label',
        component: ['Assignment cards', 'Workbook header', 'Grade submissions'],
        impact: 'Shows deadline for assignment completion',
        userType: 'student',
        category: 'label',
      },
    },
    completed: {
      value: 'Completed',
      _meta: {
        context: 'Completion timestamp for grades/assignments',
        component: ['Grade records', 'Assignment completion'],
        impact: 'Shows when student finished work',
        userType: 'all',
        category: 'label',
      },
    },
  },
  common: {
    yes: {
      value: 'Yes',
      _meta: {
        context: 'Confirmation dialog affirmative option',
        component: ['Confirmation dialogs', 'Boolean choice prompts'],
        impact: 'Confirms action or answers yes to question',
        userType: 'all',
        category: 'button',
      },
    },
    no: {
      value: 'No',
      _meta: {
        context: 'Confirmation dialog negative option',
        component: ['Confirmation dialogs', 'Boolean choice prompts'],
        impact: 'Cancels action or answers no to question',
        userType: 'all',
        category: 'button',
      },
    },
    ok: {
      value: 'OK',
      _meta: {
        context: 'Informational dialog acknowledgment button',
        component: ['Alert dialogs', 'Information messages'],
        impact: 'Acknowledges message and closes dialog',
        userType: 'all',
        category: 'button',
      },
    },
    search: {
      value: 'Search',
      _meta: {
        context: 'Search input placeholder, search button labels',
        component: ['DictionaryEditor search', 'File search', 'Embedded search'],
        impact: 'Filters content based on text query',
        userType: 'all',
        category: 'placeholder',
      },
    },
    filter: {
      value: 'Filter',
      _meta: {
        context: 'Filter dropdown/button labels',
        component: ['List filtering controls', 'Grade filters'],
        impact: 'Narrows displayed items by criteria',
        userType: 'all',
        category: 'button',
      },
    },
    sort: {
      value: 'Sort',
      _meta: {
        context: 'Sort dropdown labels in lists',
        component: ['Unit lists', 'Grade lists', 'File lists'],
        impact: 'Reorders items by selected criterion',
        userType: 'all',
        category: 'button',
      },
    },
    view: {
      value: 'View',
      _meta: {
        context: 'View details buttons, view mode toggles',
        component: ['Grade view button', 'Detail pages', 'Read-only mode'],
        impact: 'Displays full details or switches to view-only mode',
        userType: 'all',
        category: 'button',
      },
    },
    settings: {
      value: 'Settings',
      _meta: {
        context: 'Settings menu item, configuration pages',
        component: ['User menu', 'App settings', 'Unit settings'],
        impact: 'Opens configuration interface',
        userType: 'all',
        category: 'navigation',
      },
    },
    help: {
      value: 'Help',
      _meta: {
        context: 'Help menu item, support links',
        component: ['User menu', 'Help dialogs'],
        impact: 'Opens help documentation or support',
        userType: 'all',
        category: 'navigation',
      },
    },
    about: {
      value: 'About',
      _meta: {
        context: 'About page link, app information dialog',
        component: ['User menu', 'Footer links'],
        impact: 'Shows app version, credits, licensing info',
        userType: 'all',
        category: 'navigation',
      },
    },
  },
};

/**
 * Editor namespace metadata
 * Based on: Editor3/plugins/ToolBarPlugin.js, Editor3/components/*, Editor.stories.jsx
 */
const editorMetadata: MetadataMap = {
  toolbar: {
    bold: {
      value: 'Bold',
      _meta: {
        context: 'Editor toolbar bold button tooltip',
        component: ['ToolBarPlugin.js FORMAT_TEXT_COMMAND'],
        impact: 'Applies bold formatting to selected text (Ctrl+B / ⌘B)',
        userType: 'instructor',
        category: 'button',
      },
    },
    italic: {
      value: 'Italic',
      _meta: {
        context: 'Editor toolbar italic button tooltip',
        component: ['ToolBarPlugin.js FORMAT_TEXT_COMMAND'],
        impact: 'Applies italic formatting to selected text (Ctrl+I / ⌘I)',
        userType: 'instructor',
        category: 'button',
      },
    },
    underline: {
      value: 'Underline',
      _meta: {
        context: 'Editor toolbar underline button tooltip',
        component: ['ToolBarPlugin.js FORMAT_TEXT_COMMAND'],
        impact: 'Applies underline to selected text (Ctrl+U / ⌘U)',
        userType: 'instructor',
        category: 'button',
      },
    },
    strikethrough: {
      value: 'Strikethrough',
      _meta: {
        context: 'Editor toolbar strikethrough button tooltip',
        component: ['ToolBarPlugin.js FORMAT_TEXT_COMMAND'],
        impact: 'Strikes through selected text',
        userType: 'instructor',
        category: 'button',
      },
    },
    heading: {
      value: 'Heading',
      _meta: {
        context: 'Block format dropdown heading option',
        component: ['ToolBarPlugin.js BlockFormatDropDown'],
        impact: 'Converts paragraph to heading (H1-H6)',
        userType: 'instructor',
        category: 'button',
      },
    },
    paragraph: {
      value: 'Paragraph',
      _meta: {
        context: 'Block format dropdown paragraph option',
        component: ['ToolBarPlugin.js BlockFormatDropDown'],
        impact: 'Converts block to normal paragraph',
        userType: 'instructor',
        category: 'button',
      },
    },
    bullet_list: {
      value: 'Bullet List',
      _meta: {
        context: 'Editor toolbar bullet list button',
        component: ['ToolBarPlugin.js INSERT_UNORDERED_LIST_COMMAND'],
        impact: 'Creates unordered list with bullet points',
        userType: 'instructor',
        category: 'button',
      },
    },
    numbered_list: {
      value: 'Numbered List',
      _meta: {
        context: 'Editor toolbar numbered list button',
        component: ['ToolBarPlugin.js INSERT_ORDERED_LIST_COMMAND'],
        impact: 'Creates ordered list with numbers',
        userType: 'instructor',
        category: 'button',
      },
    },
    align_left: {
      value: 'Align Left',
      _meta: {
        context: 'Editor toolbar text alignment button',
        component: ['ToolBarPlugin.js FORMAT_ELEMENT_COMMAND'],
        impact: 'Aligns selected block to left',
        userType: 'instructor',
        category: 'button',
      },
    },
    align_center: {
      value: 'Align Center',
      _meta: {
        context: 'Editor toolbar text alignment button',
        component: ['ToolBarPlugin.js FORMAT_ELEMENT_COMMAND'],
        impact: 'Centers selected block',
        userType: 'instructor',
        category: 'button',
      },
    },
    align_right: {
      value: 'Align Right',
      _meta: {
        context: 'Editor toolbar text alignment button',
        component: ['ToolBarPlugin.js FORMAT_ELEMENT_COMMAND'],
        impact: 'Aligns selected block to right',
        userType: 'instructor',
        category: 'button',
      },
    },
    insert_link: {
      value: 'Insert Link',
      _meta: {
        context: 'Editor toolbar link button, link insert dialog',
        component: ['ToolBarPlugin.js TOGGLE_LINK_COMMAND'],
        impact: 'Creates/edits hyperlink on selected text',
        userType: 'instructor',
        category: 'button',
      },
    },
    insert_image: {
      value: 'Insert Image',
      _meta: {
        context: 'Editor toolbar image upload button',
        component: ['ToolBarPlugin.js media upload'],
        impact: 'Opens image picker to embed image in content',
        userType: 'instructor',
        category: 'button',
      },
    },
    insert_table: {
      value: 'Insert Table',
      _meta: {
        context: 'Editor toolbar table insert button',
        component: ['ToolBarPlugin.js InsertNewTableDialog'],
        impact: 'Opens dialog to create table with rows/columns',
        userType: 'instructor',
        category: 'button',
      },
    },
    insert_code: {
      value: 'Insert Code Block',
      _meta: {
        context: 'Editor toolbar code block button',
        component: ['ToolBarPlugin.js INSERT_CODE_COMMAND'],
        impact: 'Creates syntax-highlighted code block',
        userType: 'instructor',
        category: 'button',
      },
    },
  },
  blocks: {
    answer: {
      value: 'Answer Block',
      _meta: {
        context: 'Custom block insert menu, answer block editor',
        component: ['ToolBarPlugin.js INSERT_ANSWER_BLOCK_COMMAND', 'AnswerComponent.js'],
        impact: 'Creates graded fill-in-the-blank question from vocabulary words',
        userType: 'instructor',
        category: 'button',
      },
    },
    quiz: {
      value: 'Quiz Block',
      _meta: {
        context: 'Custom block insert menu, quiz block editor',
        component: ['ToolBarPlugin.js INSERT_QUIZ_COMMAND', 'QuizComponent.js', 'QuizEditor.js'],
        impact: 'Creates graded multiple choice quiz with selectable answers',
        userType: 'instructor',
        category: 'button',
      },
    },
    custom_answer: {
      value: 'Custom Answer',
      _meta: {
        context: 'Custom block insert menu, custom answer editor',
        component: ['ToolBarPlugin.js INSERT_ANSWER_BLOCK_COMMAND (custom)', 'CustomAnswerComponent.js'],
        impact: 'Creates graded custom question with prompt and AI-evaluated freeform answer',
        userType: 'instructor',
        category: 'button',
      },
    },
    meaning_association: {
      value: 'Meaning Association',
      _meta: {
        context: 'Custom block insert menu, meaning association game',
        component: ['ToolBarPlugin.js INSERT_MEANING_ASSOCIATION_COMMAND', 'MeaningAssociationComponent.js'],
        impact: 'Creates graded vocabulary matching exercise (drag-and-drop or click to pair)',
        userType: 'instructor',
        category: 'button',
      },
    },
  },
  placeholders: {
    type_here: {
      value: 'Type here...',
      _meta: {
        context: 'Editor empty state placeholder text',
        component: ['RichTextPlugin placeholder', 'Editor empty state'],
        impact: 'Indicates user can begin typing content in editor',
        userType: 'instructor',
        category: 'placeholder',
      },
    },
    enter_text: {
      value: 'Enter text',
      _meta: {
        context: 'Generic text input placeholders in editor dialogs',
        component: ['Dialog text inputs', 'Form fields in editor'],
        impact: 'Prompts user to type in empty input field',
        userType: 'instructor',
        category: 'placeholder',
      },
    },
    search_words: {
      value: 'Search words...',
      _meta: {
        context: 'Dictionary editor search input placeholder',
        component: ['DictionaryEditor search field'],
        impact: 'Filters vocabulary words by search query',
        userType: 'instructor',
        category: 'placeholder',
      },
    },
  },
};

/**
 * Chat namespace metadata
 * Based on: ChatSidebar.js, chat API routes
 */
const chatMetadata: MetadataMap = {
  title: {
    value: 'Chat',
    _meta: {
      context: 'Chat sidebar header title',
      component: ['ChatSidebar'],
      impact: 'Labels the AI chat interface panel',
      userType: 'all',
      category: 'heading',
    },
  },
  send_message: {
    value: 'Send message',
    _meta: {
      context: 'Chat send button tooltip/aria-label',
      component: ['ChatSidebar send button'],
      impact: 'Sends user message to AI assistant with context (unit, files, dictionary)',
      userType: 'all',
      category: 'button',
    },
  },
  type_message: {
    value: 'Type a message...',
    _meta: {
      context: 'Chat input field placeholder',
      component: ['ChatSidebar message input'],
      impact: 'Prompts user to enter chat message',
      userType: 'all',
      category: 'placeholder',
    },
  },
  upload_file: {
    value: 'Upload File',
    _meta: {
      context: 'Chat file upload button',
      component: ['ChatSidebar file upload button'],
      impact: 'Opens file picker to attach documents/images/audio to chat for AI analysis',
      userType: 'all',
      category: 'button',
    },
  },
  analyzing: {
    value: 'Analyzing...',
    _meta: {
      context: 'Document processing status in chat',
      component: ['ChatSidebar document analysis progress'],
      impact: 'Shows AI is analyzing uploaded document (PDF text extraction, vocabulary identification)',
      userType: 'all',
      category: 'status',
    },
  },
  chat_with_ai: {
    value: 'Chat with AI',
    _meta: {
      context: 'Chat panel open button, chat feature label',
      component: ['ChatSidebar toggle button'],
      impact: 'Opens AI assistant chat panel for help with content and learning',
      userType: 'all',
      category: 'button',
    },
  },
};

/**
 * Errors namespace metadata
 */
const errorsMetadata: MetadataMap = {
  generic: {
    value: 'An error occurred',
    _meta: {
      context: 'Generic error message fallback',
      component: ['Error boundaries', 'Catch-all error handlers'],
      impact: 'Displayed when specific error message unavailable',
      userType: 'all',
      category: 'error',
    },
  },
  network: {
    value: 'Network error. Please check your connection.',
    _meta: {
      context: 'Network connectivity error messages',
      component: ['API error handlers', 'DataStore sync errors'],
      impact: 'Indicates offline or network failure',
      userType: 'all',
      category: 'error',
    },
  },
  auth: {
    invalid_credentials: {
      value: 'Invalid username or password',
      _meta: {
        context: 'Login failure error message',
        component: ['Authenticator login form'],
        impact: 'Shows when authentication fails',
        userType: 'all',
        category: 'error',
      },
    },
    session_expired: {
      value: 'Your session has expired. Please sign in again.',
      _meta: {
        context: 'Session timeout error message',
        component: ['Auth session handlers', 'Token refresh failures'],
        impact: 'Prompts re-authentication when session expires',
        userType: 'all',
        category: 'error',
      },
    },
  },
  validation: {
    required: {
      value: 'This field is required',
      _meta: {
        context: 'Form field validation error',
        component: ['All form inputs with required validation'],
        impact: 'Prevents form submission when required field empty',
        userType: 'all',
        category: 'error',
      },
    },
    invalid_email: {
      value: 'Invalid email address',
      _meta: {
        context: 'Email field validation error',
        component: ['Email input fields (auth, profile)'],
        impact: 'Indicates email format invalid',
        userType: 'all',
        category: 'error',
      },
    },
    password_mismatch: {
      value: 'Passwords do not match',
      _meta: {
        context: 'Password confirmation field error',
        component: ['Password change form', 'Sign up form'],
        impact: 'Shows when password and confirm password don\'t match',
        userType: 'all',
        category: 'error',
      },
    },
  },
  file: {
    upload_failed: {
      value: 'File upload failed',
      _meta: {
        context: 'S3 upload error message',
        component: ['FileUploadUtils', 'ChatSidebar file upload', 'Editor media upload'],
        impact: 'Shows when file upload to S3 fails',
        userType: 'all',
        category: 'error',
      },
    },
    invalid_type: {
      value: 'Invalid file type',
      _meta: {
        context: 'File type validation error',
        component: ['File upload validation'],
        impact: 'Shows when uploaded file type not allowed',
        userType: 'all',
        category: 'error',
      },
    },
    too_large: {
      value: 'File is too large',
      _meta: {
        context: 'File size validation error',
        component: ['File upload validation'],
        impact: 'Shows when file exceeds size limit',
        userType: 'all',
        category: 'error',
      },
    },
  },
};

/**
 * Units namespace metadata
 */
const unitsMetadata: MetadataMap = {
  title: {
    value: 'Units',
    _meta: {
      context: 'Units page heading, navigation label',
      component: ['Units page', 'MainToolbar navigation'],
      impact: 'Labels the learning modules library page',
      userType: 'instructor',
      category: 'heading',
    },
  },
  create_unit: {
    value: 'Create New Unit',
    _meta: {
      context: 'Create unit button on units page',
      component: ['Units page create button'],
      impact: 'Opens unit creation form to start new learning module',
      userType: 'instructor',
      category: 'button',
    },
  },
  edit_unit: {
    value: 'Edit Unit',
    _meta: {
      context: 'Unit card action menu edit option',
      component: ['Unit card menu', 'Unit editor header'],
      impact: 'Opens unit in editor to modify content',
      userType: 'instructor',
      category: 'button',
    },
  },
  delete_unit: {
    value: 'Delete Unit',
    _meta: {
      context: 'Unit card action menu delete option',
      component: ['Unit card menu', 'Delete confirmation dialog'],
      impact: 'Permanently removes unit from database',
      userType: 'instructor',
      category: 'button',
    },
  },
  unit_name: {
    value: 'Unit Name',
    _meta: {
      context: 'Unit creation/edit form name field label',
      component: ['UnitCreateForm', 'Unit editor'],
      impact: 'Label for unit title input',
      userType: 'instructor',
      category: 'label',
    },
  },
  unit_description: {
    value: 'Unit Description',
    _meta: {
      context: 'Unit creation/edit form description field label',
      component: ['UnitCreateForm', 'Unit editor metadata'],
      impact: 'Label for unit description/summary input',
      userType: 'instructor',
      category: 'label',
    },
  },
  published: {
    value: 'Published',
    _meta: {
      context: 'Unit publication status badge',
      component: ['Unit card status', 'Unit editor status toggle'],
      impact: 'Indicates unit is visible to students and can be assigned',
      userType: 'instructor',
      category: 'status',
    },
  },
  draft: {
    value: 'Draft',
    _meta: {
      context: 'Unit draft status badge',
      component: ['Unit card status', 'Unit editor status toggle'],
      impact: 'Indicates unit is private/not yet published',
      userType: 'instructor',
      category: 'status',
    },
  },
  assign_to_section: {
    value: 'Assign to Section',
    _meta: {
      context: 'Unit card action menu assign option, assignment creation',
      component: ['Unit card menu', 'Assignment creation dialog'],
      impact: 'Opens dialog to assign unit to class section with due date',
      userType: 'instructor',
      category: 'button',
    },
  },
  no_units: {
    value: 'No units available',
    _meta: {
      context: 'Empty state message on units page',
      component: ['Units page empty state'],
      impact: 'Shows when no units exist or match filter',
      userType: 'instructor',
      category: 'message',
    },
  },
};

/**
 * Grades namespace metadata
 */
const gradesMetadata: MetadataMap = {
  title: {
    value: 'Grades',
    _meta: {
      context: 'Grades page heading, navigation label',
      component: ['Grades page', 'MainToolbar navigation'],
      impact: 'Labels the student submissions and scores page',
      userType: 'all',
      category: 'heading',
    },
  },
  accuracy: {
    value: 'Accuracy',
    _meta: {
      context: 'Grade score label, quiz/block accuracy display',
      component: ['Grade cards', 'Quiz toolbar', 'Grading rubric'],
      impact: 'Shows percentage of correct answers in graded blocks',
      userType: 'all',
      category: 'label',
    },
  },
  complete: {
    value: 'Complete',
    _meta: {
      context: 'Grade completion status badge',
      component: ['Grade cards', 'Assignment status'],
      impact: 'Indicates student submitted completed work',
      userType: 'all',
      category: 'status',
    },
  },
  incomplete: {
    value: 'Incomplete',
    _meta: {
      context: 'Grade incomplete status badge',
      component: ['Grade cards', 'Assignment status'],
      impact: 'Shows work not yet finished/submitted',
      userType: 'all',
      category: 'status',
    },
  },
  view_grade: {
    value: 'View Grade',
    _meta: {
      context: 'Grade card view button',
      component: ['Grade list cards'],
      impact: 'Opens detailed grade view showing all responses and scores',
      userType: 'all',
      category: 'button',
    },
  },
  submit_grade: {
    value: 'Submit Grade',
    _meta: {
      context: 'Workbook submit button, grade submission dialog',
      component: ['Workbook completion flow', 'Grade submission'],
      impact: 'Finalizes and submits student work for instructor review',
      userType: 'student',
      category: 'button',
    },
  },
  no_grades: {
    value: 'No grades available',
    _meta: {
      context: 'Empty state message on grades page',
      component: ['Grades page empty state'],
      impact: 'Shows when no grades exist or match filter',
      userType: 'all',
      category: 'message',
    },
  },
  percentage: {
    value: '{{value}}%',
    _meta: {
      context: 'Percentage formatting template',
      component: ['Grade accuracy display', 'Progress indicators'],
      impact: 'Formats numeric accuracy as percentage (e.g., 85%)',
      userType: 'all',
      category: 'label',
    },
  },
};

/**
 * Merge metadata into existing locale data
 */
function mergeMetadata(
  existingData: LocaleData,
  metadata: MetadataMap
): MetadataMap {
  const result: MetadataMap = {};
  
  for (const [key, value] of Object.entries(existingData)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - recurse
      result[key] = mergeMetadata(value, metadata[key] as MetadataMap || {});
    } else {
      // Leaf value - add metadata if exists
      if (metadata[key] && typeof metadata[key] === 'object' && '_meta' in metadata[key]) {
        result[key] = metadata[key];
      } else {
        result[key] = {
          value,
          _meta: {
            context: 'NEEDS_DOCUMENTATION - Location in UI not yet mapped',
            impact: 'NEEDS_DOCUMENTATION - Purpose and user interaction not yet described',
            userType: 'all',
            category: 'label',
          },
        };
      }
    }
  }
  
  return result;
}

/**
 * Main execution
 */
async function main() {
  console.log('Extracting component docblocks from src/...');
  const docblocks = await extractAllDocblocks();
  console.log(`Found ${docblocks.size} component docblocks\n`);
  
  const localesDir = path.join(__dirname, '..', 'public', 'locales', 'en');
  
  console.log('Generating metadata with component functionality descriptions...');
  const namespaceMetadata: Record<string, MetadataMap> = {
    auth: await getAuthMetadata(docblocks),
    // common: await getCommonMetadata(docblocks),
    // editor: await getEditorMetadata(docblocks),
    // chat: await getChatMetadata(docblocks),
    // errors: await getErrorsMetadata(docblocks),
    // units: await getUnitsMetadata(docblocks),
    // grades: await getGradesMetadata(docblocks),
  };
  
  for (const [namespace, metadata] of Object.entries(namespaceMetadata)) {
    const filePath = path.join(localesDir, `${namespace}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping ${namespace}.json - file not found`);
      continue;
    }
    
    const existingData: LocaleData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const enhanced = mergeMetadata(existingData, metadata);
    
    fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2) + '\n');
    console.log(`✅ Enhanced ${namespace}.json with UI metadata`);
  }
  
  console.log('\\n📊 Metadata Enhancement Complete!');
  console.log('\\nNext steps:');
  console.log('1. Review generated metadata in public/locales/en/*.json');
  console.log('2. Fill in "NEEDS_DOCUMENTATION" placeholders');
  console.log('3. Update translation scripts to preserve _meta during translation');
}

main().catch(console.error);
