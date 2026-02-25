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
import { File, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaperListProps {
  papers: Paper[];
  summaries: Record<string, string[]>;
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
}

export function PaperList({ papers, summaries, selectedPaper, onSelectPaper }: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-background/60 backdrop-blur-sm">
      
      {/* Search */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            className="pl-10 h-9 bg-muted/40 border-muted focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          
          {/* Header */}
          <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24 text-xs uppercase tracking-wide text-muted-foreground">
                Year
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Authors
              </TableHead>
              <TableHead className="w-[45%] text-xs uppercase tracking-wide text-muted-foreground">
                Title
              </TableHead>
              <TableHead className="text-right w-16 text-xs uppercase tracking-wide text-muted-foreground">
                File
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredPapers.length > 0 ? (
              filteredPapers.map(paper => (
                <TableRow
                  key={paper.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200 border-b hover:bg-muted/40',
                    {
                      'bg-primary/10 hover:bg-primary/15 border-l-4 border-primary':
                        selectedPaper?.id === paper.id,
                    }
                  )}
                  onClick={() => onSelectPaper(paper)}
                >
                  
                  {/* Year */}
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {paper.year}
                  </TableCell>

                  {/* Authors */}
                  <TableCell className="text-xs text-muted-foreground">
                    {paper.authors.join(', ')}
                  </TableCell>

                  {/* Title + Journal + Summary */}
                  <TableCell className="py-3">
                    <div className="font-semibold text-sm leading-snug text-foreground">
                      {paper.title}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {paper.journal}
                    </div>

                    {summaries[paper.id] && (
                      <ul className="mt-3 text-xs text-muted-foreground list-disc pl-4 space-y-1 max-w-prose">
                        {summaries[paper.id].slice(0, 2).map((point, i) => (
                          <li key={i} className="truncate hover:text-foreground transition-colors">
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>

                  {/* File Button – only when paper has a PDF */}
                  <TableCell className="text-right">
                    {paper.pdfUrl ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                        asChild
                      >
                        <a
                          href={`/api/papers/${paper.id}/pdf-url`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <File className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : null}
                  </TableCell>

                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-muted-foreground">No papers in your library yet.</p>
                            <p className="text-sm text-muted-foreground">
                                Click the "Import" button to add your first paper.
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
