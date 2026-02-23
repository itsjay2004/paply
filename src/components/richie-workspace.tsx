'use client';

import { useEffect, useState } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LeftSidebarContent } from '@/components/left-sidebar-content';
import { PaperList } from '@/components/paper-list';
import { PaperDetailsPane } from '@/components/paper-details-pane';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ImportDialog } from './import-dialog';
import { cn } from '@/lib/utils';

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
    setSummaries(prev => ({ ...prev, [paperId]: summary }));
    setPapers(prevPapers => prevPapers.map(p => p.id === paperId ? {...p, summary} : p));
  };
  
  const handlePaperImport = (newPaper: Paper) => {
    const newPapers = [newPaper, ...papers];
    setPapers(newPapers);
    setSelectedPaper(newPaper);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
            <LeftSidebarContent collections={collections} />
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden"/>
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
          <main className={cn("flex-1 grid overflow-hidden", selectedPaper ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-[55%_45%] xl:grid-cols-[60%_40%] 2xl:grid-cols-[65%_35%]" : "grid-cols-1")}>
            <PaperList
              papers={papers}
              summaries={summaries}
              selectedPaper={selectedPaper}
              onSelectPaper={setSelectedPaper}
            />
            {selectedPaper && (
              <PaperDetailsPane 
                paper={selectedPaper}
                onSummaryUpdate={handleSummaryUpdate}
                onClose={() => setSelectedPaper(null)}
              />
            )}
          </main>
        </div>
        <ImportDialog 
          open={isImportDialogOpen}
          onOpenChange={setImportDialogOpen}
          onPaperImported={handlePaperImport}
        />
      </div>
    </SidebarProvider>
  );
}
