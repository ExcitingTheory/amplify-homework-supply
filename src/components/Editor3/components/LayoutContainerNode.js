import {addClassNamesToElement} from '@lexical/utils';
import {ElementNode} from 'lexical';

export class LayoutContainerNode extends ElementNode {
    __templateColumns;

    constructor(templateColumns, key) {
        super(key);
        this.__templateColumns = templateColumns;
    }

    static getType() {
        return 'layout-container';
    }

    static clone(node) {
        return new LayoutContainerNode(node.__templateColumns, node.__key);
    }

    createDOM(config) {
        const dom = document.createElement('div');
        dom.style.display = 'grid';
        dom.className = 'layout-container'
        dom.style.gridTemplateColumns = this.__templateColumns;
        if (typeof config.theme.layoutContainer === 'string') {
            addClassNamesToElement(dom, config.theme.layoutContainer);
        }
        return dom;
    }

    updateDOM(prevNode, dom) {
        if (prevNode.__templateColumns !== this.__templateColumns) {
            dom.style.gridTemplateColumns = this.__templateColumns;
        }
        return false;
    }

    static importDOM() {
        return {};
    }

    static importJSON(json) {
        return $createLayoutContainerNode(json.templateColumns);
    }

    canBeEmpty() {
        return false;
    }

    exportJSON() {
        return {
            ...super.exportJSON(),
            templateColumns: this.__templateColumns,
            type: 'layout-container',
            version: 1,
        };
    }

    getTemplateColumns() {
        return this.getLatest().__templateColumns;
    }

    setTemplateColumns(templateColumns) {
        this.getWritable().__templateColumns = templateColumns;
    }
}

export function $createLayoutContainerNode(templateColumns) {
    return new LayoutContainerNode(templateColumns);
}

export function $isLayoutContainerNode(node) {
    return node instanceof LayoutContainerNode;
}