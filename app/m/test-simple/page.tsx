'use client';

import { useEffect, useState } from 'react';

export default function TestSimplePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`${time}: ${msg}`, ...prev].slice(0, 20));
    console.log(msg);
  };

  useEffect(() => {
    addLog(`Начальный статус: ${navigator.onLine ? 'ОНЛАЙН' : 'ОФЛАЙН'}`);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      addLog('🟢 Событие: ОНЛАЙН');
      setIsOnline(true);
    };

    const handleOffline = () => {
      addLog('🔴 Событие: ОФЛАЙН');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Проверяем каждую секунду
    const interval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        addLog(`⚠️ Статус изменился: ${currentStatus ? 'ОНЛАЙН' : 'ОФЛАЙН'}`);
        setIsOnline(currentStatus);
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔍 Простой тест офлайн</h1>
        
        {/* Большой индикатор */}
        <div className={`p-8 rounded-lg mb-6 text-center ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <div className="text-6xl mb-4">
            {isOnline ? '🟢' : '🔴'}
          </div>
          <div className="text-white text-3xl font-bold">
            {isOnline ? 'ОНЛАЙН' : 'ОФЛАЙН'}
          </div>
          <div className="text-white text-sm mt-2">
            navigator.onLine = {String(navigator.onLine)}
          </div>
        </div>

        {/* Инструкция */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">📋 Инструкция:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Смотрите на индикатор выше</li>
            <li>Включите авиарежим на телефоне</li>
            <li>Индикатор должен стать КРАСНЫМ 🔴</li>
            <li>Выключите авиарежим</li>
            <li>Индикатор должен стать ЗЕЛЁНЫМ 🟢</li>
          </ol>
        </div>

        {/* Логи */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs">
          <div className="font-bold mb-2">ЛОГИ:</div>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        {/* Кнопки */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              addLog('🔄 Проверка статуса...');
              addLog(`navigator.onLine = ${navigator.onLine}`);
            }}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            🔄 Проверить статус
          </button>
          <button
            onClick={() => {
              setLogs([]);
              addLog('🗑️ Логи очищены');
            }}
            className="bg-gray-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            🗑️ Очистить логи
          </button>
        </div>
      </div>
    </div>
  );
}
