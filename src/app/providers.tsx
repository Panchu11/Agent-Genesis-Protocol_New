'use client';

import React, { useEffect, useState } from 'react';
import { initDatabase } from '@/services/db.service';
import { UserProvider } from '@/contexts/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize database. Please try refreshing the page.');
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p>Initializing application...</p>
      </div>
    );
  }

  return <UserProvider>{children}</UserProvider>;
}
