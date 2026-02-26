'use client';

import { SettingsSection } from './settings-section';
import { FileText, HardDrive } from 'lucide-react';

type UsageStats = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const defaultStats: UsageStats[] = [
  { label: 'Papers in library', value: '—', icon: <FileText className="size-4 text-muted-foreground" /> },
  { label: 'Storage used', value: '—', icon: <HardDrive className="size-4 text-muted-foreground" /> },
];

export function Usage() {
  return (
    <SettingsSection
      title="Usage"
      description="Your account usage and limits."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {defaultStats.map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-sm text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
