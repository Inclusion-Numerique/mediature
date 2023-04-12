import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $isMarkNode, $unwrapMarkNode } from '@lexical/mark';
import { $getRoot, $isElementNode, LexicalEditor, LexicalNode } from 'lexical';

import PlaygroundNodes from '@mediature/ui/src/Editor/nodes/PlaygroundNodes';

export function createPlaygroundHeadlessEditor(): LexicalEditor {
  return createHeadlessEditor({
    nodes: PlaygroundNodes,
    onError: (err) => {
      console.error(err);
    },
  });
}

export function inlineEditorStateToHtml(inlineEditorState: string): string {
  const editor = createPlaygroundHeadlessEditor();

  const editorStateJSON = JSON.parse(inlineEditorState);
  editor.setEditorState(editor.parseEditorState(editorStateJSON));

  let htmlContent: string | null = null;

  editor.update(() => {
    htmlContent = $generateHtmlFromNodes(editor, null);
  });

  if (!htmlContent) {
    throw new Error('cannot get the html from the editor state');
  }

  return htmlContent;
}

export function inlineEditorStateToText(inlineEditorState: string): string {
  const editor = createPlaygroundHeadlessEditor();

  const editorStateJSON = JSON.parse(inlineEditorState);
  editor.setEditorState(editor.parseEditorState(editorStateJSON));

  let textContent: string | null = null;

  editor.update(() => {
    textContent = $getRoot().getTextContent();
  });

  if (!textContent) {
    throw new Error('cannot get the text from the editor state');
  }

  return textContent;
}

function sanitizeNode(node: LexicalNode): void {
  if ($isMarkNode(node)) {
    $unwrapMarkNode(node);
    return;
  }

  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      sanitizeNode(child);
    }
  }
}

export function validateEditorState(inlineEditorState: string): void {
  const editor = createPlaygroundHeadlessEditor();

  const editorStateJSON = JSON.parse(inlineEditorState);
  editor.setEditorState(editor.parseEditorState(editorStateJSON));

  editor.update(() => {
    const root = $getRoot();

    sanitizeNode(root);
  });

  const sanitizedInlineEditorState = JSON.stringify(editor.getEditorState().toJSON());

  if (inlineEditorState.trim() !== sanitizedInlineEditorState) {
    throw new Error('the editor state input is not valid');
  }
}
