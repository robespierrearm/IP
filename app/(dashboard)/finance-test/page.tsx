'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FinanceTestPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Финансы и Аналитика 🧪</h1>
        <p className="text-sm text-gray-600 mt-2">Тестовая версия в разработке...</p>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <span className="font-bold">⚠️ В РАЗРАБОТКЕ</span><br/>
          Создаю полноценную версию с аналитикой и графиками.<br/>
          Пока функционал в процессе реализации.
        </p>
      </div>

      <Link href="/accounting" className="text-blue-600 hover:underline">
        ← Вернуться к текущей бухгалтерии
      </Link>
    </div>
  );
}
