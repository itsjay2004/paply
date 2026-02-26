'use client';

import { SettingsSection } from './settings-section';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

export function PaymentDetails() {
  return (
    <SettingsSection
      title="Payment details"
      description="Manage payment methods for your subscription."
    >
      <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-muted/30 px-4 py-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <CreditCard className="size-5" />
          <span className="text-sm">No payment method on file.</span>
        </div>
        <Button variant="outline" size="sm" disabled>
          Add payment method (coming soon)
        </Button>
      </div>
    </SettingsSection>
  );
}
