'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { PersonalDetails } from '@/components/settings/personal-details';
import { Usage } from '@/components/settings/usage';
import { SubscriptionBilling } from '@/components/settings/subscription-billing';
import { PaymentDetails } from '@/components/settings/payment-details';
import { Notifications } from '@/components/settings/notifications';

export default function SettingsPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
          <PersonalDetails />
          <Usage />
          <SubscriptionBilling />
          <PaymentDetails />
          <Notifications />
        </div>
      </main>
    </>
  );
}
