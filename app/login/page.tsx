'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Новая анимированная страница авторизации
 * 
 * Особенности:
 * - Плавные анимации через Framer Motion
 * - Адаптивный дизайн (desktop + mobile)
 * - Микровзаимодействия
 * - Интеграция с существующей системой auth
 * - TypeScript типизация
 * - Безопасность (httpOnly cookies)
 */

export default function NewLoginPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Forgot password mode
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Проверяем авторизацию
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [router]);
  
  // Валидация
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Обработка входа
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Валидация
    if (!email.trim()) {
      setError('Введите email адрес');
      setIsLoading(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Введите пароль');
      setIsLoading(false);
      return;
    }
    
    try {
      // Вызываем существующий API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const text = await response.text();
      
      if (!text) {
        throw new Error('Сервер вернул пустой ответ');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Invalid JSON:', text);
        throw new Error('Невалидный ответ от сервера');
      }
      
      if (!response.ok) {
        setError(data.error || 'Ошибка входа');
        setIsLoading(false);
        return;
      }
      
      // Успех!
      setSuccess(true);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      // Уведомляем AuthProvider об изменении
      window.dispatchEvent(new Event('auth-change'));
      
      // Небольшая задержка для анимации
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
      setIsLoading(false);
    }
  };
  
  // Обработка восстановления пароля
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email.trim() || !validateEmail(email)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }
    
    // TODO: Интеграция с API восстановления пароля
    setTimeout(() => {
      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        setForgotPasswordMode(false);
        setSuccess(false);
        setError('');
      }, 2000);
    }, 1500);
  };
  
  if (!mounted) {
    return null; // Избегаем hydration mismatch
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <m.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <m.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      {/* Login Card */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          
          {/* Logo */}
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <Lock className="w-8 h-8 text-white relative z-10" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
              {forgotPasswordMode ? 'Восстановление' : 'Добро пожаловать'}
            </h1>
            
            <p className="text-slate-400 text-sm">
              {forgotPasswordMode ? 'Введите email для восстановления пароля' : 'Войдите в систему'}
            </p>
          </m.div>
          
          {/* Form */}
          <AnimatePresence mode="wait">
            {!forgotPasswordMode ? (
              <m.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{error}</span>
                    </m.div>
                  )}
                </AnimatePresence>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                    Email адрес
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-12 pr-4 transition-all"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                    Пароль
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-12 pr-12 transition-all"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-slate-400 hover:text-blue-400 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={isLoading}
                  >
                    Забыли пароль?
                  </button>
                </div>
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <m.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Вход...</span>
                      </m.div>
                    ) : success ? (
                      <m.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Успешно!</span>
                      </m.div>
                    ) : (
                      <m.div
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span>Войти</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </m.div>
                    )}
                  </AnimatePresence>
                </Button>
              </m.form>
            ) : (
              <m.form
                key="forgot-password-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleForgotPassword}
                className="space-y-5"
              >
                {/* Success Message */}
                <AnimatePresence>
                  {success && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-400">Ссылка для восстановления отправлена на email!</span>
                    </m.div>
                  )}
                  
                  {error && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{error}</span>
                    </m.div>
                  )}
                </AnimatePresence>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-slate-300 text-sm font-medium">
                    Email адрес
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        id="reset-email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-12 pr-4 transition-all"
                        disabled={isLoading || success}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading || success}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Отправка...</span>
                      </div>
                    ) : (
                      'Восстановить пароль'
                    )}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setError('');
                      setSuccess(false);
                    }}
                    className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    disabled={isLoading}
                  >
                    ← Вернуться к входу
                  </button>
                </div>
              </m.form>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    </div>
  );
}
