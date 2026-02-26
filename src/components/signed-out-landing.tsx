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
} from 'lucide-react';
import { useEffect, useState } from "react";


export function SignedOutLanding() {
  const { resolvedTheme, setTheme } = useTheme();

  const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 10);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(91,76,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,76,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#5B4CFF]/10 via-transparent to-[#00A3C4]/10" />

{/* Floating Glass Navbar */}
<div className="sticky top-6 z-50 px-4">
  <div className="mx-auto max-w-6xl">
    <header className="relative flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-background/60 px-6 shadow-2xl backdrop-blur-xl">

      {/* Subtle Gradient Border Glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#5B4CFF]/20 via-transparent to-[#00A3C4]/20 opacity-60 blur-xl" />

      {/* Logo */}
      <Image
        src="/logo/logo-full.png"
        alt="Paply"
        width={120}
        height={40}
        className="size-24 rounded-lg object-contain"
        priority
      />

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Theme Toggle */}
        <div className="flex items-center rounded-xl border border-border/50 bg-background/50 p-1 backdrop-blur-md">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
              resolvedTheme === 'light'
                ? 'bg-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sun className="size-4" />
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
              (resolvedTheme ?? 'dark') === 'dark'
                ? 'bg-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Moon className="size-4" />
          </button>
        </div>

        {/* Sign In Button */}
        <SignInButton mode="modal">
          <Button className="rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-lg shadow-[#5B4CFF]/30 px-6">
            Sign in
          </Button>
        </SignInButton>

      </div>
    </header>
  </div>
</div>

      {/* Hero */}
      <section className="relative px-4 pt-32 sm:pt-36 pb-32 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-[#5B4CFF] to-[#00A3C4] bg-clip-text text-transparent">
            Research Without Friction
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paply is the modern AI-powered reference manager built for serious researchers. 
            Organize, annotate, and synthesize your work in one intelligent workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-5">
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="min-w-[220px] text-base rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-xl shadow-[#5B4CFF]/30 gap-2"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>

            <Button
              size="lg"
              variant="outline"
              className="min-w-[220px] rounded-xl border-[#00A3C4]/40 hover:bg-[#00A3C4]/10 hover:text-slate-900 dark:hover:text-white gap-2"
              asChild
            >
              <a href="https://github.com/itsjay2004/paply" target="_blank">
                <Github className="size-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Glow Orbs */}
        <div className="absolute -top-20 -left-20 h-72 w-72 bg-[#5B4CFF]/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 h-72 w-72 bg-[#00A3C4]/20 blur-3xl rounded-full" />
      </section>


      {/* Core Features */}
<section id="features" className="relative py-28 px-4 overflow-hidden scroll-mt-24">
  <div className="absolute inset-0 bg-gradient-to-br from-[#5B4CFF]/5 via-transparent to-[#00A3C4]/5" />
  <div className="relative mx-auto max-w-6xl">
    <div className="text-center mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Everything you need in one workspace
      </h2>
      <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
        Powerful research tools designed for serious academic work.
      </p>
    </div>

    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          icon: Search,
          title: 'Smart Search & Sync',
          desc: 'Fetch metadata, abstracts, and citations instantly via DOI or title.',
        },
        {
          icon: Sparkles,
          title: 'AI-Powered Insights',
          desc: 'Generate contextual summaries covering methods and conclusions.',
        },
        {
          icon: FileText,
          title: 'Advanced PDF Engine',
          desc: 'Highlight, annotate, and sync your research across devices.',
        },
        {
          icon: BookOpen,
          title: 'Dedicated Notebook',
          desc: 'Turn highlights into structured academic writing.',
        },
      ].map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="group rounded-3xl border border-border/60 bg-background/70 backdrop-blur-xl p-8 shadow-md hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#5B4CFF]/10 text-[#5B4CFF] group-hover:bg-[#5B4CFF] group-hover:text-white group-hover:scale-110 transition-all duration-300">
            <Icon className="size-6" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">{title}</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* Why Paply */}
<section id="why-us" className="relative py-28 px-4 scroll-mt-24">
  <div className="mx-auto max-w-6xl">
    <div className="text-center mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold">
        Built for modern researchers
      </h2>
      <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
        Transparent, secure, and designed with academic workflows in mind.
      </p>
    </div>

    <div className="grid gap-8 md:grid-cols-3">
      {[
        {
          icon: Lock,
          title: 'Open-Source & Transparent',
          desc: 'No hidden tracking, no lock-ins. Built for the research community.',
        },
        {
          icon: Shield,
          title: 'Privacy-First Security',
          desc: 'Your library is encrypted and accessible only to you.',
        },
        {
          icon: Database,
          title: 'Generous Free Storage',
          desc: '500MB free — enough for 250+ research papers.',
        },
      ].map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="group relative rounded-3xl p-8 bg-gradient-to-br from-[#5B4CFF]/10 to-[#00A3C4]/10 border border-border backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] group-hover:scale-110 group-hover:bg-[#00A3C4]/25 transition-all duration-300">
            <Icon className="size-6" />
          </div>
          <h3 className="mt-6 font-semibold text-lg">{title}</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* Workflow */}
