'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StoryboardPanel {
  id: string;
  orderIndex: number;
  imageUrl: string | null;
  prompt: string;
  status: string;
}

interface InfiniteCanvasProps {
  projectId: string;
  panels?: StoryboardPanel[];
  onPanelClick?: (panel: StoryboardPanel) => void;
  onPanelRegenerate?: (panelId: string) => void;
  onPanelApprove?: (panelId: string) => void;
  className?: string;
}

export default function InfiniteCanvas({
  panels = [],
  onPanelClick,
  onPanelRegenerate,
  onPanelApprove,
  className,
}: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.1), 5),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setTransform((prev) => ({
      ...prev,
      x: dragStart.current!.tx + (e.clientX - dragStart.current!.x),
      y: dragStart.current!.ty + (e.clientY - dragStart.current!.y),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const PANEL_WIDTH = 320;
  const PANEL_HEIGHT = 220;
  const COLS = 4;
  const GAP = 32;

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative overflow-hidden bg-zinc-950 cursor-default select-none',
        isDragging && 'cursor-grabbing',
        className
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
          backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      />

      {/* Canvas content */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {panels.length === 0 ? (
          <div className="flex items-center justify-center w-[800px] h-[400px]">
            <div className="text-center text-zinc-600">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-xl font-medium">
                Your storyboard will appear here
              </p>
              <p className="text-sm mt-2">
                Use the AI editor on the left to get started
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative"
            style={{
              width: COLS * (PANEL_WIDTH + GAP) + GAP,
              height:
                Math.ceil(panels.length / COLS) * (PANEL_HEIGHT + GAP) + GAP,
            }}
          >
            {panels.map((panel, idx) => {
              const col = idx % COLS;
              const row = Math.floor(idx / COLS);
              const x = GAP + col * (PANEL_WIDTH + GAP);
              const y = GAP + row * (PANEL_HEIGHT + GAP);
              return (
                <div
                  key={panel.id}
                  className="absolute bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden group cursor-pointer hover:border-indigo-500 transition-colors"
                  style={{
                    left: x,
                    top: y,
                    width: PANEL_WIDTH,
                    height: PANEL_HEIGHT,
                  }}
                  onClick={() => onPanelClick?.(panel)}
                >
                  {/* Panel number */}
                  <div className="absolute top-2 left-2 z-10 bg-zinc-950/80 rounded px-2 py-1 text-xs text-zinc-400">
                    #{idx + 1}
                  </div>

                  {/* Panel status badge */}
                  <div
                    className={cn(
                      'absolute top-2 right-2 z-10 rounded px-2 py-1 text-xs',
                      panel.status === 'approved'
                        ? 'bg-green-600/80 text-white'
                        : panel.status === 'generated'
                        ? 'bg-blue-600/80 text-white'
                        : panel.status === 'generating'
                        ? 'bg-yellow-600/80 text-white'
                        : 'bg-zinc-700/80 text-zinc-300'
                    )}
                  >
                    {panel.status}
                  </div>

                  {/* Image */}
                  {panel.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={panel.imageUrl}
                      alt={`Panel ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      {panel.status === 'generating' ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500">Generating...</p>
                        </div>
                      ) : (
                        <div className="text-center px-4">
                          <div className="text-3xl mb-2">🎨</div>
                          <p className="text-xs text-zinc-500 line-clamp-3">
                            {panel.prompt}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPanelRegenerate?.(panel.id);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium"
                    >
                      Regenerate
                    </button>
                    {panel.status !== 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPanelApprove?.(panel.id);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              scale: Math.min(prev.scale * 1.2, 5),
            }))
          }
          className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center text-xs"
        >
          ⌂
        </button>
        <button
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              scale: Math.max(prev.scale * 0.8, 0.1),
            }))
          }
          className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-center text-lg font-bold"
        >
          −
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-600 bg-zinc-900/50 px-2 py-1 rounded">
        {Math.round(transform.scale * 100)}% · Alt+drag to pan · Scroll to zoom
      </div>
    </div>
  );
}
