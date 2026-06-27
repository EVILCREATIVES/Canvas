import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
        A collaborative production canvas for storytellers.
      </h1>
      <p className="mt-6 text-lg text-zinc-400">
        Drop in an idea. Canvas turns it into a script, breaks it into a shot
        list, designs characters, locations and styles, generates a 12–16 panel
        storyboard, and animates the approved frames into video. All on an
        infinite canvas you can edit with your team in real time.
      </p>
      <div className="mt-10 flex gap-3">
        <Link
          href="/projects"
          className="rounded-rail bg-canvas-accent px-5 py-3 font-medium text-white hover:opacity-90"
        >
          Open projects
        </Link>
        <Link
          href="/blog"
          className="rounded-rail border border-canvas-border px-5 py-3 font-medium text-zinc-200 hover:bg-canvas-panel"
        >
          Read the blog
        </Link>
      </div>
    </section>
  );
}
