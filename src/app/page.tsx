import { RichieWorkspace } from '@/components/richie-workspace';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      <SignedIn>
        <main>
          <RichieWorkspace />
        </main>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Richie Reference</h1>
            <p className="text-lg text-muted-foreground mb-8">Your personal research paper manager.</p>
            <SignInButton mode="modal">
                <Button size="lg">Sign in to get started</Button>
            </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}