<section id="workflow" className="relative py-28 px-4 border-t border-border/50 scroll-mt-24">
  <div className="mx-auto max-w-5xl">
    <div className="text-center mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold">
        From search to synthesis
      </h2>
      <p className="mt-4 text-muted-foreground">
        A seamless research workflow in four steps.
      </p>
    </div>

    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 text-center">
      {[
        { icon: Upload, step: 'Import', text: 'Upload a PDF or search by DOI.' },
        { icon: FolderOpen, step: 'Organize', text: 'Tag and categorize effortlessly.' },
        { icon: Highlighter, step: 'Annotate', text: 'Highlight and add contextual notes.' },
        { icon: PenLine, step: 'Synthesize', text: 'Generate summaries and build your thesis.' },
      ].map(({ icon: Icon, step, text }) => (
        <div key={step} className="relative group">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#5B4CFF]/15 text-[#5B4CFF] ring-4 ring-[#5B4CFF]/10 shadow-lg group-hover:scale-110 group-hover:ring-[#5B4CFF]/25 transition-all duration-300">
            <Icon className="size-7" />
          </div>
          <h4 className="mt-6 font-semibold text-lg">{step}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* CTA */}
      <section id="cta" className="px-4 pb-28 scroll-mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl p-12 bg-gradient-to-br from-[#5B4CFF]/15 to-[#00A3C4]/15 border border-border backdrop-blur-xl shadow-xl">
            <h2 className="text-3xl font-bold">
              Ready to upgrade your research workflow?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Simplify literature reviews and boost your productivity with Paply.
            </p>

            <SignInButton mode="modal">
              <Button
                size="lg"
                className="mt-8 min-w-[240px] rounded-xl bg-[#5B4CFF] hover:bg-[#4a3de0] shadow-xl shadow-[#5B4CFF]/30"
              >
                Create Free Account
              </Button>
            </SignInButton>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · 500MB free storage
            </p>
          </div>
        </div>
      </section>

     {/* Footer */}
<footer className="relative border-t border-border/50 bg-background/80 backdrop-blur-xl">
  
  {/* Subtle Top Glow */}
  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#5B4CFF]/60 to-transparent" />

  <div className="mx-auto max-w-6xl px-4 py-16">
    
    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* Brand */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-[#5B4CFF] to-[#00A3C4] bg-clip-text text-transparent">
        <Image
        src="/logo/logo-full.png"
        alt="Paply"
        width={120}
        height={40}
        className="size-24 rounded-lg object-contain"
        priority
      />
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
        <h4 className="text-sm font-semibold mb-4">Product</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>
            <a href="#features" className="hover:text-[#5B4CFF] transition">
              Features
            </a>
          </li>
          <li>
            <a href="#why-us" className="hover:text-[#5B4CFF] transition">
              Why Us
            </a>
          </li>
          <li>
            <a href="https://github.com/itsjay2004/paply" target="_blank" rel="noopener noreferrer" className="hover:text-[#5B4CFF] transition">
              Open Source
            </a>
          </li>
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Legal</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>
            <a href="#cta" className="hover:text-[#5B4CFF] transition">
              Terms of Service
            </a>
          </li>
          <li>
            <a href="#cta" className="hover:text-[#5B4CFF] transition">
              Privacy Policy
            </a>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Contact</h4>
        <p className="text-sm text-muted-foreground">
          Questions or feedback?
        </p>
        <a
          href="mailto:itsjaybauri233@gmail.com"
          className="mt-3 inline-block text-sm font-medium text-[#00A3C4] hover:text-[#5EE7F7] transition"
        >
          itsjaybauri1233@gmail.com
        </a>

        <div className="mt-6 flex items-center gap-4 text-muted-foreground">
          <a
            href="https://github.com/itsjay2004/paply"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:text-[#5B4CFF] hover:bg-[#5B4CFF]/10 hover:scale-110 transition-all duration-200"
          >
            <Github className="size-5" />
          </a>
        </div>
      </div>
    </div>

    {/* Bottom Row */}
    <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
      <p>
        © {new Date().getFullYear()} Paply. All rights reserved.
      </p>
      <p>
        Built for researchers, by a researcher.
      </p>
    </div>

  </div>
</footer>
    </div>
  );
}
