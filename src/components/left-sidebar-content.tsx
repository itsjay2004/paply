import { useState, useRef, useCallback } from 'react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { BookOpenCheck, Folder, HelpCircle, Library, LogOut, Moon, Plus, Settings, Star, Sun, User } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const HOVER_CLOSE_DELAY_MS = 150;

export type SidebarView = 'all' | 'starred' | 'collection';

export function LeftSidebarContent({
  collections,
  onCollectionCreate,
  activeView,
  selectedCollectionId,
  onNavigate,
}: {
  collections: Collection[];
  onCollectionCreate: (name: string) => Promise<void>;
  activeView: SidebarView;
  selectedCollectionId: string | null;
  onNavigate: (view: SidebarView, collectionId?: string) => void;
}) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();

  const clearLeaveTimeout = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const handleUserMenuEnter = useCallback(() => {
    clearLeaveTimeout();
    setUserMenuOpen(true);
  }, [clearLeaveTimeout]);

  const handleUserMenuLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => setUserMenuOpen(false), HOVER_CLOSE_DELAY_MS);
  }, []);

  const handleCreate = async () => {
    if (newCollectionName.trim() !== '') {
      await onCollectionCreate(newCollectionName.trim());
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <BookOpenCheck className="size-5 text-primary" />
          </Button>
          <span className="text-lg font-semibold tracking-tight">Richie</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'all'}
              tooltip="All Papers"
              onClick={() => onNavigate('all')}
            >
              <Library />
              <span>All Papers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'starred'}
              tooltip="Starred"
              onClick={() => onNavigate('starred')}
            >
              <Star />
              <span>Starred</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="flex items-center">
            <span className="flex-1">Collections</span>
            <Button variant="ghost" size="icon" className="size-6" onClick={() => setIsCreating(!isCreating)}>
              <Plus className="size-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isCreating && (
                <div className="flex items-center gap-2 p-2">
                  <Input
                    type="text"
                    placeholder="New collection..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="h-8"
                  />
                  <Button size="sm" onClick={handleCreate}>Create</Button>
                </div>
              )}
              {collections.length === 0 && !isCreating && (
                <p className="p-2 text-sm text-muted-foreground">No collections yet. Click the '+' to create one.</p>
              )}
              {collections.map(collection => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton
                    tooltip={collection.name}
                    isActive={activeView === 'collection' && selectedCollectionId === collection.id}
                    onClick={() => onNavigate('collection', collection.id)}
                  >
                    <Folder />
                    <span className="flex-1">{collection.name}</span>
                    <Badge variant="secondary" className='group-data-[collapsible=icon]:hidden'>{collection.paperCount}</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="mt-auto border-t border-sidebar-border">
          <div
            className="relative"
            onMouseEnter={handleUserMenuEnter}
            onMouseLeave={handleUserMenuLeave}
          >
            <div
              className={cn(
                'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding]',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center'
              )}
            >
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="size-4" />
                </div>
              )}
              <span className="truncate text-sm group-data-[collapsible=icon]:hidden">
                {user.primaryEmailAddress?.emailAddress ?? 'Account'}
              </span>
            </div>

            {userMenuOpen && (
              <div
                className="absolute bottom-0 left-full z-50 ml-1 min-w-[220px] rounded-lg border bg-popover p-2 text-popover-foreground shadow-md"
                onMouseEnter={handleUserMenuEnter}
                onMouseLeave={handleUserMenuLeave}
              >
                <div className="flex items-center gap-3 px-2 py-2">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {user.fullName || user.username || 'User'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress ?? ''}
                    </p>
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="size-4 shrink-0" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {}}
                  >
                    <HelpCircle className="size-4 shrink-0" />
                    Help
                  </button>
                  <div className="flex w-full flex-col gap-2 px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Theme</span>
                    <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                          resolvedTheme === 'light'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Sun className="size-3.5" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors',
                          (resolvedTheme ?? 'dark') === 'dark'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Moon className="size-3.5" />
                        Dark
                      </button>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-red-500 hover:text-white"
                    onClick={() => signOut({ redirectUrl: '/' })}
                  >
                    <LogOut className="size-4 shrink-0" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </SidebarFooter>
      )}
    </>
  );
}
