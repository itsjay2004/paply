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
      'h-auto border-0 bg-transparent p-0 text-right text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
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
    <ScrollArea className="h-full bg-background border-l relative">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10" onClick={onClose}>
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>
      <div className="p-6 space-y-8">
        <div className="space-y-2">
            <Textarea
              value={editedPaper.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-2xl font-semibold leading-tight h-auto p-0 border-0 shadow-none focus-visible:ring-0 resize-none bg-transparent"
              placeholder="Paper Title"
            />
            <Input
                value={editedPaper.authors.join(', ')}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="h-auto p-0 border-0 shadow-none focus-visible:ring-0 text-muted-foreground bg-transparent"
                placeholder="Authors (comma-separated)"
            />
            <Button asChild variant="link" className="p-0 h-auto justify-start -ml-1 mt-2 text-sm">
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileIcon className="mr-2 h-4 w-4" />
                Open PDF
              </a>
            </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Details</h3>
          <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Year</Label>
                <DetailInput id="year" type="number" value={editedPaper.year} onChange={(e) => handleInputChange('year', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Journal</Label>
                <DetailInput id="journal" value={editedPaper.journal || ''} onChange={(e) => handleInputChange('journal', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Publisher</Label>
                <DetailInput id="publisher" value={editedPaper.publisher || ''} onChange={(e) => handleInputChange('publisher', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Type of Work</Label>
                <DetailInput id="typeOfWork" value={editedPaper.typeOfWork || ''} onChange={(e) => handleInputChange('typeOfWork', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Language</Label>
                <DetailInput id="language" value={editedPaper.language || ''} onChange={(e) => handleInputChange('language', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">City</Label>
                <DetailInput id="city" value={editedPaper.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">Country</Label>
                <DetailInput id="country" value={editedPaper.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">URL</Label>
                <DetailInput id="url" value={editedPaper.url || ''} onChange={(e) => handleInputChange('url', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">DOI</Label>
                <DetailInput id="doi" value={editedPaper.doi || ''} onChange={(e) => handleInputChange('doi', e.target.value)} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <Label className="text-muted-foreground">File</Label>
                <DetailInput id="file" value={editedPaper.pdfUrl || ''} onChange={(e) => handleInputChange('pdfUrl', e.target.value)} />
              </div>
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Abstract</h3>
              <Button size="sm" variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Summarize
              </Button>
            </div>
          <div className="space-y-4">
            {(isSummarizing && (!editedPaper.summary || editedPaper.summary.length === 0)) && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            )}
            {editedPaper.summary && editedPaper.summary.length > 0 && (
              <ul className="list-disc space-y-2 rounded-lg border bg-muted/50 p-4 pl-8 text-sm">
                {editedPaper.summary.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            )}
            <div>
              <Textarea
                value={editedPaper.abstract}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                className="text-sm text-muted-foreground leading-relaxed w-full border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent resize-none"
                rows={isAbstractExpanded ? 20 : 4}
              />
              {isLongAbstract && (
                <Button variant="link" onClick={() => setIsAbstractExpanded(!isAbstractExpanded)} className="p-0 h-auto mt-2 text-sm">
                  {isAbstractExpanded ? 'Show less' : 'Show more'}
                  {isAbstractExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
