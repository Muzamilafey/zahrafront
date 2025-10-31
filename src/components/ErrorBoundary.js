import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error){
    return { hasError: true, error };
  }

  componentDidCatch(error, info){
    this.setState({ error, info });
    // you can also log to a remote error service here
    console.error('ErrorBoundary caught', error, info);
  }

  render(){
    if(this.state.hasError){
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
          <div className="mt-3 bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-800">{this.state.error?.message || String(this.state.error)}</div>
            {this.state.info && (
              <details className="mt-3 text-xs text-gray-500"><summary>Details</summary><pre className="whitespace-pre-wrap">{this.state.info.componentStack}</pre></details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
