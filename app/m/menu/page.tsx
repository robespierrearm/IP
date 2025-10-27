'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare, FolderOpen, Shield, LogOut, User, Settings, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MenuPage() {
  const router = useRouter();
  const [username, setUsername] = useState('Пользователь');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setUsername(user.username || 'Пользователь');
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
  }, []);

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      try {
        // Вызываем API logout (удалит httpOnly cookie)
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      // Удаляем данные из localStorage
      localStorage.removeItem('currentUser');
      
      // Уведомляем AuthProvider об изменении
      window.dispatchEvent(new Event('auth-change'));
      
      // Редиректим на логин (единая адаптивная страница)
      router.replace('/login');
    }
  };

  const menuItems = [
    { icon: Sparkles, label: 'ИИ-помощник', href: '/m/ai', color: 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600' },
    { icon: MessageSquare, label: 'Чат', href: '/m/chat', color: 'bg-blue-100 text-blue-600' },
    { icon: FolderOpen, label: 'Файлы', href: '/m/files', color: 'bg-purple-100 text-purple-600' },
    { icon: Shield, label: 'Админка', href: '/m/admin', color: 'bg-red-100 text-red-600' },
    { icon: Settings, label: 'Настройки', href: '/m/settings', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Меню</h1>
      </div>

      {/* Профиль пользователя */}
      <div className="px-6 py-6">
        <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-3xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm opacity-80 mb-1">Вы вошли как</div>
              <div className="text-xl font-bold">
                {username}
              </div>
            </div>
          </div>
        </div>

        {/* Пункты меню */}
        <div className="space-y-3 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm active:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-lg font-semibold text-gray-900">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Кнопка выхода */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 rounded-2xl p-4 font-semibold flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Выйти из системы
        </button>
      </div>
    </div>
  );
}
