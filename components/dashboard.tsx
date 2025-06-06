"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserContent, getUserStats } from "@/lib/content-service"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { AlertCircle, Music, FileText, Clock, Plus, Loader2 } from "lucide-react"
import Link from "next/link"

type ContentItem = {
  id: string
  title: string
  content_type: string
  created_at: string
  updated_at: string
  is_favorite: boolean
}

type UserStats = {
  totalContent: number
  totalSetlists: number
  favoriteContent: number
  recentlyViewed: number
}

interface DashboardProps {
  onNavigate: (screen: string) => void
  onSelectContent: (content: ContentItem) => void
  onEnterPerformance: () => void
}

export function Dashboard({ onNavigate, onSelectContent, onEnterPerformance }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [recentContent, setRecentContent] = useState<ContentItem[]>([])
  const [favoriteContent, setFavoriteContent] = useState<ContentItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isInitialized) {
        console.log("Auth not initialized yet, waiting...")
        return
      }

      if (!user) {
        console.log("User not authenticated, redirecting to login")
        router.push("/login")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log("Loading dashboard data for user:", user.id)

        // Load content and stats in parallel
        const [contentData, statsData] = await Promise.all([getUserContent(), getUserStats()])

        // Process content
        const content = contentData || []

          // Sort by date descending
          const sortedContent = [...content].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )

          setRecentContent(sortedContent.slice(0, 5))
          setFavoriteContent(content.filter((item: ContentItem) => item.is_favorite).slice(0, 5))
        
        // Process stats
        setStats(statsData)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, router, isInitialized])

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Sheet Music":
        return <Music className="h-4 w-4" />
      case "Guitar Tab":
        return <FileText className="h-4 w-4" />
      case "Lyrics":
        return <FileText className="h-4 w-4" />
      case "Chord Chart":
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (isLoading && !recentContent.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/add-content">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            <Plus className="mr-2 h-4 w-4" /> Add Content
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border border-amber-200 p-1 rounded-xl shadow-md">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg"
          >
            Recent
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-lg"
          >
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Content</CardTitle>
                <CardDescription>All your music content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats?.totalContent || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Favorites</CardTitle>
                <CardDescription>Your favorite content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats?.favoriteContent || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Setlists</CardTitle>
                <CardDescription>Your created setlists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats?.totalSetlists || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
            <CardHeader>
              <CardTitle>Recently Viewed</CardTitle>
              <CardDescription>Items you've accessed recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats?.recentlyViewed || 0}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
            <CardHeader>
              <CardTitle>Recently Updated</CardTitle>
              <CardDescription>Your most recently updated content</CardDescription>
            </CardHeader>
            <CardContent>
              {recentContent.length > 0 ? (
                <div className="space-y-4">
                  {recentContent.map((item) => (
                    <Link key={item.id} href={`/content/${item.id}`}>
                      <div className="flex items-center justify-between p-3 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 rounded-full">{getContentIcon(item.content_type)}</div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">{(item.content_type || '').replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(item.updated_at)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-2 opacity-30" />
                  <p>No recent content found</p>
                  <Link href="/add-content" className="mt-4">
                    <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                      <Plus className="mr-2 h-4 w-4" /> Add Your First Content
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-100 shadow-md">
            <CardHeader>
              <CardTitle>Favorites</CardTitle>
              <CardDescription>Your favorite music content</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteContent.length > 0 ? (
                <div className="space-y-4">
                  {favoriteContent.map((item) => (
                    <Link key={item.id} href={`/content/${item.id}`}>
                      <div className="flex items-center justify-between p-3 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 rounded-full">{getContentIcon(item.content_type)}</div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">{(item.content_type || '').replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(item.updated_at)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-2 opacity-30" />
                  <p>No favorites found</p>
                  <p className="text-sm mt-1">Mark content as favorite to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
