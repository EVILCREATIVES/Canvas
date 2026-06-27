'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

export interface StyleData {
  style: string | null;
  description: string | null;
  referenceImages: string[] | null;
}

interface StyleSettingsPanelProps {
  projectId: string;
  initial: StyleData;
}

export default function StyleSettingsPanel({
  projectId,
  initial,
}: StyleSettingsPanelProps) {
  const [style, setStyle] = useState(initial.style ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(initial.referenceImages ?? []);
  const [saving, setSaving] = useState(false);

  const addImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/generate-style`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, description, referenceImages: images }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Style</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="style-name">Style name</Label>
          <Input
            id="style-name"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. Cinematic noir, Anime, Watercolor"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="style-desc">Description</Label>
          <Textarea
            id="style-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[140px]"
            placeholder="Describe the color palette, lighting, mood..."
          />
        </div>
        <div className="space-y-2">
          <Label>Reference images</Label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
            />
            <Button type="button" variant="secondary" onClick={addImage}>
              Add
            </Button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Reference ${i + 1}`}
                  className="aspect-square rounded-md object-cover border border-zinc-800"
                />
              ))}
            </div>
          )}
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Style
        </Button>
      </CardContent>
    </Card>
  );
}
