'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet } from '@/components/ui/sheet';
import { LeftSidebarContent } from '@/components/left-sidebar-content';
import { SidebarViewProvider, useSidebarView } from '@/lib/sidebar-view-context';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/lib/types';
import { SignedOutLanding } from '@/components/signed-out-landing';

function DashboardSidebar({
  collections,
  onCollectionCreate,
  onCollectionRename,
  onCollectionDelete,
}: {
  collections: Collection[];
  onCollectionCreate: (name: string) => Promise<void>;
  onCollectionRename: (id: string, name: string) => Promise<void>;
  onCollectionDelete: (id: string) => Promise<void>;
}) {
  const view = useSidebarView();
  if (!view) return null;
  return (
    <LeftSidebarContent
      collections={collections}
      onCollectionCreate={onCollectionCreate}
      onCollectionRename={onCollectionRename}
      onCollectionDelete={onCollectionDelete}
      activeView={view.activeView}
      selectedCollectionId={view.selectedCollectionId}
      onNavigate={view.onNavigate}
    />
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        {children}
      </Sheet>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch('/api/collections');
      if (!res.ok) return;
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch {
      setCollections([]);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCollectionCreate = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create collection');
      const newCollection = Array.isArray(data) ? data[0] : data;
      if (newCollection) setCollections((prev) => [...prev, newCollection]);
    } catch (e) {
      console.error('Error creating collection:', e);
    }
  }, []);

  const handleCollectionRename = useCallback(async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to rename collection');
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    } catch (e) {
      console.error('Error renaming collection:', e);
    }
  }, []);

  const handleCollectionDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete collection');
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Error deleting collection:', e);
    }
  }, []);

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <SidebarViewProvider>
            <DashboardShell>
              <div className="flex h-screen w-full bg-background">
                <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
                  <DashboardSidebar
                    collections={collections}
                    onCollectionCreate={handleCollectionCreate}
                    onCollectionRename={handleCollectionRename}
                    onCollectionDelete={handleCollectionDelete}
                  />
                </Sidebar>
                <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
              </div>
            </DashboardShell>
          </SidebarViewProvider>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
      <SignedOutLanding />
      </SignedOut>
    </>
  );
}
