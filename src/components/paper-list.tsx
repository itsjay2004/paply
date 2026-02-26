'use client';

import { useState } from 'react';
import type { Paper } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Quote, Search, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="flex flex-col h-full border-r bg-background/60 backdrop-blur-sm">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, authors, abstract, source…"
            className="pl-10 h-9 bg-muted/40 border-muted focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-[48px] text-center">
                Star
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[180px]">
                Title
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[140px]">
                Authors
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[200px]">
                Abstract
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[160px]">
                Summary
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-[100px]">
                Source
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-[90px]">
                Work type
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground w-[70px] text-center">
                Landing
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPapers.length > 0 ? (
              filteredPapers.map((paper) => {
                const landingUrl = paper.landingPageUrl || paper.paperUrl || null;
                const summaryPoints = summaries[paper.id];
                return (
                  <TableRow
                    key={paper.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 border-b hover:bg-muted/40 align-top',
                      {
                        'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary':
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
                          className="inline-flex items-center justify-center rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                    {/* Column 1: Title, below: year + cited by (cite icon + number) */}
                    <TableCell className="py-3">
                      <div>
                        <div className="font-semibold text-sm leading-snug text-foreground">
                          {paper.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          {paper.year > 0 && <span>{paper.year}</span>}
                          {paper.citedByCount != null && (
                            <span className="inline-flex items-center gap-1">
                              <Quote className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {paper.citedByCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Authors */}
                    <TableCell className="py-3 text-xs text-muted-foreground align-top">
                      {paper.authors?.length > 0 ? (
                        <span className="line-clamp-4" title={paper.authors.join(', ')}>
                          {paper.authors.join(', ')}
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 3: First 3 lines of abstract */}
                    <TableCell className="py-3 text-xs text-muted-foreground leading-relaxed align-top">
                      {paper.abstract?.trim() ? (
                        <p className="line-clamp-3" title={paper.abstract}>
                          {paper.abstract.trim()}
                        </p>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 4: Bullet summary if available */}
                    <TableCell className="py-3 text-xs text-muted-foreground align-top">
                      {summaryPoints && summaryPoints.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-0.5 line-clamp-4">
                          {summaryPoints.slice(0, 3).map((point, i) => (
                            <li key={i} className="line-clamp-2">
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 5: Source */}
                    <TableCell className="py-3 text-xs text-muted-foreground align-top">
                      {paper.source ? (
                        <span className="line-clamp-3" title={paper.source}>
                          {paper.source}
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>

                    {/* Column 6: Work type */}
                    <TableCell className="py-3 text-xs text-muted-foreground align-top">
                      {paper.typeOfWork ?? <span className="italic">—</span>}
                    </TableCell>

                    {/* Column 7: Landing – external link to landing_page_url */}
                    <TableCell className="py-3 text-center align-top">
                      {landingUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
        </Table>
      </ScrollArea>
    </div>
  );
}
