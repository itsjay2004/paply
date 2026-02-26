'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
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
  const onNavigate = useCallback((view: SidebarView, collectionId?: string) => {
    setActiveView(view);
    setSelectedCollectionId(view === 'collection' && collectionId ? collectionId : null);
  }, []);

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
