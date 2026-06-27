import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiRules, aiSettings } from "@/lib/db/schema";

import { AdminSettingsForm } from "./AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold">Admin only</h1>
      </section>
    );
  }
  const [settings, rules] = await Promise.all([
    db.select().from(aiSettings).where(eq(aiSettings.scope, "global")),
    db.select().from(aiRules),
  ]);
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">AI settings</h1>
      <p className="mt-2 text-zinc-400 text-sm">
        These values are stored in <code>ai_settings</code> and <code>ai_rules</code>{" "}
        and are read at request time, so changes take effect immediately for
        every project.
      </p>
      <AdminSettingsForm settings={settings} rules={rules} />
    </section>
  );
}
