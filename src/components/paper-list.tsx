'use client';

import { useState } from 'react';
import type { Paper } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Quote, Search, Star } from 'lucide-react';

interface PaperListProps {
  papers: Paper[];
  summaries: Record<string, string[]>;
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  onStarToggle?: (paper: Paper) => void;
}

export function PaperList({ papers, summaries, selectedPaper, onSelectPaper, onStarToggle }: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPapers = papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paper.abstract?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (paper.source?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (paper.typeOfWork?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="flex flex-1 flex-col min-h-0 border-r border-border/70 bg-background/70 backdrop-blur-sm overflow-hidden">
      {/* Search bar — pinned */}
      <div className="shrink-0 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="relative rounded-xl border border-border/60 bg-muted/30 p-2 shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, authors, abstract, source…"
            className="h-9 border-muted bg-background/90 pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable table — single native scroll context */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-[1100px] caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/70 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-[52px] text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Star
              </TableHead>
              <TableHead className="h-11 min-w-[200px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Title
              </TableHead>
              <TableHead className="h-11 min-w-[170px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Authors
              </TableHead>
              <TableHead className="h-11 min-w-[180px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Abstract
              </TableHead>
              <TableHead className="h-11 min-w-[280px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Summary
              </TableHead>
              <TableHead className="h-11 w-[130px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Source
              </TableHead>
              <TableHead className="h-11 w-[110px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Work type
              </TableHead>
              <TableHead className="h-11 w-[78px] text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Landing
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b">
            {filteredPapers.length > 0 ? (
              filteredPapers.map((paper) => {
                const landingUrl = paper.landingPageUrl || paper.paperUrl || null;
                const summaryPoints = summaries[paper.id] ?? paper.summary;
                return (
                  <TableRow
                    key={paper.id}
                    className={cn(
                      'group cursor-pointer border-b border-border/60 align-top transition-colors duration-200 even:bg-muted/[0.18] hover:bg-muted/45',
                      {
                        'border-l-4 border-l-primary bg-primary/10 hover:bg-primary/15':
                          selectedPaper?.id === paper.id,
                      }
                    )}
                    onClick={() => onSelectPaper(paper)}
                  >
                    {/* Column 0: Star */}
                    <TableCell className="py-3 text-center align-top" onClick={(e) => e.stopPropagation()}>
                      {onStarToggle ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-background/80 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                          onClick={() => onStarToggle(paper)}
                          aria-label={paper.starred ? 'Unstar paper' : 'Star paper'}
                        >
                          <Star
                            className={cn('h-4 w-4', paper.starred && 'fill-amber-500 text-amber-500')}
                          />
                        </button>
                      ) : (
                        <Star
                          className={cn('h-4 w-4', paper.starred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/50')}
                          aria-hidden
                        />
                      )}
                    </TableCell>

                    {/* Column 1: Title */}
                    <TableCell className="py-3">
                      <div>
                        <div className="text-sm font-semibold leading-snug text-foreground">
                          {paper.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          {paper.year > 0 && <span>{paper.year}</span>}
                          {paper.citedByCount != null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-bold">
                              <Quote className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {paper.citedByCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Authors */}
                    <TableCell className="py-3 align-top text-xs text-muted-foreground">
                      {paper.authors?.length > 0 ? (
                        <span className="line-clamp-4" title={paper.authors.join(', ')}>
                          {paper.authors.join(', ')}
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 3: Abstract */}
                    <TableCell className="py-3 align-top text-xs leading-relaxed text-muted-foreground">
                      {paper.abstract?.trim() ? (
                        <p className="line-clamp-3" title={paper.abstract}>
                          {paper.abstract.trim()}
                        </p>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 4: Summary */}
                    <TableCell className="py-3 align-top text-xs text-muted-foreground">
                      {summaryPoints && summaryPoints.length > 0 ? (
                        <p className="line-clamp-4 leading-relaxed">
                          {summaryPoints.join(' ')}
                        </p>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 5: Source */}
                    <TableCell className="py-3 align-top text-xs text-muted-foreground">
                      {paper.source ? (
                        <span className="line-clamp-3" title={paper.source}>
                          {paper.source}
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 6: Work type */}
                    <TableCell className="py-3 align-top text-xs text-muted-foreground">
                      {paper.typeOfWork ?? <span className="italic">—</span>}
                    </TableCell>

                    {/* Column 7: Landing page link */}
                    <TableCell className="py-3 text-center align-top">
                      {landingUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          asChild
                        >
                          <a
                            href={landingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Open landing page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="font-medium">No papers match your search.</p>
                    <p className="text-sm">
                      {searchTerm
                        ? 'Try a different search term or clear the search.'
                        : 'Click "Import" to add your first paper.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
