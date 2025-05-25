import { useEffect, useState } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './ErrorBoundary';
import GlobalErrorHandler from './GlobalErrorHandler';

function App() {
  const [error, setError] = useState<Error | null>(null);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-600">Global Error: {error.message}</p>
    </div>
  )

  return (
    <div>
    <ErrorBoundary>
    <GlobalErrorHandler setError={setError} />
    <ThemeProvider>
      <Outlet />
      <Toaster  richColors />
    </ThemeProvider>
    </ErrorBoundary>
    </div>
  )
}

export default App
