import { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  rows = 4,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const isFocusedRef = useRef(false);

  // Only update innerHTML when value changes externally AND editor is not focused
  useEffect(() => {
    // Skip if this is a value we just sent up (prevents cursor jumping)
    if (lastValueRef.current === value) {
      return;
    }

    // Only sync external changes when not focused to prevent cursor jumping
    if (editorRef.current && !isFocusedRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    lastValueRef.current = value;
  }, [value]);

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, commandValue?: string) => {
    // Execute the command - browser handles selection naturally
    document.execCommand(command, false, commandValue);

    // Sync the change
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange]);

  // Get the current block element or text node containing the cursor
  const getCurrentBlock = useCallback((): { node: Node; isDirectText: boolean } | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node: Node | null = selection.getRangeAt(0).startContainer;
    const originalNode = node;

    // If we're in a text node, check if it's directly in the editor
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentNode === editorRef.current) {
        // Text is directly in the editor (no wrapper block)
        return { node: node, isDirectText: true };
      }
      node = node.parentNode;
    }

    // Walk up to find a block-level element or direct child of editor
    while (node && node !== editorRef.current) {
      const parent = node.parentNode;
      if (parent === editorRef.current) {
        return { node: node as HTMLElement, isDirectText: false };
      }
      // Check if this is a block element
      if (node.nodeType === Node.ELEMENT_NODE) {
        const display = window.getComputedStyle(node as Element).display;
        if (display === 'block' || node.nodeName === 'DIV' || node.nodeName === 'P') {
          return { node: node as HTMLElement, isDirectText: false };
        }
      }
      node = parent;
    }

    // If we got here and originalNode is directly in editor, return it
    if (originalNode.parentNode === editorRef.current) {
      return { node: originalNode, isDirectText: true };
    }

    return null;
  }, []);

  // Check for list auto-detection patterns
  const checkListPattern = useCallback((text: string): { type: 'bullet' | 'number'; marker: string } | null => {
    // Check for bullet: "- " at start
    if (text.startsWith('- ')) {
      return { type: 'bullet', marker: '- ' };
    }
    // Also support "* " for bullets
    if (text.startsWith('* ')) {
      return { type: 'bullet', marker: '* ' };
    }
    // Check for number: "N. " at start (where N is one or more digits)
    const numberMatch = text.match(/^(\d+)\.\s/);
    if (numberMatch) {
      return { type: 'number', marker: numberMatch[0] };
    }
    return null;
  }, []);

  // Check if cursor is at the start of a list item
  const isCursorAtStartOfListItem = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);

    // Must be a collapsed cursor (not a selection)
    if (!range.collapsed) return false;

    // Find the closest list item
    let node: Node | null = range.startContainer;
    let listItem: HTMLLIElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'LI') {
        listItem = node as HTMLLIElement;
        break;
      }
      node = node.parentNode;
    }

    if (!listItem) return false;

    // Check if we're at offset 0
    if (range.startOffset !== 0) return false;

    // Check if we're at the very beginning of the list item
    // Walk up from startContainer to listItem, ensuring we're at the start of each level
    let current: Node | null = range.startContainer;
    while (current && current !== listItem) {
      const parent: Node | null = current.parentNode;
      if (parent) {
        const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
        if (index !== 0) return false;
      }
      current = parent;
    }

    return true;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
      return;
    }

    // Handle Tab for list indentation
    if (e.key === 'Tab') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if we're inside a list
      let node: Node | null = selection.getRangeAt(0).startContainer;
      let inList = false;
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'UL' || node.nodeName === 'OL') {
          inList = true;
          break;
        }
        node = node.parentNode;
      }

      if (inList) {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab = outdent
          execCommand('outdent');
        } else {
          // Tab = indent
          execCommand('indent');
        }
      }
      return;
    }

    // Handle Backspace at start of list item
    if (e.key === 'Backspace' && isCursorAtStartOfListItem()) {
      e.preventDefault();
      execCommand('outdent');
      return;
    }

    // Handle Enter for auto-list detection
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if we're already in a list - if so, let default behavior handle it
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'UL' || node.nodeName === 'OL' || node.nodeName === 'LI') {
          return; // Let default list continuation work
        }
        node = node.parentNode;
      }

      // Get current block and check for list pattern
      const blockInfo = getCurrentBlock();
      if (blockInfo) {
        const { node: block, isDirectText } = blockInfo;
        const text = block.textContent || '';
        const pattern = checkListPattern(text);

        if (pattern) {
          e.preventDefault();

          // Remove the marker from the text
          const newText = text.slice(pattern.marker.length);

          // Update the content
          if (isDirectText) {
            // Text is directly in the editor
            block.textContent = newText;
          } else {
            // It's a block element
            block.textContent = newText;
          }

          // Select all content to apply list formatting
          const range = document.createRange();
          if (isDirectText) {
            // For direct text, select the text node
            range.selectNodeContents(block);
          } else {
            range.selectNodeContents(block);
          }
          selection.removeAllRanges();
          selection.addRange(range);

          // Apply the appropriate list type
          if (pattern.type === 'bullet') {
            document.execCommand('insertUnorderedList', false);
          } else {
            document.execCommand('insertOrderedList', false);
          }

          // Move cursor to end of the list item
          const newSelection = window.getSelection();
          if (newSelection) {
            newSelection.collapseToEnd();
          }

          // Insert a new list item (simulating the Enter that triggered this)
          document.execCommand('insertParagraph', false);

          // Sync the change
          if (editorRef.current) {
            const newValue = editorRef.current.innerHTML;
            lastValueRef.current = newValue;
            onChange(newValue);
          }
        }
      }
    }
  }, [execCommand, isCursorAtStartOfListItem, getCurrentBlock, checkListPattern, onChange]);

  const handleListCommand = useCallback((type: 'unordered' | 'ordered') => {
    const command = type === 'unordered' ? 'insertUnorderedList' : 'insertOrderedList';

    // Ensure editor is focused before executing list command
    if (editorRef.current) {
      editorRef.current.focus();
    }

    // Execute the list command
    document.execCommand(command, false);

    // Sync the change
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    // Sync any final changes on blur
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      if (lastValueRef.current !== newValue) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    }
  }, [onChange]);

  const ToolbarButton = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent focus loss
      }}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-surface-100 transition-colors text-gray-400 hover:text-gray-200"
    >
      {children}
    </button>
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="border border-surface-50 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-200 border-b border-surface-100">
          <ToolbarButton onClick={() => execCommand('bold')} title="Bold (⌘B)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('italic')} title="Italic (⌘I)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('underline')} title="Underline (⌘U)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 20h14" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-surface-100 mx-1" />

          <ToolbarButton onClick={() => handleListCommand('unordered')} title="Bullet List">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="3" cy="5" r="1.5" />
              <circle cx="3" cy="10" r="1.5" />
              <circle cx="3" cy="15" r="1.5" />
              <rect x="7" y="4" width="11" height="2" rx="1" />
              <rect x="7" y="9" width="11" height="2" rx="1" />
              <rect x="7" y="14" width="11" height="2" rx="1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => handleListCommand('ordered')} title="Numbered List">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <text x="1" y="6" fontSize="5" fontWeight="bold">1</text>
              <text x="1" y="11" fontSize="5" fontWeight="bold">2</text>
              <text x="1" y="16" fontSize="5" fontWeight="bold">3</text>
              <rect x="7" y="4" width="11" height="2" rx="1" />
              <rect x="7" y="9" width="11" height="2" rx="1" />
              <rect x="7" y="14" width="11" height="2" rx="1" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-placeholder={placeholder}
          className="px-3 py-2 min-h-[100px] bg-surface-300 text-gray-100 focus:outline-none
            [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-500 [&:empty]:before:pointer-events-none
            [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6
            [&_li]:my-1
            [&_ul_ul]:list-circle [&_ul_ul_ul]:list-square
            [&_ol_ol]:list-[lower-alpha] [&_ol_ol_ol]:list-[lower-roman]"
          style={{ minHeight: `${rows * 1.5}rem` }}
        />
      </div>
    </div>
  );
}
