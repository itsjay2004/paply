'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  UploadCloud,
  FileText,
  Check,
  Link,
  Library,
  X,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { importPaperFromDoi, importPaperFromPdfWithKey } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Paper } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ── Types ───────────────────────────────────────────────────────────────── */

type FileStatus = 'pending' | 'uploading' | 'extracting' | 'saving' | 'done' | 'error';
type DoiStep = 'fetching' | 'saving' | null;

type FileEntry = {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
};

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperImported: (paper: Omit<Paper, 'id'>) => void | Promise<void>;
}

const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100 MB
const CONCURRENCY = 3;

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: 'Waiting',
  uploading: 'Uploading…',
  extracting: 'Extracting metadata…',
  saving: 'Saving to library…',
  done: 'Done',
  error: 'Failed',
};

/* ── Component ───────────────────────────────────────────────────────────── */

export function ImportDialog({ open, onOpenChange, onPaperImported }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'doi' | 'pdf'>('doi');
  const [doi, setDoi] = useState('');
  const [fileQueue, setFileQueue] = useState<FileEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [doiStep, setDoiStep] = useState<DoiStep>(null);
  const [isDoiImporting, setIsDoiImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /* ── Derived state ─────────────────────────────────────────────────────── */

  const doneCount = fileQueue.filter((e) => e.status === 'done').length;
  const errorCount = fileQueue.filter((e) => e.status === 'error').length;
  const allSettled =
    fileQueue.length > 0 && fileQueue.every((e) => e.status === 'done' || e.status === 'error');

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  const resetForm = useCallback(() => {
    setDoi('');
    setFileQueue([]);
    setIsRunning(false);
    setDoiStep(null);
    setIsDoiImporting(false);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    // Block close while processing
    if (!isOpen && (isRunning || isDoiImporting)) return;
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const addFiles = (files: FileList | File[]) => {
    const next: FileEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: `"${file.name}" is not a PDF.`,
        });
        continue;
      }
      if (file.size > MAX_PDF_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `"${file.name}" exceeds the 100 MB limit.`,
        });
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, status: 'pending' });
    }
    setFileQueue((prev) => [...prev, ...next]);
  };

  const removeFile = (id: string) => {
    setFileQueue((prev) => prev.filter((e) => e.id !== id));
  };

  /* ── Per-file processor ────────────────────────────────────────────────── */

  const processFile = useCallback(
    async (entry: FileEntry) => {
      const update = (patch: Partial<FileEntry>) =>
        setFileQueue((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)));

      try {
        // Step 1 — get presigned URL
        update({ status: 'uploading' });
        const urlRes = await fetch('/api/upload-pdf/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: entry.file.size }),
        });
        if (!urlRes.ok) {
          const d = await urlRes.json().catch(() => ({}));
          throw new Error(d?.error ?? 'Failed to get upload URL');
        }
        const { putUrl, key } = await urlRes.json();

        // Step 2 — upload to S3
        const putRes = await fetch(putUrl, {
          method: 'PUT',
          body: entry.file,
          headers: { 'Content-Type': 'application/pdf' },
        });
        if (!putRes.ok) {
          throw new Error(`Upload failed (${putRes.status} ${putRes.statusText})`);
        }

        // Step 3 — AI extraction + OpenAlex fetch (server action)
        update({ status: 'extracting' });
        const paperDetails = await importPaperFromPdfWithKey({ key });

        // Step 4 — persist to DB
        update({ status: 'saving' });
        await onPaperImported(paperDetails as Omit<Paper, 'id'>);

        update({ status: 'done' });
      } catch (err) {
        update({
          status: 'error',
          error: err instanceof Error ? err.message : 'Import failed',
        });
      }
    },
    [onPaperImported],
  );

  /* ── Batch runner ──────────────────────────────────────────────────────── */

  const runQueue = useCallback(
    async (entries: FileEntry[]) => {
      setIsRunning(true);
      for (let i = 0; i < entries.length; i += CONCURRENCY) {
        await Promise.all(entries.slice(i, i + CONCURRENCY).map(processFile));
      }
      setIsRunning(false);
    },
    [processFile],
  );

  const handlePdfImport = () => {
    if (fileQueue.length === 0 || isRunning) return;
    runQueue(fileQueue.filter((e) => e.status === 'pending'));
  };

  const handleRetryFailed = () => {
    const failed = fileQueue.filter((e) => e.status === 'error');
    if (failed.length === 0) return;
    // Reset all failed entries to pending in state, then process them
    setFileQueue((prev) =>
      prev.map((e) => (e.status === 'error' ? { ...e, status: 'pending', error: undefined } : e)),
    );
    runQueue(failed.map((e) => ({ ...e, status: 'pending' as FileStatus, error: undefined })));
  };

  /* ── DOI import (unchanged logic) ─────────────────────────────────────── */

  const handleDoiImport = async () => {
    if (!doi.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a DOI.' });
      return;
    }
    setIsDoiImporting(true);
    try {
      setDoiStep('fetching');
      const paperDetails = await importPaperFromDoi({ doi: doi.trim() });
      setDoiStep('saving');
      if (paperDetails) {
        const payload: Omit<Paper, 'id'> =
          'pdfUrl' in paperDetails && paperDetails.pdfUrl !== undefined
            ? (paperDetails as Omit<Paper, 'id'>)
            : {
                title: paperDetails.title,
                authors: paperDetails.authors,
                year: paperDetails.year,
                publication_date:
                  'publication_date' in paperDetails ? paperDetails.publication_date : undefined,
                abstract: paperDetails.abstract,
                doi: paperDetails.doi ?? null,
                language: 'language' in paperDetails ? paperDetails.language : undefined,
                source: 'source' in paperDetails ? paperDetails.source : undefined,
                paperUrl: 'paperUrl' in paperDetails ? paperDetails.paperUrl : undefined,
                landingPageUrl:
                  'landingPageUrl' in paperDetails ? paperDetails.landingPageUrl : undefined,
                citedByCount:
                  'citedByCount' in paperDetails ? paperDetails.citedByCount : undefined,
                typeOfWork: 'work_type' in paperDetails ? paperDetails.work_type : undefined,
                pdfUrl: '',
                summary: [],
                tags: [],
                collectionIds: [],
              };
        await onPaperImported(payload);
        toast({ title: 'Success', description: 'Paper imported successfully.' });
        handleOpenChange(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsDoiImporting(false);
      setDoiStep(null);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import Paper</DialogTitle>
          <DialogDescription>
            Add papers to your library from PDFs or by DOI.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'doi' | 'pdf')}
          className="pt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="doi" disabled={isRunning}>
              From DOI
            </TabsTrigger>
            <TabsTrigger value="pdf" disabled={isDoiImporting}>
              From PDF
            </TabsTrigger>
          </TabsList>

          {/* ── DOI Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="doi" className="space-y-4 py-4">
            {isDoiImporting ? (
              <div className="space-y-1 py-2">
                {(
                  [
                    { key: 'fetching', label: 'Fetching paper details', icon: <Link className="size-4" /> },
                    { key: 'saving', label: 'Adding to your library', icon: <Library className="size-4" /> },
                  ] as const
                ).map((step, index) => {
                  const currentIndex = doiStep === 'fetching' ? 0 : doiStep === 'saving' ? 1 : -1;
                  const isActive = index === currentIndex;
                  const isDone = currentIndex > index;
                  return (
                    <div
                      key={step.key}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : isDone
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground opacity-50',
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background">
                        {isActive ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : isDone ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          step.icon
                        )}
                      </span>
                      <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  placeholder="10.1101/2021.08.12.456123"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDoiImport();
                  }}
                />
              </div>
            )}
          </TabsContent>

          {/* ── PDF Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="pdf" className="space-y-3 py-3">
            {/* Drop zone — hidden while processing or after all settled */}
            {!isRunning && !allSettled && (
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors',
                  'border-border/60 hover:border-primary/50 hover:bg-primary/[0.02]',
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-9 text-muted-foreground/40" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Drop PDFs here or click to browse</p>
                  <p className="text-xs text-muted-foreground">
                    Select multiple files · Max 100 MB each
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            {/* File list */}
            {fileQueue.length > 0 && (
              <ScrollArea className="max-h-56 rounded-lg border border-border/50">
                <div className="space-y-px p-1.5">
                  {fileQueue.map((entry) => {
                    const isActive = ['uploading', 'extracting', 'saving'].includes(entry.status);
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isActive && 'bg-primary/8 text-primary',
                          entry.status === 'done' &&
                            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                          entry.status === 'error' && 'bg-destructive/10 text-destructive',
                          entry.status === 'pending' && 'text-muted-foreground',
                        )}
                      >
                        {/* Status icon */}
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background/80">
                          {isActive && <Loader2 className="size-3.5 animate-spin" />}
                          {entry.status === 'done' && (
                            <Check className="size-3.5 text-emerald-500" />
                          )}
                          {entry.status === 'error' && (
                            <AlertCircle className="size-3.5 text-destructive" />
                          )}
                          {entry.status === 'pending' && (
                            <FileText className="size-3.5 text-muted-foreground/50" />
                          )}
                        </span>

                        {/* Filename + sub-label */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium leading-snug">
                            {entry.file.name}
                          </p>
                          {entry.status !== 'pending' && (
                            <p className="truncate text-[10px] leading-snug opacity-70">
                              {entry.status === 'error'
                                ? entry.error
                                : STATUS_LABEL[entry.status]}
                            </p>
                          )}
                        </div>

                        {/* Remove button (only when not actively running) */}
                        {!isRunning && entry.status !== 'done' && (
                          <button
                            type="button"
                            onClick={() => removeFile(entry.id)}
                            className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
                            title="Remove"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Add more files button */}
            {fileQueue.length > 0 && !isRunning && !allSettled && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Plus className="size-3.5" />
                Add more PDFs
              </button>
            )}

            {/* Summary banner when all settled */}
            {allSettled && (
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm',
                  errorCount === 0
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                )}
              >
                {errorCount === 0 ? (
                  <>
                    <Check className="size-4 shrink-0" />
                    All {doneCount} {doneCount === 1 ? 'paper' : 'papers'} imported successfully.
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-4 shrink-0" />
                    {doneCount > 0
                      ? `${doneCount} imported, ${errorCount} failed.`
                      : `${errorCount} ${errorCount === 1 ? 'import' : 'imports'} failed.`}
                  </>
                )}
              </div>
            )}

            {/* Running progress summary */}
            {isRunning && (
              <p className="text-center text-xs text-muted-foreground">
                Processing up to {CONCURRENCY} files at a time…
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRunning || isDoiImporting}
          >
            {allSettled ? 'Close' : 'Cancel'}
          </Button>

          {/* DOI: import button */}
          {activeTab === 'doi' && !isDoiImporting && (
            <Button onClick={handleDoiImport} disabled={!doi.trim()}>
              Import
            </Button>
          )}

          {/* PDF: start import */}
          {activeTab === 'pdf' && !allSettled && (
            <Button
              onClick={handlePdfImport}
              disabled={fileQueue.filter((e) => e.status === 'pending').length === 0 || isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  Import{' '}
                  {fileQueue.length === 1 ? '1 PDF' : `${fileQueue.length} PDFs`}
                </>
              )}
            </Button>
          )}

          {/* PDF: retry failed */}
          {activeTab === 'pdf' && allSettled && errorCount > 0 && (
            <Button variant="outline" onClick={handleRetryFailed}>
              <RefreshCw className="size-4" />
              Retry {errorCount} failed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
