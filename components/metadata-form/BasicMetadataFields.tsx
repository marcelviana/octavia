"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicMetadataFieldsProps {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  notes: string;
  onChange: (field: string, value: string) => void;
}

export function BasicMetadataFields({
  title,
  artist,
  album,
  genre,
  year,
  notes,
  onChange
}: BasicMetadataFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title *
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Enter song title"
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="artist" className="text-sm font-medium">
          Artist *
        </Label>
        <Input
          id="artist"
          value={artist}
          onChange={(e) => onChange("artist", e.target.value)}
          placeholder="Enter artist name"
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="album" className="text-sm font-medium">
            Album
          </Label>
          <Input
            id="album"
            value={album}
            onChange={(e) => onChange("album", e.target.value)}
            placeholder="Enter album name"
            className="border-amber-200 focus:border-amber-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre" className="text-sm font-medium">
            Genre
          </Label>
          <Input
            id="genre"
            value={genre}
            onChange={(e) => onChange("genre", e.target.value)}
            placeholder="Enter genre"
            className="border-amber-200 focus:border-amber-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year" className="text-sm font-medium">
          Year
        </Label>
        <Input
          id="year"
          type="number"
          value={year}
          onChange={(e) => onChange("year", e.target.value)}
          placeholder="Enter year"
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Add any additional notes or comments"
          className="border-amber-200 focus:border-amber-400 min-h-[80px]"
        />
      </div>
    </>
  );
}