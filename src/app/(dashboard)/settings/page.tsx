'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { PersonalDetails } from '@/components/settings/personal-details';
import { Usage } from '@/components/settings/usage';
import { SubscriptionBilling } from '@/components/settings/subscription-billing';
import { PaymentDetails } from '@/components/settings/payment-details';
import { Notifications } from '@/components/settings/notifications';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { signOut } = useClerk();

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        </div>
        <UserNav />
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
          <PersonalDetails />
          <Usage />
          <SubscriptionBilling />
          <PaymentDetails />
          <Notifications />
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              className="gap-2 hover:bg-red-500 hover:text-white"
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
