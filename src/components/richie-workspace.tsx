'use client';

import { useEffect, useState } from 'react';
import type { Paper, Collection } from '@/lib/types';
import type { SidebarView } from '@/components/left-sidebar-content';
import { useSidebarView } from '@/lib/sidebar-view-context';

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
    publication_date: pubDate ?? undefined,
    abstract: typeof row.abstract === 'string' ? row.abstract : '',
    summary: Array.isArray(row.summary) ? (row.summary as string[]) : (typeof row.summary === 'string' && row.summary ? row.summary.split('\n').filter(Boolean) : []),
    pdfUrl: (row.pdf_url as string) ?? (row.pdfUrl as string) ?? '',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    collection_id: collectionId ?? undefined,
    collectionIds: collectionId ? [collectionId] : [],
    typeOfWork: (row.work_type as string) ?? (row.typeOfWork as string) ?? undefined,
    language: (row.language as string) ?? undefined,
    doi: (row.doi as string) ?? undefined,
    source: (row.source as string) ?? undefined,
    paperUrl: (row.paper_url as string) ?? (row.paperUrl as string) ?? undefined,
    landingPageUrl: (row.landing_page_url as string) ?? (row.landingPageUrl as string) ?? undefined,
    citedByCount: typeof row.cited_by_count === 'number' ? row.cited_by_count : (row.citedByCount as number) ?? undefined,
    starred: typeof row.starred === 'boolean' ? row.starred : Boolean((row as Record<string, unknown>).starred),
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
import { NotebookView } from './notebook-view';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';

