'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles, Loader2, X, FileText, ChevronDown, ChevronUp,
  Trash2, ExternalLink, Pencil, UploadCloud, Check, Folder,
  Calendar, Globe, BookOpen, Link2, Download, Quote,
} from 'lucide-react';
import { getSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LINK_FIELDS: (keyof Paper)[] = ['landingPageUrl', 'doi'];

function getLinkHref(field: keyof Paper, value: string): string | null {
  if (!value.trim()) return null;
  if (field === 'doi') return `https://doi.org/${value.trim()}`;
  if (field === 'landingPageUrl') {
    const v = value.trim();
    return v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`;
  }
  return null;
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

function EditField({
  label, id, children, className,
}: {
  label: string; id: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </Label>
      {children}
    </div>
  );
}

// Fields shown in the edit form — "Publication" group
const PUBLICATION_EDIT_FIELDS: { label: string; field: keyof Paper; type?: 'number' | 'text' }[] = [
  { label: 'Year', field: 'year', type: 'number' },
  { label: 'Publication date', field: 'publication_date' },
  { label: 'Work type', field: 'typeOfWork' },
  { label: 'Language', field: 'language' },
  { label: 'Source', field: 'source' },
  { label: 'Cited by count', field: 'citedByCount', type: 'number' },
];

// Fields shown in the "Identifiers" edit group
const IDENTIFIER_EDIT_FIELDS: { label: string; field: keyof Paper }[] = [
  { label: 'DOI', field: 'doi' },
  { label: 'URL', field: 'landingPageUrl' },
];

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
  const [isEditing, setIsEditing] = useState(false);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedPaper(paper);
    setIsAbstractExpanded(false);
    setIsEditing(false);
  }, [paper]);

  const persist = useCallback(async (p: Paper) => {
    if (!p.id) return;
    setIsSaving(true);
    try {
      await onPaperPersist(p);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: (e as Error).message || 'Failed to update paper.',
      });
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [onPaperPersist, toast]);

  const handleSave = async () => {
    try {
      await persist(editedPaper);
      onPaperUpdate(editedPaper);
      setIsEditing(false);
      toast({ title: 'Changes saved', description: 'Paper details updated successfully.' });
    } catch {
      // error already shown by persist
    }
  };

  const handleCancel = () => {
    setEditedPaper(paper);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Paper, value: unknown) => {
    const processed = field === 'year'
      ? (typeof value === 'number' ? value : parseInt(String(value), 10) || 0)
      : value;
    setEditedPaper(prev => ({ ...prev, [field]: processed }));
  };

  const handleAuthorChange = (value: string) => {
    const authors = value.split(',').map(a => a.trim()).filter(Boolean);
    handleInputChange('authors', authors);
  };

  const handleSummarize = () => {
    startSummaryTransition(async () => {
      try {
        const result = await getSummary({ abstract: paper.abstract });
        onSummaryUpdate(paper.id, result);
        setEditedPaper(prev => ({ ...prev, summary: result }));
        onPaperUpdate({ ...paper, summary: result });
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate summary.' });
      }
    });
  };

  const handleAddPdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !paper.id) return;
    if (file.size > 100 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'PDF must be 100 MB or smaller.' });
      return;
    }
    setIsUploadingPdf(true);
    try {
      const res = await fetch('/api/upload-pdf/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: file.size, paperId: paper.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to get upload URL');
      }
      const { putUrl, key } = await res.json();
      const putRes = await fetch(putUrl, { method: 'PUT', body: file, headers: { 'Content-Type': 'application/pdf' } });
      if (!putRes.ok) throw new Error('Failed to upload PDF');
      const updated = { ...paper, pdfUrl: key };
      setEditedPaper(updated);
      onPaperUpdate(updated);
      await persist(updated);
      toast({ title: 'PDF added', description: 'The PDF has been attached to this paper.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const activeCollection = collections.find(c => c.id === paper.collection_id);
  const isLongAbstract = (paper.abstract?.length ?? 0) > 300;
  const hasDoi = !!paper.doi?.trim();
  const hasUrl = !!paper.landingPageUrl?.trim();

  return (
    <div className="h-full w-full rounded-2xl bg-card border border-border/60 shadow-xl flex flex-col overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/60">
        {isEditing ? (
          <>
            <span className="text-sm font-medium">Edit paper</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 rounded-lg text-muted-foreground">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 rounded-lg gap-1.5 px-4">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Paper</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Separator orientation="vertical" className="h-4 mx-0.5" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onPaperDelete(paper.id)}
                aria-label="Delete paper"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isEditing ? (

          /* ══════════════════════════════════════════════════════════
             EDIT MODE
          ══════════════════════════════════════════════════════════ */
          <div className="p-5 space-y-5 max-w-2xl mx-auto">

            {/* Basic info */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Basic info</p>
              <EditField label="Title" id="title">
                <Textarea
                  id="title"
                  value={editedPaper.title ?? ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="resize-none bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg font-medium"
                  placeholder="Paper title"
                  rows={3}
                />
              </EditField>
              <EditField label="Authors" id="authors">
                <Textarea
                  id="authors"
                  value={(editedPaper.authors ?? []).join(', ')}
                  onChange={e => handleAuthorChange(e.target.value)}
                  className="resize-none bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg text-sm"
                  placeholder="Author One, Author Two, …"
                  rows={2}
                />
              </EditField>
              <EditField label="Collection" id="collection">
                <Select
                  value={editedPaper.collection_id ?? '__none__'}
                  onValueChange={v => handleInputChange('collection_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger className="rounded-lg bg-background border-border/60">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No collection</SelectItem>
                    {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </EditField>
            </div>

            {/* Abstract */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Abstract</p>
              <Textarea
                value={editedPaper.abstract ?? ''}
                onChange={e => handleInputChange('abstract', e.target.value)}
                className="min-h-[160px] resize-y bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg text-sm leading-relaxed"
                rows={8}
                placeholder="No abstract…"
              />
            </div>

            {/* Publication details */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Publication</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PUBLICATION_EDIT_FIELDS.map(({ label, field, type = 'text' }) => {
                  const value = (editedPaper as Record<string, unknown>)[field];
                  const strValue = type === 'number'
                    ? (typeof value === 'number' ? String(value) : '')
                    : String(value ?? '');
                  return (
                    <EditField key={field} label={label} id={field}>
                      <Input
                        id={field}
                        type={type}
                        value={type === 'number' ? (typeof value === 'number' ? value : '') : strValue}
                        onChange={e => handleInputChange(
                          field,
                          type === 'number'
                            ? (e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)
                            : e.target.value
                        )}
                        className="h-9 rounded-lg bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                    </EditField>
                  );
                })}
              </div>
            </div>

            {/* Identifiers */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Identifiers</p>
              <div className="grid grid-cols-1 gap-4">
                {IDENTIFIER_EDIT_FIELDS.map(({ label, field }) => {
                  const value = String((editedPaper as Record<string, unknown>)[field] ?? '');
                  const href = value ? getLinkHref(field, value) : null;
                  return (
                    <EditField key={field} label={label} id={field}>
                      <div className="flex gap-1.5 items-center min-w-0">
                        <Input
                          id={field}
                          value={value}
                          onChange={e => handleInputChange(field, e.target.value)}
                          className="flex-1 min-w-0 h-9 rounded-lg bg-background border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                          placeholder={field === 'doi' ? '10.xxxx/xxxxx' : 'https://…'}
                        />
                        {href && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-primary" asChild>
                            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </EditField>
                  );
                })}
              </div>
            </div>
          </div>

        ) : (

          /* ══════════════════════════════════════════════════════════
             VIEW MODE
          ══════════════════════════════════════════════════════════ */
          <div className="flex flex-col">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="px-5 pt-6 pb-5 space-y-4">

              {/* Collection badge */}
              {activeCollection && (
                <Badge variant="secondary" className="rounded-full gap-1.5 text-xs font-normal px-2.5 py-0.5">
                  <Folder className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                  {activeCollection.name}
                </Badge>
              )}

              {/* Title */}
              <h2 className="text-[1.35rem] font-bold leading-snug tracking-tight break-words [overflow-wrap:anywhere]">
                {paper.title || <span className="text-muted-foreground italic font-normal">Untitled paper</span>}
              </h2>

              {/* Authors */}
              {paper.authors && paper.authors.length > 0 && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paper.authors.join(' · ')}
                </p>
              )}

              {/* Source — journal/conference name, displayed like a citation byline */}
              {paper.source && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground italic">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 not-italic opacity-60" />
                  {paper.source}
                </p>
              )}

              {/* Meta row: year · date · type · language · cited-by badge */}
              {(paper.year || paper.publication_date || paper.typeOfWork || paper.language || paper.citedByCount) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  {paper.year ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {paper.year}
                    </span>
                  ) : null}
                  {paper.publication_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {paper.publication_date}
                    </span>
                  )}
                  {paper.typeOfWork && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {paper.typeOfWork}
                    </span>
                  )}
                  {paper.language && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {paper.language}
                    </span>
                  )}
                  {paper.citedByCount ? (
                    <Badge className="rounded-full gap-1 text-[11px] font-medium px-2 py-0.5 h-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                      <Quote className="h-3 w-3" />
                      {paper.citedByCount.toLocaleString()} citations
                    </Badge>
                  ) : null}
                </div>
              )}

              {/* PDF actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  aria-hidden
                  onChange={handleAddPdfFileChange}
                />
                {paper.pdfUrl ? (
                  <>
                    <Button asChild size="sm" className="h-8 rounded-lg gap-2 px-4">
                      <a href={`/papers/${paper.id}/view`}>
                        <FileText className="h-3.5 w-3.5" />
                        View PDF
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 rounded-lg gap-2 px-4">
                      <a href={`/api/papers/${paper.id}/pdf-url`} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg gap-2 px-4 border-dashed text-muted-foreground"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isUploadingPdf}
                  >
                    {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                    {isUploadingPdf ? 'Uploading…' : 'Attach PDF'}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Abstract ─────────────────────────────────────────── */}
            <div className="px-5 py-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Abstract</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="h-7 rounded-lg gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5"
                >
                  {isSummarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isSummarizing ? 'Summarizing…' : 'Summarize'}
                </Button>
              </div>

              {/* AI Summary card */}
              {paper.summary && paper.summary.length > 0 && (
                <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">AI Summary</p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{paper.summary.join(' ')}</p>
                </div>
              )}
              {isSummarizing && (!paper.summary || paper.summary.length === 0) && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">AI Summary</p>
                  </div>
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                </div>
              )}

              {/* Abstract body */}
              {paper.abstract ? (
                <div>
                  <p className={cn(
                    'text-sm leading-relaxed text-foreground/85',
                    !isAbstractExpanded && isLongAbstract && 'line-clamp-5'
                  )}>
                    {paper.abstract}
                  </p>
                  {isLongAbstract && (
                    <button
                      type="button"
                      onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {isAbstractExpanded ? 'Show less' : 'Show more'}
                      {isAbstractExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">No abstract available.</p>
              )}
            </div>

            {/* ── Identifiers ──────────────────────────────────────── */}
            {(hasDoi || hasUrl) && (
              <>
                <Separator />
                <div className="px-5 py-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Identifiers</p>
                  <div className="space-y-2">
                    {hasDoi && (
                      <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors group">
                        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-0.5">DOI</p>
                          <a
                            href={`https://doi.org/${paper.doi!.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
                          >
                            <span className="break-all">{paper.doi}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        </div>
                      </div>
                    )}
                    {hasUrl && (
                      <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors group">
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-0.5">URL</p>
                          <a
                            href={getLinkHref('landingPageUrl', paper.landingPageUrl!) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
                          >
                            <span className="break-all">{paper.landingPageUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* bottom breathing room */}
            <div className="h-6" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
