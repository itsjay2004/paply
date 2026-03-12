'use client';

import { useState } from 'react';
import type { Paper } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Quote, Search, Star, FileText, BookOpen } from 'lucide-react';

interface PaperListProps {
  papers: Paper[];
  summaries: Record<string, string[]>;
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  onStarToggle?: (paper: Paper) => void;
}

export function PaperList({ papers, summaries: _summaries, selectedPaper, onSelectPaper, onStarToggle }: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPapers = papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paper.source?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (paper.typeOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

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

      {/* ── Column header ───────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/20">
        <div />
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
              const isSelected = selectedPaper?.id === paper.id;

              return (
                <li
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className={cn(
                    'group grid grid-cols-[44px_1fr_auto] items-start gap-3 px-4 py-4 cursor-pointer transition-colors duration-150',
                    isSelected
                      ? 'bg-primary/8 border-l-[3px] border-l-primary pl-[13px]'
                      : 'border-l-[3px] border-l-transparent hover:bg-muted/40 pl-[13px]'
                  )}
                >
                  {/* Star */}
                  <div className="pt-0.5 flex justify-center" onClick={(e) => e.stopPropagation()}>
                    {onStarToggle ? (
                      <button
                        type="button"
                        onClick={() => onStarToggle(paper)}
                        aria-label={paper.starred ? 'Unstar' : 'Star'}
                        className={cn(
                          'rounded-md p-1 transition-colors',
                          paper.starred
                            ? 'text-amber-500'
                            : 'text-muted-foreground/30 hover:text-amber-400'
                        )}
                      >
                        <Star className={cn('h-4 w-4', paper.starred && 'fill-amber-500')} />
                      </button>
                    ) : (
                      <Star
                        className={cn('h-4 w-4 mt-1', paper.starred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/25')}
                        aria-hidden
                      />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 space-y-1.5">
                    {/* Title */}
                    <p className={cn(
                      'text-sm font-semibold leading-snug line-clamp-2 break-words',
                      isSelected ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground'
                    )}>
                      {paper.title || <span className="italic text-muted-foreground">Untitled</span>}
                    </p>

                    {/* Authors */}
                    {paper.authors && paper.authors.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {paper.authors.join(' · ')}
                      </p>
                    )}

                    {/* Source */}
                    {paper.source && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground/70 italic line-clamp-1 text-green-500">
                        <BookOpen className="h-3 w-3 shrink-0 not-italic opacity-60" />
                        {paper.source}
                      </p>
                    )}
                  </div>

                  {/* Right meta column */}
                  <div className="flex items-start gap-6 pt-0.5 shrink-0">

                    {/* Year */}
                    <div className="w-10 flex justify-center">
                      {paper.year > 0 ? (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {paper.year}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* Work type */}
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

                    {/* Citations */}
                    <div className="w-16 flex justify-center">
                      {paper.citedByCount != null && paper.citedByCount > 0 ? (
                        <Badge
                          className="rounded-full text-[10px] font-semibold px-2 py-0.5 gap-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                        >
                          <Quote className="h-2.5 w-2.5 shrink-0" />
                          {paper.citedByCount >= 1000
                            ? `${(paper.citedByCount / 1000).toFixed(1)}k`
                            : paper.citedByCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </div>

                    {/* URL */}
                    <div className="w-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
                      {landingUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                          asChild
                        >
                          <a
                            href={landingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open URL"
                          >
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
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-24">
            <div className="rounded-full bg-muted/50 p-4">
              <Search className="h-6 w-6 opacity-40" />
            </div>
            <p className="font-medium text-sm">
              {searchTerm ? 'No papers match your search' : 'No papers yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[220px] text-center">
              {searchTerm
                ? 'Try a different term or clear the search.'
                : 'Click "Import" to add your first paper.'}
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
