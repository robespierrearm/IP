'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Briefcase, Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';
import { isMobileDevice } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      router.push('/m/dashboard');
    }

    // Определяем мобильное устройство
    setIsMobile(isMobileDevice());
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Простая валидация (username = email в мобильной версии)
    if (!username.trim()) {
      setError('Введите email адрес');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Введите пароль');
      setIsLoading(false);
      return;
    }

    // Базовая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }

    try{
      // Вызываем тот же API route что и десктопная версия
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
        credentials: 'include', // Важно для cookies
      });

      // Проверяем что ответ не пустой
      const text = await response.text();
      
      if (!text) {
        throw new Error('Сервер вернул пустой ответ');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Invalid JSON from server:', text);
        throw new Error('Невалидный ответ от сервера');
      }

      if (!response.ok) {
        // Показываем точное сообщение от сервера
        const errorMsg = data.error || 'Ошибка входа';
        
        // Переводим на русский если нужно
        if (errorMsg.includes('Invalid login credentials')) {
          setError('Неверный email или пароль');
        } else if (errorMsg.includes('Email') && errorMsg.includes('password')) {
          setError('Email и пароль обязательны');
        } else {
          setError(errorMsg);
        }
        
        setIsLoading(false);
        return;
      }

      // Сохраняем данные пользователя в localStorage (только для UI)
      // Токен хранится в httpOnly cookie (безопасно)
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // Добавляем лог входа
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: data.user.id,
            username: data.user.username,
            action: 'Вход в систему (мобильная версия)',
            action_type: 'login',
            details: { email: data.user.email }
          });
      } catch (logError) {
        // Не блокируем вход если лог не записался
      }

      // Используем router.push вместо window.location для избежания полной перезагрузки
      router.push('/m/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Обработка сетевых ошибок
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Не удалось подключиться к серверу');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при входе';
        setError(errorMessage);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 flex flex-col">
      {/* Безопасная зона сверху */}
      <div className="safe-top" />

      {/* Контент */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Логотип */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-sm mb-4">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TenderCRM</h1>
          <p className="text-white/80 text-sm flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4" />
            Мобильная версия
          </p>
        </div>

        {/* Форма входа */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Вход в систему
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Логин */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логин
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="Введите логин"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="Введите пароль"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Кнопка входа */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Вход...
                  </span>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            {/* Информация */}
            {isMobile && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 Добавьте приложение на главный экран для быстрого доступа
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Безопасная зона снизу */}
      <div className="safe-bottom" />
    </div>
  );
}
