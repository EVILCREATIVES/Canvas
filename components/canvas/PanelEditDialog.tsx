'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, Video } from 'lucide-react';

export interface PanelData {
  id: string;
  orderIndex: number;
  imageUrl: string | null;
  prompt: string;
  status: string;
}

interface PanelEditDialogProps {
  panel: PanelData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate?: (panelId: string, prompt: string) => Promise<void> | void;
  onApprove?: (panelId: string) => Promise<void> | void;
  onGenerateVideo?: (panelId: string) => Promise<void> | void;
}

export default function PanelEditDialog({
  panel,
  open,
  onOpenChange,
  onRegenerate,
  onApprove,
  onGenerateVideo,
}: PanelEditDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const currentPrompt = prompt || panel?.prompt || '';

  const run = async (key: string, fn?: () => Promise<void> | void) => {
    if (!fn) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  if (!panel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Panel #{panel.orderIndex + 1}
            <Badge
              variant={
                panel.status === 'approved'
                  ? 'success'
                  : panel.status === 'generating'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {panel.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Edit the prompt, regenerate the image, or export this panel to video.
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center">
          {panel.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={panel.imageUrl}
              alt={`Panel ${panel.orderIndex + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center text-zinc-600 p-6">
              <div className="text-4xl mb-2">🎨</div>
              <p className="text-sm">No image generated yet</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <Textarea
            value={currentPrompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe what should appear in this panel..."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => run('regen', () => onRegenerate?.(panel.id, currentPrompt))}
            disabled={busy !== null}
          >
            {busy === 'regen' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
          {panel.status !== 'approved' && (
            <Button
              variant="secondary"
              onClick={() => run('approve', () => onApprove?.(panel.id))}
              disabled={busy !== null}
            >
              {busy === 'approve' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
          )}
          <Button
            onClick={() => run('video', () => onGenerateVideo?.(panel.id))}
            disabled={busy !== null}
          >
            {busy === 'video' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Video className="mr-2 h-4 w-4" />
            )}
            Export to Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
