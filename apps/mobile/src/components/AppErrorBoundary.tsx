import React from 'react';
import { SystemStateLayout } from './system';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

/** Penpot 74 — error boundary global. */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn('[AppErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SystemStateLayout
          penpotFrame="79_Error_Generico"
          icon="warning-outline"
          glowColor="#FF5C5C60"
          title="Algo salió mal"
          body="Ocurrió un error inesperado. Reintentá o reiniciá la app."
          primaryLabel="Reintentar"
          onPrimary={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
