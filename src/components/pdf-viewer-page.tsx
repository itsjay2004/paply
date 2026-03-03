'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Highlighter, StickyNote, Loader2, MapPin, PanelRightClose, PanelRightOpen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SavedHighlight } from '@/components/pdf-viewer-with-highlights';

const PdfViewerWithHighlights = dynamic(
  () => import('@/components/pdf-viewer-with-highlights').then((m) => m.PdfViewerWithHighlights),
  { ssr: false, loading: () => <div className="flex flex-1 items-center justify-center bg-muted/30"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> }
);

interface DbHighlight extends SavedHighlight {}

interface DbNote {
  id: string;
  paper_id: string;
  note_content: string;
  position: { pageIndex: number; x: number; y: number };
  created_at?: string;
}

export function PdfViewerPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = use(params);
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<DbHighlight[]>([]);
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'highlights' | 'notes'>('highlights');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const jumpToHighlightAreaRef = useRef<((area: { pageIndex: number; left: number; top: number; width: number; height: number }) => void) | null>(null);

  const fetchPdfUrl = useCallback(async () => {
    const res = await fetch(`/api/papers/${paperId}/pdf-url?json=1`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Failed to load PDF');
    }
    const data = await res.json();
    return data.url as string;
  }, [paperId]);

  const fetchHighlights = useCallback(async () => {
    const res = await fetch(`/api/papers/${paperId}/highlights`);
    if (!res.ok) return [];
    return res.json() as Promise<DbHighlight[]>;
  }, [paperId]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/papers/${paperId}/notes`);
    if (!res.ok) return [];
    return res.json() as Promise<DbNote[]>;
  }, [paperId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [url, h, n] = await Promise.all([
          fetchPdfUrl(),
          fetchHighlights(),
          fetchNotes(),
        ]);
        if (!cancelled) {
          setPdfUrl(url);
          setHighlights(h);
          setNotes(n);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPdfUrl, fetchHighlights, fetchNotes]);

  const handleAddNote = async () => {
    const content = newNote.trim();
    if (!content) {
      toast({ variant: 'destructive', title: 'Enter note text' });
      return;
    }
    setSavingNote(true);
    try {
      const res = await fetch(`/api/papers/${paperId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_content: content,
          position: { pageIndex: 0, x: 20, y: 20 },
        }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      const note = await res.json();
      setNotes((prev) => [...prev, note]);
      setNewNote('');
      toast({ title: 'Note added' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save note',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddHighlightFromSelection = useCallback(
    async (payload: {
      highlighted_text: string;
      position: { areas: Array<{ pageIndex: number; left: number; top: number; width: number; height: number }>; color: string };
    }) => {
      setSavingHighlight(true);
      try {
        const res = await fetch(`/api/papers/${paperId}/highlights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            highlighted_text: payload.highlighted_text,
            position: payload.position,
          }),
        });
        if (!res.ok) throw new Error('Failed to save highlight');
        const highlight = await res.json();
        toast({ title: 'Highlight saved' });
        return highlight as DbHighlight;
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Could not save highlight',
          description: e instanceof Error ? e.message : undefined,
        });
        throw e;
      } finally {
        setSavingHighlight(false);
      }
    },
    [paperId, toast]
  );

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ title: 'Note removed' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not delete note' });
    }
  };

  const handleRemoveHighlight = useCallback(
    async (highlightId: string) => {
      const res = await fetch(`/api/highlights/${highlightId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      toast({ title: 'Highlight removed' });
    },
    [toast]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-destructive">{error ?? 'No PDF available'}</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to papers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b bg-card px-4 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">PDF Viewer</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? 'Hide highlights & notes' : 'Show highlights & notes'}
        >
          {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* PDF area: in-page viewer with text selection highlighting */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <PdfViewerWithHighlights
            fileUrl={pdfUrl}
            paperId={paperId}
            highlights={highlights}
            onHighlightAdded={(h) => setHighlights((prev) => [...prev, h])}
            onAddHighlight={handleAddHighlightFromSelection}
            onRemoveHighlight={handleRemoveHighlight}
            onPluginReady={(api) => {
              jumpToHighlightAreaRef.current = api.jumpToHighlightArea;
            }}
            savingHighlight={savingHighlight}
          />
        </div>

        {/* Sidebar: Highlights & Notes (toggleable) */}
        {sidebarOpen && (
        <aside className="w-80 shrink-0 border-l bg-card flex flex-col">
          <div className="flex border-b">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('highlights')}
                    className={cn(
                      'flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-sm font-medium transition-colors',
                      activeTab === 'highlights'
                        ? 'border-b-2 border-primary text-primary bg-muted/50'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Highlighter className="h-4 w-4" />
                      Highlights
                    </span>
                    <span className="text-[10px] font-normal opacity-80">Text you&apos;ve marked</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p>Saved text selections from the PDF. Select text, click Highlight, then view them here.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                      'flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-sm font-medium transition-colors',
                      activeTab === 'notes'
                        ? 'border-b-2 border-primary text-primary bg-muted/50'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </span>
                    <span className="text-[10px] font-normal opacity-80">Your annotations</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p>Free-form notes you add. Use the form below to create notes linked to this paper.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {activeTab === 'highlights' && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Select text in the PDF, choose a colour in the toolbar or popup, then click Highlight. Click a highlight in the PDF to erase it.
                  </p>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Highlighted text
                    </span>
                    {highlights.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No highlights yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {highlights.map((h) => (
                          <li
                            key={h.id}
                            className="rounded-lg border bg-muted/30 p-2 text-sm group"
                          >
                            <p className="font-medium text-foreground/90 line-clamp-3">&ldquo;{h.highlighted_text}&rdquo;</p>
                            {h.explanation && (
                              <p className="mt-1 text-muted-foreground text-xs line-clamp-2">{h.explanation}</p>
                            )}
                            <div className="mt-2 flex gap-1">
                              {h.position?.areas?.length ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => jumpToHighlightAreaRef.current?.(h.position!.areas![0])}
                                >
                                  <MapPin className="h-3 w-3" />
                                  Go to
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:bg-destructive"
                                onClick={() => handleRemoveHighlight(h.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'notes' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Add note
                    </label>
                    <Textarea
                      placeholder="Write a note…"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleAddNote}
                      disabled={savingNote || !newNote.trim()}
                    >
                      {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add note'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Saved notes
                    </span>
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {notes.map((n) => (
                          <li
                            key={n.id}
                            className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-2 text-sm group"
                          >
                            <p className="text-foreground whitespace-pre-wrap">{n.note_content}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 text-xs text-muted-foreground hover:bg-destructive"
                              onClick={() => handleDeleteNote(n.id)}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </aside>
        )}
      </div>
    </div>
  );
}
