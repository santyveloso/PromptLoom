import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Here you could send to an error tracking service like Sentry
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Here you could send to an error tracking service like Sentry
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-red-200 shadow-lg p-6 max-w-md w-full text-center">
            <div className="text-red-500 text-5xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This could be due to a temporary issue.
            </p>
            <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded overflow-auto max-h-32">
              {error?.message || 'Unknown error'}
            </p>
            <button
              onClick={resetError}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
