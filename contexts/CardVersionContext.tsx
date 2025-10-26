'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type CardVersion = 'original' | 'new' | 'ultimate';

interface CardVersionContextType {
  cardVersion: CardVersion;
  setCardVersion: (version: CardVersion) => void;
}

const CardVersionContext = createContext<CardVersionContextType | undefined>(undefined);

export function CardVersionProvider({ children }: { children: ReactNode }) {
  const [cardVersion, setCardVersionState] = useState<CardVersion>('ultimate');

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem('cardVersion') as CardVersion;
    if (saved && ['original', 'new', 'ultimate'].includes(saved)) {
      setCardVersionState(saved);
    }
  }, []);

  // Сохранение в localStorage при изменении
  const setCardVersion = (version: CardVersion) => {
    setCardVersionState(version);
    localStorage.setItem('cardVersion', version);
  };

  return (
    <CardVersionContext.Provider value={{ cardVersion, setCardVersion }}>
      {children}
    </CardVersionContext.Provider>
  );
}

export function useCardVersion() {
  const context = useContext(CardVersionContext);
  if (!context) {
    throw new Error('useCardVersion must be used within CardVersionProvider');
  }
  return context;
}
