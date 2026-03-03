'use client';

import { SignInButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
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
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function SignedOutLanding() {
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen text-foreground">

      {/* Keyframe animations for floating orbs */}
      <style>{`
        @keyframes orb-drift-1 {
          0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }
          50% { transform: translateX(-50%) translateY(-70px) scale(1.07); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translateX(50%) translateY(0px) scale(1); }
          33% { transform: translateX(50%) translateY(50px) scale(0.93); }
          66% { transform: translateX(50%) translateY(-35px) scale(1.05); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translateX(-50%) translateY(0px) scale(1); }
          50% { transform: translateX(-50%) translateY(-55px) scale(1.1); }
        }
        @keyframes orb-drift-4 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
          50% { transform: translateY(-25px) scale(1.15); opacity: 0.8; }
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Base page color */}
        <div className="absolute inset-0 bg-background" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.12] dark:opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(91,76,255,0.6) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />

        {/* Primary violet orb — top-left */}
        <div
          className="absolute top-[-80px] left-1/4 h-[600px] w-[600px] rounded-full bg-[#5B4CFF]/10 blur-[100px]"
          style={{ animation: 'orb-drift-1 16s ease-in-out infinite', transform: 'translateX(-50%)' }}
        />

        {/* Cyan orb — top-right */}
        <div
          className="absolute top-[-40px] right-1/4 h-[440px] w-[440px] rounded-full bg-[#00A3C4]/10 blur-[90px]"
          style={{ animation: 'orb-drift-2 20s ease-in-out infinite', transform: 'translateX(50%)' }}
        />

        {/* Bottom orb */}
        <div
          className="absolute bottom-[-80px] left-1/2 h-[500px] w-[800px] rounded-full bg-[#5B4CFF]/8 blur-[110px]"
          style={{ animation: 'orb-drift-3 22s ease-in-out infinite', transform: 'translateX(-50%)' }}
        />

        {/* Small accent — mid-right */}
        <div
          className="absolute top-[45%] right-[8%] h-[200px] w-[200px] rounded-full bg-[#7B6FFF]/10 blur-[60px]"
          style={{ animation: 'orb-drift-4 11s ease-in-out infinite' }}
        />

        {/* Small accent — mid-left */}
        <div
          className="absolute top-[60%] left-[6%] h-[160px] w-[160px] rounded-full bg-[#00A3C4]/8 blur-[55px]"
          style={{ animation: 'orb-drift-4 13s ease-in-out infinite 2s' }}
        />

        {/* Top edge aurora glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5B4CFF]/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#5B4CFF]/[0.04] to-transparent" />
      </div>

      {/* Navbar */}
      <div className="sticky top-4 z-50 px-4">
        <header
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-5 py-3 backdrop-blur-xl transition-all duration-500",
            scrolled
              ? "border-[#5B4CFF]/25 bg-background/95 shadow-xl shadow-[#5B4CFF]/8 dark:shadow-[#5B4CFF]/12"
              : "border-border/40 bg-background/70 shadow-lg shadow-black/5"
          )}
        >
          <Image
            src="/logo/logo-full.png"
            alt="Paply"
            width={110}
            height={36}
            className="h-9 w-auto rounded-lg object-contain"
            priority
          />

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#why-us" className="hover:text-foreground transition">Why Us</a>
            <a href="#workflow" className="hover:text-foreground transition">Workflow</a>
            <a
              href="https://github.com/itsjay2004/paply"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition flex items-center gap-1.5"
            >
              <Github className="size-3.5" />
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-border/50 bg-muted/30 p-1">
              {mounted && (
                <>
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                      resolvedTheme === 'light'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sun className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                      resolvedTheme === 'dark'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Moon className="size-3.5" />
                  </button>
                </>
              )}
            </div>

            <SignInButton mode="modal">
              <Button className="rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-lg shadow-[#5B4CFF]/25 px-5 h-9 text-sm">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </header>
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 text-center">
        <div className="mx-auto max-w-5xl">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B4CFF]/30 bg-[#5B4CFF]/10 px-4 py-1.5 text-xs font-medium text-[#5B4CFF] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5B4CFF] animate-pulse" />
            Open-source · Free to use · AI-powered
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.2]">

            {/* Line 1 — colored verb + regular noun */}
            <span className="block">
              <span className="text-[#5B4CFF]">Organize</span>{' '}
              Your Knowledge
            </span>

            {/* Line 2 — soft connector + plain bold */}
            <span className="block">
              <em className="font-light text-muted-foreground" style={{ fontStyle: 'italic' }}>with</em>{' '}
              One Powerful
            </span>

            {/* Line 3 — badge as the conclusion */}
            <span className="block mt-1">
              <span className="inline-flex items-center rounded-[14px] bg-foreground text-background px-5 py-1.5 align-middle text-[0.82em] -rotate-1 font-extrabold">
                Reference Manager
              </span>
              🚀
            </span>

          </h1>

          <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Import papers, annotate PDFs, organize, unlock insights, and write — all in one
            intelligent workspace designed for deep academic work.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="min-w-[200px] h-12 text-base rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-xl shadow-[#5B4CFF]/30 gap-2"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px] h-12 rounded-xl border-border/60 hover:bg-muted/50 gap-2"
              asChild
            >
              <a href="https://github.com/itsjay2004/paply" target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {['No credit card required', '500MB free storage', 'Open-source'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#5B4CFF]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section id="features" className="relative py-24 px-4 scroll-mt-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need in one workspace
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Powerful research tools designed for serious academic work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {/* Large card — AI */}
            <div className="group relative lg:col-span-2 rounded-3xl border border-border/60 bg-gradient-to-br from-[#5B4CFF]/10 via-background to-background p-8 overflow-hidden hover:border-[#5B4CFF]/40 transition-all duration-300">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#5B4CFF]/15 blur-3xl" />
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#5B4CFF]/15 text-[#5B4CFF] group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">AI-Powered Insights</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-md">
                Generate contextual summaries covering methods, findings, and conclusions. Let AI do the heavy lifting so you can focus on your research.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Abstract Summarization', 'Key Findings', 'Methodology Analysis'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#5B4CFF]/25 bg-[#5B4CFF]/8 px-3 py-1 text-xs font-medium text-[#5B4CFF]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Smart Search */}
            <div className="group relative rounded-3xl border border-border/60 bg-gradient-to-br from-[#00A3C4]/10 via-background to-background p-8 overflow-hidden hover:border-[#00A3C4]/40 transition-all duration-300">
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#00A3C4]/15 blur-3xl" />
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#00A3C4]/15 text-[#00A3C4] group-hover:scale-110 transition-transform duration-300">
                <Search className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Smart Search & Sync</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-sm">
                Fetch metadata, abstracts, and citations instantly via DOI or title search.
              </p>
            </div>

            {/* PDF Engine */}
            <div className="group relative rounded-3xl border border-border/60 bg-gradient-to-br from-[#5B4CFF]/8 via-background to-background p-8 overflow-hidden hover:border-[#5B4CFF]/40 transition-all duration-300">
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-[#5B4CFF]/10 blur-3xl" />
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#5B4CFF]/15 text-[#5B4CFF] group-hover:scale-110 transition-transform duration-300">
                <FileText className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Advanced PDF Engine</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-sm">
                Highlight, annotate, and sync your research PDFs across devices seamlessly.
              </p>
            </div>

            {/* Notebook — Large card */}
            <div className="group relative lg:col-span-2 rounded-3xl border border-border/60 bg-gradient-to-br from-[#00A3C4]/10 via-background to-background p-8 overflow-hidden hover:border-[#00A3C4]/40 transition-all duration-300">
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#00A3C4]/15 blur-3xl" />
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#00A3C4]/15 text-[#00A3C4] group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Dedicated Notebook</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-md">
                Turn highlights and annotations into structured academic writing. Your thinking, organized. Your ideas, connected.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Rich Text Editor', 'Tables & Lists', 'Export PDF & DOCX'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#00A3C4]/25 bg-[#00A3C4]/8 px-3 py-1 text-xs font-medium text-[#00A3C4]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Paply */}
      <section id="why-us" className="relative py-24 px-4 scroll-mt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5B4CFF]/3 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for modern researchers
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Transparent, secure, and designed with academic workflows in mind.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Open-Source & Transparent',
                desc: 'No hidden tracking, no lock-ins. Built for the research community.',
                color: '#5B4CFF',
              },
              {
                icon: Shield,
                title: 'Privacy-First Security',
                desc: 'Your library is encrypted and accessible only to you.',
                color: '#00A3C4',
              },
              {
                icon: Database,
                title: 'Generous Free Storage',
                desc: '500MB free — enough for 250+ research papers.',
                color: '#5B4CFF',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group relative rounded-3xl border border-border/60 bg-card/50 p-8 hover:border-border transition-all duration-300 overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(400px circle at 50% 0%, ${color}10, transparent 60%)` }}
                />
                <div
                  className="flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative py-24 px-4 scroll-mt-24 border-t border-border/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From search to synthesis
            </h2>
            <p className="mt-4 text-muted-foreground">
              A seamless research workflow in four steps.
            </p>
          </div>

          <div className="relative">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Upload, step: '01', label: 'Import', text: 'Upload a PDF or search by DOI.' },
                { icon: FolderOpen, step: '02', label: 'Organize', text: 'Tag and categorize effortlessly.' },
                { icon: Highlighter, step: '03', label: 'Annotate', text: 'Highlight and add contextual notes.' },
                { icon: PenLine, step: '04', label: 'Synthesize', text: 'Generate summaries and build your thesis.' },
              ].map(({ icon: Icon, step, label, text }, i) => (
                <div key={label} className="group flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-[#5B4CFF]/30 bg-[#5B4CFF]/10 text-[#5B4CFF] group-hover:border-[#5B4CFF]/60 group-hover:bg-[#5B4CFF]/15 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Icon className="size-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-[#5B4CFF] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h4 className="mt-5 font-semibold text-base">{label}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 px-4 scroll-mt-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl overflow-hidden border border-[#5B4CFF]/30 bg-gradient-to-br from-[#5B4CFF]/15 via-background to-[#00A3C4]/15 p-12 text-center shadow-2xl">
            {/* Glow effects */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#5B4CFF]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-[#00A3C4]/20 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5B4CFF]/30 bg-[#5B4CFF]/10 px-4 py-1.5 text-xs font-medium text-[#5B4CFF] mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B4CFF] animate-pulse" />
                Join researchers already using Paply
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
                Ready to upgrade your<br />
                <span className="bg-gradient-to-r from-[#5B4CFF] to-[#00A3C4] bg-clip-text text-transparent">
                  research workflow?
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                Simplify literature reviews and boost your productivity with Paply.
              </p>

              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="mt-8 min-w-[220px] h-12 rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-xl shadow-[#5B4CFF]/30 text-base gap-2"
                >
                  Create Free Account
                  <ArrowRight className="size-4" />
                </Button>
              </SignInButton>

              <p className="mt-4 text-xs text-muted-foreground">
                No credit card required · 500MB free storage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5B4CFF]/40 to-transparent" />

        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#5B4CFF] to-[#00A3C4] bg-clip-text text-transparent">
                Paply
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Open-source, AI-powered reference manager built for modern researchers.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Made with ❤️ for the research community.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Why Us', href: '#why-us' },
                  { label: 'Open Source', href: 'https://github.com/itsjay2004/paply', external: true },
                ].map(({ label, href, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      className="hover:text-[#5B4CFF] transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#cta" className="hover:text-[#5B4CFF] transition-colors">Terms of Service</a></li>
                <li><a href="#cta" className="hover:text-[#5B4CFF] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Contact</h4>
              <p className="text-sm text-muted-foreground">Questions or feedback?</p>
              <a
                href="mailto:itsjaybauri233@gmail.com"
                className="mt-2 inline-block text-sm font-medium text-[#00A3C4] hover:text-[#00c5ef] transition-colors"
              >
                itsjaybauri1233@gmail.com
              </a>
              <div className="mt-5">
                <a
                  href="https://github.com/itsjay2004/paply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <Github className="size-4" />
                  GitHub
                </a>
              </div>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Paply. All rights reserved.</p>
            <p>Built for researchers, by a researcher.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
