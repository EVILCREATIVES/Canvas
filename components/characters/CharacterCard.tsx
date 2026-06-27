import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CharacterCardData {
  id: string;
  name: string;
  description: string | null;
  referenceImages: string[] | null;
  poseSheetUrl: string | null;
}

export default function CharacterCard({
  character,
}: {
  character: CharacterCardData;
}) {
  const images = character.referenceImages ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{character.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {images.length > 0 ? (
            images.slice(0, 3).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${character.name} reference ${i + 1}`}
                className="aspect-square rounded-md object-cover border border-zinc-800"
              />
            ))
          ) : (
            <div className="col-span-3 aspect-video rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl">
              🧑‍🎨
            </div>
          )}
        </div>
        {character.poseSheetUrl && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">Pose Sheet</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.poseSheetUrl}
              alt={`${character.name} pose sheet`}
              className="w-full rounded-md border border-zinc-800"
            />
          </div>
        )}
        <p className="text-sm text-zinc-400 line-clamp-4">
          {character.description || 'No description yet.'}
        </p>
      </CardContent>
    </Card>
  );
}
