'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, pipe to your logging service (e.g. Sentry)
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-6 text-sm text-muted-foreground">{this.state.message}</p>
          <Button variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
