"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Cloud, Download, Upload, RefreshCw } from "lucide-react";

interface CloudSettingsProps {
  settings: {
    autoSync: boolean;
    cloudSync: boolean;
    backupEnabled: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

export function CloudSettings({ settings, onUpdate }: CloudSettingsProps) {
  const handleBackup = () => {
    // Backup logic would go here
    console.log("Creating backup...");
  };

  const handleRestore = () => {
    // Restore logic would go here
    console.log("Restoring from backup...");
  };

  const handleSync = () => {
    // Sync logic would go here
    console.log("Syncing data...");
  };

  return (
    <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
        <CardTitle className="flex items-center text-blue-800">
          <Cloud className="w-5 h-5 mr-2" />
          Cloud & Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Auto Sync</Label>
            <p className="text-xs text-gray-500">Automatically sync changes</p>
          </div>
          <Switch
            checked={settings.autoSync}
            onCheckedChange={(checked) => onUpdate("autoSync", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Cloud Sync</Label>
            <p className="text-xs text-gray-500">Sync data to cloud storage</p>
          </div>
          <Switch
            checked={settings.cloudSync}
            onCheckedChange={(checked) => onUpdate("cloudSync", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Automatic Backup</Label>
            <p className="text-xs text-gray-500">Create automatic backups</p>
          </div>
          <Switch
            checked={settings.backupEnabled}
            onCheckedChange={(checked) => onUpdate("backupEnabled", checked)}
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={handleBackup}
              className="flex items-center justify-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Upload className="w-4 h-4" />
              <span>Backup</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleRestore}
              className="flex items-center justify-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
              <span>Restore</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleSync}
              className="flex items-center justify-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Now</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}