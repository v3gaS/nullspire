"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/** Catch R3F/Rapier hard crashes so Deploy doesn't blank the whole tab. */
export class GameErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Nullspire game crash:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d141c] px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
          Signal fault
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-zinc-100">
          Drop aborted
        </h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          {this.state.error.message || "A runtime error stopped the canvas."}
        </p>
        <button
          type="button"
          className="mt-8 rounded border border-teal-400/40 bg-teal-500/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-teal-100 hover:bg-teal-400/30"
          onClick={() => {
            this.setState({ error: null });
            this.props.onReset?.();
          }}
        >
          Retry Deploy
        </button>
      </div>
    );
  }
}
