"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedMetadataFieldsProps {
  key: string;
  bpm: string;
  difficulty: string;
  capo: string;
  tuning: string;
  timeSignature: string;
  isFavorite: boolean;
  tags: string[];
  onChange: (field: string, value: string | boolean | string[]) => void;
}

export function AdvancedMetadataFields({
  key,
  bpm,
  difficulty,
  capo,
  tuning,
  timeSignature,
  isFavorite,
  tags,
  onChange
}: AdvancedMetadataFieldsProps) {
  const difficulties = ["Beginner", "Intermediate", "Advanced"];
  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="key" className="text-sm font-medium">
            Key
          </Label>
          <Select value={key} onValueChange={(value) => onChange("key", value)}>
            <SelectTrigger className="border-amber-200 focus:border-amber-400">
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent>
              {keys.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bpm" className="text-sm font-medium">
            BPM
          </Label>
          <Input
            id="bpm"
            type="number"
            value={bpm}
            onChange={(e) => onChange("bpm", e.target.value)}
            placeholder="120"
            className="border-amber-200 focus:border-amber-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty" className="text-sm font-medium">
            Difficulty
          </Label>
          <Select value={difficulty} onValueChange={(value) => onChange("difficulty", value)}>
            <SelectTrigger className="border-amber-200 focus:border-amber-400">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capo" className="text-sm font-medium">
            Capo
          </Label>
          <Input
            id="capo"
            type="number"
            value={capo}
            onChange={(e) => onChange("capo", e.target.value)}
            placeholder="Fret number"
            className="border-amber-200 focus:border-amber-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tuning" className="text-sm font-medium">
            Tuning
          </Label>
          <Input
            id="tuning"
            value={tuning}
            onChange={(e) => onChange("tuning", e.target.value)}
            placeholder="Standard (EADGBE)"
            className="border-amber-200 focus:border-amber-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeSignature" className="text-sm font-medium">
          Time Signature
        </Label>
        <Input
          id="timeSignature"
          value={timeSignature}
          onChange={(e) => onChange("timeSignature", e.target.value)}
          placeholder="4/4"
          className="border-amber-200 focus:border-amber-400"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="favorite"
          checked={isFavorite}
          onCheckedChange={(checked) => onChange("isFavorite", !!checked)}
        />
        <Label htmlFor="favorite" className="text-sm font-medium">
          Mark as favorite
        </Label>
      </div>
    </>
  );
}