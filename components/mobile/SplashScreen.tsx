'use client';

import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Показываем splash screen 1.5 секунды
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-logo text-white text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">TenderCRM</h1>
        <p className="text-white/80 text-sm">Мобильная версия</p>
      </div>
    </div>
  );
}
