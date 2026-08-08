/**
 * @fileoverview Storybook stories for PlaylistPlugin
 * Demonstrates audio/video playlists in both editable and read-only modes
 */

import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { Button } from "@mui/material";

import PlaylistPlugin, {
  INSERT_PLAYLIST_COMMAND,
  PlaylistNode,
} from "./PlaylistPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  seedMockFiles,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";

export default {
  title: "✏️ Lesson Editor/Media/Playlist",
  component: PlaylistPlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockFiles([
        {
          id: "audio-1",
          name: "Audio Track 1",
          owner: "mock-user-id",
          identityId: "us-east-1:mock-identity",
          mimeType: "audio/mpeg",
          level: "PUBLIC",
          path: "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          duration: 2.8,
          size: 45678,
          generated: false,
          _version: 1,
        },
        {
          id: "audio-2",
          name: "Audio Track 2",
          owner: "mock-user-id",
          identityId: "us-east-1:mock-identity",
          mimeType: "audio/mpeg",
          level: "PUBLIC",
          path: "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          duration: 4.5,
          size: 72345,
          generated: false,
          _version: 1,
        },
        {
          id: "audio-3",
          name: "Audio Track 3",
          owner: "mock-user-id",
          identityId: "us-east-1:mock-identity",
          mimeType: "audio/mpeg",
          level: "PUBLIC",
          path: "/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3",
          duration: 3.2,
          size: 51234,
          generated: false,
          _version: 1,
        },
      ]);
      seedMockUnit({
        id: "playlist-story-unit",
        name: "Playlist Story Unit",
        data: JSON.stringify({
          root: {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        }),
        _version: 1,
        owner: "mock-user-sub",
      });
    },
  ],
  parameters: {
    layout: "fullscreen",
    unitId: "playlist-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertPlaylistButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [
      "video1",
      "video2",
      "video3",
    ]);
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Sample Playlist
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: "PlaylistPluginDemo",
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      PlaylistNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Playlist Plugin - Editable Mode</h2>
        {showInsertButton && <InsertPlaylistButton />}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            minHeight: "400px",
            padding: "20px",
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{ outline: "none", minHeight: "350px" }}
              />
            }
            placeholder={
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  color: "#999",
                }}
              >
                Enter text or insert playlists...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <PlaylistPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "PlaylistPluginDemo",
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      PlaylistNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Playlist Plugin - Read-Only Mode</h2>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            minHeight: "400px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{ outline: "none", minHeight: "350px" }}
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <PlaylistPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const samplePlaylistState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Audio Playlist Example",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Below is an audio playlist with multiple tracks:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        type: "playlist",
        version: 1,
        fileIDs: ["audio-1", "audio-2", "audio-3"],
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
};

export const EditableWithPlaylist = {
  render: () => <EditableTemplate editorState={samplePlaylistState} />,
};

export const ReadOnlyWithPlaylist = {
  render: () => <ReadOnlyTemplate editorState={samplePlaylistState} />,
};
