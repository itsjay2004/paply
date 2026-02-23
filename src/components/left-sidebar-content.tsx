import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { BookOpenCheck, Clock, Folder, Library, Plus, Star, Tag } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { UserNav } from './user-nav';
import { Badge } from './ui/badge';

export function LeftSidebarContent({ collections }: { collections: Collection[] }) {
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
            <Button variant="ghost" size="icon" className="size-6">
              <Plus className="size-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
      <SidebarSeparator />
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </>
  );
}