/**
 * RichieWorkspaceLayout manages the primary UI structure including the sidebar, 
 * header, and the main paper grid. It also handles the responsive floating pane
 * for paper details.
 */
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
  onCollectionRename,
  onCollectionDelete,
  isImportDialogOpen,
  setImportDialogOpen,
  onPaperImported,
  onStarToggle,
  onBulkDelete,
  onBulkAddToCollection,
  activeView,
  selectedCollectionId,
  onNavigate,
  embedded = false,
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
  onCollectionRename: (id: string, name: string) => Promise<void>;
  onCollectionDelete: (id: string) => Promise<void>;
  isImportDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  onPaperImported: (paper: Omit<Paper, 'id'>) => void;
  onStarToggle: (paper: Paper) => void;
  onBulkDelete: (paperIds: string[]) => Promise<void>;
  onBulkAddToCollection: (paperIds: string[], collectionId: string) => Promise<void>;
  activeView: SidebarView;
  selectedCollectionId: string | null;
  onNavigate: (view: SidebarView, collectionId?: string) => void;
  /** When true, sidebar is rendered by parent layout; only main content is rendered here. */
  embedded?: boolean;
}) {
  const displayedPapers =
    activeView === 'starred'
      ? papers.filter((p) => p.starred)
      : activeView === 'collection' && selectedCollectionId
        ? papers.filter((p) => p.collection_id === selectedCollectionId)
        : papers;

  const headerTitle =
    activeView === 'notebook'
      ? 'Notebook'
      : activeView === 'all'
        ? 'All Papers'
        : activeView === 'starred'
          ? 'Starred'
          : activeView === 'collection' && selectedCollectionId
            ? collections.find((c) => c.id === selectedCollectionId)?.name ?? 'Collection'
            : 'All Papers';
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const mainContent = (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header: Responsive trigger, Title, and User Actions */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">{headerTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <SignedIn>
              {activeView !== 'notebook' && (
                <Button size="sm" className="gap-2" onClick={() => setImportDialogOpen(true)}>
                  <PlusCircle />
                  Import
                </Button>
              )}
              <UserNav />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {activeView === 'notebook' ? (
          <NotebookView />
        ) : (
          <>
            {/* Main Content Area: Grid of paper cards */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <PaperList
                papers={displayedPapers}
                summaries={summaries}
                selectedPaper={selectedPaper}
                collections={collections}
                onSelectPaper={onSelectPaper}
                onStarToggle={onStarToggle}
                onBulkDelete={onBulkDelete}
                onBulkAddToCollection={onBulkAddToCollection}
              />
            </main>
          </>
        )}
      </div>

      {/* Floating Paper Details Pane (only when not in notebook view) */}
      {activeView !== 'notebook' && (
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
      )}

      <ImportDialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen} onPaperImported={onPaperImported} />
    </>
  );

  if (embedded) {
    return mainContent;
  }

  const mainLayout = (
    <div className="flex h-screen w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
        <LeftSidebarContent
          collections={collections}
          onCollectionCreate={onCollectionCreate}
          onCollectionRename={onCollectionRename}
          onCollectionDelete={onCollectionDelete}
          activeView={activeView}
          selectedCollectionId={selectedCollectionId}
          onNavigate={onNavigate}
        />
      </Sidebar>
      {mainContent}
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

/**
 * RichieWorkspace is the root container for the application workspace.
 * It handles global state management, authentication sync, and data fetching.
 * When embedded is true, sidebar is provided by the parent (e.g. dashboard layout).
 */
export function RichieWorkspace({ embedded = false }: RichieWorkspaceProps = {}) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string[]>>({});
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [localActiveView, setLocalActiveView] = useState<SidebarView>('all');
  const [localSelectedCollectionId, setLocalSelectedCollectionId] = useState<string | null>(null);
  const sidebarView = useSidebarView();

  const activeView = embedded && sidebarView ? sidebarView.activeView : localActiveView;
  const selectedCollectionId = embedded && sidebarView ? sidebarView.selectedCollectionId : localSelectedCollectionId;
  const handleNavigate = embedded && sidebarView
    ? sidebarView.onNavigate
    : (view: SidebarView, collectionId?: string) => {
        setLocalActiveView(view);
        setLocalSelectedCollectionId(view === 'collection' && collectionId ? collectionId : null);
      };
  const { user } = useUser(); // Use Clerk's useUser hook

  // Sync Clerk user profile to Supabase database for consistent user records
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
          const msg =
            typeof details === 'string'
              ? details
              : typeof details === 'object' && details !== null
                ? JSON.stringify(details)
                : String(details);
          console.warn('User sync to Supabase failed:', response.status, msg);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn('User sync to Supabase failed:', msg);
      }
    };
    syncUser();
  }, [user]);

  // Initial data bootstrap: Fetch papers and collections from API
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [papersRes, collectionsRes] = await Promise.all([
          fetch('/api/papers'),
          fetch('/api/collections'),
        ]);

        if (!papersRes.ok || !collectionsRes.ok) {
          const papersErr = await papersRes.json().catch(() => ({ error: papersRes.statusText }));
          const collectionsErr = await collectionsRes.json().catch(() => ({ error: collectionsRes.statusText }));
          const papersDetail = papersErr?.details ?? papersErr?.error ?? papersRes.statusText;
          const collectionsDetail = collectionsErr?.details ?? collectionsErr?.error ?? collectionsRes.statusText;
          console.error(
            'Fetch failed:',
            `papers ${papersRes.status}: ${typeof papersDetail === 'string' ? papersDetail : JSON.stringify(papersDetail)}`,
            `collections ${collectionsRes.status}: ${typeof collectionsDetail === 'string' ? collectionsDetail : JSON.stringify(collectionsDetail)}`
          );
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

        // Pre-populate summaries to avoid re-summarizing existing papers
        const initialSummaries = papersArray.reduce((acc, paper: Record<string, unknown>) => {
          const id = typeof paper.id === 'string' ? paper.id : String(paper.id ?? '');
          const summary = paper.summary;
          const arr = Array.isArray(summary) ? (summary as string[]) : (typeof summary === 'string' && summary ? summary.split('\n').filter(Boolean) : []);
          if (arr.length > 0) acc[id] = arr;
          return acc;
        }, {} as Record<string, string[]>);
        setSummaries(initialSummaries);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error fetching data:', message, error);
      }
    };

    fetchData();
  }, [user?.id]);

  /**
   * Updates a paper's AI summary in the database and local state.
   * Also updates the summaries cache so the paper list Summary column shows the new summary.
   */
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
      setSummaries((prev) => ({ ...prev, [paperId]: summary }));
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  };

  /** 
   * Updates a specific paper in the list state, and synchronizes selection if applicable.
   */
  const handlePaperUpdate = (updatedPaper: Paper) => {
    setPapers((prevPapers) => prevPapers.map((p) => (p.id === updatedPaper.id ? updatedPaper : p)));
    if (selectedPaper && selectedPaper.id === updatedPaper.id) {
      setSelectedPaper(updatedPaper);
    }
  };

  /** 
   * Persists paper metadata changes to the backend API.
   */
  const handlePaperPersist = async (paperToSave: Paper) => {
    const response = await fetch(`/api/papers/${paperToSave.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        title: paperToSave.title,
        authors: paperToSave.authors,
        year: paperToSave.year,
        publication_date: paperToSave.publication_date ?? undefined,
        abstract: paperToSave.abstract,
        summary: paperToSave.summary,
        pdfUrl: paperToSave.pdfUrl,
        doi: paperToSave.doi,
        typeOfWork: paperToSave.typeOfWork,
        language: paperToSave.language,
        source: paperToSave.source,
        paperUrl: paperToSave.paperUrl,
        landingPageUrl: paperToSave.landingPageUrl,
        citedByCount: paperToSave.citedByCount,
        collection_id: paperToSave.collection_id ?? null,
        starred: paperToSave.starred ?? false,
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

  /** 
   * Handles importing a new paper (via DOI or PDF) and adds it to the library.
   */
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

  /** 
   * Deletes a paper from the library and closes the details pane if needed.
   */
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

  /**
   * Bulk-deletes multiple papers by their IDs.
   */
  const handleBulkDelete = async (paperIds: string[]) => {
    await Promise.all(
      paperIds.map((id) =>
        fetch(`/api/papers/${id}`, { method: 'DELETE' })
      )
    );
    setPapers((prev) => prev.filter((p) => !paperIds.includes(p.id)));
    if (selectedPaper && paperIds.includes(selectedPaper.id)) {
      setSelectedPaper(null);
    }
  };

  /**
   * Moves multiple papers into a collection by patching their collection_id.
   */
  const handleBulkAddToCollection = async (paperIds: string[], collectionId: string) => {
    await Promise.all(
      paperIds.map((id) =>
        fetch(`/api/papers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection_id: collectionId }),
        })
      )
    );
    setPapers((prev) =>
      prev.map((p) =>
        paperIds.includes(p.id) ? { ...p, collection_id: collectionId } : p
      )
    );
    if (selectedPaper && paperIds.includes(selectedPaper.id)) {
      setSelectedPaper((prev) => prev ? { ...prev, collection_id: collectionId } : prev);
    }
  };

  /**
   * Toggle a paper's starred state and persist to the API.
   */
  const handleStarToggle = async (paper: Paper) => {
    const nextStarred = !paper.starred;
    const updated = { ...paper, starred: nextStarred };
    handlePaperUpdate(updated);
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: nextStarred }),
      });
      if (!response.ok) throw new Error('Failed to update starred');
      const raw = await response.json();
      const fromApi = apiPaperToPaper((Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>);
      handlePaperUpdate(fromApi);
    } catch (error) {
      console.error('Error toggling star:', error);
      handlePaperUpdate(paper); // revert on error
    }
  };

  /**
   * Renames a collection by ID.
   */
  const handleCollectionRename = async (id: string, name: string) => {
    const response = await fetch(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to rename collection');
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  /**
   * Deletes a collection by ID. Papers in the collection are not deleted.
   */
  const handleCollectionDelete = async (id: string) => {
    const response = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete collection');
    setCollections(prev => prev.filter(c => c.id !== id));
    // If currently viewing the deleted collection, navigate back to all papers
    if (activeView === 'collection' && selectedCollectionId === id) {
      handleNavigate('all');
    }
  };

  /**
   * Creates a new user defined collection for organizing papers.
   */
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

  const layout = (
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
      onCollectionRename={handleCollectionRename}
      onCollectionDelete={handleCollectionDelete}
      isImportDialogOpen={isImportDialogOpen}
      setImportDialogOpen={setImportDialogOpen}
      onPaperImported={handlePaperImport}
      onStarToggle={handleStarToggle}
      onBulkDelete={handleBulkDelete}
      onBulkAddToCollection={handleBulkAddToCollection}
      activeView={activeView}
      selectedCollectionId={selectedCollectionId}
      onNavigate={handleNavigate}
      embedded={embedded}
    />
  );

  if (embedded) return layout;
  return <SidebarProvider>{layout}</SidebarProvider>;
}

export type RichieWorkspaceProps = { embedded?: boolean };
