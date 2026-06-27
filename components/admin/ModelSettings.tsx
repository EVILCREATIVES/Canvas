'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

export interface AdminSettingsData {
  modelName: string;
  imageModel: string;
  videoModel: string;
  aiRules: string | null;
  systemPrompt: string | null;
}

export default function ModelSettings({
  initial,
}: {
  initial: AdminSettingsData;
}) {
  const [settings, setSettings] = useState<AdminSettingsData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof AdminSettingsData, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelName">Text Model</Label>
            <Input
              id="modelName"
              value={settings.modelName}
              onChange={(e) => update('modelName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageModel">Image Model</Label>
            <Input
              id="imageModel"
              value={settings.imageModel}
              onChange={(e) => update('imageModel', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoModel">Video Model</Label>
            <Input
              id="videoModel"
              value={settings.videoModel}
              onChange={(e) => update('videoModel', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={settings.systemPrompt ?? ''}
            onChange={(e) => update('systemPrompt', e.target.value)}
            className="min-h-[120px]"
            placeholder="Base instructions for the AI screenwriter..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aiRules">AI Rules</Label>
          <Textarea
            id="aiRules"
            value={settings.aiRules ?? ''}
            onChange={(e) => update('aiRules', e.target.value)}
            className="min-h-[120px]"
            placeholder="Content rules and constraints the AI must follow..."
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
          {saved && <span className="text-sm text-green-400">Saved!</span>}
        </div>
      </CardContent>
    </Card>
  );
}
