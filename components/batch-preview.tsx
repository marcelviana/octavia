"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createContent } from "@/lib/content-service";

interface SongItem {
  title: string;
  body: string;
  artist: string;
  include: boolean;
}

interface BatchPreviewProps {
  songs: SongItem[];
  contentType: string;
  onComplete: (contents: any[]) => void;
  onBack: () => void;
}

export function BatchPreview({
  songs: initialSongs,
  contentType,
  onComplete,
  onBack,
}: BatchPreviewProps) {
  const [songs, setSongs] = useState<SongItem[]>(initialSongs);
  const [isImporting, setIsImporting] = useState(false);

  const typeMap: Record<string, { type: string; key: string }> = {
    "Lyrics Sheet": { type: "lyrics", key: "lyrics" },
    "Chord Chart": { type: "chord_chart", key: "chords" },
    "Guitar Tablature": { type: "tablature", key: "tablature" },
    lyrics: { type: "lyrics", key: "lyrics" },
    chord_chart: { type: "chord_chart", key: "chords" },
    tablature: { type: "tablature", key: "tablature" },
  };

  const handleImport = async () => {
    const selected = songs.filter((s) => s.include);
    if (selected.length === 0) return;
    setIsImporting(true);
    try {
      const created = [];
      for (const song of selected) {
        const mapping = typeMap[contentType];
        if (!mapping) {
          toast.error("Invalid content type");
          continue;
        }
        const item = await createContent({
          title: song.title,
          artist: song.artist || null,
          content_type: mapping.type,
          content_data: { [mapping.key]: song.body.trim() },
        } as any);
        created.push(item);
      }
      toast.success(`${created.length} songs imported successfully`);
      onComplete(created);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import songs");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {songs.map((song, idx) => (
        <Card key={idx} className="space-y-2">
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={song.include}
                onCheckedChange={(v) =>
                  setSongs((prev) =>
                    prev.map((s, i) =>
                      i === idx ? { ...s, include: !!v } : s,
                    ),
                  )
                }
              />
              <Input
                value={song.title}
                onChange={(e) =>
                  setSongs((prev) =>
                    prev.map((s, i) =>
                      i === idx ? { ...s, title: e.target.value } : s,
                    ),
                  )
                }
                className="font-medium"
              />
            </div>
            <div className="mt-2">
              <Input
                placeholder="Artist"
                value={song.artist}
                onChange={(e) =>
                  setSongs((prev) =>
                    prev.map((s, i) =>
                      i === idx ? { ...s, artist: e.target.value } : s,
                    ),
                  )
                }
              />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <Textarea
              className="font-mono whitespace-pre"
              value={song.body}
              rows={4}
              onChange={(e) =>
                setSongs((prev) =>
                  prev.map((s, i) =>
                    i === idx ? { ...s, body: e.target.value } : s,
                  ),
                )
              }
            />
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          Back
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="bg-black text-white"
        >
          {isImporting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          )}
          Import All
        </Button>
      </div>
    </div>
  );
}
