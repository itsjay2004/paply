'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Paper } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, X, File as FileIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSummary } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';

interface PaperDetailsPaneProps {
  paper: Paper;
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
  onPaperUpdate: (paper: Paper) => void;
  onClose: () => void;
}

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
      <div className="p-4 lg:p-6 space-y-6">
        <Card>
          <CardHeader>
            <Textarea
              value={editedPaper.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-2xl font-semibold leading-none tracking-tight h-auto p-0 border-0 shadow-none focus-visible:ring-0 resize-none"
              placeholder="Paper Title"
              rows={2}
            />
            <div className="text-sm text-muted-foreground pt-2">
              <Input
                value={editedPaper.authors.join(', ')}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                placeholder="Authors (comma-separated)"
              />
            </div>
            <Button asChild variant="link" className="p-0 h-auto justify-start -ml-1 mt-2">
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileIcon className="mr-2 h-4 w-4" />
                Open PDF
              </a>
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" value={editedPaper.year} onChange={(e) => handleInputChange('year', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="journal">Journal</Label>
                <Input id="journal" value={editedPaper.journal || ''} onChange={(e) => handleInputChange('journal', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input id="publisher" value={editedPaper.publisher || ''} onChange={(e) => handleInputChange('publisher', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="typeOfWork">Type of Work</Label>
                <Input id="typeOfWork" value={editedPaper.typeOfWork || ''} onChange={(e) => handleInputChange('typeOfWork', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Input id="language" value={editedPaper.language || ''} onChange={(e) => handleInputChange('language', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={editedPaper.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={editedPaper.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={editedPaper.url || ''} onChange={(e) => handleInputChange('url', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="doi">DOI</Label>
                <Input id="doi" value={editedPaper.doi || ''} onChange={(e) => handleInputChange('doi', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" value={editedPaper.pdfUrl || ''} onChange={(e) => handleInputChange('pdfUrl', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Abstract</span>
              <Button size="sm" variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Summarize
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                className="text-sm text-muted-foreground leading-relaxed w-full"
                rows={isAbstractExpanded ? 12 : 4}
              />
              {isLongAbstract && (
                <Button variant="link" onClick={() => setIsAbstractExpanded(!isAbstractExpanded)} className="p-0 h-auto mt-2 text-sm">
                  {isAbstractExpanded ? 'Show less' : 'Show more'}
                  {isAbstractExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
