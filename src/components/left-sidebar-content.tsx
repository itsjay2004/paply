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
import Image from 'next/image';
import { Button } from './ui/button';
import { BookMarked, Check, Folder, HelpCircle, Library, LogOut, Moon, MoreHorizontal, Pencil, Plus, Settings, Star, Sun, Trash2, User, X } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const HOVER_CLOSE_DELAY_MS = 150;

export type SidebarView = 'all' | 'starred' | 'collection' | 'notebook';

export function LeftSidebarContent({
  collections,
  onCollectionCreate,
  onCollectionRename,
  onCollectionDelete,
  activeView,
  selectedCollectionId,
  onNavigate,
}: {
  collections: Collection[];
  onCollectionCreate: (name: string) => Promise<void>;
  onCollectionRename: (id: string, name: string) => Promise<void>;
  onCollectionDelete: (id: string) => Promise<void>;
  activeView: SidebarView;
  selectedCollectionId: string | null;
  onNavigate: (view: SidebarView, collectionId?: string) => void;
}) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const startEditing = (collection: Collection) => {
    setEditingId(collection.id);
    setEditingName(collection.name);
  };

  const commitRename = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== collections.find(c => c.id === editingId)?.name) {
      await onCollectionRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  const cancelEditing = () => setEditingId(null);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await onCollectionDelete(deletingId);
    setDeletingId(null);
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-center px-1 py-2">
          <Image
            src="/logo/logo-full.png"
            alt="Paply"
            width={140}
            height={40}
            className="h-12 w-auto max-w-full shrink-0 rounded-lg object-contain object-left"
          />
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
              <span className="font-heading">All Papers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'starred'}
              tooltip="Starred"
              onClick={() => onNavigate('starred')}
            >
              <Star />
              <span className="font-heading">Starred</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'notebook'}
              tooltip="Notebook"
              onClick={() => onNavigate('notebook')}
            >
              <BookMarked />
              <span className="font-heading">Notebook</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="flex items-center">
            <span className="flex-1 font-heading">Collections</span>
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
                  {editingId === collection.id ? (
                    /* ── Inline rename input ── */
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Folder className="size-4 shrink-0 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        onBlur={commitRename}
                        className="h-7 flex-1 text-sm px-1 py-0 border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/40"
                      />
                      <button type="button" onClick={commitRename} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                        <Check className="size-3.5" />
                      </button>
                      <button type="button" onClick={cancelEditing} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* ── Normal row with hover actions ── */
                    <div className="group/item flex items-center w-full rounded-md">
                      <SidebarMenuButton
                        tooltip={collection.name}
                        isActive={activeView === 'collection' && selectedCollectionId === collection.id}
                        onClick={() => onNavigate('collection', collection.id)}
                        className="flex-1 min-w-0"
                      >
                        <Folder />
                        <span className="flex-1 font-heading truncate">{collection.name}</span>
                        <Badge variant="secondary" className="group-data-[collapsible=icon]:hidden shrink-0">
                          {collection.paperCount}
                        </Badge>
                      </SidebarMenuButton>

                      {/* ··· dropdown — visible on hover */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={e => e.stopPropagation()}
                            className={cn(
                              'ml-0.5 shrink-0 rounded-md p-1 text-muted-foreground/50',
                              'opacity-0 group-hover/item:opacity-100 transition-opacity',
                              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              'group-data-[collapsible=icon]:hidden',
                            )}
                            aria-label="Collection options"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-40">
                          <DropdownMenuItem onClick={() => startEditing(collection)}>
                            <Pencil className="size-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeletingId(collection.id)}
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={open => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              "{collections.find(c => c.id === deletingId)?.name}" will be permanently deleted.
              Papers inside it will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
