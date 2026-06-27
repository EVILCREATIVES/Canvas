'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Save } from 'lucide-react';

interface ScriptViewerProps {
  content: string;
  onSave?: (content: string) => void;
  editable?: boolean;
}

export default function ScriptViewer({
  content,
  onSave,
  editable = true,
}: ScriptViewerProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Script</CardTitle>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editing) onSave?.(value);
              setEditing(!editing);
            }}
          >
            {editing ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Save
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        ) : content ? (
          <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300">
            {content}
          </pre>
        ) : (
          <p className="text-sm text-zinc-500">
            No script generated yet. Use the canvas AI editor to create one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
