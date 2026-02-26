'use client';

import { useEffect, useState } from 'react';
import { SettingsSection } from './settings-section';
import { Progress } from '@/components/ui/progress';
import { FileText, HardDrive } from 'lucide-react';

type UsageData = {
  paperCount: number;
  storageUsedBytes: number | null;
  storageLimitBytes: number | null;
};

function formatStorage(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Usage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/usage')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load usage');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => { cancelled = true; };
  }, []);

  const paperCount = data?.paperCount ?? null;
  const storageUsed = data?.storageUsedBytes ?? null;
  const storageLimit = data?.storageLimitBytes ?? null;
  const storageLabel =
    storageLimit != null || storageUsed != null
      ? `${formatStorage(storageUsed)} / ${formatStorage(storageLimit)}`
      : '—';

  const storagePercent =
    storageLimit != null && storageLimit > 0 && storageUsed != null
      ? Math.min(100, (storageUsed / storageLimit) * 100)
      : null;

  return (
    <SettingsSection
      title="Usage"
      description="Your account usage and limits."
    >
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Papers in library</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {data === null && !error ? '…' : String(paperCount ?? '—')}
          </span>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage used</span>
            </div>
            <span className="text-sm text-muted-foreground">{storageLabel}</span>
          </div>
          {storagePercent != null && (
            <Progress value={storagePercent} className="h-2" />
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
