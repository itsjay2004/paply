'use client';

import { useEffect, useState } from 'react';
import type { Paper, Collection } from '@/lib/types';

/** Map API/Supabase paper row (snake_case) to frontend Paper type. */
function apiPaperToPaper(row: Record<string, unknown>): Paper {
  const id = typeof row.id === 'string' ? row.id : String(row.id ?? '');
  const title = typeof row.title === 'string' ? row.title : '';
  const authors = Array.isArray(row.authors) ? (row.authors as string[]) : [];
  const pubDate = row.publication_date as string | undefined;
  const year = pubDate ? new Date(pubDate).getFullYear() : 0;
  const collectionId = row.collection_id != null ? String(row.collection_id) : null;
  return {
    id,
    title,
    authors,
    year,
    abstract: typeof row.abstract === 'string' ? row.abstract : '',
    summary: Array.isArray(row.summary) ? (row.summary as string[]) : (typeof row.summary === 'string' && row.summary ? row.summary.split('\n').filter(Boolean) : []),
    pdfUrl: (row.pdf_url as string) ?? (row.pdfUrl as string) ?? '',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    collection_id: collectionId ?? undefined,
    collectionIds: collectionId ? [collectionId] : [],
    publisher: (row.publisher as string) ?? undefined,
    typeOfWork: (row.work_type as string) ?? (row.typeOfWork as string) ?? undefined,
    language: (row.language as string) ?? undefined,
    city: (row.publication_city as string) ?? (row.city as string) ?? undefined,
    country: (row.publication_country as string) ?? (row.country as string) ?? undefined,
    doi: (row.doi as string) ?? undefined,
  };
}
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
  onPaperPersist,
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
  onPaperPersist: (paper: Paper) => Promise<void>;
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
                onPaperPersist={onPaperPersist}
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

  // Effect to sync user data to Supabase (non-blocking; papers/collections APIs will sync if needed)
  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;
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
          const body = await response.json().catch(() => ({}));
          const details = body?.details ?? body?.error ?? response.statusText;
          console.warn('User sync to Supabase failed:', details);
        }
      } catch (error) {
        console.warn('User sync to Supabase failed:', error);
      }
    };
    syncUser();
  }, [user]);

  // Fetch papers and collections only once the user is available (avoids 401 on refresh)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [papersRes, collectionsRes] = await Promise.all([
          fetch('/api/papers'),
          fetch('/api/collections'),
        ]);

        if (!papersRes.ok || !collectionsRes.ok) {
          console.error('Fetch failed:', { papers: papersRes.status, collections: collectionsRes.status });
          return;
        }

        const [papersData, collectionsData] = await Promise.all([
          papersRes.json(),
          collectionsRes.json(),
        ]);

        const papersArray = Array.isArray(papersData) ? papersData : [];
        const collectionsArray = Array.isArray(collectionsData) ? collectionsData : [];
        const normalizedPapers = papersArray.map((p) => apiPaperToPaper(p as Record<string, unknown>));

        setPapers(normalizedPapers);
        setCollections(collectionsArray);

        const initialSummaries = papersArray.reduce((acc, paper: Record<string, unknown>) => {
          const id = typeof paper.id === 'string' ? paper.id : String(paper.id ?? '');
          const summary = paper.summary;
          const arr = Array.isArray(summary) ? (summary as string[]) : (typeof summary === 'string' && summary ? summary.split('\n').filter(Boolean) : []);
          if (arr.length > 0) acc[id] = arr;
          return acc;
        }, {} as Record<string, string[]>);
        setSummaries(initialSummaries);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleSummaryUpdate = async (paperId: string, summary: string[]) => {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      if (!response.ok) throw new Error('Failed to update summary');
      const raw = await response.json();
      const updatedPaper = apiPaperToPaper((Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>);
      handlePaperUpdate(updatedPaper);
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

  const handlePaperPersist = async (paperToSave: Paper) => {
    const response = await fetch(`/api/papers/${paperToSave.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: paperToSave.title,
        authors: paperToSave.authors,
        year: paperToSave.year,
        abstract: paperToSave.abstract,
        summary: paperToSave.summary,
        pdfUrl: paperToSave.pdfUrl,
        doi: paperToSave.doi,
        typeOfWork: paperToSave.typeOfWork,
        language: paperToSave.language,
        publisher: paperToSave.publisher,
        city: paperToSave.city,
        country: paperToSave.country,
        collection_id: paperToSave.collection_id ?? null,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Failed to save paper');
    }
    const raw = await response.json();
    const updated = apiPaperToPaper((Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>);
    handlePaperUpdate(updated);
  };

  const handlePaperImport = async (newPaperData: Omit<Paper, 'id'>) => {
    const response = await fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPaperData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = typeof data?.error === 'string' ? data.error : 'Failed to import paper';
      const details = data?.details != null ? `: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : '';
      throw new Error(msg + details);
    }
    const raw = Array.isArray(data) ? data[0] : data;
    if (raw) {
      const paper = apiPaperToPaper(raw as Record<string, unknown>);
      setPapers((prev) => [paper, ...prev]);
      setSelectedPaper(paper);
    }
    setImportDialogOpen(false);
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
      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error ?? 'Failed to create collection';
        const details = data?.details ? `: ${data.details}` : '';
        throw new Error(msg + details);
      }
      const newCollection = Array.isArray(data) ? data[0] : data;
      if (newCollection) {
        setCollections((prevCollections) => [...prevCollections, newCollection]);
      }
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
        onPaperPersist={handlePaperPersist}
        onPaperDelete={handlePaperDelete}
        onCollectionCreate={handleCollectionCreate}
        isImportDialogOpen={isImportDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        onPaperImported={handlePaperImport}
      />
    </SidebarProvider>
  );
}
