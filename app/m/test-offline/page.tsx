'use client';

import { useEffect, useState } from 'react';
import { offlineSupabase } from '@/lib/offline-supabase';
import { offlineDB } from '@/lib/offline-db';

export default function TestOfflinePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [swStatus, setSWStatus] = useState('Проверка...');
  const [dbStatus, setDBStatus] = useState('Проверка...');
  const [cacheStatus, setCacheStatus] = useState('Проверка...');
  const [dataStatus, setDataStatus] = useState('Проверка...');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    addLog('🔍 Начинаем диагностику офлайн-режима...');

    // 1. Проверка Service Worker
    addLog('1️⃣ Проверка Service Worker...');
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          setSWStatus(`✅ Зарегистрирован (${registrations.length})`);
          addLog(`✅ Service Worker зарегистрирован: ${registrations[0].active?.scriptURL}`);
          addLog(`   Статус: ${registrations[0].active?.state}`);
        } else {
          setSWStatus('❌ Не зарегистрирован');
          addLog('❌ Service Worker НЕ зарегистрирован');
        }
      } catch (error) {
        setSWStatus('❌ Ошибка');
        addLog(`❌ Ошибка проверки SW: ${error}`);
      }
    } else {
      setSWStatus('❌ Не поддерживается');
      addLog('❌ Service Worker не поддерживается браузером');
    }

    // 2. Проверка IndexedDB
    addLog('2️⃣ Проверка IndexedDB...');
    try {
      await offlineDB.init();
      setDBStatus('✅ Инициализирован');
      addLog('✅ IndexedDB инициализирован');

      // Проверяем данные
      const tenders = await offlineDB.getAll('tenders');
      const suppliers = await offlineDB.getAll('suppliers');
      const expenses = await offlineDB.getAll('expenses');
      const pending = await offlineDB.getPendingChanges();

      addLog(`   Тендеров в кэше: ${tenders.length}`);
      addLog(`   Поставщиков в кэше: ${suppliers.length}`);
      addLog(`   Расходов в кэше: ${expenses.length}`);
      addLog(`   Несинхронизированных: ${pending.length}`);

      if (tenders.length > 0 || suppliers.length > 0 || expenses.length > 0) {
        setDataStatus(`✅ Есть данные (T:${tenders.length} S:${suppliers.length} E:${expenses.length})`);
      } else {
        setDataStatus('⚠️ Нет данных');
        addLog('⚠️ В IndexedDB нет данных - нужна предзагрузка');
      }
    } catch (error) {
      setDBStatus('❌ Ошибка');
      addLog(`❌ Ошибка IndexedDB: ${error}`);
    }

    // 3. Проверка Cache Storage
    addLog('3️⃣ Проверка Cache Storage...');
    try {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        setCacheStatus(`✅ Активен (${cacheNames.length} кэшей)`);
        addLog(`✅ Cache Storage активен:`);
        cacheNames.forEach(name => addLog(`   - ${name}`));

        // Проверяем содержимое основного кэша
        const mainCache = cacheNames.find(name => name.includes('tendercrm'));
        if (mainCache) {
          const cache = await caches.open(mainCache);
          const keys = await cache.keys();
          addLog(`   Закэшировано ресурсов: ${keys.length}`);
        }
      } else {
        setCacheStatus('⚠️ Пустой');
        addLog('⚠️ Cache Storage пустой');
      }
    } catch (error) {
      setCacheStatus('❌ Ошибка');
      addLog(`❌ Ошибка Cache Storage: ${error}`);
    }

    // 4. Проверка онлайн/офлайн
    addLog('4️⃣ Проверка статуса сети...');
    const isOnline = navigator.onLine;
    addLog(`${isOnline ? '🟢' : '🔴'} Статус: ${isOnline ? 'ОНЛАЙН' : 'ОФЛАЙН'}`);

    // 5. Тест загрузки данных
    addLog('5️⃣ Тест загрузки данных через offlineSupabase...');
    try {
      const testTenders = await offlineSupabase.getTenders();
      addLog(`✅ Загружено тендеров: ${testTenders.length}`);
      if (testTenders.length > 0) {
        addLog(`   Первый тендер: ${testTenders[0].name || testTenders[0].id}`);
      }
    } catch (error) {
      addLog(`❌ Ошибка загрузки данных: ${error}`);
    }

    addLog('✅ Диагностика завершена');
  };

  const testOfflineMode = async () => {
    addLog('🧪 ТЕСТ: Симуляция офлайн-режима...');
    
    // Отключаем сеть программно (только для теста)
    addLog('⚠️ Включите авиарежим вручную и нажмите "Тест загрузки офлайн"');
  };

  const testOfflineLoad = async () => {
    addLog('🧪 ТЕСТ: Загрузка данных офлайн...');
    
    try {
      const tenders = await offlineSupabase.getTenders();
      addLog(`${tenders.length > 0 ? '✅' : '❌'} Загружено тендеров: ${tenders.length}`);
      
      const suppliers = await offlineSupabase.getSuppliers();
      addLog(`${suppliers.length > 0 ? '✅' : '❌'} Загружено поставщиков: ${suppliers.length}`);
      
      const expenses = await offlineSupabase.getExpenses();
      addLog(`${expenses.length > 0 ? '✅' : '❌'} Загружено расходов: ${expenses.length}`);

      if (tenders.length === 0 && suppliers.length === 0 && expenses.length === 0) {
        addLog('❌ ПРОБЛЕМА: Нет данных в IndexedDB!');
        addLog('💡 Решение: Откройте приложение с интернетом сначала');
      } else {
        addLog('✅ Офлайн-режим работает!');
      }
    } catch (error) {
      addLog(`❌ Ошибка: ${error}`);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Удалить все данные? (для теста)')) return;
    
    addLog('🗑️ Очистка всех данных...');
    try {
      await offlineSupabase.clearAllData();
      addLog('✅ Данные очищены');
      
      // Очищаем кэш
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      addLog('✅ Кэш очищен');
      
      // Удаляем SW
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      addLog('✅ Service Worker удалён');
      
      addLog('✅ Всё очищено. Перезагрузите страницу.');
    } catch (error) {
      addLog(`❌ Ошибка очистки: ${error}`);
    }
  };

  const forcePreload = async () => {
    addLog('📥 Принудительная предзагрузка данных...');
    try {
      const tenders = await offlineSupabase.getTenders();
      addLog(`✅ Загружено и закэшировано тендеров: ${tenders.length}`);
      
      const suppliers = await offlineSupabase.getSuppliers();
      addLog(`✅ Загружено и закэшировано поставщиков: ${suppliers.length}`);
      
      const expenses = await offlineSupabase.getExpenses();
      addLog(`✅ Загружено и закэшировано расходов: ${expenses.length}`);
      
      addLog('✅ Предзагрузка завершена. Теперь можно работать офлайн!');
      
      // Обновляем статус
      runDiagnostics();
    } catch (error) {
      addLog(`❌ Ошибка предзагрузки: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔧 Диагностика офлайн-режима</h1>
        
        {/* Статус */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Service Worker</div>
            <div className="font-semibold">{swStatus}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">IndexedDB</div>
            <div className="font-semibold">{dbStatus}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Cache Storage</div>
            <div className="font-semibold">{cacheStatus}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Данные</div>
            <div className="font-semibold">{dataStatus}</div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={runDiagnostics}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            🔄 Повторить диагностику
          </button>
          <button
            onClick={forcePreload}
            className="bg-green-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            📥 Предзагрузить данные
          </button>
          <button
            onClick={testOfflineLoad}
            className="bg-orange-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            🧪 Тест загрузки офлайн
          </button>
          <button
            onClick={clearAllData}
            className="bg-red-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            🗑️ Очистить всё
          </button>
        </div>

        {/* Логи */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>

        {/* Инструкции */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">📋 Инструкция по тестированию:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Откройте эту страницу с интернетом</li>
            <li>Нажмите "Предзагрузить данные" (если данных нет)</li>
            <li>Убедитесь что все статусы зелёные ✅</li>
            <li>Включите авиарежим на телефоне</li>
            <li>Нажмите "Тест загрузки офлайн"</li>
            <li>Если данные загрузились - офлайн работает! ✅</li>
            <li>Если нет - смотрите логи для диагностики ❌</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
