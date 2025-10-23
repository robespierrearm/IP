'use client';

import { useState } from 'react';
import { Tender, STATUS_TRANSITIONS, STATUS_LABELS } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calendar, DollarSign, MapPin, Pencil, Trash2, 
  ExternalLink, ArrowLeft, ChevronDown, ChevronUp, Hash,
  TrendingDown, BarChart3, Receipt, ArrowRight, CheckCircle, XCircle
} from 'lucide-react';
import { getStatusColor, formatPrice, formatDate } from '@/lib/tender-utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TestFinalPage() {
  const [expandedOld, setExpandedOld] = useState(false);
  const [expandedNew, setExpandedNew] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Tender['status']>('подано');

  // Тестовые данные
  const sampleTender: Tender = {
    id: 1,
    name: 'Строительство жилого комплекса "Солнечный"',
    status: currentStatus,
    start_price: 15000000,
    win_price: null,
    region: 'Москва, ЦАО',
    purchase_number: '0373100000123000001',
    submission_deadline: '2025-11-15',
    link: 'https://zakupki.gov.ru',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    publication_date: '2025-10-20',
    submission_date: '2025-11-10',
    submitted_price: 14500000,
    additional_data: null,
  };

  // Расчёт снижения
  const reduction = sampleTender.start_price && sampleTender.submitted_price
    ? {
        amount: sampleTender.start_price - sampleTender.submitted_price,
        percentage: ((sampleTender.start_price - sampleTender.submitted_price) / sampleTender.start_price) * 100
      }
    : null;

  // Получить цвет рамки
  const getBorderColor = (status: Tender['status']) => {
    switch (status) {
      case 'новый': return 'border-l-blue-500';
      case 'подано': return 'border-l-green-500';
      case 'на рассмотрении': return 'border-l-yellow-500';
      case 'в работе': return 'border-l-orange-500';
      case 'победа': return 'border-l-purple-500';
      case 'завершён': return 'border-l-gray-400';
      case 'проигрыш': return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  // Доступные переходы
  const availableTransitions = STATUS_TRANSITIONS[currentStatus];

  // Получить цвет кнопки статуса
  const getStatusButtonColor = (status: Tender['status']) => {
    const colorMap: Record<Tender['status'], string> = {
      'новый': 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
      'подано': 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200',
      'на рассмотрении': 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      'победа': 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200',
      'в работе': 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200',
      'завершён': 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200',
      'проигрыш': 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200',
    };
    return colorMap[status];
  };

  // Получить иконку статуса
  const getStatusIcon = (status: Tender['status']) => {
    switch (status) {
      case 'победа':
      case 'завершён':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'проигрыш':
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <ArrowRight className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/tenders"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Финальная улучшенная версия
              </h1>
              <p className="text-sm text-gray-500">
                С цветной рамкой, переключателем статусов, анимациями
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-12">
        
        {/* СТАРАЯ ВЕРСИЯ */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ❌ Старая версия
            </h2>
            <p className="text-sm text-gray-600">
              Текущий дизайн без улучшений
            </p>
          </div>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-semibold text-base text-gray-900">{sampleTender.name}</h3>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpandedOld(!expandedOld)}>
                    {expandedOld ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Регион</p>
                    <p className="font-medium text-gray-900">{sampleTender.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Начальная</p>
                    <p className="font-medium text-gray-900">{formatPrice(sampleTender.start_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Поданная</p>
                    <p className="font-medium text-gray-900">{formatPrice(sampleTender.submitted_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Подача</p>
                    <p className="font-medium text-gray-900">{formatDate(sampleTender.submission_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Дедлайн</p>
                    <p className="font-medium text-gray-900">{formatDate(sampleTender.submission_deadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {expandedOld && (
              <div className="border-t bg-gray-50 p-4 space-y-4 mt-4">
                <div className="flex gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">№ {sampleTender.purchase_number}</span>
                  </div>
                  {reduction && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-md border border-green-200">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{formatPrice(reduction.amount)}</span>
                      <span className="text-xs opacity-75">({reduction.percentage.toFixed(1)}%)</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Регион / Адрес</h4>
                      </div>
                      <p className="text-sm text-gray-700">{sampleTender.region}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Карта
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="h-auto py-3 border-indigo-200 bg-indigo-50 text-indigo-700">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Финансовая сводка</div>
                      <div className="text-xs opacity-75">Доходы и расходы</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 border-blue-200 bg-blue-50 text-blue-700">
                    <FileText className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Документация (3)</div>
                      <div className="text-xs opacity-75">Документы</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 border-green-200 bg-green-50 text-green-700">
                    <Receipt className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Закрывающие (2)</div>
                      <div className="text-xs opacity-75">Акты, счета</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Разделитель */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-lg font-bold text-gray-500">VS</span>
          </div>
        </div>

        {/* НОВАЯ УЛУЧШЕННАЯ ВЕРСИЯ */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Улучшенная версия (ФИНАЛ)
            </h2>
            <p className="text-sm text-gray-600">
              Цветная рамка, переключатель статусов, анимации, компактность
            </p>
          </div>
          
          <Card className={`
            p-4 hover:shadow-xl hover:scale-[1.005] transition-all duration-200
            border-l-4 ${getBorderColor(currentStatus)}
          `}>
            <div className="flex flex-col gap-3">
              {/* Заголовок */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 mb-2 leading-tight">{sampleTender.name}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(currentStatus)}`}>
                      {currentStatus}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">№ {sampleTender.purchase_number}</span>
                    {reduction && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <TrendingDown className="h-3 w-3" />
                        -{reduction.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedNew(!expandedNew)}
                  >
                    {expandedNew ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Данные в одну строку */}
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{sampleTender.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-900 font-medium">{formatPrice(sampleTender.start_price)}</span>
                  <span className="text-gray-400">→</span>
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">{formatPrice(sampleTender.submitted_price)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-700">{formatDate(sampleTender.submission_deadline)}</span>
                </div>
              </div>

              {/* Переключатель статусов */}
              {availableTransitions.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Изменить статус:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => setCurrentStatus(nextStatus)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-all duration-200 hover:scale-105',
                          getStatusButtonColor(nextStatus)
                        )}
                      >
                        {getStatusIcon(nextStatus)}
                        {STATUS_LABELS[nextStatus]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Раскрывающаяся секция - КОМПАКТНАЯ */}
            {expandedNew && (
              <div className="border-t bg-gradient-to-b from-gray-50 to-white p-4 space-y-3 mt-4 animate-in slide-in-from-top-2 duration-300">
                {/* Финансы - компактно */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Экономия</p>
                      <p className="text-sm font-semibold text-green-600">
                        {reduction && formatPrice(reduction.amount)} ({reduction?.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Детали
                  </Button>
                </div>

                {/* Регион - компактно */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Регион</p>
                      <p className="text-sm font-medium text-gray-900">{sampleTender.region}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Документы - компактно */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left">
                    <BarChart3 className="h-4 w-4 text-indigo-600 mb-1" />
                    <p className="text-xs font-medium text-indigo-700">Финансы</p>
                  </button>
                  <button className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                    <FileText className="h-4 w-4 text-blue-600 mb-1" />
                    <p className="text-xs font-medium text-blue-700">Документы (3)</p>
                  </button>
                  <button className="p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:bg-green-50 transition-all text-left">
                    <Receipt className="h-4 w-4 text-green-600 mb-1" />
                    <p className="text-xs font-medium text-green-700">Акты (2)</p>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Сравнение */}
        <Card className="p-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            ✨ Все улучшения:
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🎨 Дизайн:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Цветная рамка по статусу</li>
                <li>✅ Компактная раскрывающаяся секция</li>
                <li>✅ Hover эффекты</li>
                <li>✅ Плавные анимации</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">⚡ Функции:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Переключатель статусов</li>
                <li>✅ Все кнопки работают</li>
                <li>✅ Сохранены все модалки</li>
                <li>✅ Логика не изменена</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">📊 Результат:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Занимает меньше места</li>
                <li>✅ Быстрее работает</li>
                <li>✅ Современный вид</li>
                <li>✅ Удобнее использовать</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
