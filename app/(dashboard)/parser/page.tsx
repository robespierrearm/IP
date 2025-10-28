'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion as m } from 'framer-motion';
import { Sparkles, Link as LinkIcon, Copy, CheckCircle, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ParserPage() {
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = `javascript:(function(){(async()=>{const l=document.createElement('div');l.style.cssText='position:fixed;top:20px;right:20px;background:linear-gradient(135deg,rgb(102,126,234),rgb(118,75,162));color:white;padding:20px 30px;border-radius:50px;font-family:system-ui;font-size:16px;font-weight:bold;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:999999';l.innerHTML='🔍 Извлекаю текст...';document.body.appendChild(l);try{const e=e=>{let t='';if(['SCRIPT','STYLE','SVG','NOSCRIPT'].includes(e.tagName))return'';for(let l of e.childNodes)3===l.nodeType?t+=l.textContent+' ':1===l.nodeType&&(t+=e(l));return t};let t=e(document.body);if(t=t.replace(/\\s+/g,' ').trim(),t.length>50000&&(t=t.substring(0,50000),l.innerHTML='⚠️ Большая страница...'),l.innerHTML='🤖 ИИ анализирует...',!(await fetch('http://localhost:3000/api/bookmarklet-parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:t,url:window.location.href})})).ok){document.body.removeChild(l),alert('❌ Ошибка сервера');return}const o=await res.json();if(document.body.removeChild(l),!o.success){alert('❌ '+o.error);return}const r=o.data,n=\`📋 ДАННЫЕ:\\n\\n✅ \${r.name}\\n\\n📝 Номер: \${r.purchase_number||'—'}\\n📍 Регион: \${r.region||'—'}\\n📅 Публикация: \${r.publication_date||'—'}\\n⏰ Дедлайн: \${r.submission_deadline||'—'}\\n💰 Цена: \${r.start_price?new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format(r.start_price):'—'}\`;confirm(n+'\\n\\n➡️ Открыть форму?')&&(localStorage.setItem('parsedTender',JSON.stringify(r)),window.open('http://localhost:3000/tenders?action=add-from-parser','_blank'))}catch(e){document.body.contains(l)&&document.body.removeChild(l),alert('❌ '+e.message),console.error(e)}})();})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast.success('Код скопирован в буфер обмена!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🤖 Умный Парсер Тендеров
          </h1>
          <p className="text-gray-600 text-lg">
            Автоматически извлекайте данные тендера одной кнопкой
          </p>
        </m.div>

        {/* Преимущества */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Быстро</h3>
              <p className="text-sm text-gray-600">Один клик - и данные извлечены за 2-5 секунд</p>
            </Card>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Безопасно</h3>
              <p className="text-sm text-gray-600">Использует вашу авторизацию, не передаёт пароли</p>
            </Card>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
              <Globe className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Универсально</h3>
              <p className="text-sm text-gray-600">Работает на любых тендерных площадках</p>
            </Card>
          </m.div>
        </div>

        {/* Инструкция */}
        <Card className="p-8 shadow-xl border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Как установить
          </h2>

          <div className="space-y-6">
            {/* Шаг 1 */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Скопируйте код bookmarklet</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3 relative">
                  <code className="text-xs text-gray-700 break-all">
                    {bookmarkletCode.substring(0, 100)}...
                  </code>
                  <Button
                    onClick={handleCopyBookmarklet}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Скопировано</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" /> Копировать</>
                    )}
                  </Button>
                </div>
              </div>
            </m.div>

            {/* Шаг 2 */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Создайте закладку в браузере</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                  <li>Откройте менеджер закладок (Ctrl+Shift+O или Cmd+Shift+O)</li>
                  <li>Создайте новую закладку</li>
                  <li>Название: <span className="font-mono bg-gray-100 px-2 py-1 rounded">📋→CRM</span></li>
                  <li>URL: Вставьте скопированный код</li>
                  <li>Сохраните</li>
                </ul>
              </div>
            </m.div>

            {/* Шаг 3 */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Используйте на тендерных площадках</h3>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">Откройте любой тендер и нажмите созданную закладку:</p>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Поддерживаемые площадки:</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <li>✅ Сбербанк-АСТ</li>
                      <li>✅ Госзакупки</li>
                      <li>✅ ЕТС</li>
                      <li>✅ РТС-тендер</li>
                      <li>✅ Torgi.egov66.ru</li>
                      <li>✅ Любые другие</li>
                    </ul>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </Card>

        {/* Как это работает */}
        <Card className="p-8 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Как это работает</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">1</div>
              <p className="flex-1">Вы открываете тендер на любом сайте (где залогинены)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">2</div>
              <p className="flex-1">Нажимаете закладку "📋→CRM"</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">3</div>
              <p className="flex-1">Bookmarklet извлекает текст со страницы (не весь HTML!)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">4</div>
              <p className="flex-1">ИИ (Llama 3.3 70B) анализирует текст и находит данные</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">5</div>
              <p className="flex-1">Форма добавления тендера открывается с заполненными полями</p>
            </div>
          </div>
        </Card>

        {/* Справка */}
        <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3">⚠️ Важно знать</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Сервер должен быть запущен</strong> - bookmarklet работает через ваш локальный сервер</li>
            <li>• <strong>Работает с авторизацией</strong> - использует вашу текущую сессию в браузере</li>
            <li>• <strong>Безопасно</strong> - не передаёт пароли, работает только на вашем компьютере</li>
            <li>• <strong>Проверяйте данные</strong> - всегда проверяйте извлечённые данные перед сохранением</li>
          </ul>
        </Card>

      </div>
    </div>
  );
}
