'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileText } from 'lucide-react';
import { importPaperFromDoi, importPaperFromPdf } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Paper } from '@/lib/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperImported: (paper: Paper) => void;
}

export function ImportDialog({ open, onOpenChange, onPaperImported }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState('doi');
  const [doi, setDoi] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isImporting, startImportTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };
  
  const resetForm = () => {
      setDoi('');
      setPdfFile(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleImport = () => {
    startImportTransition(async () => {
      try {
        let paperDetails;
        let localPdfUrl: string | null = null;

        if (activeTab === 'doi') {
          if (!doi.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a DOI.' });
            return;
          }
          paperDetails = await importPaperFromDoi({ doi });
        } else {
          if (!pdfFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a PDF file.' });
            return;
          }
          const pdfDataUri = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(pdfFile);
          });
          paperDetails = await importPaperFromPdf({ pdfDataUri });
          localPdfUrl = URL.createObjectURL(pdfFile);
        }

        if (paperDetails) {
            const newPaper: Paper = {
                id: crypto.randomUUID(),
                title: paperDetails.title,
                authors: paperDetails.authors,
                year: paperDetails.year,
                journal: paperDetails.journal,
                abstract: paperDetails.abstract,
                summary: [],
                pdfUrl: localPdfUrl ?? '/placeholder.pdf',
                tags: [],
                collectionIds: [],
            };
            onPaperImported(newPaper);
            toast({ title: 'Success', description: 'Paper imported successfully.' });
            handleOpenChange(false);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Error',
          description: (error as Error).message || 'An unexpected error occurred during import.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Paper</DialogTitle>
          <DialogDescription>
            Add a new paper to your library from a PDF or DOI.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="doi">From DOI</TabsTrigger>
            <TabsTrigger value="pdf">From PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="doi" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                placeholder="10.1101/2021.08.12.456123"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="pdf" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <div className="relative flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {pdfFile ? (
                    <>
                        <FileText className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-sm text-muted-foreground">{pdfFile.name}</p>
                        <Button variant="link" size="sm" onClick={() => setPdfFile(null)}>Change file</Button>
                    </>
                  ) : (
                    <>
                        <UploadCloud className="w-12 h-12 mx-auto text-gray-400" />
                        <div className="flex text-sm text-muted-foreground">
                            <Label htmlFor="pdf-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary/80">
                                <span>Upload a file</span>
                                <Input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} />
                            </Label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
