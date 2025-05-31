"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, FileText, Guitar, Clock, Star, Play, Plus, Calendar, Users } from "lucide-react"

interface DashboardProps {
  onNavigate: (screen: string) => void
  onSelectContent?: (content: any) => void
  onEnterPerformance?: () => void
}

export function Dashboard({ onNavigate, onSelectContent, onEnterPerformance }: DashboardProps) {
  const recentContent = [
    { id: 1, title: "Hotel California", type: "Guitar Tab", artist: "Eagles", lastOpened: "2 hours ago" },
    { id: 2, title: "Bohemian Rhapsody", type: "Sheet Music", artist: "Queen", lastOpened: "1 day ago" },
    { id: 3, title: "Wonderwall", type: "Chord Chart", artist: "Oasis", lastOpened: "2 days ago" },
    { id: 4, title: "Stairway to Heaven", type: "Guitar Tab", artist: "Led Zeppelin", lastOpened: "3 days ago" },
  ]

  const upcomingGigs = [
    { id: 1, name: "Coffee Shop Session", date: "Today, 7:00 PM", songs: 12 },
    { id: 2, name: "Wedding Reception", date: "Saturday, 2:00 PM", songs: 25 },
    { id: 3, name: "Open Mic Night", date: "Next Monday, 8:00 PM", songs: 8 },
  ]

  const stats = [
    { label: "Total Songs", value: "247", icon: Music },
    { label: "Setlists", value: "12", icon: FileText },
    { label: "Practice Hours", value: "156", icon: Clock },
    { label: "Favorites", value: "34", icon: Star },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Ready to make some music?</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={onEnterPerformance}>
            <Play className="w-4 h-4 mr-2" />
            Quick Performance
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Content</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("library")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectContent?.(item)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {item.type === "Guitar Tab" && <Guitar className="w-5 h-5 text-blue-600" />}
                      {item.type === "Sheet Music" && <Music className="w-5 h-5 text-blue-600" />}
                      {item.type === "Chord Chart" && <FileText className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.artist}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{item.type}</Badge>
                    <p className="text-xs text-gray-500 mt-1">{item.lastOpened}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Gigs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("setlists")}>
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingGigs.map((gig) => (
                <div key={gig.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{gig.name}</p>
                      <p className="text-sm text-gray-500">{gig.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <Music className="w-4 h-4 mr-1" />
                      {gig.songs} songs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="w-6 h-6" />
              <span>Create Lyrics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Guitar className="w-6 h-6" />
              <span>Chord Chart</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Music className="w-6 h-6" />
              <span>New Setlist</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>Band Practice</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
