'use client';

import { useState } from 'react';
import { Tender } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calendar, DollarSign, MapPin, Pencil, Trash2, 
  ExternalLink, ArrowLeft, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { getStatusColor, formatPrice, formatDate } from '@/lib/tender-utils';
import Link from 'next/link';

export default function DesktopUIPreview() {
  // Тестовые данные
  const sampleTenders: Tender[] = [
    {
      id: 1,
      name: 'Строительство жилого комплекса "Солнечный" в центральном районе города',
      status: 'новый',
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
    },
    {
      id: 2,
      name: 'Ремонт дорожного покрытия на участке федеральной трассы М-7',
      status: 'подано',
      start_price: 5000000,
      win_price: 4800000,
      region: 'Санкт-Петербург',
      purchase_number: '0373100000123000002',
      submission_deadline: '2025-11-20',
      link: 'https://zakupki.gov.ru',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      publication_date: '2025-10-18',
      submission_date: '2025-11-15',
      submitted_price: 4800000,
      additional_data: null,
    },
    {
      id: 3,
      name: 'Поставка строительных материалов для муниципальных нужд',
      status: 'на рассмотрении',
      start_price: 2500000,
      win_price: null,
      region: 'Казань',
      purchase_number: '0373100000123000003',
      submission_deadline: '2025-11-25',
      link: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      publication_date: '2025-10-22',
      submission_date: '2025-11-20',
      submitted_price: 2400000,
      additional_data: null,
    },
  ];

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
                2 новых варианта дизайна
              </h1>
              <p className="text-sm text-gray-500">
                Вариант 1: Улучшенный текущий | Вариант 2: Таблица Notion-style
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-12">
        
        {/* ВАРИАНТ 1: Улучшенный текущий */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ✨ Вариант 1: Улучшенный текущий
            </h2>
            <p className="text-sm text-gray-600">
              Твой дизайн, но с небольшими улучшениями: цветные индикаторы, лучшие отступы, четче иерархия
            </p>
          </div>
          
          <div className="grid gap-4">
            {sampleTenders.map((tender) => {
              const getBorderColor = (status: string) => {
                switch (status) {
                  case 'новый': return 'border-l-blue-500';
                  case 'подано': return 'border-l-green-500';
                  case 'на рассмотрении': return 'border-l-yellow-500';
                  case 'в работе': return 'border-l-orange-500';
                  case 'победа': return 'border-l-purple-500';
                  default: return 'border-l-gray-400';
                }
              };

              return (
                <Card 
                  key={`v1-${tender.id}`}
                  className={`
                    p-4 hover:shadow-lg transition-shadow cursor-pointer
                    border-l-4 ${getBorderColor(tender.status)}
                  `}
                >
                  <div className="flex flex-col gap-3">
                    {/* Заголовок и действия */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <h3 className="font-semibold text-base text-gray-900">{tender.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(tender.status)}`}>
                            {tender.status}
                          </span>
                          {tender.purchase_number && (
                            <span className="text-xs text-gray-400 font-mono">
                              № {tender.purchase_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {tender.link && (
                          <Button variant="outline" size="sm" className="h-8 gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="text-xs">Площадка</span>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Информация - сетка */}
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Регион</p>
                          <p className="font-medium text-gray-900">{tender.region}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Начальная</p>
                          <p className="font-medium text-gray-900">{formatPrice(tender.start_price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Поданная</p>
                          <p className="font-medium text-green-700">{formatPrice(tender.submitted_price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-500">Подача</p>
                          <p className="font-medium text-gray-900">{formatDate(tender.submission_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-500">Дедлайн</p>
                          <p className="font-medium text-gray-900">{formatDate(tender.submission_deadline)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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

        {/* ВАРИАНТ 2: Таблица Notion-style */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🎯 Вариант 2: Таблица (Notion-style)
            </h2>
            <p className="text-sm text-gray-600">
              Совершенно другой подход - компактная таблица с hover эффектами, как в Notion
            </p>
          </div>
          
          <Card className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Название</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-2">Цены</div>
                <div className="col-span-2">Регион</div>
                <div className="col-span-1">Дедлайн</div>
                <div className="col-span-1 text-right">Действия</div>
              </div>
            </div>

            {/* Строки таблицы */}
            <div className="divide-y divide-gray-100">
              {sampleTenders.map((tender) => {
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'подано': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
                    case 'на рассмотрении': return <Clock className="w-4 h-4 text-yellow-500" />;
                    case 'новый': return <AlertCircle className="w-4 h-4 text-blue-500" />;
                    default: return null;
                  }
                };

                const getStatusDot = (status: string) => {
                  switch (status) {
                    case 'новый': return 'bg-blue-500';
                    case 'подано': return 'bg-green-500';
                    case 'на рассмотрении': return 'bg-yellow-500';
                    case 'в работе': return 'bg-orange-500';
                    case 'победа': return 'bg-purple-500';
                    default: return 'bg-gray-400';
                  }
                };

                return (
                  <div 
                    key={`v2-${tender.id}`}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Название */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {tender.name}
                            </p>
                            {tender.purchase_number && (
                              <p className="text-xs text-gray-400 font-mono mt-0.5">
                                № {tender.purchase_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Статус */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusDot(tender.status)}`}></div>
                          <span className="text-sm text-gray-700">{tender.status}</span>
                        </div>
                      </div>

                      {/* Цены */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{formatPrice(tender.start_price)}</p>
                          {tender.submitted_price && (
                            <p className="text-xs text-green-600 mt-0.5">
                              → {formatPrice(tender.submitted_price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Регион */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{tender.region}</span>
                        </div>
                      </div>

                      {/* Дедлайн */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">{formatDate(tender.submission_deadline)}</span>
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tender.link && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Разделитель */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-lg font-bold text-gray-500">
              И ЕЩЁ
            </span>
          </div>
        </div>

        {/* ВАРИАНТ 3: Apple-style */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🍎 Вариант 3: Apple-style
            </h2>
            <p className="text-sm text-gray-600">
              Минималистичный, элегантный, с плавными тенями и акцентом на типографику
            </p>
          </div>
          
          <div className="grid gap-3">
            {sampleTenders.map((tender) => {
              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'новый': 
                    return 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20';
                  case 'подано': 
                    return 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20';
                  case 'на рассмотрении': 
                    return 'bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/20';
                  case 'в работе': 
                    return 'bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/20';
                  case 'победа': 
                    return 'bg-purple-500/10 text-purple-700 ring-1 ring-purple-500/20';
                  default: 
                    return 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-500/20';
                }
              };

              return (
                <div 
                  key={`v3-${tender.id}`}
                  className="group bg-white rounded-2xl p-5 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer border border-gray-100"
                >
                  {/* Одна строка - Apple минимализм */}
                  <div className="flex items-center gap-6">
                    {/* Левая часть - Название */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-gray-900 leading-snug mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {tender.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${getStatusBadge(tender.status)}`}>
                          {tender.status.toUpperCase()}
                        </span>
                        {tender.purchase_number && (
                          <span className="text-[11px] text-gray-400 font-mono tracking-tight">
                            {tender.purchase_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Центр - Данные минималистично */}
                    <div className="hidden xl:flex items-center gap-8">
                      {/* Регион */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-[13px] text-gray-600 font-medium">{tender.region}</span>
                      </div>

                      {/* Цены */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Начальная</p>
                          <p className="text-[15px] font-semibold text-gray-900">{formatPrice(tender.start_price)}</p>
                        </div>
                        {tender.submitted_price && (
                          <>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-right">
                              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Поданная</p>
                              <p className="text-[15px] font-semibold text-green-600">{formatPrice(tender.submitted_price)}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Дедлайн */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Дедлайн</p>
                          <p className="text-[13px] font-medium text-gray-900">{formatDate(tender.submission_deadline)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Правая часть - Действия */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      {tender.link && (
                        <button className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <ExternalLink className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      <button className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-indigo-50 flex items-center justify-center transition-colors">
                        <Pencil className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                      </button>
                      <button className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Сравнение */}
        <Card className="p-8 bg-gradient-to-br from-indigo-50 to-white">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            📊 Сравнение вариантов
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Вариант 1 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">✨ Вариант 1: Улучшенный</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Привычный формат карточек</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Цветные индикаторы слева</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Цветные иконки для данных</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Хорошо для детального просмотра</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Занимает больше места</span>
                </div>
              </div>
            </div>

            {/* Вариант 2 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🎯 Вариант 2: Таблица</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Очень компактно - много на экране</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Легко сканировать список</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Стиль Notion - современно</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Hover эффекты - кнопки появляются</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Непривычный формат</span>
                </div>
              </div>
            </div>

            {/* Вариант 3 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🍎 Вариант 3: Apple-style</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Минималистичный дизайн</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Плавные анимации (hover:scale)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Элегантная типографика</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Прозрачные бейджи с ring</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Компактно и стильно</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
