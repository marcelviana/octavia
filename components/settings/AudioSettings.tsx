"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Volume2 } from "lucide-react";

interface AudioSettingsProps {
  settings: {
    metronome: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

export function AudioSettings({ settings, onUpdate }: AudioSettingsProps) {
  return (
    <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
        <CardTitle className="flex items-center text-green-800">
          <Music className="w-5 h-5 mr-2" />
          Audio & Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Built-in Metronome</Label>
            <p className="text-xs text-gray-500">Enable metronome for practice</p>
          </div>
          <Switch
            checked={settings.metronome}
            onCheckedChange={(checked) => onUpdate("metronome", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Audio Output Device</Label>
          <Select defaultValue="default">
            <SelectTrigger className="border-green-200 focus:border-green-400">
              <SelectValue placeholder="Select audio device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Audio Device</SelectItem>
              <SelectItem value="speakers">Built-in Speakers</SelectItem>
              <SelectItem value="headphones">Headphones</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Audio Quality</Label>
          <Select defaultValue="high">
            <SelectTrigger className="border-green-200 focus:border-green-400">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (Faster Loading)</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}