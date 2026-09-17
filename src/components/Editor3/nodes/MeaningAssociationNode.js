/**
 * MeaningAssociationNode — Server-safe node class for vocabulary matching exercises.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertMeaningAssociationElement(domNode) {
  const ids = domNode.getAttribute("data-lexical-meaning-association");
  if (ids) {
    return { node: $createMeaningAssociationNode(ids.split(",")) };
  }
  return null;
}

export class MeaningAssociationNode extends DecoratorNode {
  __ids;
  __enabledModes;
  __promptFor;
  __showAudio;
  __showPronunciation;

  static getType() {
    return "meaning-association";
  }

  static clone(node) {
    return new MeaningAssociationNode(
      node.__ids,
      node.__enabledModes,
      node.__promptFor,
      node.__showAudio,
      node.__showPronunciation,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return $createMeaningAssociationNode(
      serializedNode.wordIDs,
      serializedNode.enabledModes,
      serializedNode.promptFor,
      serializedNode.showAudio,
      serializedNode.showPronunciation,
    );
  }

  exportJSON() {
    return {
      type: "meaning-association",
      version: 1,
      wordIDs: [...this.__ids],
      enabledModes: this.__enabledModes || ["learn", "easy", "hard"],
      promptFor: this.__promptFor || "definition",
      showAudio: this.__showAudio !== false,
      showPronunciation: this.__showPronunciation !== false,
    };
  }

  constructor(
    ids = [],
    enabledModes = ["learn", "easy", "hard"],
    promptFor = "definition",
    showAudio = true,
    showPronunciation = true,
    format,
    key,
  ) {
    super(key);
    this.__ids = ids;
    this.__enabledModes = enabledModes;
    this.__promptFor = promptFor || "definition";
    this.__showAudio = showAudio !== false;
    this.__showPronunciation = showPronunciation !== false;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute(
      "data-lexical-meaning-association",
      this.__ids.join(","),
    );
    return { element };
  }

  createDOM(config) {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-meaning-association", this.__ids.join(","));
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-meaning-association")) {
          return null;
        }
        return {
          conversion: convertMeaningAssociationElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM() {
    return false;
  }

  isKeyboardSelectable() {
    return true;
  }

  getIds() {
    return this.__ids;
  }

  getEnabledModes() {
    return this.__enabledModes || ["learn", "easy", "hard"];
  }

  getPromptFor() {
    return this.__promptFor || "definition";
  }

  getShowAudio() {
    return this.__showAudio !== false;
  }

  getShowPronunciation() {
    return this.__showPronunciation !== false;
  }

  setEnabledModes(modes) {
    const writable = this.getWritable();
    writable.__enabledModes = modes;
  }

  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  mergeIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, ...ids])];
  }

  appendId(id) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, id])];
  }

  removeIntersection(ids) {
    const writable = this.getWritable();
    writable.__ids = this.__ids.filter((x) => !ids.includes(x));
  }

  getTextContent() {
    return this.__ids;
  }

  decorate() {
    return null;
  }
}

export function $createMeaningAssociationNode(
  ids,
  enabledModes,
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
) {
  return new MeaningAssociationNode(
    ids,
    enabledModes,
    promptFor,
    showAudio,
    showPronunciation,
  );
}

export function $isMeaningAssociationNode(node) {
  return node instanceof MeaningAssociationNode;
}
