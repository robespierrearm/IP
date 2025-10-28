'use client';

import { Card } from '@/components/ui/card';
import { motion as m } from 'framer-motion';
import { Zap, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';

export default function ParserPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Заголовок */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Парсер Тендеров
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Извлекайте данные тендера автоматически с помощью ИИ
          </p>
        </m.div>

        {/* Основная карточка установки */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 bg-white shadow-xl border-2 border-blue-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Установка</h2>
              <p className="text-gray-600">Один клик для настройки</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center">
              <p className="text-gray-700 mb-6 text-lg">
                Нажмите кнопку ниже, чтобы перейти на страницу установки
              </p>
              <a 
                href="/parser.html" 
                target="_blank"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Sparkles className="h-6 w-6" />
                Установить Bookmarklet
                <ExternalLink className="h-5 w-5" />
              </a>
              <p className="text-sm text-gray-500 mt-4">Откроется в новой вкладке</p>
            </div>
          </Card>
        </m.div>

        {/* Преимущества */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-white border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Быстро</h3>
              </div>
              <p className="text-sm text-gray-600">Извлечение данных за 2-5 секунд</p>
            </Card>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-white border border-gray-200 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Точно</h3>
              </div>
              <p className="text-sm text-gray-600">ИИ понимает контекст страницы</p>
            </Card>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-white border border-gray-200 hover:border-green-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Просто</h3>
              </div>
              <p className="text-sm text-gray-600">Работает на всех площадках</p>
            </Card>
          </m.div>
        </div>

      </div>
    </div>
  );
}
