import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 bg-slate-900 border border-red-500/50 rounded-2xl shadow-2xl shadow-red-500/10">
            <h2 className="text-xl font-bold text-red-500 mb-2">
              Application Render Crash Detected
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              An unhandled exception occurred in the frontend render lifecycle:
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-60 overflow-auto mb-4 font-mono text-xs text-amber-400 whitespace-pre-wrap break-all">
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && (
                <span className="block mt-2 text-[10px] text-slate-500">
                  {this.state.errorInfo.componentStack}
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
