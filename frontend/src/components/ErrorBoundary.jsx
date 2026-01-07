import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.group('🚨 ERROR BOUNDARY - Error capturado:');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error detectado</h1>
            <p className="mb-4">Se ha producido un error en la aplicación. Revisa la consola (F12) para más detalles.</p>
            <details className="bg-slate-900 rounded p-4 text-sm">
              <summary className="cursor-pointer font-semibold mb-2">Detalles del error</summary>
              <pre className="overflow-auto text-red-400">
                {this.state.error && this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="overflow-auto text-yellow-400 mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
