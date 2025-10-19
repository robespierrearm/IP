'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: string; top: string; delay: string; duration: string }>>([]);

  // Генерируем частицы только на клиенте
  useEffect(() => {
    const generatedParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Попытка входа:', email);
      
      // Вызываем новый API route для логина
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Важно для cookies
      });

      console.log('📡 Ответ сервера:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 Данные:', data);

      if (!response.ok) {
        console.error('❌ Ошибка:', data.error);
        setError(data.error || 'Ошибка входа');
        setIsLoading(false);
        return;
      }

      console.log('✅ Вход успешен!');

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
            action: 'Вход в систему',
            action_type: 'login',
            details: { email: data.user.email }
          });
      } catch (logError) {
        console.warn('⚠️ Не удалось записать лог:', logError);
        // Не блокируем вход если лог не записался
      }

      console.log('🚀 Редирект на dashboard...');
      // Перенаправляем на дашборд
      router.push('/dashboard');
    } catch (err) {
      console.error('❌ Критическая ошибка входа:', err);
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированная сетка */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Анимированные светящиеся элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Плавающие частицы */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/30 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-slate-800/50 backdrop-blur-xl bg-slate-900/80 overflow-hidden">
        <div className="p-8">
          {/* Светящаяся линия сверху */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>

          {/* Логотип и название */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl shadow-2xl hover:scale-110 transition-transform duration-300">
                <Building2 className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent mb-3">
              ИП Чолахян
            </h1>
            <p className="text-slate-400 text-sm">Строительная компания</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-500/50"></div>
            </div>
          </div>

          {/* Форма входа */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-500" />
                Email адрес
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/50 rounded-xl pl-4 pr-4 transition-all duration-300 hover:bg-slate-800/70 focus:bg-slate-800"
                    required
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                Пароль
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/50 rounded-xl pl-4 pr-4 transition-all duration-300 hover:bg-slate-800/70 focus:bg-slate-800"
                    required
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <Button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-14 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white font-bold shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="relative flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold">Вход в систему...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span className="font-semibold">Войти в систему</span>
                      <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>

          {/* Информация */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-700"></div>
              <span className="uppercase tracking-wider">TenderCRM</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-700"></div>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Система управления тендерами
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span>Защищенное соединение</span>
            </div>
          </div>

          {/* Светящаяся линия снизу */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
        </div>
      </Card>
    </div>
  );
}
