'use client';

import { useEffect, useState } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Sidebar, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { LeftSidebarContent } from '@/components/left-sidebar-content';
import { PaperList } from '@/components/paper-list';
import { PaperDetailsPane } from '@/components/paper-details-pane';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ImportDialog } from './import-dialog';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';

function RichieWorkspaceLayout({
  papers,
  collections,
  summaries,
  selectedPaper,
  onSelectPaper,
  onSummaryUpdate,
  onPaperUpdate,
  isImportDialogOpen,
  setImportDialogOpen,
  onPaperImported,
}: {
  papers: Paper[];
  collections: Collection[];
  summaries: Record<string, string[]>;
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper | null) => void;
  onSummaryUpdate: (paperId: string, summary: string[]) => void;
  onPaperUpdate: (paper: Paper) => void;
  isImportDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  onPaperImported: (paper: Paper) => void;
}) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const mainLayout = (
    <div className="flex h-screen w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
        <LeftSidebarContent collections={collections} />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">All Papers</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" className="gap-2" onClick={() => setImportDialogOpen(true)}>
              <PlusCircle />
              Import
            </Button>
            <UserNav />
          </div>
        </header>
        <main
          className={cn(
            'flex-1 grid overflow-hidden',
            'grid-cols-1'
          )}
        >
          <PaperList
            papers={papers}
            summaries={summaries}
            selectedPaper={selectedPaper}
            onSelectPaper={onSelectPaper}
          />
        </main>
      </div>
      
      {/* Floating Pane */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-[45%] xl:w-[40%] 2xl:w-[35%] transform-gpu transition-transform duration-300 ease-in-out z-40',
          'p-4',
          selectedPaper ? 'translate-x-0' : 'translate-x-full',
          !selectedPaper && 'pointer-events-none'
        )}
      >
        {selectedPaper && (
            <PaperDetailsPane
                paper={selectedPaper}
                onSummaryUpdate={onSummaryUpdate}
                onPaperUpdate={onPaperUpdate}
                onClose={() => onSelectPaper(null)}
            />
        )}
      </div>

      <ImportDialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen} onPaperImported={onPaperImported} />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        {mainLayout}
      </Sheet>
    );
  }

  return mainLayout;
}

export function RichieWorkspace({ papers: initialPapers, collections }: { papers: Paper[]; collections: Collection[] }) {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string[]>>({});
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    const initialSummaries = papers.reduce((acc, paper) => {
      if (paper.summary && paper.summary.length > 0) {
        acc[paper.id] = paper.summary;
      }
      return acc;
    }, {} as Record<string, string[]>);
    setSummaries(initialSummaries);
  }, [papers]);

  const handleSummaryUpdate = (paperId: string, summary: string[]) => {
    setSummaries((prev) => ({ ...prev, [paperId]: summary }));
    setPapers((prevPapers) => prevPapers.map((p) => (p.id === paperId ? { ...p, summary } : p)));
  };

  const handlePaperUpdate = (updatedPaper: Paper) => {
    setPapers((prevPapers) => prevPapers.map((p) => (p.id === updatedPaper.id ? updatedPaper : p)));
    if (selectedPaper && selectedPaper.id === updatedPaper.id) {
      setSelectedPaper(updatedPaper);
    }
  };

  const handlePaperImport = (newPaper: Paper) => {
    const newPapers = [newPaper, ...papers];
    setPapers(newPapers);
    setSelectedPaper(newPaper);
  };

  return (
    <SidebarProvider>
      <RichieWorkspaceLayout
        papers={papers}
        collections={collections}
        summaries={summaries}
        selectedPaper={selectedPaper}
        onSelectPaper={setSelectedPaper}
        onSummaryUpdate={handleSummaryUpdate}
        onPaperUpdate={handlePaperUpdate}
        isImportDialogOpen={isImportDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        onPaperImported={handlePaperImport}
      />
    </SidebarProvider>
  );
}
