"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisplaySettings } from "./DisplaySettings";
import { CloudSettings } from "./CloudSettings";
import { AudioSettings } from "./AudioSettings";
import { SettingsIcon } from "lucide-react";

export function RefactoredSettings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoSync: true,
    performanceMode: true,
    defaultZoom: 125,
    autoScroll: false,
    metronome: true,
    backupEnabled: true,
    cloudSync: false,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2 text-gray-700" />
            Settings
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Customize your Octavia experience
          </p>
        </div>

        <Tabs defaultValue="display" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-amber-200">
            <TabsTrigger
              value="display"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800"
            >
              Display
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800"
            >
              Audio
            </TabsTrigger>
            <TabsTrigger
              value="cloud"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800"
            >
              Cloud & Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="display" className="space-y-4">
            <DisplaySettings settings={settings} onUpdate={updateSetting} />
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <AudioSettings settings={settings} onUpdate={updateSetting} />
          </TabsContent>

          <TabsContent value="cloud" className="space-y-4">
            <CloudSettings settings={settings} onUpdate={updateSetting} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}