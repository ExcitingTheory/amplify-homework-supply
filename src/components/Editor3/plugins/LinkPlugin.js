/**
 * @fileoverview LinkPlugin - Enables hyperlink functionality in the editor.
 * @module LinkPlugin
 * 
 * Wraps Lexical's LinkPlugin with URL validation to support hyperlinks
 * in the editor content.
 */

import {LinkPlugin as LexicalLinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import * as React from 'react';

import {validateUrl} from '../utils/url';

/**
 * LinkPlugin - Registers link functionality with URL validation.
 * 
 * @returns {JSX.Element} Lexical link plugin component
 */
export default function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}