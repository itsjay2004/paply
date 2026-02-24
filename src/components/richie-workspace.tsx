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
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';

function RichieWorkspaceLayout({
  papers,
  collections,
  summaries,
  selectedPaper,
  onSelectPaper,
  onSummaryUpdate,
  onPaperUpdate,
  onPaperDelete,
  onCollectionCreate,
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
  onPaperDelete: (paperId: string) => void;
  onCollectionCreate: (name: string) => Promise<void>;
  isImportDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  onPaperImported: (paper: Omit<Paper, 'id'>) => void;
}) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const mainLayout = (
    <div className="flex h-screen w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
        <LeftSidebarContent collections={collections} onCollectionCreate={onCollectionCreate} />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">All Papers</h1>
          </div>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Button size="sm" className="gap-2" onClick={() => setImportDialogOpen(true)}>
                <PlusCircle />
                Import
              </Button>
              <UserNav />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>
        <main
          className={cn('flex-1 grid overflow-hidden', 'grid-cols-1')}
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
                collections={collections}
                onSummaryUpdate={onSummaryUpdate}
                onPaperUpdate={onPaperUpdate}
                onPaperDelete={onPaperDelete}
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

export function RichieWorkspace() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string[]>>({});
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const { user } = useUser(); // Use Clerk's useUser hook

  // Effect to sync user data to Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.username || '',
              profile_image_url: user.imageUrl,
            }),
          });
          if (!response.ok) {
            console.error('Failed to sync user to Supabase', await response.text());
          }
        } catch (error) {
          console.error('Error syncing user to Supabase:', error);
        }
      }
    };
    syncUser();
  }, [user]); // Re-run when user object changes

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const [papersRes, collectionsRes] = await Promise.all([
          fetch('/api/papers'),
          fetch('/api/collections'),
        ]);
        const [papersData, collectionsData] = await Promise.all([
          papersRes.json(),
          collectionsRes.json(),
        ]);
        setPapers(papersData);
        setCollections(collectionsData);

        const initialSummaries = papersData.reduce((acc, paper) => {
          if (paper.summary && paper.summary.length > 0) {
            acc[paper.id] = paper.summary;
          }
          return acc;
        }, {} as Record<string, string[]>);
        setSummaries(initialSummaries);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSummaryUpdate = async (paperId: string, summary: string[]) => {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      if (!response.ok) throw new Error('Failed to update summary');
      const updatedPaper = await response.json();
      handlePaperUpdate(updatedPaper[0]); // Response is an array
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  };

  const handlePaperUpdate = (updatedPaper: Paper) => {
    setPapers((prevPapers) => prevPapers.map((p) => (p.id === updatedPaper.id ? updatedPaper : p)));
    if (selectedPaper && selectedPaper.id === updatedPaper.id) {
      setSelectedPaper(updatedPaper);
    }
  };

  const handlePaperImport = async (newPaperData: Omit<Paper, 'id'>) => {
    try {
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaperData),
      });
      if (!response.ok) throw new Error('Failed to import paper');
      const newPaper = await response.json();
      const newPapers = [newPaper[0], ...papers]; // Response is an array
      setPapers(newPapers);
      setSelectedPaper(newPaper[0]);
      setImportDialogOpen(false);
    } catch (error) {
      console.error("Error importing paper:", error);
    }
  };

  const handlePaperDelete = async (paperId: string) => {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete paper');
      setPapers((prevPapers) => prevPapers.filter((p) => p.id !== paperId));
      setSelectedPaper(null);
    } catch (error) {
      console.error("Error deleting paper:", error);
    }
  };

  const handleCollectionCreate = async (name: string) => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to create collection');
      const newCollection = await response.json();
      setCollections((prevCollections) => [...prevCollections, newCollection[0]]); // Response is an array
    } catch (error) {
      console.error("Error creating collection:", error);
    }
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
        onPaperDelete={handlePaperDelete}
        onCollectionCreate={handleCollectionCreate}
        isImportDialogOpen={isImportDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        onPaperImported={handlePaperImport}
      />
    </SidebarProvider>
  );
}
