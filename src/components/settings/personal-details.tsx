'use client';

import { useUser } from '@clerk/nextjs';
import { SettingsSection } from './settings-section';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export function PersonalDetails() {
  const { user } = useUser();
  const name = user?.fullName ?? user?.username ?? '';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <SettingsSection
      title="Personal details"
      description="Your account information. Manage your name and email."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="size-16 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted">
              <User className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">Profile photo</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" value={name} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" type="email" value={email} readOnly className="bg-muted/50" />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
