import {
  DecoratorNode,
} from 'lexical';
import * as React from 'react';
import { useContext } from 'react';

import AutocompleteContext from '../context/SharedAutocompleteContext';

import { uuid as UUID } from '../plugins/AutocompletePlugin';


export class AutocompleteNode extends DecoratorNode {
  __uuid;

  static clone(node) {
    return new AutocompleteNode(node.__uuid, node.__key);
  }

  static getType() {
    return 'autocomplete';
  }

  static importJSON(serializedNode) {
    const node = $createAutocompleteNode(serializedNode.uuid);
    return node;
  }

  exportJSON() {
    return {
    //   ...super.exportJSON(),
      type: 'autocomplete',
      uuid: this.__uuid,
      version: 1,
    };
  }

  constructor(uuid, key) {
    super(key);
    this.__uuid = uuid;
  }

  updateDOM(prevNode, dom, config) {
    return false;
  }

  createDOM(config) {
    return document.createElement('span');
  }

  decorate() {
    if (this.__uuid !== UUID) {
      return null;
    }
    return <AutocompleteComponent />;
  }
}

export function $createAutocompleteNode(uuid) {
  return new AutocompleteNode(uuid);
}

function AutocompleteComponent() {
    const {
        suggestion,
    } = useContext(AutocompleteContext)
    const {
        autocompleteChunk
    } = suggestion || {}
    console.log('AutocompleteComponent() suggestion', suggestion);
  console.log('AutocompleteComponent() suggestion', suggestion);
  const userAgentData = window.navigator.userAgentData;
  const isMobile =
    userAgentData !== undefined
      ? userAgentData.mobile
      : window.innerWidth <= 800 && window.innerHeight <= 600;
  return (
    <span style={{ color: '#ccc' }} spellCheck="false">
      {autocompleteChunk} {isMobile ? '(SWIPE \u2B95)' : '(TAB)'}
    </span>
  );
}