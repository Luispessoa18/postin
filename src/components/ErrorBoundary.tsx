import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled application error', error, info.componentStack);
  }

  handleReset = () => {
    localStorage.removeItem('appState');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-center p-8">
          <h1 className="text-2xl font-bold text-slate-200 mb-4">Algo deu errado</h1>
          <p className="text-slate-400 mb-6 max-w-md">
            Ocorreu um erro inesperado ao carregar o aplicativo. Tente recarregar a página ou redefinir os dados salvos localmente.
          </p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-xl font-bold">
              Recarregar
            </button>
            <button onClick={this.handleReset} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold">
              Redefinir dados locais
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
