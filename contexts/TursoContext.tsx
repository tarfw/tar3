import React, { createContext, useContext, useEffect, useState } from 'react';

interface TursoContextType {
  isTursoConfigured: boolean;
  tursoUrl: string | undefined;
  tursoAuthToken: string | undefined;
}

const TursoContext = createContext<TursoContextType | undefined>(undefined);

export function TursoProvider({ children }: { children: React.ReactNode }) {
  const [isTursoConfigured, setIsTursoConfigured] = useState(false);
  const [tursoUrl, setTursoUrl] = useState<string | undefined>(undefined);
  const [tursoAuthToken, setTursoAuthToken] = useState<string | undefined>(undefined);

  // For now, we're not configuring Turso since we removed the local-first system
  // But we keep the context structure for compatibility
  useEffect(() => {
    // Reset to unconfigured state since we removed the local-first functionality
    setIsTursoConfigured(false);
    setTursoUrl(undefined);
    setTursoAuthToken(undefined);
  }, []);

  return (
    <TursoContext.Provider value={{ isTursoConfigured, tursoUrl, tursoAuthToken }}>
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