'use client';

import { SettingsSection } from './settings-section';
import { Bell } from 'lucide-react';

export function Notifications() {
  return (
    <SettingsSection
      title="Notifications"
      description="Choose how you receive updates about your library."
    >
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-8 text-muted-foreground">
        <Bell className="size-5 shrink-0" />
        <span className="text-sm font-medium">Coming soon</span>
      </div>
    </SettingsSection>
  );
}
