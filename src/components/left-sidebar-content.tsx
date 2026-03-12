'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { Button } from './ui/button';
import {
  BookMarked, Check, ChevronUp, Folder, HelpCircle,
  Library, LogOut, Moon, MoreHorizontal, Pencil, Plus,
  Settings, Star, Sun, Trash2, User, X,
} from 'lucide-react';
import type { Collection } from '@/lib/types';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type SidebarView = 'all' | 'starred' | 'collection' | 'notebook';

/* ── Single nav button ─────────────────────────────────────────────────── */
function NavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/nav flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 outline-none',
        'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
      )}
    >
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'bg-primary/20 text-primary'
            : 'bg-sidebar-accent/80 text-sidebar-foreground/60 group-hover/nav:bg-sidebar-accent group-hover/nav:text-sidebar-foreground',
        )}
      >
        <Icon className="size-[15px]" />
      </div>
      <span className="flex-1 text-left font-heading text-[0.8rem] font-semibold tracking-[0.01em] group-data-[collapsible=icon]:hidden">
        {label}
      </span>
      {isActive && (
        <span className="size-1.5 shrink-0 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
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
  const createInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (isCreating) createInputRef.current?.focus();
  }, [isCreating]);

  const handleCreate = async () => {
    if (newCollectionName.trim()) {
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
    if (trimmed && trimmed !== collections.find((c) => c.id === editingId)?.name) {
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

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const displayName = user?.fullName || user?.username || 'Account';

  return (
    <>
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 pb-3 pt-4">
        <div className="flex items-center group-data-[collapsible=icon]:justify-center">
          <Image
            src="/logo/logo-full.png"
            alt="Paply"
            width={120}
            height={36}
            className="h-9 w-auto shrink-0 rounded-lg object-contain object-left group-data-[collapsible=icon]:hidden"
            priority
          />
          <Image
            src="/logo/icon-logo.png"
            alt="Paply"
            width={32}
            height={32}
            className="hidden h-8 w-auto shrink-0 rounded-lg object-contain group-data-[collapsible=icon]:block"
            priority
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-0 px-3 pb-2">
        {/* ── Primary navigation ────────────────────────────────────────── */}
        <nav className="flex flex-col gap-0.5 pb-3">
          <NavItem
            icon={Library}
            label="All Papers"
            isActive={activeView === 'all'}
            onClick={() => onNavigate('all')}
          />
          <NavItem
            icon={Star}
            label="Starred"
            isActive={activeView === 'starred'}
            onClick={() => onNavigate('starred')}
          />
          <NavItem
            icon={BookMarked}
            label="Notebook"
            isActive={activeView === 'notebook'}
            onClick={() => onNavigate('notebook')}
          />
        </nav>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="mx-1 mb-3 h-px bg-sidebar-border/60 group-data-[collapsible=icon]:hidden" />

        {/* ── Collections ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          {/* Section header */}
          <div className="mb-0.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Collections
            </span>
            <button
              type="button"
              onClick={() => setIsCreating((v) => !v)}
              className="flex size-5 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="New collection"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Inline create input */}
          {isCreating && (
            <div className="mb-1 flex items-center gap-1.5 rounded-xl bg-sidebar-accent/60 px-2.5 py-1.5">
              <Folder className="size-3.5 shrink-0 text-sidebar-foreground/40" />
              <input
                ref={createInputRef}
                type="text"
                placeholder="Collection name…"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                  if (e.key === 'Escape') { setIsCreating(false); setNewCollectionName(''); }
                }}
                className="flex-1 bg-transparent text-xs text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/30"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newCollectionName.trim()}
                className="rounded-md p-0.5 text-sidebar-foreground/50 transition-colors hover:text-primary disabled:opacity-30"
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewCollectionName(''); }}
                className="rounded-md p-0.5 text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Empty state */}
          {collections.length === 0 && !isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-sidebar-border/60 px-3 py-3 text-xs text-sidebar-foreground/30 transition-colors hover:border-primary/30 hover:text-primary/60"
            >
              <Plus className="size-3" />
              New collection
            </button>
          )}

          {/* Collection list */}
          <div className="flex flex-col gap-0.5">
            {collections.map((collection) => {
              const isActive =
                activeView === 'collection' && selectedCollectionId === collection.id;

              return (
                <div key={collection.id} className="group/item flex items-center gap-0.5">
                  {editingId === collection.id ? (
                    /* ── Inline rename ── */
                    <div className="flex flex-1 items-center gap-1.5 rounded-xl bg-sidebar-accent/60 px-2.5 py-1.5">
                      <Folder className="size-3.5 shrink-0 text-sidebar-foreground/40" />
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        onBlur={commitRename}
                        className="h-auto flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                      />
                      <button type="button" onClick={commitRename} className="rounded-md p-0.5 text-sidebar-foreground/40 hover:text-primary">
                        <Check className="size-3.5" />
                      </button>
                      <button type="button" onClick={cancelEditing} className="rounded-md p-0.5 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Collection button */}
                      <button
                        type="button"
                        onClick={() => onNavigate('collection', collection.id)}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 outline-none',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-md transition-colors',
                            isActive
                              ? 'bg-primary/20 text-primary'
                              : 'bg-sidebar-accent/80 text-sidebar-foreground/40',
                          )}
                        >
                          <Folder className="size-3" />
                        </div>
                        <span className="flex-1 truncate text-left text-xs font-medium">
                          {collection.name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                            isActive
                              ? 'bg-primary/20 text-primary'
                              : 'bg-sidebar-accent text-sidebar-foreground/40',
                          )}
                        >
                          {collection.paperCount}
                        </span>
                      </button>

                      {/* Options menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'shrink-0 rounded-lg p-1 text-sidebar-foreground/30',
                              'opacity-0 transition-opacity group-hover/item:opacity-100',
                              'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                            )}
                            aria-label="Collection options"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-40">
                          <DropdownMenuItem onClick={() => startEditing(collection)}>
                            <Pencil className="mr-2 size-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setDeletingId(collection.id)}
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SidebarContent>

      {/* ── User footer ──────────────────────────────────────────────────── */}
      {user && (
        <SidebarFooter className="border-t border-sidebar-border/60 px-3 py-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl p-2 text-left outline-none transition-colors',
                  'hover:bg-sidebar-accent',
                  'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2',
                )}
              >
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="size-7 shrink-0 rounded-full object-cover ring-1 ring-sidebar-border"
                  />
                ) : (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-sidebar-border">
                    <User className="size-3.5" />
                  </div>
                )}
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold leading-tight text-sidebar-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] leading-tight text-sidebar-foreground/40">
                    {email}
                  </p>
                </div>
                <ChevronUp className="size-3.5 shrink-0 text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-64 p-0 shadow-lg"
            >
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Menu items */}
              <div className="p-1.5">
                <Link
                  href="/settings"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Settings className="size-4 shrink-0 text-muted-foreground" />
                  Settings
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                  Help &amp; Support
                </button>
              </div>

              <div className="h-px bg-border" />

              {/* Theme toggle */}
              <div className="p-3">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Appearance
                </p>
                <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all',
                      resolvedTheme === 'light'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Sun className="size-3.5" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all',
                      (resolvedTheme ?? 'dark') === 'dark'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Moon className="size-3.5" />
                    Dark
                  </button>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Sign out */}
              <div className="p-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  onClick={() => signOut({ redirectUrl: '/' })}
                >
                  <LogOut className="size-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </SidebarFooter>
      )}

      {/* ── Delete collection dialog ──────────────────────────────────────── */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                &ldquo;{collections.find((c) => c.id === deletingId)?.name}&rdquo;
              </span>{' '}
              will be permanently deleted. Papers inside it will not be removed.
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
