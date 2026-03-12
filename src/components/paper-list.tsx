'use client';

import { useState, useCallback } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ExternalLink, Quote, Search, Star, FileText, BookOpen,
  Trash2, FolderInput, X, Loader2,
} from 'lucide-react';

interface PaperListProps {
  papers: Paper[];
  summaries: Record<string, string[]>;
  selectedPaper: Paper | null;
  collections: Collection[];
  onSelectPaper: (paper: Paper) => void;
  onStarToggle?: (paper: Paper) => void;
  onBulkDelete?: (paperIds: string[]) => Promise<void>;
  onBulkAddToCollection?: (paperIds: string[], collectionId: string) => Promise<void>;
}

export function PaperList({
  papers,
  summaries: _summaries,
  selectedPaper,
  collections,
  onSelectPaper,
  onStarToggle,
  onBulkDelete,
  onBulkAddToCollection,
}: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [collectionPopoverOpen, setCollectionPopoverOpen] = useState(false);

  const filteredPapers = papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paper.source?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (paper.typeOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const isSelectionMode = selectedIds.size > 0;
  const allFilteredSelected = filteredPapers.length > 0 && filteredPapers.every((p) => selectedIds.has(p.id));
  const someFilteredSelected = filteredPapers.some((p) => selectedIds.has(p.id));

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPapers.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPapers.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }, [allFilteredSelected, filteredPapers]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleRowClick = useCallback((paper: Paper) => {
    if (isSelectionMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(paper.id)) next.delete(paper.id);
        else next.add(paper.id);
        return next;
      });
    } else {
      onSelectPaper(paper);
    }
  }, [isSelectionMode, onSelectPaper]);

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      clearSelection();
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!onBulkAddToCollection) return;
    setIsBulkMoving(true);
    setCollectionPopoverOpen(false);
    try {
      await onBulkAddToCollection(Array.from(selectedIds), collectionId);
      clearSelection();
    } finally {
      setIsBulkMoving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 border-r border-border/70 bg-background overflow-hidden">

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-border/60 bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            placeholder="Search papers…"
            className="h-9 pl-9 bg-muted/30 border-border/50 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/30 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Bulk action bar (slides in when selection active) ────────── */}
      <div
        className={cn(
          'shrink-0 overflow-hidden transition-all duration-200 ease-in-out',
          isSelectionMode ? 'max-h-14 border-b border-primary/20 bg-primary/5' : 'max-h-0'
        )}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground min-w-0">
            <span className="text-primary font-semibold">{selectedIds.size}</span>
            <span className="text-muted-foreground"> selected</span>
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Add to collection */}
            {onBulkAddToCollection && collections.length > 0 && (
              <Popover open={collectionPopoverOpen} onOpenChange={setCollectionPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg gap-1.5 text-xs"
                    disabled={isBulkMoving}
                  >
                    {isBulkMoving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <FolderInput className="h-3.5 w-3.5" />}
                    Add to collection
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-52 p-1.5">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                    Choose collection
                  </p>
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      onClick={() => handleAddToCollection(c.id)}
                    >
                      <FolderInput className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            {/* Delete */}
            {onBulkDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedIds.size} paper{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the selected paper{selectedIds.size !== 1 ? 's' : ''} and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Clear */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Column header ───────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/20">
        <div className="flex justify-center">
          <Checkbox
            checked={allFilteredSelected}
            data-state={someFilteredSelected && !allFilteredSelected ? 'indeterminate' : undefined}
            onCheckedChange={toggleAll}
            aria-label="Select all"
            className={cn(
              'h-4 w-4 transition-opacity',
              isSelectionMode ? 'opacity-100' : 'opacity-0 hover:opacity-60'
            )}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Paper
        </span>
        <div className="flex items-center gap-6 pr-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          <span className="w-10 text-center">Year</span>
          <span className="w-24 text-center">Type</span>
          <span className="w-16 text-center">Citations</span>
          <span className="w-8 text-center">URL</span>
        </div>
      </div>

      {/* ── Paper rows ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredPapers.length > 0 ? (
          <ul className="divide-y divide-border/50">
            {filteredPapers.map((paper) => {
              const landingUrl = paper.landingPageUrl || paper.paperUrl || null;
              const isDetailSelected = selectedPaper?.id === paper.id;
              const isChecked = selectedIds.has(paper.id);

              return (
                <li
                  key={paper.id}
                  onClick={() => handleRowClick(paper)}
                  className={cn(
                    'group grid grid-cols-[56px_1fr_auto] items-start gap-3 px-4 py-4 cursor-pointer transition-colors duration-150',
                    isChecked
                      ? 'bg-primary/8 border-l-[3px] border-l-primary pl-[13px]'
                      : isDetailSelected
                        ? 'bg-primary/5 border-l-[3px] border-l-primary/60 pl-[13px]'
                        : 'border-l-[3px] border-l-transparent hover:bg-muted/40 pl-[13px]'
                  )}
                >
                  {/* Checkbox + Star cell — side by side */}
                  <div
                    className="flex items-start justify-center gap-1 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Checkbox — visible on hover or in selection mode */}
                    <div className={cn(
                      'transition-opacity duration-150',
                      isChecked || isSelectionMode
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    )}>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            checked ? next.add(paper.id) : next.delete(paper.id);
                            return next;
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                        aria-label="Select paper"
                      />
                    </div>

                    {/* Star — always visible */}
                    {onStarToggle ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onStarToggle(paper); }}
                        aria-label={paper.starred ? 'Unstar' : 'Star'}
                        className={cn(
                          'rounded-md p-0.5 transition-colors',
                          paper.starred ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                        )}
                      >
                        <Star className={cn('h-4 w-4', paper.starred && 'fill-amber-500')} />
                      </button>
                    ) : (
                      <Star
                        className={cn('h-4 w-4', paper.starred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/25')}
                        aria-hidden
                      />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 space-y-1.5">
                    <p className={cn(
                      'text-sm font-semibold leading-snug line-clamp-2 break-words',
                      isDetailSelected || isChecked ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'
                    )}>
                      {paper.title || <span className="italic text-muted-foreground">Untitled</span>}
                    </p>
                    {paper.authors && paper.authors.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {paper.authors.join(' · ')}
                      </p>
                    )}
                    {paper.source && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground/70 italic line-clamp-1 text-green-500">
                        <BookOpen className="h-3 w-3 shrink-0 not-italic opacity-60" />
                        {paper.source}
                      </p>
                    )}
                  </div>

                  {/* Right meta column */}
                  <div className="flex items-start gap-6 pt-0.5 shrink-0">
                    <div className="w-10 flex justify-center">
                      {paper.year > 0 ? (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">{paper.year}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </div>
                    <div className="w-24 flex justify-center">
                      {paper.typeOfWork ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[10px] font-medium px-2 py-0.5 max-w-full truncate"
                          title={paper.typeOfWork}
                        >
                          <FileText className="h-2.5 w-2.5 shrink-0 mr-1" />
                          <span className="truncate">{paper.typeOfWork}</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </div>
                    <div className="w-16 flex justify-center">
                      {paper.citedByCount != null && paper.citedByCount > 0 ? (
                        <Badge className="rounded-full text-[10px] font-semibold px-2 py-0.5 gap-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                          <Quote className="h-2.5 w-2.5 shrink-0" />
                          {paper.citedByCount >= 1000
                            ? `${(paper.citedByCount / 1000).toFixed(1)}k`
                            : paper.citedByCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </div>
                    <div className="w-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
                      {landingUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                          asChild
                        >
                          <a href={landingUrl} target="_blank" rel="noopener noreferrer" aria-label="Open URL">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-24">
            <div className="rounded-full bg-muted/50 p-4">
              <Search className="h-6 w-6 opacity-40" />
            </div>
            <p className="font-medium text-sm">
              {searchTerm ? 'No papers match your search' : 'No papers yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[220px] text-center">
              {searchTerm ? 'Try a different term or clear the search.' : 'Click "Import" to add your first paper.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer count ────────────────────────────────────────────── */}
      {papers.length > 0 && (
        <div className="shrink-0 border-t border-border/60 bg-muted/10 px-4 py-2">
          <p className="text-[11px] text-muted-foreground/60">
            {searchTerm
              ? `${filteredPapers.length} of ${papers.length} papers`
              : `${papers.length} paper${papers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  );
}
