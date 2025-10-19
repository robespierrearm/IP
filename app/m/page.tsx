'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/m/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm opacity-80">Загрузка...</p>
      </div>
    </div>
  );
}
