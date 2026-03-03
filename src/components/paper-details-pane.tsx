'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, X, FileText, ChevronDown, ChevronUp, Trash2, Check, UploadCloud, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SAVE_DEBOUNCE_MS = 600;

/** URL field keys that should be rendered as links with an "Open" action */
const LINK_FIELDS: (keyof Paper)[] = ['paperUrl', 'landingPageUrl', 'doi'];

function isLinkField(field: keyof Paper): boolean {
  return LINK_FIELDS.includes(field);
}

/** Resolve href for a link field (for the open/external link action). */
function getLinkHref(paper: Paper, field: keyof Paper, value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  if (field === 'doi') return `https://doi.org/${value.trim()}`;
  if (field === 'paperUrl' || field === 'landingPageUrl') {
    const v = value.trim();
    return v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`;
  }
  return value.startsWith('http://') || value.startsWith('https://') ? value : null;
}

interface PaperDetailsPaneProps {
  paper: Paper;
  collections: Collection[];
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
  onPaperUpdate: (paper: Paper) => void;
  onPaperPersist: (paper: Paper) => Promise<void>;
  onPaperDelete: (paperId: string) => void;
  onClose: () => void;
}

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

/** Section heading with left accent bar for visual hierarchy */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider pl-3 border-l-2 border-primary/50">
      {children}
    </h3>
  );
}

/**
 * PaperDetailsPane is a sliding panel that allows the user to view and edit 
 * a specific paper's metadata. Features include auto-save, AI summarizing,
 * and collection management.
 */
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
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize internal state when the selected paper changes from props
  useEffect(() => {
    setEditedPaper(paper);
    setIsAbstractExpanded(false);
    setLastPersisted(paper);
  }, [paper]);

  /** 
   * Triggers the persistent save to the backend. 
   */
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

  /** 
   * Debounces the auto-save functionality to prevent excessive database writes 
   * during rapid typing.
   */
  const schedulePersist = useCallback(
    (p: Paper) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => persist(p), SAVE_DEBOUNCE_MS);
    },
    [persist]
  );

  // Cleanup pending timeouts on component unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  /** 
   * Handles changes for basic metadata fields (Title, DOI, etc.).
   */
  const handleInputChange = (field: keyof Paper, value: unknown) => {
    const processedValue = field === 'year' ? (typeof value === 'number' ? value : parseInt(String(value), 10) || 0) : value;
    const updatedPaper = { ...editedPaper, [field]: processedValue };
    setEditedPaper(updatedPaper);
    onPaperUpdate(updatedPaper);
    schedulePersist(updatedPaper);
  };

  /** 
   * Specialized handler for the authors list, converting a comma-separated string back to an array.
   */
  const handleAuthorChange = (value: string) => {
    const authors = value.split(',').map((a) => a.trim()).filter(Boolean);
    handleInputChange('authors', authors);
  };

  /** 
   * Kicks off the Genkit AI flow to generate a summary based on the paper's abstract.
   */
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

  /** 
   * Attach a PDF to this paper (e.g. after DOI import). Uploads to S3 and updates paper.pdfUrl.
   */
  const handleAddPdfClick = () => {
    pdfInputRef.current?.click();
  };

  const handleAddPdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editedPaper.id) return;
    const MAX_PDF_BYTES = 100 * 1024 * 1024;
    if (file.size > MAX_PDF_BYTES) {
      toast({ variant: 'destructive', title: 'Error', description: 'PDF must be 100 MB or smaller.' });
      return;
    }
    setIsUploadingPdf(true);
    try {
      const res = await fetch('/api/upload-pdf/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: file.size, paperId: editedPaper.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to get upload URL');
      }
      const { putUrl, key } = await res.json();
      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      });
      if (!putResponse.ok) {
        throw new Error('Failed to upload PDF');
      }
      const updatedPaper = { ...editedPaper, pdfUrl: key };
      setEditedPaper(updatedPaper);
      onPaperUpdate(updatedPaper);
      await persist(updatedPaper);
      toast({ title: 'PDF added', description: 'The PDF has been attached to this paper.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ variant: 'destructive', title: 'Upload failed', description: msg });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const isLongAbstract = (editedPaper.abstract?.length ?? 0) > 300;

  /** 
   * Determines if the user has made changes that are not yet saved to the server.
   * Compares the current state against the 'lastPersisted' snapshot (ignoring ignored fields).
   */
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
    { label: 'Publication date', field: 'publication_date' },
    { label: 'Work type', field: 'typeOfWork' },
    { label: 'Language', field: 'language' },
    { label: 'Source', field: 'source' },
    { label: 'Cited by count', field: 'citedByCount', type: 'number' },
    { label: 'DOI', field: 'doi' },
    { label: 'Paper URL', field: 'paperUrl' },
    { label: 'Landing page URL', field: 'landingPageUrl' },
  ];

  return (
    <div className="h-full w-full rounded-2xl bg-card border border-border/80 shadow-xl flex flex-col overflow-hidden">
      {/* Top bar — always visible */}
      <div className="shrink-0 flex items-center justify-between border-b-2 border-border/80 bg-card/95 backdrop-blur px-4 py-2.5">
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

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 md:p-6 space-y-8 max-w-2xl mx-auto">
          {/* Title, authors, and action buttons — scroll with content */}
          <header className="rounded-xl border border-border/60 bg-muted/5 -mx-4 md:-mx-6 px-4 md:px-6 py-4 space-y-4 ring-1 ring-border/40">
            <Field label="Title" id="title">
              <Textarea
                id="title"
                value={editedPaper.title ?? ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-lg md:text-xl font-semibold leading-snug min-h-[2.5rem] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg break-words [overflow-wrap:anywhere]"
                placeholder="Paper title"
                rows={3}
              />
            </Field>
            <Field label="Authors" id="authors">
              <Textarea
                id="authors"
                value={(editedPaper.authors ?? []).join(', ')}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="min-h-[2.5rem] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg text-sm leading-relaxed break-words [overflow-wrap:anywhere]"
                placeholder="Author One, Author Two, …"
                rows={2}
              />
            </Field>

            <div className="flex flex-wrap gap-3 items-center pt-1">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                aria-hidden
                onChange={handleAddPdfFileChange}
              />
              {editedPaper.pdfUrl ? (
                <>
                  <Button asChild variant="default" size="sm" className="rounded-lg gap-2">
                    <a href={`/papers/${editedPaper.id}/view`}>
                      <FileText className="h-4 w-4" />
                      View PDF
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-lg gap-2">
                    <a href={`/api/papers/${editedPaper.id}/pdf-url`} target="_blank" rel="noopener noreferrer" download>
                      <ExternalLink className="h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-2"
                  onClick={handleAddPdfClick}
                  disabled={isUploadingPdf}
                >
                  {isUploadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {isUploadingPdf ? 'Uploading PDF…' : 'Add PDF'}
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

          {/* Abstract section */}
          <section className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4 ring-1 ring-border/40">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading>Abstract</SectionHeading>
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

            {/* AI Summary: Rendered as a distinct high-light block if it exists */}
            {editedPaper.summary && editedPaper.summary.length > 0 && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {editedPaper.summary.join(' ')}
                </p>
              </div>
            )}

            {/* Loading Indicator for AI summarization */}
            {(isSummarizing && (!editedPaper.summary || editedPaper.summary.length === 0)) && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
              </div>
            )}

            {/* Abstract Textarea: Expandable view for long text */}
            <div className="rounded-lg border border-border/50 bg-background/50 p-4">
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

          {/* Metadata Details */}
          <section className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4 ring-1 ring-border/40">
            <SectionHeading>Details</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metadataFields.map(({ label, field, type = 'text' }) => {
                const value = (editedPaper as Record<string, unknown>)[field];
                const strValue = type === 'number' ? (typeof value === 'number' ? String(value) : '') : String(value ?? '');
                const href = isLinkField(field) ? getLinkHref(editedPaper, field, strValue) : null;
                return (
                  <Field key={field} label={label} id={field}>
                    <div className="flex gap-1.5 items-center min-w-0">
                      <Input
                        id={field}
                        type={type}
                        value={type === 'number' ? (typeof value === 'number' ? value : '') : strValue}
                        onChange={(e) =>
                          handleInputChange(
                            field as keyof Paper,
                            type === 'number' ? (e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0) : e.target.value
                          )
                        }
                        className={cn(
                          'flex-1 min-w-0 h-9 rounded-lg',
                          isLinkField(field) && strValue
                            ? 'text-primary underline decoration-primary/50 bg-transparent hover:bg-muted/30'
                            : 'bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20'
                        )}
                      />
                      {href && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-primary" asChild>
                          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </Field>
                );
              })}
            </div>
          </section>


        </div>
      </ScrollArea>
    </div>
  );
}
