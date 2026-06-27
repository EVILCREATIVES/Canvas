import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ShotListRow {
  id?: string;
  sceneNumber: string | null;
  location: string | null;
  timeOfDay: string | null;
  action: string | null;
  dialogue: string | null;
  notes: string | null;
}

export default function ShotListViewer({ shots }: { shots: ShotListRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shot List ({shots.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {shots.length === 0 ? (
          <p className="text-sm text-zinc-500">No shots generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-3 py-2">Scene</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Dialogue</th>
                </tr>
              </thead>
              <tbody>
                {shots.map((shot, idx) => (
                  <tr
                    key={shot.id ?? idx}
                    className="border-b border-zinc-800/50 align-top"
                  >
                    <td className="px-3 py-2 font-medium text-indigo-400 whitespace-nowrap">
                      {shot.sceneNumber}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{shot.location}</td>
                    <td className="px-3 py-2 text-zinc-400">{shot.timeOfDay}</td>
                    <td className="px-3 py-2 text-zinc-300 max-w-xs">
                      {shot.action}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 max-w-xs">
                      {shot.dialogue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
