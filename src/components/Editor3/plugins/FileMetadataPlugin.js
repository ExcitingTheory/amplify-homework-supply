import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { INSERT_FILE_METADATA_COMMAND } from '../commands/FileMetadataCommands';
import { $createFileMetadataNode } from '../nodes/FileMetadataNode';

export default function FileMetadataPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_FILE_METADATA_COMMAND,
      (payload) => {
        const { file, parsedContent } = payload;
        const fileMetadataNode = $createFileMetadataNode(file, parsedContent);
        $insertNodeToNearestRoot(fileMetadataNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}