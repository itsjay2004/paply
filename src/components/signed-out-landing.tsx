'use client';

import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Search,
  Sparkles,
  FileText,
  BookOpen,
  Lock,
  Shield,
  Database,
  Upload,
  FolderOpen,
  Highlighter,
  PenLine,
  Github,
  ArrowRight,
  BookOpenCheck,
} from 'lucide-react';

export function SignedOutLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav bar */}
      <div className="sticky top-0 z-50 p-4 sm:p-5">
        <header className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-border/60 bg-card px-5 shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/95">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpenCheck className="size-5" aria-hidden />
            </div>
            <span className="font-semibold text-foreground">Paply</span>
          </div>
          <SignInButton mode="modal">
            <Button variant="secondary" size="sm" className="rounded-lg">
              Sign in
            </Button>
          </SignInButton>
        </header>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl bg-clip-text">
            Your Research, Reimagined
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto sm:text-xl leading-relaxed">
            The open-source, AI-powered reference manager built for the modern scholar. Organize, annotate, and summarize your library in one secure workspace.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton mode="modal">
              <Button size="lg" className="min-w-[200px] gap-2 text-base">
                Get Started for Free
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] gap-2 text-base"
              asChild
            >
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="size-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Four */}
      <section className="border-t border-border/60 bg-muted/20 py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl mb-12">
            Everything you need in one place
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: 'Smart Search & Sync',
                desc: 'Find papers by DOI or title. Rich metadata, abstracts, and citations fetched automatically.',
              },
              {
                icon: Sparkles,
                title: 'AI-Powered Insights',
                desc: 'Generate narrative summaries that explain context, methods, and conclusions in seconds.',
              },
              {
                icon: FileText,
                title: 'Advanced PDF Engine',
                desc: 'View, highlight, and annotate PDFs in-browser. Notes sync to your account everywhere.',
              },
              {
                icon: BookOpen,
                title: 'Dedicated Notebook',
                desc: 'Connect highlights to a workspace and synthesize findings into your own work.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Paply */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl mb-12">
            Why Paply?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Open-Source & Transparent',
                desc: 'Research tools as open as the science they support. No hidden tracking, no lock-ins.',
              },
              {
                icon: Shield,
                title: 'Privacy-First Security',
                desc: 'Private storage and verified auth. Your papers are encrypted and visible only to you.',
              },
              {
                icon: Database,
                title: 'Generous Free Storage',
                desc: '500MB free—enough for 250–300 papers. Get started without a credit card.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-gradient-to-b from-card to-muted/30 p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-t border-border/60 bg-muted/20 py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl mb-12">
            From search to summary
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Upload, step: 'Import', text: 'Drop a PDF or search by DOI to populate your library.' },
              { icon: FolderOpen, step: 'Organize', text: 'Tag and categorize with an intuitive folder system.' },
              { icon: Highlighter, step: 'Annotate', text: 'Highlight and add notes in the high-fidelity viewer.' },
              { icon: PenLine, step: 'Synthesize', text: 'Use AI summaries and the Notebook to build your thesis.' },
            ].map(({ icon: Icon, step, text }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold ring-2 ring-primary/20">
                  <Icon className="size-6" />
                </div>
                <p className="mt-3 font-semibold text-foreground">{step}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-10 shadow-lg">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to upgrade your workflow?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join researchers who have simplified their literature reviews.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="mt-6 min-w-[220px] text-base">
                Create Your Free Account
              </Button>
            </SignInButton>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. 500MB free storage included.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Paply. Open-source reference manager for researchers.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <Github className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
