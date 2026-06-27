'use client';

import { use, useCallback, useEffect, useState } from 'react';
import InfiniteCanvas from '@/components/canvas/InfiniteCanvas';
import AITextEditor from '@/components/editor/AITextEditor';
import PanelEditDialog, {
  type PanelData,
} from '@/components/canvas/PanelEditDialog';

interface Panel {
  id: string;
  orderIndex: number;
  imageUrl: string | null;
  prompt: string;
  status: string;
}

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selected, setSelected] = useState<PanelData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadPanels = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/storyboard`);
      if (res.ok) {
        const data = await res.json();
        setPanels(data.panels ?? []);
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    // loadPanels only calls setState after an awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPanels();
  }, [loadPanels]);

  const handlePanelClick = (panel: Panel) => {
    setSelected(panel);
    setDialogOpen(true);
  };

  const regenerate = useCallback(
    async (panelId: string) => {
      await fetch(`/api/panels/${panelId}/regenerate`, { method: 'POST' });
      await loadPanels();
    },
    [loadPanels]
  );

  const approve = useCallback(
    async (panelId: string) => {
      await fetch(`/api/panels/${panelId}/approve`, { method: 'POST' });
      await loadPanels();
    },
    [loadPanels]
  );

  const generateVideo = useCallback(async (panelId: string) => {
    await fetch(`/api/panels/${panelId}/generate-video`, { method: 'POST' });
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* AI Editor panel */}
      <div className="w-[350px] shrink-0 p-3">
        <AITextEditor
          projectId={projectId}
          onStoryboardGenerated={loadPanels}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <InfiniteCanvas
          projectId={projectId}
          panels={panels}
          onPanelClick={handlePanelClick}
          onPanelRegenerate={regenerate}
          onPanelApprove={approve}
          className="h-full w-full"
        />
      </div>

      <PanelEditDialog
        panel={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRegenerate={(pid) => regenerate(pid)}
        onApprove={approve}
        onGenerateVideo={generateVideo}
      />
    </div>
  );
}
