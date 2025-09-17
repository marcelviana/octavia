"use client";

import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

interface CompletionStepProps {
  title: string;
  subtitle: string;
  secondaryLabel: string;
  onNavigate: (destination: string) => void;
}

export function CompletionStep({
  title,
  subtitle,
  secondaryLabel,
  onNavigate
}: CompletionStepProps) {
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">🎉 Done! Your music is now part of your library.</h1>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-1">{title}</p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">{subtitle}</p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => onNavigate("add-content")}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 px-4 py-2 text-sm"
            >
              {secondaryLabel}
            </Button>
            <Button
              onClick={() => onNavigate("library")}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 text-sm shadow"
            >
              Go to Library
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}