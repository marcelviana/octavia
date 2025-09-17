"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Display, Palette } from "lucide-react";

interface DisplaySettingsProps {
  settings: {
    darkMode: boolean;
    defaultZoom: number;
    autoScroll: boolean;
    performanceMode: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

export function DisplaySettings({ settings, onUpdate }: DisplaySettingsProps) {
  return (
    <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
        <CardTitle className="flex items-center text-amber-800">
          <Display className="w-5 h-5 mr-2" />
          Display & Theme
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Dark Mode</Label>
            <p className="text-xs text-gray-500">Switch to dark theme</p>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(checked) => onUpdate("darkMode", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Zoom Level</Label>
          <div className="px-2">
            <Slider
              value={[settings.defaultZoom]}
              onValueChange={([value]) => onUpdate("defaultZoom", value)}
              max={200}
              min={50}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span className="font-medium">{settings.defaultZoom}%</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Auto Scroll</Label>
            <p className="text-xs text-gray-500">Automatically scroll during performance</p>
          </div>
          <Switch
            checked={settings.autoScroll}
            onCheckedChange={(checked) => onUpdate("autoScroll", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Performance Mode</Label>
            <p className="text-xs text-gray-500">Optimized display for live performance</p>
          </div>
          <Switch
            checked={settings.performanceMode}
            onCheckedChange={(checked) => onUpdate("performanceMode", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}