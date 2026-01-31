/**
 * @fileoverview AutoEmbedPlugin - Automatic embedding of external content.
 * @module AutoEmbedPlugin
 * 
 * Detects URLs for embeddable content (YouTube videos, etc.) and provides
 * UI for inserting rich embeds automatically.
 */

import {
  AutoEmbedOption,
  LexicalAutoEmbedPlugin,
  URL_MATCHER,
} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTranslation } from 'next-i18next';

// import useModal from '../../hooks/useModal';
// import Button from '../../ui/Button';
// import {DialogActions} from '../../ui/Dialog';
// import {INSERT_FIGMA_COMMAND} from '../FigmaPlugin';
// import {INSERT_TWEET_COMMAND} from '../TwitterPlugin';
import {INSERT_YOUTUBE_COMMAND} from './YouTubePlugin';
import { YouTube } from '@mui/icons-material';
import {
  ListItem,
  Card,
  List,
  Button,
  ListItemIcon,
  ListItemText,
  ListItemButton,

} from '@mui/material';


export const YoutubeEmbedConfig = {
  contentName: 'youtubeVideo', // Translation key

  exampleUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',

  // Icon for display.
  icon: <YouTube />,

  insertNode: (editor, result) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
  },

  keywords: ['youtube', 'video'],

  // Determine if a given URL is a match and return url data.
  parseUrl: async (url) => {
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);

    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;

    if (id != null) {
      return {
        id,
        url,
      };
    }

    return null;
  },

  type: 'youtube-video',
};

// export const TwitterEmbedConfig = {
//   // e.g. Tweet or Google Map.
//   contentName: 'Tweet',

//   exampleUrl: 'https://twitter.com/jack/status/20',

//   // Icon for display.
//   icon: <i className="icon tweet" />,

//   // Create the Lexical embed node from the url data.
//   insertNode: (editor, result) => {
//     editor.dispatchCommand(INSERT_TWEET_COMMAND, result.id);
//   },

//   // For extra searching.
//   keywords: ['tweet', 'twitter'],

//   // Determine if a given URL is a match and return url data.
//   parseUrl: (text) => {
//     const match =
//       /^https:\/\/twitter\.com\/(#!\/)?(\w+)\/status(es)*\/(\d+)$/.exec(text);

//     if (match != null) {
//       return {
//         id: match[4],
//         url: match[0],
//       };
//     }

//     return null;
//   },

//   type: 'tweet',
// };

// export const FigmaEmbedConfig = {
//   contentName: 'Figma Document',

//   exampleUrl: 'https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File',

//   icon: <i className="icon figma" />,

//   insertNode: (editor, result) => {
//     editor.dispatchCommand(INSERT_FIGMA_COMMAND, result.id);
//   },

//   keywords: ['figma', 'figma.com', 'mock-up'],

//   // Determine if a given URL is a match and return url data.
//   parseUrl: (text) => {
//     const match =
//       /https:\/\/([\w.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/.exec(
//         text,
//       );

//     if (match != null) {
//       return {
//         id: match[3],
//         url: match[0],
//       };
//     }

//     return null;
//   },

//   type: 'figma',
// };

export const EmbedConfigs = [
  // TwitterEmbedConfig,
  YoutubeEmbedConfig,
  // FigmaEmbedConfig,
];

function AutoEmbedMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <ListItem
      disablePadding
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <ListItemButton>
        <ListItemText className="text" primary={option.title} />
      </ListItemButton>
    </ListItem>
  );
}

function AutoEmbedMenu({
  options,
  selectedItemIndex,
  onOptionClick,
  onOptionMouseEnter,
}) {
  return (
    <Card className="typeahead-popover"
      style={{
        padding: '0rem',
        borderRadius: '3px',
        boxShadow: '1px 1px 5px 0px rgba(0,0,0,0.75)',
      }}
    >
      <List>
        {options.map((option, i) => (
          <AutoEmbedMenuItem
            index={i}
            isSelected={selectedItemIndex === i}
            onClick={() => onOptionClick(option, i)}
            onMouseEnter={() => onOptionMouseEnter(i)}
            key={option.key}
            option={option}
          />
        ))}
      </List>
    </Card>
  );
}

const debounce = (callback, delay) => {
  let timeoutId;
  return (text) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(text);
    }, delay);
  };
};

export function AutoEmbedDialog({
  embedConfig,
  onClose,
}) {
  const { t } = useTranslation('editor');
  const [text, setText] = useState('');
  const [editor] = useLexicalComposerContext();
  const [embedResult, setEmbedResult] = useState(null);

  const validateText = useMemo(
    () =>
      debounce((inputText) => {
        const urlMatch = URL_MATCHER.exec(inputText);
        if (embedConfig != null && inputText != null && urlMatch != null) {
          Promise.resolve(embedConfig.parseUrl(inputText)).then(
            (parseResult) => {
              setEmbedResult(parseResult);
            },
          );
        } else if (embedResult != null) {
          setEmbedResult(null);
        }
      }, 200),
    [embedConfig, embedResult],
  );

  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult);
      onClose();
    }
  };

  return (
    <div style={{width: '600px'}}>
      <div className="Input__wrapper">
        <input
          type="text"
          className="Input__input"
          placeholder={embedConfig.exampleUrl}
          value={text}
          data-test-id={`${embedConfig.type}-embed-modal-url`}
          onChange={(e) => {
            const {value} = e.target;
            setText(value);
            validateText(value);
          }}
        />
      </div>
      <DialogActions>
        <Button
          disabled={!embedResult}
          onClick={onClick}
          data-test-id={`${embedConfig.type}-embed-modal-submit-btn`}>
          {t('autoEmbedPlugin.embed')}
        </Button>
      </DialogActions>
    </div>
  );
}

export default function AutoEmbedPlugin() {
  const { t } = useTranslation('editor');
  // const [modal, showModal] = useModal();

  const openEmbedModal = (embedConfig) => {
    showModal(t('autoEmbedPlugin.embedTitle', { contentName: t(`autoEmbedPlugin.${embedConfig.contentName}`) }), (onClose) => (
      <AutoEmbedDialog embedConfig={embedConfig} onClose={onClose} />
    ));
  };

  const getMenuOptions = (
    activeEmbedConfig,
    embedFn,
    dismissFn,
  ) => {
    return [
      new AutoEmbedOption(t('autoEmbedPlugin.dismiss'), {
        onSelect: dismissFn,
      }),
      new AutoEmbedOption(t('autoEmbedPlugin.embedOption', { contentName: t(`autoEmbedPlugin.${activeEmbedConfig.contentName}`) }), {
        onSelect: embedFn,
      }),
    ];
  };

  return (
    <>
      <LexicalAutoEmbedPlugin
        embedConfigs={EmbedConfigs}
        onOpenEmbedModalForConfig={openEmbedModal}
        getMenuOptions={getMenuOptions}
        menuRenderFn={(
          anchorElementRef,
          {selectedIndex, options, selectOptionAndCleanUp, setHighlightedIndex},
        ) => null // Disabled - using FloatingLinkEditor for YouTube embeds instead
        }
      />
    </>
  );
}