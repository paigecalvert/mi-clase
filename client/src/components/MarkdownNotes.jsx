import React, { useEffect, useRef, useState } from 'react';

const s = {
  shell: {
    border: '1px solid #dee2e6',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fff',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    padding: 8,
    borderBottom: '1px solid #edf2f4',
    background: '#f8f9fa',
  },
  toolBtn: active => ({
    border: '1px solid #dee2e6',
    background: active ? '#386641' : '#fff',
    color: active ? '#fff' : '#386641',
    borderRadius: 6,
    minWidth: 32,
    height: 30,
    padding: '0 8px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }),
  editorWrap: {
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 12,
    left: 12,
    color: '#adb5bd',
    fontSize: 14,
    pointerEvents: 'none',
  },
  editor: {
    width: '100%',
    minHeight: 160,
    border: 0,
    padding: 12,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: 1.5,
    color: '#212529',
  },
};

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function placeCaretAtEnd(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCurrentBlock(editor) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  let node = selection.anchorNode;
  if (!node || !editor.contains(node)) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== editor) {
    if (['P', 'DIV', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'LI'].includes(node.nodeName)) {
      return node;
    }
    node = node.parentElement;
  }

  return editor;
}

function applyInlineMarkdown(block) {
  const text = block.textContent || '';
  if (!/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/.test(text)) return false;

  const escaped = escapeHtml(text);
  const nextHtml = escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\s][^_]*?)_/g, '$1<em>$2</em>');

  if (nextHtml === escaped) return false;

  block.innerHTML = nextHtml;
  placeCaretAtEnd(block);
  return true;
}

export default function MarkdownNotes({ value, onChange, onSavingShortcut }) {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [active, setActive] = useState({
    block: 'p',
    bold: false,
    italic: false,
    unorderedList: false,
    orderedList: false,
  });

  const updateEmptyState = () => {
    const editor = editorRef.current;
    const text = editor?.textContent || '';
    setIsEmpty(!text.trim());
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const nextValue = value || '';
    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
      updateEmptyState();
    }
  }, [value]);

  const emitChange = () => {
    const nextValue = editorRef.current?.innerHTML || '';
    updateEmptyState();
    onChange(nextValue);
  };

  const updateActiveState = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const block = getCurrentBlock(editor);
    const blockName = block?.nodeName?.toLowerCase() || 'p';
    setActive({
      block: blockName,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const runCommand = (command, argument = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
    updateActiveState();
  };

  const applyMarkdownShortcut = () => {
    const editor = editorRef.current;
    const block = getCurrentBlock(editor);
    if (!editor || !block) return false;

    const text = block.textContent || '';
    const shortcut = [
      { match: text.match(/^#\s(.*)$/), command: 'formatBlock', argument: 'h1' },
      { match: text.match(/^##\s(.*)$/), command: 'formatBlock', argument: 'h2' },
      { match: text.match(/^###\s(.*)$/), command: 'formatBlock', argument: 'h3' },
      { match: text.match(/^-\s(.*)$/), command: 'insertUnorderedList' },
      { match: text.match(/^\d+\.\s(.*)$/), command: 'insertOrderedList' },
      { match: text.match(/^>\s(.*)$/), command: 'formatBlock', argument: 'blockquote' },
    ].find(item => item.match);

    if (!shortcut) return applyInlineMarkdown(block);

    block.textContent = shortcut.match[1];
    placeCaretAtEnd(block);
    document.execCommand(shortcut.command, false, shortcut.argument || null);
    updateActiveState();
    return true;
  };

  const tools = [
    { label: 'H1', title: 'Heading 1', active: active.block === 'h1', action: () => runCommand('formatBlock', 'h1') },
    { label: 'H2', title: 'Heading 2', active: active.block === 'h2', action: () => runCommand('formatBlock', 'h2') },
    { label: 'H3', title: 'Heading 3', active: active.block === 'h3', action: () => runCommand('formatBlock', 'h3') },
    { label: 'P', title: 'Paragraph', active: active.block === 'p' || active.block === 'div', action: () => runCommand('formatBlock', 'p') },
    { label: 'B', title: 'Bold', active: active.bold, style: { fontWeight: 900 }, action: () => runCommand('bold') },
    { label: 'I', title: 'Italic', active: active.italic, style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }, action: () => runCommand('italic') },
    { label: '•', title: 'Bulleted list', active: active.unorderedList, action: () => runCommand('insertUnorderedList') },
    { label: '1.', title: 'Numbered list', active: active.orderedList, action: () => runCommand('insertOrderedList') },
    { label: '>', title: 'Quote', active: active.block === 'blockquote', action: () => runCommand('formatBlock', 'blockquote') },
  ];

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      onSavingShortcut?.();
      return;
    }

    const editor = editorRef.current;
    const block = editor ? getCurrentBlock(editor) : null;
    const blockName = block?.nodeName?.toLowerCase();
    if (event.key === 'Enter' && !event.shiftKey && ['h1', 'h2', 'h3'].includes(blockName)) {
      requestAnimationFrame(() => {
        document.execCommand('formatBlock', false, 'p');
        emitChange();
        updateActiveState();
      });
    }
  };

  const handleInput = () => {
    applyMarkdownShortcut();
    emitChange();
    updateActiveState();
  };

  const handleSelectionChange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;
    updateActiveState();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  });

  return (
    <div style={s.shell}>
      <div style={s.toolbar}>
        {tools.map(tool => (
          <button key={tool.title} type="button" title={tool.title} style={{ ...s.toolBtn(tool.active), ...tool.style }} onMouseDown={event => event.preventDefault()} onClick={tool.action}>
            {tool.label}
          </button>
        ))}
      </div>

      <div style={s.editorWrap}>
        {isEmpty && <div style={s.placeholder}>Take notes from today's class...</div>}
        <div
          ref={editorRef}
          className="notes-rich-editor"
          style={s.editor}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Class notes"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveState}
          onMouseUp={updateActiveState}
        />
      </div>
    </div>
  );
}
