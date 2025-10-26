'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard, useTenders } from '@/hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, AlertCircle, Briefcase, ChevronRight, 
  Plus, Receipt, FileText, Building, Mail, CreditCard,
  Clock, RefreshCw, Target, DollarSign
} from 'lucide-react';
import { supabase, Tender } from '@/lib/supabase';
import { getSmartNotification } from '@/lib/tender-notifications';
import { formatPrice, formatDate } from '@/lib/tender-utils';
import { m } from 'framer-motion';

export default function DashboardTestPage() {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  const { data: dashboardData, isLoading, refetch } = useDashboard();
  const { data: allTenders = [] } = useTenders();
  
  const stats = dashboardData?.stats || { inWork: 0, underReview: 0, new: 0, submitted: 0, won: 0, lost: 0 };
  
  const [finances, setFinances] = useState({ revenue: 0, expenses: 0, profit: 0, inWorkSum: 0 });
  const [urgentTenders, setUrgentTenders] = useState<Tender[]>([]);
  const [inWorkTenders, setInWorkTenders] = useState<Tender[]>([]);

  // Таймер
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Вычисление финансов
  useEffect(() => {
    if (!allTenders || allTenders.length === 0) return;

    const calculateFinances = async () => {
      // Выручка = сумма win_price (победа + в работе + завершён)
      const revenue = allTenders
        .filter(t => ['победа', 'в работе', 'завершён'].includes(t.status))
        .reduce((sum, t) => sum + (t.win_price || 0), 0);

      // Сумма "в работе"
      const inWorkSum = allTenders
        .filter(t => t.status === 'в работе')
        .reduce((sum, t) => sum + (t.win_price || 0), 0);

      // Расходы
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount');
      const expenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      const profit = revenue - expenses;

      setFinances({ revenue, expenses, profit, inWorkSum });
    };

    calculateFinances();
  }, [allTenders]);

  // Срочные и активные тендеры
  useEffect(() => {
    if (!allTenders || allTenders.length === 0) return;

    // Срочные (urgent + high)
    const urgent = allTenders
      .map(t => ({ tender: t, notification: getSmartNotification(t) }))
      .filter(({ notification }) => notification && (notification.priority === 'urgent' || notification.priority === 'high'))
      .sort((a, b) => {
        if (a.notification!.priority === 'urgent' && b.notification!.priority !== 'urgent') return -1;
        if (a.notification!.priority !== 'urgent' && b.notification!.priority === 'urgent') return 1;
        return 0;
      })
      .slice(0, 4)
      .map(({ tender }) => tender);
    setUrgentTenders(urgent);

    // В работе (топ-4)
    const inWork = allTenders
      .filter(t => t.status === 'в работе')
      .slice(0, 4);
    setInWorkTenders(inWork);
  }, [allTenders]);

  const formatTime = (date: Date) => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const formatDateStr = (date: Date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const profitMargin = finances.revenue > 0 ? (finances.profit / finances.revenue) * 100 : 0;

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
            <p className="text-sm text-gray-500 mt-1">Тестовая версия - улучшенный обзор</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="font-medium tabular-nums">{formatTime(currentDateTime)}</span>
              <span>•</span>
              <span>{formatDateStr(currentDateTime)}</span>
            </div>
            <Button 
              onClick={() => refetch()} 
              size="sm"
              variant="outline"
              disabled={isLoading}
              className="backdrop-blur-xl bg-white/50 hover:bg-white/70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ФИНАНСОВАЯ ПАНЕЛЬ - широкий блок */}
        <Card className="backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Финансовая панель</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Выручка</p>
                <p className="text-3xl font-bold text-blue-600">{formatPrice(finances.revenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Расходы</p>
                <p className="text-3xl font-bold text-red-600">{formatPrice(finances.expenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Прибыль</p>
                <p className={`text-3xl font-bold ${finances.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(finances.profit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Маржа: {profitMargin.toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">В работе</p>
                <p className="text-3xl font-bold text-purple-600">{formatPrice(finances.inWorkSum)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.inWork} проектов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ТРИ ГЛАВНЫХ БЛОКА */}
        <div className="grid grid-cols-3 gap-4">
          
          {/* СРОЧНО */}
          <Card className="backdrop-blur-xl bg-white/40 border-l-4 border-l-red-500 shadow-lg h-[320px] flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Срочно</h3>
                  <p className="text-2xl font-bold text-red-600">{urgentTenders.length}</p>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {urgentTenders.length > 0 ? (
                  urgentTenders.map(tender => {
                    const notification = getSmartNotification(tender);
                    return (
                      <m.div
                        key={tender.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push(`/tenders?edit=${tender.id}`)}
                        className="p-3 rounded-lg bg-white/60 hover:bg-white/80 cursor-pointer border border-red-200"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate mb-1">{tender.name}</p>
                        {notification && (
                          <p className="text-xs text-red-600 font-medium">
                            {notification.icon} {notification.shortMessage}
                          </p>
                        )}
                        <Button size="sm" className="w-full mt-2 h-7 text-xs bg-red-500 hover:bg-red-600">
                          Открыть тендер →
                        </Button>
                      </m.div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Нет срочных дел 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* В РАБОТЕ */}
          <Card className="backdrop-blur-xl bg-white/40 border-l-4 border-l-green-500 shadow-lg h-[320px] flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Briefcase className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">В работе</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.inWork}</p>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {inWorkTenders.length > 0 ? (
                  inWorkTenders.map(tender => (
                    <m.div
                      key={tender.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => router.push(`/tenders?edit=${tender.id}`)}
                      className="p-3 rounded-lg bg-white/60 hover:bg-white/80 cursor-pointer border border-green-200"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate mb-1">{tender.name}</p>
                      <p className="text-xs text-green-600 font-medium">
                        💰 {formatPrice(tender.win_price)}
                      </p>
                      <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </m.div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Нет активных проектов</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ВОРОНКА */}
          <Card className="backdrop-blur-xl bg-white/40 border-l-4 border-l-blue-500 shadow-lg h-[320px]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Воронка продаж</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Новых</span>
                    <span className="font-bold text-gray-900">{stats.new}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Подано</span>
                    <span className="font-bold text-blue-600">{stats.submitted}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: stats.new > 0 ? `${(stats.submitted / stats.new) * 100}%` : '0%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">На рассмотрении</span>
                    <span className="font-bold text-yellow-600">{stats.underReview}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: stats.submitted > 0 ? `${(stats.underReview / stats.submitted) * 100}%` : '0%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Побед</span>
                    <span className="font-bold text-green-600">{stats.won}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: stats.underReview > 0 ? `${(stats.won / stats.underReview) * 100}%` : '0%' }} />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Конверсия (новых → побед)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.new > 0 ? Math.round((stats.won / stats.new) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* НИЖНИЙ РЯД */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
          <Card className="backdrop-blur-xl bg-white/40 border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Быстрые действия</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => router.push('/tenders?add=true')}
                  className="w-full justify-start gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Добавить тендер
                </Button>
                
                <Button
                  onClick={() => router.push('/accounting')}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Добавить расход
                </Button>

                <Button
                  onClick={() => router.push('/tenders')}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Все тендеры
                </Button>

                <Button
                  onClick={() => router.push('/suppliers')}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Поставщики
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ДОКУМЕНТЫ КОМПАНИИ */}
          <Card className="backdrop-blur-xl bg-white/40 border border-white/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Документы компании</h3>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white/60 hover:bg-white/80 cursor-pointer border border-orange-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Карточка предприятия</p>
                      <p className="text-xs text-gray-500">ИНН, ОГРН, реквизиты</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/60 hover:bg-white/80 cursor-pointer border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Шаблоны писем</p>
                      <p className="text-xs text-gray-500">Поставщикам, заказчикам</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/60 hover:bg-white/80 cursor-pointer border border-orange-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Типовые документы</p>
                      <p className="text-xs text-gray-500">Договоры, акты</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Уведомление о тестовой версии */}
        <Card className="backdrop-blur-xl bg-yellow-500/10 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">🧪 Тестовая версия:</span> Это экспериментальный дашборд. 
              Текущая версия доступна на <a href="/dashboard" className="underline">/dashboard</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
