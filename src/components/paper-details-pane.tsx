'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, X, FileText, ChevronDown, ChevronUp, Trash2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SAVE_DEBOUNCE_MS = 600;

interface PaperDetailsPaneProps {
  paper: Paper;
  collections: Collection[];
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
  onPaperUpdate: (paper: Paper) => void;
  onPaperPersist: (paper: Paper) => Promise<void>;
  onPaperDelete: (paperId: string) => void;
  onClose: () => void;
}

/** Editable field wrapper: label + input, consistent styling */
function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function PaperDetailsPane({
  paper,
  collections,
  onSummaryUpdate,
  onPaperUpdate,
  onPaperPersist,
  onPaperDelete,
  onClose,
}: PaperDetailsPaneProps) {
  const { toast } = useToast();
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [editedPaper, setEditedPaper] = useState<Paper>(paper);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastPersisted, setLastPersisted] = useState<Paper | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEditedPaper(paper);
    setIsAbstractExpanded(false);
    setLastPersisted(paper);
  }, [paper]);

  const persist = useCallback(
    async (p: Paper) => {
      if (!p.id) return;
      setIsSaving(true);
      try {
        await onPaperPersist(p);
        setLastPersisted(p);
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Could not save',
          description: (e as Error).message || 'Failed to update paper.',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [onPaperPersist, toast]
  );

  const schedulePersist = useCallback(
    (p: Paper) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => persist(p), SAVE_DEBOUNCE_MS);
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (field: keyof Paper, value: unknown) => {
    const processedValue = field === 'year' ? (typeof value === 'number' ? value : parseInt(String(value), 10) || 0) : value;
    const updatedPaper = { ...editedPaper, [field]: processedValue };
    setEditedPaper(updatedPaper);
    onPaperUpdate(updatedPaper);
    schedulePersist(updatedPaper);
  };

  const handleAuthorChange = (value: string) => {
    const authors = value.split(',').map((a) => a.trim()).filter(Boolean);
    handleInputChange('authors', authors);
  };

  const handleSummarize = () => {
    if (!paper) return;
    startSummaryTransition(async () => {
      try {
        const result = await getSummary({ abstract: paper.abstract });
        onSummaryUpdate(paper.id, result);
        handleInputChange('summary', result);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not generate summary.',
        });
      }
    });
  };

  const isLongAbstract = (editedPaper.abstract?.length ?? 0) > 300;

  const isDirty =
    lastPersisted == null ||
    JSON.stringify({
      ...editedPaper,
      id: undefined,
      tags: undefined,
    }) !==
      JSON.stringify({
        ...lastPersisted,
        id: undefined,
        tags: undefined,
      });

  const metadataFields: { label: string; field: keyof Paper; type?: 'number' | 'text' }[] = [
    { label: 'Publication year', field: 'year', type: 'number' },
    { label: 'DOI', field: 'doi' },
    { label: 'Work type', field: 'typeOfWork' },
    { label: 'Language', field: 'language' },
    { label: 'Publisher', field: 'publisher' },
    { label: 'Publication city', field: 'city' },
    { label: 'Publication country', field: 'country' },
    { label: 'PDF URL', field: 'pdfUrl' },
  ];

  return (
    <div className="h-full w-full rounded-2xl bg-card border border-border/80 shadow-xl flex flex-col overflow-hidden">
      <ScrollArea className="h-full flex-1">
        {/* Top bar: save indicator + actions */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/95 backdrop-blur px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving…</span>
              </>
            )}
            {!isSaving && isDirty && (
              <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
            {!isSaving && !isDirty && lastPersisted && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onPaperDelete(paper.id)}
              aria-label="Delete paper"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
          {/* Title & authors */}
          <header className="space-y-4">
            <Field label="Title" id="title">
              <Textarea
                id="title"
                value={editedPaper.title ?? ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-xl md:text-2xl font-semibold leading-tight min-h-[2.5rem] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg"
                placeholder="Paper title"
              />
            </Field>
            <Field label="Authors" id="authors">
              <Input
                id="authors"
                value={(editedPaper.authors ?? []).join(', ')}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="bg-muted/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20"
                placeholder="Author One, Author Two, …"
              />
            </Field>

            <div className="flex flex-wrap gap-3 items-center pt-1">
              {editedPaper.pdfUrl && (
                <Button asChild variant="outline" size="sm" className="rounded-lg gap-2">
                  <a href={editedPaper.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Open PDF
                  </a>
                </Button>
              )}
              <div className="min-w-[200px]">
                <Select
                  value={editedPaper.collection_id ?? '__none__'}
                  onValueChange={(value) => handleInputChange('collection_id', value === '__none__' ? null : value)}
                >
                  <SelectTrigger className="w-full rounded-lg bg-muted/50 border-border/60">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No collection</SelectItem>
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          {/* Metadata card */}
          <section className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metadataFields.map(({ label, field, type = 'text' }) => (
                <Field key={field} label={label} id={field}>
                  <Input
                    id={field}
                    type={type}
                    value={
                      type === 'number'
                        ? ((): number | '' => {
                            const v = (editedPaper as Record<string, unknown>)[field];
                            return typeof v === 'number' ? v : '';
                          })()
                        : String((editedPaper as Record<string, unknown>)[field] ?? '')
                    }
                    onChange={(e) =>
                      handleInputChange(
                        field as keyof Paper,
                        type === 'number' ? (e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0) : e.target.value
                      )
                    }
                    className="bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg h-9"
                  />
                </Field>
              ))}
            </div>
          </section>

          {/* Abstract & summary */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Abstract</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="rounded-lg gap-2 shadow-sm"
              >
                {isSummarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Summarize
              </Button>
            </div>

            {editedPaper.summary && editedPaper.summary.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {editedPaper.summary.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {(isSummarizing && (!editedPaper.summary || editedPaper.summary.length === 0)) && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
              </div>
            )}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <Textarea
                value={editedPaper.abstract ?? ''}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                className="text-sm leading-relaxed w-full min-h-[120px] resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 rounded-none"
                rows={isAbstractExpanded ? 16 : 5}
                placeholder="Abstract"
              />
              {isLongAbstract && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                  className="mt-2 text-muted-foreground hover:text-foreground"
                >
                  {isAbstractExpanded ? 'Show less' : 'Show more'}
                  {isAbstractExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
