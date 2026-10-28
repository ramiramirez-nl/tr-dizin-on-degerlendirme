import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';

interface EBState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          fontFamily: 'sans-serif', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '480px' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1.5rem', background: '#2563eb', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in HTML');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
