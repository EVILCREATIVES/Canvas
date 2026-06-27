import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  PenTool,
  Film,
  Layers,
  Wand2,
  Video,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: PenTool,
    title: 'AI Script Writing',
    description:
      'Type a single idea and watch it expand into a fully formatted cinematic script.',
  },
  {
    icon: Layers,
    title: 'Automatic Shot Lists',
    description:
      'Your script is broken into detailed scenes, locations, and shots automatically.',
  },
  {
    icon: Wand2,
    title: 'Characters & Style',
    description:
      'Generate consistent character descriptions, locations, and a cohesive visual style.',
  },
  {
    icon: Film,
    title: 'Storyboard Panels',
    description:
      '12-16 storyboard panels rendered straight onto an infinite, zoomable canvas.',
  },
  {
    icon: Video,
    title: 'Panel to Video',
    description:
      'Edit or regenerate any panel, then convert your approved frames into motion.',
  },
  {
    icon: Sparkles,
    title: 'Infinite Canvas',
    description:
      'Pan, zoom, and arrange everything on a limitless creative workspace.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-lg">Canvas</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              Blog
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          AI-powered storyboarding, end to end
        </div>
        <h1 className="max-w-3xl text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          From a single idea to a full{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            storyboard
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          Canvas is an infinite, free workspace for storytellers. Write an idea,
          and AI generates the script, shot list, characters, style, and a full
          storyboard — ready to turn into video.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/register">
            <Button size="lg">
              Start creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need to tell your story
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-indigo-500/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-600/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to bring your story to life?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join Canvas and start storyboarding with AI today — completely free.
          </p>
          <Link href="/register">
            <Button size="lg">
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span>Canvas</span>
        </div>
        <p>© {new Date().getFullYear()} Canvas. Built for storytellers.</p>
      </footer>
    </div>
  );
}
