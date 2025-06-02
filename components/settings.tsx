"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  User,
  DiscIcon as Display,
  Music,
  Cloud,
  Shield,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  SettingsIcon,
  Sparkles,
  Palette,
  Volume2,
} from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-base text-gray-600 mt-2">Customize your MusicSheet Pro experience</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-amber-200 p-2 rounded-xl shadow-lg items-center">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg font-medium py-1 flex items-center justify-center"
            >
              <User className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg font-medium py-1 flex items-center justify-center"
            >
              <Display className="w-4 h-4 mr-2" />
              Display
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg font-medium py-1 flex items-center justify-center"
            >
              <Music className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="sync"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg font-medium py-1 flex items-center justify-center"
            >
              <Cloud className="w-4 h-4 mr-2" />
              Sync & Backup
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg font-medium py-1 flex items-center justify-center"
            >
              <Shield className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <User className="w-5 h-5 mr-3" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-base font-medium text-gray-900">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      defaultValue="John"
                      className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-base font-medium text-gray-900">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      defaultValue="Musician"
                      className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-medium text-gray-900">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john@example.com"
                    className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1"
                  />
                </div>
                <div>
                  <Label htmlFor="instrument" className="text-base font-medium text-gray-900">
                    Primary Instrument
                  </Label>
                  <Select defaultValue="guitar">
                    <SelectTrigger className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1">
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

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Sparkles className="w-5 h-5 mr-3" />
                  App Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="darkMode" className="text-base font-medium text-gray-900">
                      Dark Mode
                    </Label>
                    <p className="text-gray-600">Enable dark theme for better low-light viewing</p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting("darkMode", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="autoSync" className="text-base font-medium text-gray-900">
                      Auto Sync
                    </Label>
                    <p className="text-gray-600">Automatically sync changes across devices</p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={settings.autoSync}
                    onCheckedChange={(checked) => updateSetting("autoSync", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Palette className="w-5 h-5 mr-3" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <Label className="text-base font-medium text-gray-900 mb-4 block">Default Zoom Level</Label>
                  <div className="space-y-4">
                    <Slider
                      value={[settings.defaultZoom]}
                      onValueChange={(value) => updateSetting("defaultZoom", value[0])}
                      max={200}
                      min={50}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-gray-600">
                      <span className="font-medium">50%</span>
                      <span className="font-bold text-xl text-amber-600">{settings.defaultZoom}%</span>
                      <span className="font-medium">200%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pageLayout" className="text-base font-medium text-gray-900">
                      Page Layout
                    </Label>
                    <Select defaultValue="single">
                      <SelectTrigger className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1">
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
                    <Label htmlFor="fontSize" className="text-base font-medium text-gray-900">
                      Annotation Font Size
                    </Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base py-1">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Music className="w-5 h-5 mr-3" />
                  Performance Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="performanceMode" className="text-base font-medium text-gray-900">
                      Enhanced Performance Mode
                    </Label>
                    <p className="text-gray-600">Optimize interface for live performances</p>
                  </div>
                  <Switch
                    id="performanceMode"
                    checked={settings.performanceMode}
                    onCheckedChange={(checked) => updateSetting("performanceMode", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="autoScroll" className="text-base font-medium text-gray-900">
                      Auto Scroll
                    </Label>
                    <p className="text-gray-600">Automatically scroll through pages during performance</p>
                  </div>
                  <Switch
                    id="autoScroll"
                    checked={settings.autoScroll}
                    onCheckedChange={(checked) => updateSetting("autoScroll", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="metronome" className="text-base font-medium text-gray-900">
                      Built-in Metronome
                    </Label>
                    <p className="text-gray-600">Enable metronome for practice sessions</p>
                  </div>
                  <Switch
                    id="metronome"
                    checked={settings.metronome}
                    onCheckedChange={(checked) => updateSetting("metronome", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Volume2 className="w-5 h-5 mr-3" />
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { action: "Next page/song", shortcut: "→ or Space" },
                    { action: "Previous page/song", shortcut: "←" },
                    { action: "Zoom in", shortcut: "Ctrl + +" },
                    { action: "Zoom out", shortcut: "Ctrl + -" },
                    { action: "Exit performance mode", shortcut: "Esc" },
                    { action: "Toggle metronome", shortcut: "M" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                    >
                      <span className="font-medium text-gray-900 text-base">{item.action}</span>
                      <code className="bg-white px-3 py-2 rounded-lg border border-amber-300 font-mono text-amber-700 font-bold">
                        {item.shortcut}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Cloud className="w-5 h-5 mr-3" />
                  Cloud Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="cloudSync" className="text-base font-medium text-gray-900">
                      Enable Cloud Sync
                    </Label>
                    <p className="text-gray-600">Sync your library across all devices</p>
                  </div>
                  <Switch
                    id="cloudSync"
                    checked={settings.cloudSync}
                    onCheckedChange={(checked) => updateSetting("cloudSync", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base"
                  >
                    <Upload className="w-5 h-5 mr-3" />
                    Upload Library
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Shield className="w-5 h-5 mr-3" />
                  Local Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div>
                    <Label htmlFor="backupEnabled" className="text-base font-medium text-gray-900">
                      Automatic Local Backup
                    </Label>
                    <p className="text-gray-600">Create local backups of your library</p>
                  </div>
                  <Switch
                    id="backupEnabled"
                    checked={settings.backupEnabled}
                    onCheckedChange={(checked) => updateSetting("backupEnabled", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="backupLocation" className="text-base font-medium text-gray-900">
                    Backup Location
                  </Label>
                  <div className="flex mt-3 space-x-3">
                    <Input
                      readOnly
                      value="/Documents/MusicSheet Pro/Backups"
                      className="border-amber-300 text-base py-1"
                    />
                    <Button
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 text-base"
                    >
                      Browse
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="grid grid-cols-2 gap-3 text-base">
                    <div>
                      <p className="text-green-700 font-medium">Last backup</p>
                      <p className="text-green-900 font-bold">Today at 3:45 PM</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Backup size</p>
                      <p className="text-green-900 font-bold">2.4 GB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Library Size", value: "1.2 GB", color: "blue" },
                    { label: "Total Songs", value: "247", color: "green" },
                    { label: "Cache Size", value: "156 MB", color: "amber" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className={`p-3 bg-gradient-to-r from-${stat.color}-50 to-${stat.color}-100 rounded-xl border border-${stat.color}-200`}
                    >
                      <div className="text-center">
                        <p className={`text-${stat.color}-700 font-medium text-lg`}>{stat.label}</p>
                        <p className={`text-${stat.color}-900 font-bold text-2xl mt-2`}>{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base"
                  >
                    <RefreshCw className="w-5 h-5 mr-3" />
                    Clear Cache
                  </Button>
                  <Button variant="destructive" className="bg-red-500 hover:bg-red-600 py-3 text-base">
                    <Trash2 className="w-5 h-5 mr-3" />
                    Reset App
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Upload className="w-5 h-5 mr-3" />
                  Import/Export
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-base font-medium text-gray-900 mb-4 block">Supported Formats</Label>
                  <div className="flex flex-wrap gap-3">
                    {["PDF", "PNG", "JPG", "GP5", "GPX", "MusicXML", "MIDI"].map((format) => (
                      <span
                        key={format}
                        className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-lg text-amber-700 font-medium text-base"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base"
                  >
                    <Upload className="w-5 h-5 mr-3" />
                    Import Files
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-3 text-base"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Export Library
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Sparkles className="w-5 h-5 mr-3" />
                  App Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Version", value: "2.1.0" },
                    { label: "Build", value: "20240115" },
                    { label: "Platform", value: "Web" },
                    { label: "Last Updated", value: "January 15, 2024" },
                  ].map((info, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                    >
                      <span className="font-medium text-gray-900 text-base">{info.label}</span>
                      <span className="font-bold text-amber-700 text-base">{info.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
