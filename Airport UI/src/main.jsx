import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px',
          background: '#08131F',
          color: '#ef4444',
          fontFamily: 'monospace',
          height: '100vh',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ color: '#00f5ff', fontSize: '24px', marginBottom: '16px' }}>
            ⚠️ Application Runtime Error Captured
          </h1>
          <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{
            background: '#0a1929',
            padding: '16px',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            border: '1px solid rgba(0,245,255,0.2)'
          }}>
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
