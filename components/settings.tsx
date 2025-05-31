"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { User, DiscIcon as Display, Music, Cloud, Shield, Download, Upload, Trash2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Settings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoSync: true,
    performanceMode: true,
    defaultZoom: 125,
    autoScroll: false,
    metronome: true,
    backupEnabled: true,
    cloudSync: false,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl bg-[#fff9f0]">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Customize your MusicSheet Pro experience</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center space-x-2">
            <Display className="w-4 h-4" />
            <span>Display</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Music className="w-4 h-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Sync & Backup</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Musician" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div>
                <Label htmlFor="instrument">Primary Instrument</Label>
                <Select defaultValue="guitar">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guitar">Guitar</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="violin">Violin</SelectItem>
                    <SelectItem value="drums">Drums</SelectItem>
                    <SelectItem value="vocals">Vocals</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Enable dark theme for better low-light viewing</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting("darkMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSync">Auto Sync</Label>
                  <p className="text-sm text-gray-500">Automatically sync changes across devices</p>
                </div>
                <Switch
                  id="autoSync"
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => updateSetting("autoSync", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Default Zoom Level</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[settings.defaultZoom]}
                    onValueChange={(value) => updateSetting("defaultZoom", value[0])}
                    max={200}
                    min={50}
                    step={25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>50%</span>
                    <span className="font-medium">{settings.defaultZoom}%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="pageLayout">Page Layout</Label>
                <Select defaultValue="single">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Page</SelectItem>
                    <SelectItem value="facing">Facing Pages</SelectItem>
                    <SelectItem value="continuous">Continuous Scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fontSize">Annotation Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xlarge">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="performanceMode">Enhanced Performance Mode</Label>
                  <p className="text-sm text-gray-500">Optimize interface for live performances</p>
                </div>
                <Switch
                  id="performanceMode"
                  checked={settings.performanceMode}
                  onCheckedChange={(checked) => updateSetting("performanceMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoScroll">Auto Scroll</Label>
                  <p className="text-sm text-gray-500">Automatically scroll through pages during performance</p>
                </div>
                <Switch
                  id="autoScroll"
                  checked={settings.autoScroll}
                  onCheckedChange={(checked) => updateSetting("autoScroll", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="metronome">Built-in Metronome</Label>
                  <p className="text-sm text-gray-500">Enable metronome for practice sessions</p>
                </div>
                <Switch
                  id="metronome"
                  checked={settings.metronome}
                  onCheckedChange={(checked) => updateSetting("metronome", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Next page/song</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">→ or Space</code>
                </div>
                <div className="flex justify-between">
                  <span>Previous page/song</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">←</code>
                </div>
                <div className="flex justify-between">
                  <span>Zoom in</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl + +</code>
                </div>
                <div className="flex justify-between">
                  <span>Zoom out</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl + -</code>
                </div>
                <div className="flex justify-between">
                  <span>Exit performance mode</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Esc</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cloudSync">Enable Cloud Sync</Label>
                  <p className="text-sm text-gray-500">Sync your library across all devices</p>
                </div>
                <Switch
                  id="cloudSync"
                  checked={settings.cloudSync}
                  onCheckedChange={(checked) => updateSetting("cloudSync", checked)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Library
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="backupEnabled">Automatic Local Backup</Label>
                  <p className="text-sm text-gray-500">Create local backups of your library</p>
                </div>
                <Switch
                  id="backupEnabled"
                  checked={settings.backupEnabled}
                  onCheckedChange={(checked) => updateSetting("backupEnabled", checked)}
                />
              </div>
              <div>
                <Label htmlFor="backupLocation">Backup Location</Label>
                <div className="flex mt-2 space-x-2">
                  <Input readOnly value="/Documents/MusicSheet Pro/Backups" />
                  <Button variant="outline">Browse</Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>Last backup: Today at 3:45 PM</p>
                <p>Backup size: 2.4 GB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Library Size</span>
                  <span className="text-sm text-gray-500">1.2 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Songs</span>
                  <span className="text-sm text-gray-500">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cache Size</span>
                  <span className="text-sm text-gray-500">156 MB</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset App
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import/Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Supported Formats</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["PDF", "PNG", "JPG", "GP5", "GPX", "MusicXML", "MIDI"].map((format) => (
                    <span key={format} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Files
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Library
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Version</span>
                <span>2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span>20240115</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span>Web</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span>January 15, 2024</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
