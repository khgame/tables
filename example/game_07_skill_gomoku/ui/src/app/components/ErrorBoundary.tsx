import React from 'react';

type ErrorBoundaryProps = React.PropsWithChildren<{ fallback?: React.ReactNode }>;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; message?: string }>{
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="rounded-2xl border border-red-400/30 bg-red-950/10 text-red-200 p-6 max-w-xl w-full">
              <h2 className="font-bold text-lg">界面发生错误</h2>
              <p className="mt-2 text-sm break-words">{this.state.message}</p>
              <button
                type="button"
                className="mt-4 rounded-full bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 text-sm"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children as React.ReactNode;
  }
}
