"use client";

import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LibraryError } from '@/types/library';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LibraryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Library Error Boundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-white/80 backdrop-blur-sm border border-red-100 shadow-lg">
          <CardContent className="p-4 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm">
              There was an error loading your music library. Please try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-sm"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default LibraryErrorBoundary;
