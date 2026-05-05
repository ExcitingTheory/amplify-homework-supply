/**
 * @fileoverview ArmorEditorPlugin - Lexical DecoratorNode for embedding
 * the guild Armor Editor (coat of arms designer) as an interactive block.
 *
 * Pattern follows existing custom blocks (QuizPlugin, AnswerPlugin, etc.):
 *   - DecoratorNode stores the ArmorEditorConfig as JSON data
 *   - In edit mode: renders the ArmorEditor inline
 *   - In read mode: renders the static SVG shield preview
 *   - INSERT_ARMOR_EDITOR_COMMAND to insert via toolbar/menu
 *
 * @module ArmorEditorPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical'
import * as React from 'react'
import { useEffect } from 'react'

import ArmorEditorBlock from './ArmorEditorBlock'
import type { ArmorEditorConfig } from '../../Gamification/ArmorEditor'

// ============================================================================
// Node
// ============================================================================

function convertArmorEditorElement(domNode: HTMLElement) {
  const raw = domNode.getAttribute('data-lexical-armor-editor')
  if (raw) {
    try {
      const data = JSON.parse(raw)
      const node = $createArmorEditorNode(data)
      return { node }
    } catch {
      return null
    }
  }
  return null
}

export class ArmorEditorNode extends DecoratorNode<React.ReactElement> {
  __data: ArmorEditorConfig

  static getType(): string {
    return 'armor-editor'
  }

  static clone(node: ArmorEditorNode): ArmorEditorNode {
    return new ArmorEditorNode(node.__data, node.__key)
  }

  static importJSON(serializedNode: any): ArmorEditorNode {
    return $createArmorEditorNode(serializedNode.data)
  }

  exportJSON(): any {
    return {
      type: 'armor-editor',
      version: 1,
      data: this.__data,
    }
  }

  constructor(data: ArmorEditorConfig, key?: string) {
    super(key)
    this.__data = data
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-armor-editor', JSON.stringify(this.__data))
    return { element }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.setAttribute('data-lexical-armor-editor', JSON.stringify(this.__data))
    return div
  }

  static importDOM(): any {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-armor-editor')) {
          return null
        }
        return {
          conversion: convertArmorEditorElement,
          priority: 1,
        }
      },
    }
  }

  updateDOM(): boolean {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }

  canBeEmpty(): boolean {
    return true
  }

  getData(): ArmorEditorConfig {
    return this.__data
  }

  saveData(data: ArmorEditorConfig): void {
    const writable = this.getWritable()
    writable.__data = data
  }

  getTextContent(): string {
    return '[Coat of Arms]'
  }

  decorate(_editor: any, config: any): React.ReactElement {
    const isEditable = _editor.isEditable()
    const embedBlockTheme = config.theme?.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }
    return (
      <ArmorEditorBlock
        nodeKey={this.getKey()}
        data={this.__data}
        isEditable={isEditable}
        className={className}
      />
    )
  }
}

// ============================================================================
// Helpers
// ============================================================================

export function $createArmorEditorNode(data?: ArmorEditorConfig): ArmorEditorNode {
  const defaultData: ArmorEditorConfig = data || {
    shape: 'classic',
    fieldColor: '#1565c0',
    fieldColor2: '#f9a825',
    division: 'none',
    chargeId: 'none',
    chargeColor: '#f9a825',
    chargePosition: 'center',
    chargeScale: 1,
    charges: [],
  }
  return new ArmorEditorNode(defaultData)
}

export function $isArmorEditorNode(node: any): node is ArmorEditorNode {
  return node instanceof ArmorEditorNode
}

// ============================================================================
// Command
// ============================================================================

export const INSERT_ARMOR_EDITOR_COMMAND = createCommand<ArmorEditorConfig | undefined>(
  'INSERT_ARMOR_EDITOR_COMMAND',
)

// ============================================================================
// Plugin
// ============================================================================

export default function ArmorEditorPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ArmorEditorNode])) {
      throw new Error('ArmorEditorPlugin: ArmorEditorNode not registered on editor')
    }

    return editor.registerCommand(
      INSERT_ARMOR_EDITOR_COMMAND,
      (payload) => {
        const node = $createArmorEditorNode(payload)
        $insertNodeToNearestRoot(node)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
