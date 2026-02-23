'use client';

import { useState, useTransition } from 'react';
import type { Paper } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, FileText, Loader2, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSummary, getExplanation } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface PaperDetailsPaneProps {
  paper: Paper | null;
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
}

export function PaperDetailsPane({ paper, onSummaryUpdate }: PaperDetailsPaneProps) {
  const { toast } = useToast();
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [isExplaining, startExplainTransition] = useTransition();
  const [summary, setSummary] = useState<string[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [textToExplain, setTextToExplain] = useState('');
  
  const pdfPreviewImage = PlaceHolderImages.find(img => img.id === 'pdf-preview');

  const handleSummarize = () => {
    if (!paper) return;
    startSummaryTransition(async () => {
      setSummary(null);
      try {
        const result = await getSummary({ abstract: paper.abstract });
        setSummary(result);
        onSummaryUpdate(paper.id, result);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not generate summary.',
        });
      }
    });
  };
  
  const handleExplain = () => {
    if (!textToExplain) return;
    startExplainTransition(async () => {
      setExplanation(null);
      try {
        const result = await getExplanation({ text: textToExplain });
        setExplanation(result);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not generate explanation.',
        });
      }
    });
  }

  if (!paper) {
    return (
      <div className="flex items-center justify-center h-full bg-background p-4">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No Paper Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">Select a paper from the list to see its details.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background">
      <div className="p-4 lg:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{paper.title}</CardTitle>
            <CardDescription>
              {paper.authors.join(', ')} ({paper.year})
              <br/>
              <em>{paper.journal}</em>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {paper.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Abstract</span>
              <Button size="sm" variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
                {isSummarizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Summarize
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSummarizing && !summary && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            )}
            {summary && (
                <ul className="list-disc space-y-2 rounded-lg border bg-muted/50 p-4 pl-8 text-sm">
                    {summary.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Text Explainer</CardTitle>
            <CardDescription>Highlight text in the PDF or paste it here for a simple explanation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Paste complex text here..."
              value={textToExplain}
              onChange={(e) => setTextToExplain(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleExplain} disabled={isExplaining || !textToExplain}>
              {isExplaining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Explain
            </Button>
            {isExplaining && !explanation && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {explanation && (
                <div className="text-sm text-foreground leading-relaxed rounded-lg border bg-muted/50 p-4">
                    {explanation}
                </div>
            )}
          </CardContent>
        </Card>

        {pdfPreviewImage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PDF Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="p-4 border rounded-md bg-muted/30">
                <Image
                  src={pdfPreviewImage.imageUrl}
                  alt={pdfPreviewImage.description}
                  data-ai-hint={pdfPreviewImage.imageHint}
                  width={400}
                  height={566}
                  className="rounded-md shadow-md mx-auto"
                />
              </div>
              <Button className="mt-4">Open PDF</Button>
            </CardContent>
          </Card>
        )}

      </div>
    </ScrollArea>
  );
}
