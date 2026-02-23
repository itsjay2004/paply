'use client';

import { useEffect, useState } from 'react';
import type { Paper, Collection } from '@/lib/types';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LeftSidebarContent } from '@/components/left-sidebar-content';
import { PaperList } from '@/components/paper-list';
import { PaperDetailsPane } from '@/components/paper-details-pane';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, PlusCircle } from 'lucide-react';

export function RichieWorkspace({ papers, collections }: { papers: Paper[]; collections: Collection[] }) {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (papers.length > 0) {
      setSelectedPaper(papers[0]);
    }
  }, [papers]);

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
              <Button size="sm" className="gap-2">
                <PlusCircle />
                Import
              </Button>
              <UserNav />
            </div>
          </header>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[55%_45%] xl:grid-cols-[60%_40%] 2xl:grid-cols-[65%_35%] overflow-hidden">
            <PaperList
              papers={papers}
              summaries={summaries}
              selectedPaper={selectedPaper}
              onSelectPaper={setSelectedPaper}
            />
            <PaperDetailsPane 
              paper={selectedPaper}
              onSummaryUpdate={handleSummaryUpdate}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
