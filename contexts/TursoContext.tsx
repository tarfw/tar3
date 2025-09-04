import React, { createContext, useContext, useEffect, useState } from 'react';
import { tursoOptions } from './TursoConfig';

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

  // Poll for Turso configuration changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkTursoConfig = () => {
      const newIsTursoConfigured = Boolean(tursoOptions.url && tursoOptions.authToken);
      if (newIsTursoConfigured !== isTursoConfigured || 
          tursoOptions.url !== tursoUrl || 
          tursoOptions.authToken !== tursoAuthToken) {
        setIsTursoConfigured(newIsTursoConfigured);
        setTursoUrl(tursoOptions.url);
        setTursoAuthToken(tursoOptions.authToken);
      }
    };
    
    // Check immediately
    checkTursoConfig();
    
    // Check every 100ms
    intervalId = setInterval(checkTursoConfig, 100);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTursoConfigured, tursoUrl, tursoAuthToken]);

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