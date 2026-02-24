import { useState } from 'react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { BookOpenCheck, Clock, Folder, Library, Plus, Star } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export function LeftSidebarContent({ collections, onCollectionCreate }: { collections: Collection[]; onCollectionCreate: (name: string) => Promise<void> }) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
            <SidebarMenuButton isActive tooltip="All Papers">
              <Library />
              <span>All Papers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Recents">
              <Clock />
              <span>Recents</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Starred">
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
                  <SidebarMenuButton tooltip={collection.name}>
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
    </>
  );
}
