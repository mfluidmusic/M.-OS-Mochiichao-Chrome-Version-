import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useGameStore } from './useGameStore';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReboot = () => {
    // Reset critical UI state
    useGameStore.setState((state) => ({ ui: { ...state.ui, active_menu: "none" } }));
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-white p-8">
           <div className="w-full max-w-2xl border border-red-500 bg-red-900/20 p-8 rounded-2xl flex flex-col gap-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <h1 className="text-3xl font-bold text-red-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">SYSTEM FAILURE DETECTED</h1>
              <p className="text-red-300">The M. OS experienced a critical crash.</p>
              
              <div className="bg-black/50 p-4 rounded text-red-400 text-xs font-mono overflow-auto max-h-40 border border-red-500/30">
                 {this.state.error?.toString()}
              </div>
              
              <button 
                 onClick={this.handleReboot}
                 className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest rounded transition-colors uppercase border border-red-400 w-full"
              >
                 Initiate Safe Reboot
              </button>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}
