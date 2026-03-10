import React from 'react';

interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: string },
  State
> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #ff1744',
          borderRadius: 8,
          padding: '16px 20px',
          color: '#ff1744',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          maxWidth: 700,
          width: '100%',
        }}>
          ⚠️ {this.props.fallback ?? '組件載入失敗'}: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}
