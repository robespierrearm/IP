'use client';

import { useState } from 'react';
import { Tender } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calendar, DollarSign, MapPin, Pencil, Trash2, 
  ExternalLink, ArrowLeft, CheckCircle2, XCircle 
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
                Сравнение дизайна (Desktop)
              </h1>
              <p className="text-sm text-gray-500">
                Старый vs Новый
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-12">
        {/* Старый дизайн */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ❌ Старый дизайн
            </h2>
            <p className="text-sm text-gray-600">
              Текущая версия карточек - плотная, много информации в одном блоке
            </p>
          </div>
          
          <div className="grid gap-4">
            {sampleTenders.map((tender) => (
              <Card 
                key={tender.id} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  {/* Заголовок и действия */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <h3 className="font-semibold text-base text-gray-900">{tender.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
                          {tender.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="grid grid-cols-5 gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Публикация</p>
                        <p className="font-medium text-gray-900">{formatDate(tender.publication_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Начальная</p>
                        <p className="font-medium text-gray-900">{formatPrice(tender.start_price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Поданная</p>
                        <p className="font-medium text-gray-900">{formatPrice(tender.submitted_price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Регион</p>
                        <p className="font-medium text-gray-900">{tender.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Дедлайн</p>
                        <p className="font-medium text-gray-900">{formatDate(tender.submission_deadline)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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

        {/* Новый дизайн */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Новый дизайн
            </h2>
            <p className="text-sm text-gray-600">
              Улучшенная версия - больше воздуха, четкая структура, цветные индикаторы
            </p>
          </div>
          
          <div className="grid gap-6">
            {sampleTenders.map((tender) => {
              // Определяем цвет border-l
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
                  key={`new-${tender.id}`}
                  className={`
                    hover:shadow-xl transition-all duration-200 cursor-pointer
                    border-l-4 ${getBorderColor(tender.status)}
                    overflow-hidden
                  `}
                >
                  {/* ЗОНА 1: Шапка - Название, статус, действия */}
                  <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                            {tender.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                            ${getStatusColor(tender.status)}
                          `}>
                            {tender.status === 'подано' && <CheckCircle2 className="w-4 h-4" />}
                            {tender.status === 'проигрыш' && <XCircle className="w-4 h-4" />}
                            {tender.status}
                          </span>
                          
                          {tender.purchase_number && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              № {tender.purchase_number}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {tender.link && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Площадка
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ЗОНА 2: Основные данные */}
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-5 gap-6">
                      {/* Регион */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Регион</p>
                          <p className="text-sm font-semibold text-gray-900">{tender.region}</p>
                        </div>
                      </div>

                      {/* Начальная цена */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Начальная</p>
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(tender.start_price)}</p>
                        </div>
                      </div>

                      {/* Поданная цена */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Поданная</p>
                          <p className="text-sm font-semibold text-green-700">{formatPrice(tender.submitted_price)}</p>
                        </div>
                      </div>

                      {/* Дата подачи */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Подача</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(tender.submission_date)}</p>
                        </div>
                      </div>

                      {/* Дедлайн */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Дедлайн</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(tender.submission_deadline)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Преимущества */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            🎯 Что улучшено в новом дизайне:
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Цветная рамка слева</p>
                <p className="text-sm text-gray-600">Мгновенное определение статуса по цвету</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Больше "воздуха"</p>
                <p className="text-sm text-gray-600">gap-6 между карточками, px-6 py-5 внутри</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Цветные иконки с фоном</p>
                <p className="text-sm text-gray-600">Каждый тип данных имеет свой цвет</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Градиентная шапка</p>
                <p className="text-sm text-gray-600">Визуальное разделение зон карточки</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Четкая типография</p>
                <p className="text-sm text-gray-600">Иерархия: заголовок (lg) → метки (xs) → данные (sm)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Улучшенные тени</p>
                <p className="text-sm text-gray-600">hover:shadow-xl для глубины</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
