"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { Music, FileText, Clock, Plus, Guitar, Mic } from "lucide-react";
import Link from "next/link";

export type ContentItem = {
  id: string;
  title: string;
  content_type: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
};

export type UserStats = {
  totalContent: number;
  totalSetlists: number;
  favoriteContent: number;
  recentlyViewed: number;
};

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onSelectContent: (content: ContentItem) => void;
  onEnterPerformance: () => void;
  recentContent: ContentItem[];
  favoriteContent: ContentItem[];
  stats: UserStats | null;
}

export function Dashboard({
  onNavigate,
  onSelectContent,
  onEnterPerformance,
  recentContent,
  favoriteContent,
  stats,
}: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Sheet Music":
        return <FileText className="h-4 w-4" />;
      case "Guitar Tab":
        return <Guitar className="h-4 w-4" />;
      case "Lyrics":
        return <Mic className="h-4 w-4" />;
      case "Chord Chart":
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight" aria-label="Dashboard">Dashboard</h1>
        <Link href="/add-content">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            <Plus className="mr-2 h-4 w-4" /> Add Content
          </Button>
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Total Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  {stats?.totalContent || 0}
                </div>
                <p className="text-xs text-amber-600">pieces in your library</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Setlists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  {stats?.totalSetlists || 0}
                </div>
                <p className="text-xs text-amber-600">ready for performance</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  {stats?.favoriteContent || 0}
                </div>
                <p className="text-xs text-amber-600">marked as favorites</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">
                  Recent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  {stats?.recentlyViewed || 0}
                </div>
                <p className="text-xs text-amber-600">viewed recently</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-amber-800">Recent Content</CardTitle>
                <CardDescription className="text-amber-600">
                  Your recently viewed music
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentContent && recentContent.length > 0 ? (
                    recentContent.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        onClick={() => onSelectContent(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectContent(item);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${item.title} content`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            {getContentIcon(item.content_type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.content_type}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent content</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-amber-800">Favorite Content</CardTitle>
                <CardDescription className="text-amber-600">
                  Your starred music pieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favoriteContent && favoriteContent.length > 0 ? (
                    favoriteContent.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        onClick={() => onSelectContent(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectContent(item);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${item.title} content`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            {getContentIcon(item.content_type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.content_type}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-4 h-4 text-amber-500 fill-current">
                            ⭐
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 mx-auto mb-4 text-gray-300">⭐</div>
                      <p>No favorite content</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-amber-800">Recent Content</CardTitle>
              <CardDescription className="text-amber-600">
                Your recently accessed music pieces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentContent && recentContent.length > 0 ? (
                  recentContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                      onClick={() => onSelectContent(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectContent(item);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${item.title} content`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          {getContentIcon(item.content_type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.content_type} • {formatDate(item.updated_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-amber-800">Favorite Content</CardTitle>
              <CardDescription className="text-amber-600">
                Your starred music pieces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {favoriteContent && favoriteContent.length > 0 ? (
                  favoriteContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                      onClick={() => onSelectContent(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectContent(item);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${item.title} content`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          {getContentIcon(item.content_type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.content_type} • {formatDate(item.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-4 h-4 text-amber-500 fill-current">
                          ⭐
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 text-gray-300">⭐</div>
                    <p>No favorite content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
