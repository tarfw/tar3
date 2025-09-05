import React, { createContext, useContext, useEffect, useState } from 'react';

interface TursoContextType {
  isTursoConfigured: boolean;
  tursoUrl: string | undefined;
  tursoAuthToken: string | undefined;
  configureTurso: (url: string, authToken: string) => void;
  clearTursoConfig: () => void;
}

const TursoContext = createContext<TursoContextType | undefined>(undefined);

export function TursoProvider({ children }: { children: React.ReactNode }) {
  const [isTursoConfigured, setIsTursoConfigured] = useState(false);
  const [tursoUrl, setTursoUrl] = useState<string | undefined>(undefined);
  const [tursoAuthToken, setTursoAuthToken] = useState<string | undefined>(undefined);

  // Configure Turso with URL and auth token
  const configureTurso = (url: string, authToken: string) => {
    setTursoUrl(url);
    setTursoAuthToken(authToken);
    setIsTursoConfigured(true);
  };

  // Clear Turso configuration
  const clearTursoConfig = () => {
    setTursoUrl(undefined);
    setTursoAuthToken(undefined);
    setIsTursoConfigured(false);
  };

  return (
    <TursoContext.Provider value={{ 
      isTursoConfigured, 
      tursoUrl, 
      tursoAuthToken,
      configureTurso,
      clearTursoConfig
    }}>
      {children}
    </TursoContext.Provider>
  );
}

export function useTurso() {
  const context = useContext(TursoContext);
  if (context === undefined) {
    throw new Error('useTurso must be used within a TursoProvider');
  }
  return context;
}