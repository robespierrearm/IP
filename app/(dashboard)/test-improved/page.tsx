'use client';

import { useState } from 'react';
import { Tender } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calendar, DollarSign, MapPin, Pencil, Trash2, 
  ExternalLink, ArrowLeft, ChevronDown, ChevronUp, Hash,
  TrendingDown, BarChart3, Receipt
} from 'lucide-react';
import { getStatusColor, formatPrice, formatDate } from '@/lib/tender-utils';
import Link from 'next/link';

export default function TestImprovedPage() {
  const [expandedOld, setExpandedOld] = useState(false);
  const [expandedNew, setExpandedNew] = useState(false);

  // Тестовые данные
  const sampleTender: Tender = {
    id: 1,
    name: 'Строительство жилого комплекса "Солнечный" в центральном районе города',
    status: 'подано',
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
                Тест улучшенного Варианта 1
              </h1>
              <p className="text-sm text-gray-500">
                Сравнение: Старая версия vs Улучшенная версия
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
              ❌ Старая версия (как сейчас)
            </h2>
            <p className="text-sm text-gray-600">
              Текущий дизайн с раскрывающейся секцией
            </p>
          </div>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-3">
              {/* Заголовок */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-semibold text-base text-gray-900">{sampleTender.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(sampleTender.status)}`}>
                      {sampleTender.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setExpandedOld(!expandedOld)}
                  >
                    {expandedOld ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Информация */}
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

            {/* Раскрывающееся содержимое - СТАРОЕ */}
            {expandedOld && (
              <div className="border-t bg-gray-50 p-4 space-y-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                {/* Номер и снижение */}
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">№ {sampleTender.purchase_number}</span>
                  </div>
                  {reduction && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-md border border-green-200">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">
                        {formatPrice(reduction.amount)}
                      </span>
                      <span className="text-xs opacity-75">
                        ({reduction.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Регион */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Регион / Адрес</h4>
                      </div>
                      <p className="text-sm text-gray-700">{sampleTender.region}</p>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Карта
                    </Button>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-auto py-3 border-indigo-200 bg-indigo-50 text-indigo-700"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Финансовая сводка</div>
                      <div className="text-xs opacity-75">Доходы и расходы</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-auto py-3 border-blue-200 bg-blue-50 text-blue-700"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Тендерная документация (3)</div>
                      <div className="text-xs opacity-75">Документы тендера</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-auto py-3 border-green-200 bg-green-50 text-green-700"
                  >
                    <Receipt className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Закрывающие документы (2)</div>
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
            <span className="bg-gray-50 px-6 text-lg font-bold text-gray-500">
              VS
            </span>
          </div>
        </div>

        {/* НОВАЯ УЛУЧШЕННАЯ ВЕРСИЯ */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Улучшенная версия (новый дизайн)
            </h2>
            <p className="text-sm text-gray-600">
              С цветной рамкой, лучшей структурой и читаемостью
            </p>
          </div>
          
          <Card className={`
            p-4 hover:shadow-lg transition-shadow
            border-l-4 border-l-green-500
          `}>
            <div className="flex flex-col gap-3">
              {/* Заголовок - УЛУЧШЕННЫЙ */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 mb-2">{sampleTender.name}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(sampleTender.status)}`}>
                      {sampleTender.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      № {sampleTender.purchase_number}
                    </span>
                    {reduction && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <TrendingDown className="h-3 w-3" />
                        -{reduction.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setExpandedNew(!expandedNew)}
                  >
                    {expandedNew ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Информация - УЛУЧШЕННАЯ (в одну строку с цветными иконками) */}
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
            </div>

            {/* Раскрывающееся содержимое - УЛУЧШЕННОЕ */}
            {expandedNew && (
              <div className="border-t bg-gray-50 p-4 space-y-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                
                {/* Финансы - карточка */}
                <Card className="p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold text-gray-900">Финансы</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Начальная цена:</span>
                      <span className="font-medium text-gray-900">{formatPrice(sampleTender.start_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Поданная цена:</span>
                      <span className="font-medium text-green-600">{formatPrice(sampleTender.submitted_price)}</span>
                    </div>
                    {reduction && (
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Экономия:</span>
                        <span className="font-semibold text-green-600">
                          {formatPrice(reduction.amount)} ({reduction.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Регион - карточка */}
                <Card className="p-4 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <h4 className="font-semibold text-gray-900">Регион / Адрес</h4>
                      </div>
                      <p className="text-sm text-gray-700">{sampleTender.region}</p>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Карта
                    </Button>
                  </div>
                </Card>

                {/* Документы - карточка */}
                <Card className="p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    <h4 className="font-semibold text-gray-900">Документы</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 h-auto py-3 border-indigo-200 bg-indigo-50 text-indigo-700"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Финансовая сводка</div>
                        <div className="text-xs opacity-75">Доходы и расходы</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 h-auto py-3 border-blue-200 bg-blue-50 text-blue-700"
                    >
                      <FileText className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Тендерная документация (3)</div>
                        <div className="text-xs opacity-75">Документы тендера</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2 h-auto py-3 border-green-200 bg-green-50 text-green-700"
                    >
                      <Receipt className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Закрывающие документы (2)</div>
                        <div className="text-xs opacity-75">Акты, счета</div>
                      </div>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>

        {/* Сравнение улучшений */}
        <Card className="p-8 bg-gradient-to-br from-green-50 to-white">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            ✨ Что улучшено:
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Основная карточка:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Цветная рамка слева (зеленая = подано)</li>
                <li>✅ Номер закупки сразу виден</li>
                <li>✅ Снижение цены в процентах</li>
                <li>✅ Данные в одну строку с цветными иконками</li>
                <li>✅ Компактнее и читаемее</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Раскрытая секция:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Разбита на карточки (Финансы, Регион, Документы)</li>
                <li>✅ Финансы показаны детально с экономией</li>
                <li>✅ Цветные иконки для каждой секции</li>
                <li>✅ Лучшая структура и читаемость</li>
                <li>✅ Сохранены все функции (кнопки, модалки)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
