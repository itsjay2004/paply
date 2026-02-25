'use client';

import { useState } from 'react';
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
import { Loader2, UploadCloud, FileText, Check, Link, CloudUpload, Sparkles, Library } from 'lucide-react';
import { importPaperFromDoi, importPaperFromPdfWithKey } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Paper } from '@/lib/types';

type PdfStep = 'getting-url' | 'uploading' | 'extracting' | 'saving' | null;
type DoiStep = 'fetching' | 'saving' | null;

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperImported: (paper: Omit<Paper, 'id'>) => void | Promise<void>;
}

export function ImportDialog({ open, onOpenChange, onPaperImported }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState('doi');
  const [doi, setDoi] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pdfStep, setPdfStep] = useState<PdfStep>(null);
  const [doiStep, setDoiStep] = useState<DoiStep>(null);
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

  const handleImport = async () => {
    if (activeTab === 'doi') {
      if (!doi.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a DOI.' });
        return;
      }
    } else {
      if (!pdfFile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a PDF file.' });
        return;
      }
const MAX_PDF_BYTES = 100 * 1024 * 1024;
          if (pdfFile.size > MAX_PDF_BYTES) {
            toast({ variant: 'destructive', title: 'Error', description: 'PDF must be 100 MB or smaller.' });
        return;
      }
    }

    setIsImporting(true);
    setPdfStep(null);
    setDoiStep(null);

    try {
      let paperDetails;

      if (activeTab === 'doi') {
        setDoiStep('fetching');
        paperDetails = await importPaperFromDoi({ doi: doi.trim() });
        setDoiStep('saving');
        if (paperDetails) {
          const payload: Omit<Paper, 'id'> =
            'pdfUrl' in paperDetails && paperDetails.pdfUrl !== undefined
              ? (paperDetails as Omit<Paper, 'id'>)
              : {
                  title: paperDetails.title,
                  authors: paperDetails.authors,
                  year: paperDetails.year,
                  publication_date: 'publication_date' in paperDetails ? paperDetails.publication_date : undefined,
                  abstract: paperDetails.abstract,
                  doi: paperDetails.doi ?? null,
                  language: 'language' in paperDetails ? paperDetails.language : undefined,
                  source: 'source' in paperDetails ? paperDetails.source : undefined,
                  paperUrl: 'paperUrl' in paperDetails ? paperDetails.paperUrl : undefined,
                  landingPageUrl: 'landingPageUrl' in paperDetails ? paperDetails.landingPageUrl : undefined,
                  citedByCount: 'citedByCount' in paperDetails ? paperDetails.citedByCount : undefined,
                  typeOfWork: 'work_type' in paperDetails ? paperDetails.work_type : undefined,
                  pdfUrl: '',
                  summary: [],
                  tags: [],
                  collectionIds: [],
                };
          await onPaperImported(payload);
          toast({ title: 'Success', description: 'Paper imported successfully.' });
          handleOpenChange(false);
        }
      } else {
        setPdfStep('getting-url');
        const res = await fetch('/api/upload-pdf/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: pdfFile!.size }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? 'Failed to get upload URL');
        }
        const { putUrl, key } = await res.json();

        setPdfStep('uploading');
        const putResponse = await fetch(putUrl, {
          method: 'PUT',
          body: pdfFile,
          headers: { 'Content-Type': 'application/pdf' },
        });
        if (!putResponse.ok) {
          throw new Error('Failed to upload PDF to storage');
        }

        setPdfStep('extracting');
        paperDetails = await importPaperFromPdfWithKey({ key });

        setPdfStep('saving');
        if (paperDetails) {
          const payload = paperDetails as Omit<Paper, 'id'>;
          await onPaperImported(payload);
          toast({ title: 'Success', description: 'Paper imported successfully.' });
          handleOpenChange(false);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Import Error',
        description: msg || 'An unexpected error occurred during import.',
      });
    } finally {
      setIsImporting(false);
      setPdfStep(null);
      setDoiStep(null);
    }
  };

  const pdfSteps: { key: PdfStep; label: string; icon: React.ReactNode }[] = [
    { key: 'getting-url', label: 'Getting upload link', icon: <Link className="h-4 w-4" /> },
    { key: 'uploading', label: 'Uploading PDF to storage', icon: <CloudUpload className="h-4 w-4" /> },
    { key: 'extracting', label: 'Extracting title, authors & abstract', icon: <Sparkles className="h-4 w-4" /> },
    { key: 'saving', label: 'Adding to your library', icon: <Library className="h-4 w-4" /> },
  ];

  const doiSteps: { key: DoiStep; label: string; icon: React.ReactNode }[] = [
    { key: 'fetching', label: 'Fetching paper details', icon: <Link className="h-4 w-4" /> },
    { key: 'saving', label: 'Adding to your library', icon: <Library className="h-4 w-4" /> },
  ];

  const currentPdfIndex = pdfStep ? pdfSteps.findIndex((s) => s.key === pdfStep) : -1;
  const currentDoiIndex = doiStep ? doiSteps.findIndex((s) => s.key === doiStep) : -1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Paper</DialogTitle>
          <DialogDescription>
            {isImporting
              ? activeTab === 'pdf'
                ? 'Importing your PDF…'
                : 'Importing from DOI…'
              : 'Add a new paper to your library from a PDF or DOI.'}
          </DialogDescription>
        </DialogHeader>

        {isImporting ? (
          <div className="py-6 space-y-1">
            {(activeTab === 'pdf' ? pdfSteps : doiSteps).map((step, index) => {
              const currentIndex = activeTab === 'pdf' ? currentPdfIndex : currentDoiIndex;
              const isActive = index === currentIndex;
              const isDone = currentIndex >= 0 && index < currentIndex;
              return (
                <div
                  key={String(step.key)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : isDone ? 'text-muted-foreground' : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
                    {isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : isDone ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
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
                        <p className="text-xs text-muted-foreground">PDF up to 100MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          {!isImporting && (
            <Button onClick={handleImport}>
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
