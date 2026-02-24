'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Paper } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, X, File as FileIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

interface PaperDetailsPaneProps {
  paper: Paper;
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
  onPaperUpdate: (paper: Paper) => void;
  onClose: () => void;
}

const DetailInput = ({ className, ...props }: React.ComponentProps<typeof Input>) => (
  <Input
    className={cn(
      'h-8 border border-transparent bg-muted/40 px-2 text-sm text-right shadow-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-md transition-all',
      className
    )}
    {...props}
  />
);

export function PaperDetailsPane({ paper, onSummaryUpdate, onPaperUpdate, onClose }: PaperDetailsPaneProps) {
  const { toast } = useToast();
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [editedPaper, setEditedPaper] = useState<Paper>(paper);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);

  useEffect(() => {
    setEditedPaper(paper);
    setIsAbstractExpanded(false);
  }, [paper]);

  const handleInputChange = (field: keyof Paper, value: any) => {
    const processedValue = field === 'year' ? parseInt(value, 10) || 0 : value;
    const updatedPaper = { ...editedPaper, [field]: processedValue };
    setEditedPaper(updatedPaper);
    onPaperUpdate(updatedPaper);
  };

  const handleAuthorChange = (value: string) => {
    const authors = value.split(',').map(author => author.trim()).filter(Boolean);
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

  const isLongAbstract = editedPaper.abstract.length > 300;

  return (
    <ScrollArea className="h-full bg-background/80 backdrop-blur-md border-l relative">
      
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-20 bg-muted hover:bg-red-500 rounded-full"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>

      <div className="p-8 space-y-10 max-w-3xl mx-auto">

        {/* HEADER */}
        <div className="space-y-3 border-b pb-6">
          <Textarea
            value={editedPaper.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="text-3xl font-semibold leading-tight h-auto p-0 border-0 shadow-none focus-visible:ring-0 resize-none bg-transparent"
            placeholder="Paper Title"
          />

          <Input
            value={editedPaper.authors.join(', ')}
            onChange={(e) => handleAuthorChange(e.target.value)}
            className="h-auto p-0 border-0 shadow-none focus-visible:ring-0 text-muted-foreground bg-transparent text-sm"
            placeholder="Authors (comma-separated)"
          />

          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 w-fit"
          >
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileIcon className="mr-2 h-4 w-4" />
              Open PDF
            </a>
          </Button>
        </div>

        {/* DETAILS CARD */}
        <div className="rounded-xl border bg-muted/30 p-6 space-y-5">
          <h3 className="text-lg font-semibold">Metadata</h3>

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm">
            {[
              ['Year', 'year'],
              ['Journal', 'journal'],
              ['Publisher', 'publisher'],
              ['Type of Work', 'typeOfWork'],
              ['Language', 'language'],
              ['City', 'city'],
              ['Country', 'country'],
              ['URL', 'url'],
              ['DOI', 'doi'],
              ['File', 'pdfUrl'],
            ].map(([label, field]) => (
              <div key={field} className="flex justify-between items-center">
                <Label className="text-muted-foreground">{label}</Label>
                <DetailInput
                  className='ml-2'
                  id={field}
                  type={field === 'year' ? 'number' : 'text'}
                  value={(editedPaper as any)[field] || ''}
                  onChange={(e) => handleInputChange(field as keyof Paper, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ABSTRACT + SUMMARY */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Abstract</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="shadow-sm"
            >
              {isSummarizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Summarize
            </Button>
          </div>

          {/* Summary Box */}
          {editedPaper.summary && editedPaper.summary.length > 0 && (
            <ul className="list-disc space-y-2 rounded-xl border bg-primary/5 p-5 pl-8 text-sm shadow-sm">
              {editedPaper.summary.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}

          {/* Loading Skeleton */}
          {(isSummarizing && (!editedPaper.summary || editedPaper.summary.length === 0)) && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}

          {/* Abstract Text */}
          <div className="rounded-xl border bg-muted/20 p-5 shadow-sm">
            <Textarea
              value={editedPaper.abstract}
              onChange={(e) => handleInputChange('abstract', e.target.value)}
              className="text-sm leading-relaxed w-full border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent resize-none"
              rows={isAbstractExpanded ? 20 : 6}
            />

            {isLongAbstract && (
              <Button
                variant="ghost"
                onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                className="p-0 h-auto mt-3 text-sm"
              >
                {isAbstractExpanded ? 'Show less' : 'Show more'}
                {isAbstractExpanded ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}