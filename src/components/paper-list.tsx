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
    <div className="flex flex-col h-full border-r bg-muted/20">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/20 z-10">
            <TableRow>
              <TableHead className="w-24">Year</TableHead>
              <TableHead>Authors</TableHead>
              <TableHead className="w-[45%]">Title</TableHead>
              <TableHead className="text-right w-16">File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPapers.map(paper => (
              <TableRow
                key={paper.id}
                className={cn('cursor-pointer', {
                  'bg-accent': selectedPaper?.id === paper.id,
                })}
                onClick={() => onSelectPaper(paper)}
              >
                <TableCell className="text-xs">{paper.year}</TableCell>
                <TableCell className="text-xs">{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</TableCell>
                <TableCell>
                  <div className="font-medium">{paper.title}</div>
                  <div className="text-xs text-muted-foreground">{paper.journal}</div>
                  {summaries[paper.id] && (
                     <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-1 group-data-[collapsible=icon]:hidden">
                       {summaries[paper.id].slice(0, 2).map((point, i) => (
                          <li key={i} className="truncate">{point}</li>
                       ))}
                     </ul>
                  )}
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <File className="w-4 h-4" />
                        </a>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
