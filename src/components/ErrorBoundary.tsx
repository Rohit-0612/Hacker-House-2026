"use client";

import { Component, type ReactNode } from "react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a render crash in the generator from taking out the whole page. React
 * has no hook equivalent for this, so it stays a class component.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center"
      >
        <h2 className="font-display text-xl font-bold">Something broke on our side</h2>
        <p className="text-sm text-muted">
          The generator hit an unexpected error. Reloading usually clears it.
        </p>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </div>
    );
  }
}
