'use client';

import { SettingsSection } from './settings-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

export function SubscriptionBilling() {
  return (
    <SettingsSection
      title="Subscription & billing"
      description="Your current plan and billing cycle."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Free plan</p>
              <p className="text-sm text-muted-foreground">Basic features for personal use</p>
            </div>
          </div>
          <Badge variant="secondary">Current</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Next billing date: —</span>
        </div>
        <Button variant="outline" size="sm" disabled>
          Upgrade plan (coming soon)
        </Button>
      </div>
    </SettingsSection>
  );
}
