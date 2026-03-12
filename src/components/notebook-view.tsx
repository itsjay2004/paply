'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { NotebookNote } from '@/lib/types';
import { TiptapSimpleEditor } from '@/components/tiptap-simple-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText, PanelLeftClose, PanelLeft, BookOpen, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function apiRowToNotebookNote(row: Record<string, unknown>): NotebookNote {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    title: row.title != null ? String(row.title) : null,
    content: (row.content as Record<string, unknown>) ?? {},
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

/** First line of text from Tiptap JSON for list preview. */
function getPreviewFromContent(content: Record<string, unknown>): string {
  try {
    const contentArr = content.content as Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> | undefined;
    if (!Array.isArray(contentArr)) return 'Untitled';
    for (const node of contentArr) {
      if (node.type === 'paragraph' && Array.isArray(node.content)) {
        for (const inner of node.content) {
          if (inner.type === 'text' && typeof inner.text === 'string' && inner.text.trim()) {
            return inner.text.trim().slice(0, 60) + (inner.text.length > 60 ? '…' : '');
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return 'Untitled';
}

export function NotebookView() {
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<NotebookNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titleSaving, setTitleSaving] = useState(false);
  const [deletingNote, setDeletingNote] = useState<NotebookNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);

  // Helper to select a note and sync the title draft
  const selectNote = useCallback((note: NotebookNote | null) => {
    setSelectedNote(note);
    setTitleDraft(note?.title ?? '');
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notebook-notes');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to load notes');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const nextNotes = list.map((row: Record<string, unknown>) => apiRowToNotebookNote(row));
      setNotes(nextNotes);
      setSelectedNote((prev) => {
        const next = nextNotes.length === 0 ? null : (prev && nextNotes.some((n) => n.id === prev.id) ? prev : nextNotes[0]);
        setTitleDraft(next?.title ?? '');
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notes');
      setNotes([]);
      setSelectedNote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/notebook-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create note');
      const note = apiRowToNotebookNote(Array.isArray(data) ? data[0] : data);
      setNotes((prev) => [note, ...prev]);
      selectNote(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create note');
    } finally {
      setSaving(false);
    }
  }, []);

  const confirmDeleteNote = useCallback(
    async (note: NotebookNote) => {
      setDeletingNote(null);
      try {
        const res = await fetch(`/api/notebook-notes/${note.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete note');
        const remaining = notes.filter((n) => n.id !== note.id);
        setNotes(remaining);
        if (selectedNote?.id === note.id) {
          selectNote(remaining[0] ?? null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete note');
      }
    },
    [notes, selectedNote, selectNote]
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ noteId: string; content: Record<string, unknown> } | null>(null);

  const flushSave = useCallback(async () => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    const { noteId, content } = pending;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notebook-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save');
      const updated = apiRowToNotebookNote(Array.isArray(data) ? data[0] : data);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleContentUpdate = useCallback(
    (content: Record<string, unknown>) => {
      if (!selectedNote) return;
      pendingSaveRef.current = { noteId: selectedNote.id, content };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        flushSave();
      }, 600);
    },
    [selectedNote, flushSave]
  );

  const handleTitleSave = useCallback(async () => {
    if (!selectedNote) return;
    const trimmed = titleDraft.trim();
    // No-op if unchanged
    if ((trimmed || null) === (selectedNote.title ?? null)) return;
    setTitleSaving(true);
    try {
      const res = await fetch(`/api/notebook-notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save title');
      const updated = apiRowToNotebookNote(Array.isArray(data) ? data[0] : data);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save title');
    } finally {
      setTitleSaving(false);
    }
  }, [selectedNote, titleDraft]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden md:flex-row">
      {/* Notes list - togglable */}
      <aside
        className={cn(
          'flex shrink-0 flex-col overflow-hidden border-r border-border/70 bg-muted/20 transition-[width] duration-200 ease-out',
          listOpen ? 'w-full md:w-72' : 'w-0 border-r-0 md:w-0'
        )}
      >
        <div className={cn('flex min-w-0 items-center justify-between border-b border-border/60 px-3 py-2.5', listOpen && 'md:min-w-[18rem]')}>
          <span className="flex items-center gap-2 truncate text-sm font-semibold">
            <BookOpen className="size-4 text-primary/80" />
            Notes
          </span>
          <Button
            variant="default"
            size="icon"
            className="size-8 shrink-0 rounded-lg"
            onClick={handleCreateNote}
            disabled={saving}
            title="New note"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="w-full space-y-0.5 p-2">
            {notes.length === 0 && (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                No notes yet. Create one to start.
              </p>
            )}
            {notes.map((note) => {
              const rawPreview = note.title?.trim() || getPreviewFromContent(note.content);
              const preview = rawPreview.length > 28 ? rawPreview.slice(0, 28) + '…' : rawPreview;
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  className={cn(
                    'group flex min-w-0 w-full items-center gap-2 overflow-hidden rounded-lg py-2 pr-2.5 pl-2.5 text-left transition-colors',
                    'hover:bg-muted/60',
                    isSelected && 'border-l-2 border-l-primary bg-primary/10 pl-3'
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 overflow-hidden text-left"
                    onClick={() => selectNote(note)}
                  >
                    <span className="block truncate text-sm font-medium">{preview}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNote(note);
                    }}
                    title="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Editor area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        {/* Toolbar: list toggle + status */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-muted/20 px-3 py-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                  onClick={() => setListOpen((open) => !open)}
                >
                  {listOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeft className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="font-medium">{listOpen ? 'Hide notes list' : 'Show notes list'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {listOpen ? 'Collapse the sidebar to get more writing space.' : 'Expand the sidebar to browse and switch between notes.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {selectedNote && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  Saved
                </>
              )}
            </span>
          )}
        </div>
        {error && (
          <div className="shrink-0 border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {selectedNote ? (
          <div className="flex flex-1 flex-col min-h-0 overflow-y-auto p-6 gap-4">
            {/* Editable title */}
            <div className="relative group/title flex items-center">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === 'Escape') {
                    setTitleDraft(selectedNote.title ?? '');
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Untitled note"
                className={cn(
                  'h-auto border-0 border-b border-transparent bg-transparent px-0 py-1 text-2xl font-bold shadow-none outline-none ring-0',
                  'placeholder:text-muted-foreground/40 focus-visible:border-b-primary/50 focus-visible:ring-0',
                  'transition-colors duration-150'
                )}
                disabled={titleSaving}
              />
              {titleSaving && (
                <Loader2 className="absolute right-0 size-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <TiptapSimpleEditor
              key={selectedNote.id}
              content={selectedNote.content}
              onUpdate={handleContentUpdate}
              placeholder="Start writing…"
              editable
              className="min-h-[300px] flex-1"
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4">
              <FileText className="size-14 text-muted-foreground/60" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Select a note or create a new one</p>
              <p className="text-xs text-muted-foreground">Your notes are saved automatically.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleCreateNote} disabled={saving} size="sm" className="rounded-lg">
                <Plus className="size-4" />
                New note
              </Button>
              {!listOpen && (
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setListOpen(true)}>
                  <PanelLeft className="size-4" />
                  Show notes list
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingNote} onOpenChange={(open) => { if (!open) setDeletingNote(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingNote && (
                <>
                  <span className="font-medium text-foreground">
                    &ldquo;{deletingNote.title?.trim() || getPreviewFromContent(deletingNote.content)}&rdquo;
                  </span>{' '}
                  will be permanently deleted. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingNote && confirmDeleteNote(deletingNote)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
