'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShotListItem {
  sceneNumber: string;
  location: string;
  timeOfDay: string;
  action: string;
  dialogue: string;
  notes: string;
}

interface AITextEditorProps {
  projectId: string;
  onScriptGenerated?: (script: string) => void;
  onShotListGenerated?: (shotList: ShotListItem[]) => void;
  onStoryboardGenerated?: () => void;
  className?: string;
}

type Step = 'idea' | 'script' | 'shotlist' | 'characters' | 'style' | 'storyboard';

export default function AITextEditor({
  projectId,
  onScriptGenerated,
  onShotListGenerated,
  onStoryboardGenerated,
  className,
}: AITextEditorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('idea');
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState('');
  const [shotList, setShotList] = useState<ShotListItem[]>([]);
  const [style, setStyle] = useState('');
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Enter your story idea here...' }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[120px] text-zinc-200',
      },
    },
  });

  const getIdea = () => editor?.getText() || '';

  const handleGenerateScript = async () => {
    const idea = getIdea();
    if (!idea.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        '/api/projects/' + projectId + '/generate-script',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea }),
        }
      );
      if (!res.ok) throw new Error('Failed to generate script');
      const data = await res.json();
      setScript(data.script);
      setCurrentStep('script');
      onScriptGenerated?.(data.script);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateShotList = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        '/api/projects/' + projectId + '/generate-shotlist',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script }),
        }
      );
      if (!res.ok) throw new Error('Failed to generate shot list');
      const data = await res.json();
      setShotList(data.shotList);
      setCurrentStep('shotlist');
      onShotListGenerated?.(data.shotList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStyle = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        '/api/projects/' + projectId + '/generate-style',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: getIdea() }),
        }
      );
      if (!res.ok) throw new Error('Failed to generate style');
      const data = await res.json();
      setStyle(data.style);
      setCurrentStep('style');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        '/api/projects/' + projectId + '/generate-storyboard',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shotList, style }),
        }
      );
      if (!res.ok) throw new Error('Failed to generate storyboard');
      setCurrentStep('storyboard');
      onStoryboardGenerated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const steps: { id: Step; label: string; number: number }[] = [
    { id: 'idea', label: 'Idea', number: 1 },
    { id: 'script', label: 'Script', number: 2 },
    { id: 'shotlist', label: 'Shot List', number: 3 },
    { id: 'characters', label: 'Characters', number: 4 },
    { id: 'style', label: 'Style', number: 5 },
    { id: 'storyboard', label: 'Storyboard', number: 6 },
  ];

  const stepIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">AI Story Creator</h2>
        {/* Step progress */}
        <div className="flex items-center gap-1 mt-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  idx < stepIdx
                    ? 'bg-indigo-600 text-white'
                    : idx === stepIdx
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                    : 'bg-zinc-800 text-zinc-500'
                )}
              >
                {idx < stepIdx ? '✓' : step.number}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 mx-0.5',
                    idx < stepIdx ? 'bg-indigo-600' : 'bg-zinc-800'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Step: Idea */}
        {currentStep === 'idea' && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">
              Write your story idea or concept below:
            </p>
            <div className="min-h-[120px] rounded-lg border border-zinc-700 bg-zinc-950 p-3 focus-within:ring-1 focus-within:ring-indigo-500">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}

        {/* Step: Script */}
        {currentStep === 'script' && script && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">Generated Script:</p>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {script}
            </div>
          </div>
        )}

        {/* Step: Shot List */}
        {currentStep === 'shotlist' && shotList.length > 0 && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">
              {shotList.length} shots generated:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shotList.map((shot, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-700 bg-zinc-950 p-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-400">
                      Scene {shot.sceneNumber}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {shot.location} · {shot.timeOfDay}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{shot.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Style */}
        {currentStep === 'style' && style && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">Suggested Visual Style:</p>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {style}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              You can edit the style in the Style tab and add reference images.
            </p>
          </div>
        )}

        {/* Step: Storyboard */}
        {currentStep === 'storyboard' && (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🎬</div>
            <p className="text-sm text-zinc-200 font-medium">
              Storyboard Generated!
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Check the canvas for your storyboard panels.
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
        {currentStep === 'idea' && (
          <Button
            onClick={handleGenerateScript}
            disabled={isLoading || !getIdea().trim()}
            className="w-full"
          >
            {isLoading ? 'Generating...' : '✨ Generate Script'}
          </Button>
        )}
        {currentStep === 'script' && (
          <div className="space-y-2">
            <Button
              onClick={handleGenerateShotList}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : '🎬 Generate Shot List'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('idea')}
              className="w-full"
            >
              ← Back to Idea
            </Button>
          </div>
        )}
        {currentStep === 'shotlist' && (
          <div className="space-y-2">
            <Button
              onClick={handleGenerateStyle}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : '🎨 Suggest Style'}
            </Button>
          </div>
        )}
        {currentStep === 'style' && (
          <div className="space-y-2">
            <Button
              onClick={handleGenerateStoryboard}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : '🖼️ Generate Storyboard'}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-indigo-500" />
            AI is working...
          </div>
        )}
      </div>
    </div>
  );
}
