'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { LeftSidebarContent } from '@/components/left-sidebar-content';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/lib/types';

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

  const handleCollectionCreate = useCallback(
    async (name: string) => {
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
    },
    []
  );

  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-background">
            <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-card">
              <LeftSidebarContent
                collections={collections}
                onCollectionCreate={handleCollectionCreate}
              />
            </Sidebar>
            <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
          </div>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Richie Reference</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your personal research paper manager.
          </p>
          <SignInButton mode="modal">
            <Button size="lg">Sign in to get started</Button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}
