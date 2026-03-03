'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { SidebarView } from '@/components/left-sidebar-content';

type SidebarViewContextValue = {
  activeView: SidebarView;
  selectedCollectionId: string | null;
  onNavigate: (view: SidebarView, collectionId?: string) => void;
};

const SidebarViewContext = createContext<SidebarViewContextValue | null>(null);

export function SidebarViewProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<SidebarView>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = useCallback((view: SidebarView, collectionId?: string) => {
    setActiveView(view);
    setSelectedCollectionId(view === 'collection' && collectionId ? collectionId : null);
    if (pathname !== '/') {
      router.push('/');
    }
  }, [pathname, router]);

  return (
    <SidebarViewContext.Provider
      value={{ activeView, selectedCollectionId, onNavigate }}
    >
      {children}
    </SidebarViewContext.Provider>
  );
}

export function useSidebarView(): SidebarViewContextValue | null {
  return useContext(SidebarViewContext);
}
