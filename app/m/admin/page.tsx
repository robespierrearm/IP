'use client';

import { useEffect, useState } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Users, Activity, Shield, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Загружаем пользователей
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && usersData) {
      setUsers(usersData);

      // Подсчёт статистики
      setStats({
        totalUsers: usersData.length,
        onlineUsers: usersData.filter((u) => u.is_online).length,
        activeUsers: usersData.filter((u) => u.is_active).length,
      });
    }

    setIsLoading(false);
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
    return `${Math.floor(diffMins / 1440)} дн назад`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Админка</h1>
        </div>
        <p className="text-sm text-gray-600">Управление системой</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="px-6 py-6">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
              <div className="text-xs text-gray-600">Всего</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full mb-3"></div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.onlineUsers}</div>
              <div className="text-xs text-gray-600">Онлайн</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <Shield className="w-6 h-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeUsers}</div>
              <div className="text-xs text-gray-600">Активных</div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Быстрые действия</h2>
            <div className="space-y-3">
              <button className="w-full bg-white rounded-2xl p-4 shadow-sm active:shadow-md transition-shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Пользователи</div>
                    <div className="text-sm text-gray-600">Управление пользователями</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full bg-white rounded-2xl p-4 shadow-sm active:shadow-md transition-shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Журнал событий</div>
                    <div className="text-sm text-gray-600">История действий</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Список пользователей */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Пользователи ({users.length})</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        {user.is_online && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-2">{user.email}</div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatLastActivity(user.last_activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
