"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Edit,
  MoreVertical,
  Star,
  Clock,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getContentTypeColors } from "@/types/content";

interface Props {
  content: any[];
  loading: boolean;
  onSelect: (c: any) => void;
  onEdit: (c: any) => void;
  onDelete: (c: any) => void;
  onToggleFavorite: (c: any) => void;
  getContentIcon: (type: string) => React.ReactNode;
  formatDate: (d: string) => string;
}

export function LibraryList({
  content,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  getContentIcon,
  formatDate,
}: Props) {
  // Handle empty state
  if (content.length === 0 && !loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No content found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Your library is empty. Add some content to get started with your music collection.
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add your first content
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-t-amber-600 border-amber-200 rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Loading your library...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if we should use dynamic height for small lists
  const isSmallList = content.length <= 4;

  return (
    <div className="relative">
      <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea 
            className={`divide-y divide-amber-100 ${
              isSmallList 
                ? 'h-auto max-h-[400px] sm:max-h-[450px] md:max-h-[500px]' 
                : 'h-[70vh] sm:h-[70vh] md:h-[72vh]'
            }`}
          >
            {content.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-4 hover:bg-amber-50 transition-colors border-b border-yellow-100"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {(() => {
                      const colors = getContentTypeColors(item.content_type);
                      return (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                          {getContentIcon(item.content_type)}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Content Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md"
                    onClick={() => onSelect(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${item.title} by ${item.artist || 'Unknown Artist'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {item.title}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-[#A69B8E] mt-0.5">
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {item.artist || "Unknown Artist"}
                          </span>
                          {item.album && (
                            <>
                              <span className="mx-1 hidden sm:inline">•</span>
                              <span className="truncate max-w-[100px] sm:max-w-none hidden sm:inline">
                                {item.album}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Mobile: Show album on second line if it exists */}
                        {item.album && (
                          <div className="text-xs text-[#A69B8E] truncate mt-0.5 sm:hidden">
                            {item.album}
                          </div>
                        )}

                        {/* Mobile: Show badges and metadata in a compact row */}
                        <div className="flex items-center gap-1.5 mt-2 sm:hidden">
                          {item.key && (
                            <Badge
                              variant="outline"
                              className="bg-white text-xs px-1.5 py-0.5"
                            >
                              {item.key}
                            </Badge>
                          )}
                          {item.difficulty && (
                            <Badge
                              className={`text-xs px-1.5 py-0.5 ${item.difficulty === "Beginner" ? "bg-green-100 text-green-800 border-green-200" : item.difficulty === "Intermediate" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-red-100 text-red-800 border-red-200"}`}
                            >
                              {item.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Desktop: Badges and metadata */}
                      <div className="hidden sm:flex items-center space-x-2 ml-4">
                        {item.key && (
                          <Badge variant="outline" className="bg-white">
                            {item.key}
                          </Badge>
                        )}
                        {item.difficulty && (
                          <Badge
                            className={
                              item.difficulty === "Beginner"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : item.difficulty === "Intermediate"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {item.difficulty}
                          </Badge>
                        )}
                      </div>

                      {/* Desktop: Date */}
                      <div className="hidden md:flex items-center text-sm text-[#A69B8E] ml-4">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(item.created_at)}
                      </div>

                      {/* Favorite Star Button */}
                      <div className="flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 hover:bg-amber-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item);
                          }}
                          aria-label={`${item.is_favorite ? 'Remove from' : 'Add to'} favorites`}
                          aria-pressed={item.is_favorite}
                        >
                          <Star 
                            className={`w-4 h-4 transition-colors ${
                              item.is_favorite 
                                ? "text-amber-500 fill-amber-500" 
                                : "text-gray-400 hover:text-amber-500"
                            }`} 
                          />
                        </Button>
                      </div>

                      {/* Actions Menu */}
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item);
                              }}
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                              }}
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
