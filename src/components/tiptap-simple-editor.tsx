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
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { TableKit } from '@tiptap/extension-table';
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
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Minus,
  Table as TableIcon,
  FileDown,
  Loader2,
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
  'tiptap-note-editor min-h-[200px] px-4 py-3 focus:outline-none';

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
        HTMLAttributes: {
          class: 'rounded px-0.5 bg-amber-200/90 dark:bg-amber-400/40',
        },
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
      HorizontalRule.configure({
        HTMLAttributes: { class: 'border-t border-border my-4' },
      }),
      TableKit.configure({
        resizable: true,
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
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

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

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const html = editor.getHTML();
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.padding = '24px';
      container.style.fontFamily = 'inherit';
      container.style.fontSize = '14px';
      container.style.color = 'inherit';
      container.style.backgroundColor = 'white';
      container.style.minWidth = '400px';
      document.body.appendChild(container);
      await html2pdf().set({
        margin: 12,
        filename: 'note.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();
      document.body.removeChild(container);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocx = async () => {
    setExporting('docx');
    try {
      const html = editor.getHTML();
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'note.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('DOCX export failed:', e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm min-h-0', className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-t-xl border-b border-border/60 bg-muted/40 px-2.5 py-2">
        {/* Group 1: History */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!a.canUndo} title="Undo">
            <Undo className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!a.canRedo} title="Redo">
            <Redo className="size-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Group 2: Text style */}
        <ToolbarGroup>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 px-6 transition-colors hover:bg-primary/10 hover:text-primary',
                currentHeadingLevel !== 0 && 'bg-primary/15 text-primary'
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
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Group 3: Lists & blocks */}
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={a.bulletList} title="Bullet list">
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={a.orderedList} title="Numbered list">
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={a.taskList} title="Task list">
            <ListTodo className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Insert divider">
            <Minus className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">
            <TableIcon className="size-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Group 4: Formatting */}
        <ToolbarGroup>
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
          <SubscriptIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={a.superscript}
          title="Superscript"
        >
          <SuperscriptIcon className="size-4" />
        </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Group 5: Alignment */}
        <ToolbarGroup>
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
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Group 6: Export */}
        <ToolbarGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                disabled={!!exporting}
                title="Download as PDF or DOCX"
              >
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPdf} disabled={!!exporting}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDocx} disabled={!!exporting}>
                Export as DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarGroup>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return (
    <span
      className="mx-0.5 w-px self-stretch min-h-[1.25rem] bg-border"
      role="separator"
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
      className={cn(
        'size-8 rounded-lg transition-colors',
        'hover:bg-primary/10 hover:text-primary',
        'disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit',
        isActive && 'bg-primary/15 text-primary hover:bg-primary/20'
      )}
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
