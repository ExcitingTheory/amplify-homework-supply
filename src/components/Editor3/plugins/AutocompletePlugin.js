import * as React from 'react';
import { useContext } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isAtNodeEnd } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import {
    $createTextNode,
    $getNodeByKey,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $setSelection,
    COMMAND_PRIORITY_LOW,
    KEY_ARROW_RIGHT_COMMAND,
    KEY_TAB_COMMAND,
} from 'lexical';
import { useCallback, useEffect } from 'react';

import AutocompleteContext from '../context/SharedAutocompleteContext';
import {
    $createAutocompleteNode,
    AutocompleteNode,
} from '../components/AutocompleteNode';
import { addSwipeRightListener } from '../utils/swipe';

export const uuid = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);

function $search(
    selection,
) {
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return [false, ''];
    }
    const node = selection.getNodes()[0];
    const anchor = selection.anchor;
    if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor)) {
        return [false, ''];
    }
    const word = [];
    const text = node.getTextContent();
    let i = node.getTextContentSize();
    let c;
    while (i-- && i >= 0 && (c = text[i]) !== ' ') {
        word.push(c);
    }
    if (word.length === 0) {
        return [false, ''];
    }
    return [true, word.reverse().join('')];
}

function useQuery() {
    return useCallback((searchText) => {
        const server = new AutocompleteServer();
        console.time('query');
        const response = server.query(searchText);
        console.timeEnd('query', response);
        return response;
    }, []);
}

export default function AutocompletePlugin() {
    const [editor] = useLexicalComposerContext();
    const {
        setSuggestion,
    } = useContext(AutocompleteContext)
    const query = useQuery();

    // Put dictionary context here

    useEffect(() => {
        let autocompleteNodeKey = null;
        let lastMatch = null;
        let lastSuggestion = null;
        let lastData = null;
        let searchPromise = null;
        function $clearSuggestion() {
            const autocompleteNode =
                autocompleteNodeKey !== null
                    ? $getNodeByKey(autocompleteNodeKey)
                    : null;
            if (autocompleteNode !== null && autocompleteNode.isAttached()) {
                autocompleteNode.remove();
                autocompleteNodeKey = null;
            }
            if (searchPromise !== null) {
                searchPromise.dismiss();
                searchPromise = null;
            }
            lastMatch = null;
            lastSuggestion = null;
            lastData = null;
            setSuggestion(null);
        }
        function updateAsyncSuggestion(
            refSearchPromise,
            newSuggestion,
        ) {
            if (searchPromise !== refSearchPromise || newSuggestion === null) {
                return;
            }
            editor.update(
                () => {
                    const selection = $getSelection();
                    const [hasMatch, match] = $search(selection);
                    if (
                        !hasMatch ||
                        match !== lastMatch ||
                        !$isRangeSelection(selection)
                    ) {
                        return;
                    }
                    const selectionCopy = selection.clone();
                    const node = $createAutocompleteNode(uuid);
                    autocompleteNodeKey = node.getKey();
                    selection.insertNodes([node]);
                    $setSelection(selectionCopy);
                    lastSuggestion = newSuggestion;
                    setSuggestion(newSuggestion);

                    console.log('setSuggestion(newSuggestion)', newSuggestion)
                },
                { tag: 'history-merge' },
            );
        }

        function handleAutocompleteNodeTransform(node) {
            const key = node.getKey();
            console.log('handleAutocompleteNodeTransform', node)
            if (node.__uuid === uuid && key !== autocompleteNodeKey) {
                $clearSuggestion();
            }
        }
        function handleUpdate() {
            editor.update(() => {
                const selection = $getSelection();
                const [hasMatch, match] = $search(selection);
                if (!hasMatch) {
                    $clearSuggestion();
                    return;
                }
                if (match === lastMatch) {
                    return;
                }
                $clearSuggestion();
                searchPromise = query(match);
                searchPromise.promise
                    .then((newSuggestion) => {
                        if (searchPromise !== null) {
                            updateAsyncSuggestion(searchPromise, newSuggestion);
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                    });
                lastMatch = match;
            });
        }
        function $handleAutocompleteIntent() {
            // TODO can we input metadata on a parent node from here?
            const {
                autocompleteChunk,
            } = lastSuggestion || {}
            if (autocompleteChunk === null || autocompleteNodeKey === null) {
                return false;
            }
            const autocompleteNode = $getNodeByKey(autocompleteNodeKey);
            if (autocompleteNode === null) {
                return false;
            }
            const textNode = $createTextNode(autocompleteChunk);
            autocompleteNode.replace(textNode);
            textNode.selectNext();
            // TODO: Can we set metadata on a parent node from here?
            $clearSuggestion();
            return true;
        }
        function $handleKeypressCommand(e) {
            if ($handleAutocompleteIntent()) {
                e.preventDefault();
                return true;
            }
            return false;
        }
        function handleSwipeRight(_force, e) {
            editor.update(() => {
                if ($handleAutocompleteIntent()) {
                    e.preventDefault();
                }
            });
        }
        function unmountSuggestion() {
            editor.update(() => {
                $clearSuggestion();
            });
        }

        const rootElem = editor.getRootElement();

        return mergeRegister(
            editor.registerNodeTransform(
                AutocompleteNode,
                handleAutocompleteNodeTransform,
            ),
            editor.registerUpdateListener(handleUpdate),
            editor.registerCommand(
                KEY_TAB_COMMAND,
                $handleKeypressCommand,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_ARROW_RIGHT_COMMAND,
                $handleKeypressCommand,
                COMMAND_PRIORITY_LOW,
            ),
            ...(rootElem !== null
                ? [addSwipeRightListener(rootElem, handleSwipeRight)]
                : []),
            unmountSuggestion,
        );
    }, [editor, query, setSuggestion]);

    return null;
}

class AutocompleteServer {
    DATABASE = DICTIONARY;
    LATENCY = 200;

    query = (searchText) => {
        let isDismissed = false;

        const dismiss = () => {
            isDismissed = true;
        };
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                if (isDismissed) {
                    return reject('Dismissed');
                }
                const searchTextLength = searchText.length;
                if (searchText === '' || searchTextLength < 4) {
                    return resolve(null);
                }
                const char0 = searchText.charCodeAt(0);
                const isCapitalized = char0 >= 65 && char0 <= 90;
                const caseInsensitiveSearchText = isCapitalized
                    ? String.fromCharCode(char0 + 32) + searchText.substring(1)
                    : searchText;
                const match = this.DATABASE.find(
                    (dictionaryWord) =>
                        dictionaryWord.startsWith(caseInsensitiveSearchText) ?? null,
                );
                if (match === undefined) {
                    return resolve(null);
                }
                const matchCapitalized = isCapitalized
                    ? String.fromCharCode(match.charCodeAt(0) - 32) + match.substring(1)
                    : match;
                const autocompleteChunk = matchCapitalized.substring(searchTextLength);
                if (autocompleteChunk === '') {
                    return resolve(null);
                }
                return resolve({autocompleteChunk});
            }, this.LATENCY);
        });

        return {
            dismiss,
            promise,
        };
    };
}

const DICTIONARY = [
    'information',
    'available',
    'copyright',
];