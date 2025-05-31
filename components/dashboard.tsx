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
    <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1F36]">Welcome back!</h1>
          <p className="text-[#A69B8E]">Ready to make some music?</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={onEnterPerformance} className="bg-[#FF6B6B] hover:bg-[#E55555] text-white">
            <Play className="w-4 h-4 mr-2" />
            Quick Performance
          </Button>
          <Button variant="outline" className="border-[#2E7CE4] text-[#2E7CE4] hover:bg-[#E8ECF4]">
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
            <Card key={index} className="bg-white border-[#A69B8E] hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#1A1F36]">{stat.value}</p>
                    <p className="text-sm text-[#A69B8E]">{stat.label}</p>
                  </div>
                  <Icon className="w-8 h-8 text-[#2E7CE4]" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <Card className="bg-white border-[#A69B8E]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#1A1F36]">Recent Content</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("library")}
              className="text-[#2E7CE4] hover:bg-[#F2EDE5]"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F2EDE5] cursor-pointer transition-colors"
                  onClick={() => onSelectContent?.(item)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#F2EDE5] rounded-lg flex items-center justify-center">
                      {item.type === "Guitar Tab" && <Guitar className="w-5 h-5 text-[#2E7CE4]" />}
                      {item.type === "Sheet Music" && <Music className="w-5 h-5 text-[#2E7CE4]" />}
                      {item.type === "Chord Chart" && <FileText className="w-5 h-5 text-[#2E7CE4]" />}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1F36]">{item.title}</p>
                      <p className="text-sm text-[#A69B8E]">{item.artist}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-[#F2EDE5] text-[#2E7CE4]">
                      {item.type}
                    </Badge>
                    <p className="text-xs text-[#A69B8E] mt-1">{item.lastOpened}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Gigs */}
        <Card className="bg-white border-[#A69B8E]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#1A1F36]">Upcoming Gigs</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("setlists")}
              className="text-[#2E7CE4] hover:bg-[#F2EDE5]"
            >
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F2EDE5] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#FF6B6B]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1F36]">{gig.name}</p>
                      <p className="text-sm text-[#A69B8E]">{gig.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-[#A69B8E]">
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
      <Card className="bg-white border-[#A69B8E]">
        <CardHeader>
          <CardTitle className="text-[#1A1F36]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
            >
              <FileText className="w-6 h-6" />
              <span>Create Lyrics</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
            >
              <Guitar className="w-6 h-6" />
              <span>Chord Chart</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
            >
              <Music className="w-6 h-6" />
              <span>New Setlist</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
            >
              <Users className="w-6 h-6" />
              <span>Band Practice</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
