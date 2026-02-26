'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Strikethrough,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListTodo,
  Type,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const DEFAULT_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

const EDITOR_CONTENT_CLASS =
  'tiptap-note-editor min-h-[200px] px-3 py-2 focus:outline-none';

type ToolbarActiveState = {
  headingLevel: number;
  bulletList: boolean;
  orderedList: boolean;
  taskList: boolean;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  underline: boolean;
  code: boolean;
  blockquote: boolean;
  link: boolean;
  highlight: boolean;
  subscript: boolean;
  superscript: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify' | null;
  canUndo: boolean;
  canRedo: boolean;
};

function getToolbarActiveState(editor: Editor): ToolbarActiveState {
  return {
    headingLevel: editor.isActive('heading') ? (editor.getAttributes('heading').level as number) : 0,
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    taskList: editor.isActive('taskList'),
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    strike: editor.isActive('strike'),
    underline: editor.isActive('underline'),
    code: editor.isActive('code'),
    blockquote: editor.isActive('blockquote'),
    link: editor.isActive('link'),
    highlight: editor.isActive('highlight'),
    subscript: editor.isActive('subscript'),
    superscript: editor.isActive('superscript'),
    textAlign: editor.isActive({ textAlign: 'left' }) ? 'left' : editor.isActive({ textAlign: 'center' }) ? 'center' : editor.isActive({ textAlign: 'right' }) ? 'right' : editor.isActive({ textAlign: 'justify' }) ? 'justify' : null,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
  };
}

/** Simple Tiptap editor. Pass key={noteId} when switching notes so content resets. */
export function TiptapSimpleEditor({
  content,
  onUpdate,
  placeholder = 'Start writing…',
  editable = true,
  className,
}: {
  content: JSONContent | null | undefined;
  onUpdate?: (content: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}) {
  const initialContent =
    content &&
    typeof content === 'object' &&
    (content.type === 'doc' || content.content !== undefined)
      ? content
      : DEFAULT_DOC;

  const updateThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingJsonRef = useRef<JSONContent | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: { class: 'bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: EDITOR_CONTENT_CLASS,
      },
    },
    onUpdate: onUpdate
      ? ({ editor: ed }) => {
          const json = ed.getJSON();
          pendingJsonRef.current = json;
          if (updateThrottleRef.current) return;
          updateThrottleRef.current = setTimeout(() => {
            updateThrottleRef.current = null;
            const toSend = pendingJsonRef.current;
            if (toSend) {
              pendingJsonRef.current = null;
              onUpdate(toSend);
            }
          }, 400);
        }
      : undefined,
  });

  const [active, setActive] = useState<ToolbarActiveState | null>(null);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    setActive(getToolbarActiveState(editor));
    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setActive(getToolbarActiveState(editor));
      });
    };
    editor.on('selectionUpdate', scheduleUpdate);
    editor.on('transaction', scheduleUpdate);
    return () => {
      editor.off('selectionUpdate', scheduleUpdate);
      editor.off('transaction', scheduleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      if (updateThrottleRef.current) clearTimeout(updateThrottleRef.current);
    };
  }, []);

  if (!editor) return null;

  const a = active ?? getToolbarActiveState(editor);
  const currentHeadingLevel = a.headingLevel;

  const handleLinkClick = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('Enter URL:', 'https://');
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn('rounded-md border bg-background', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!a.canUndo}
          title="Undo"
        >
          <Undo className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!a.canRedo}
          title="Redo"
        >
          <Redo className="size-4" />
        </ToolbarButton>
        <ToolbarDivider />

        {/* Heading dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 px-6',
                currentHeadingLevel !== 0 && 'bg-gray-400'
              )}
              title="Text style"
            >
              {currentHeadingLevel === 1 ? (
                <Heading1 className="size-4" />
              ) : currentHeadingLevel === 2 ? (
                <Heading2 className="size-4" />
              ) : currentHeadingLevel === 3 ? (
                <Heading3 className="size-4" />
              ) : (
                <Type className="size-4" />
              )}
              <ChevronDown className="ml-0.5 size-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={a.bulletList}
          title="Bullet list"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={a.orderedList}
          title="Numbered list"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={a.taskList}
          title="Task list"
        >
          <ListTodo className="size-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={a.bold}
          title="Bold"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={a.italic}
          title="Italic"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={a.strike}
          title="Strikethrough"
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={a.underline}
          title="Underline"
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={a.code}
          title="Inline code"
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={a.blockquote}
          title="Quote"
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleLinkClick}
          isActive={a.link}
          title="Link"
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={a.highlight}
          title="Highlight"
        >
          <Highlighter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={a.subscript}
          title="Subscript"
        >
          <span className="text-xs font-medium">x₂</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={a.superscript}
          title="Superscript"
        >
          <span className="text-xs font-medium">x²</span>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={a.textAlign === 'left'}
          title="Align left"
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={a.textAlign === 'center'}
          title="Align center"
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={a.textAlign === 'right'}
          title="Align right"
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={a.textAlign === 'justify'}
          title="Justify"
        >
          <AlignJustify className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarDivider() {
  return (
    <span
      className="mx-1 w-px self-stretch bg-border"
      aria-hidden
    />
  );
}

function ToolbarButton({
  onClick,
  disabled,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-8', isActive && 'bg-gray-400')}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  );
}
