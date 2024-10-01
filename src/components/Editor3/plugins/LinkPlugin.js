import {LinkPlugin as LexicalLinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import * as React from 'react';

import {validateUrl} from '../utils/url';

export default function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}