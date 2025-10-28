'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion as m } from 'framer-motion';
import { Sparkles, Link as LinkIcon, Copy, CheckCircle, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ParserPage() {
  const [copied, setCopied] = useState(false);

  // Автоматически определяем URL CRM (берём текущий домен)
  const crmUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  const bookmarkletCode = `javascript:(function(){(async()=>{const CRM_URL='${crmUrl}';const l=document.createElement('div');l.style.cssText='position:fixed;top:20px;right:20px;background:linear-gradient(135deg,rgb(102,126,234),rgb(118,75,162));color:white;padding:20px 30px;border-radius:50px;font-family:system-ui;font-size:16px;font-weight:bold;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:999999';l.innerHTML='🔍 Извлекаю текст...';document.body.appendChild(l);try{const extractText=e=>{let t='';if(['SCRIPT','STYLE','SVG','NOSCRIPT'].includes(e.tagName))return'';for(let l of e.childNodes)3===l.nodeType?t+=l.textContent+' ':1===l.nodeType&&(t+=extractText(l));return t};let text=extractText(document.body);if(text=text.replace(/\\s+/g,' ').trim(),text.length>50000&&(text=text.substring(0,50000),l.innerHTML='⚠️ Большая страница...'),l.innerHTML='🤖 ИИ анализирует...',!(res=await fetch(CRM_URL+'/api/bookmarklet-parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:text,url:window.location.href})})).ok){const txt=await res.text();document.body.removeChild(l);alert('❌ Ошибка сервера ('+res.status+'):\\n\\n'+txt);return}const result=await res.json();if(document.body.removeChild(l),!result.success){alert('❌ '+result.error);return}const d=result.data,msg=\`📋 ДАННЫЕ:\\n\\n✅ \${d.name}\\n\\n📝 Номер: \${d.purchase_number||'—'}\\n📍 Регион: \${d.region||'—'}\\n📅 Публикация: \${d.publication_date||'—'}\\n⏰ Дедлайн: \${d.submission_deadline||'—'}\\n💰 Цена: \${d.start_price?new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB'}).format(d.start_price):'—'}\`;confirm(msg+'\\n\\n➡️ Открыть форму?')&&(localStorage.setItem('parsedTender',JSON.stringify(d)),window.open(CRM_URL+'/tenders?action=add-from-parser','_blank'))}catch(e){document.body.contains(l)&&document.body.removeChild(l);alert('❌ '+e.message+'\\n\\nURL CRM: '+CRM_URL);console.error(e)}})();})();`;

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

        {/* Большая кнопка для установки */}
        <Card className="p-8 shadow-xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🚀 Установить Bookmarklet</h2>
            <p className="text-gray-600 mb-6">Нажмите кнопку ниже для перехода на страницу установки</p>
            <a 
              href="/parser.html" 
              target="_blank"
              className="inline-block px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xl rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              📋 Перейти к установке →
            </a>
            <p className="text-sm text-gray-500 mt-4">Откроется в новой вкладке</p>
          </div>
        </Card>

        {/* Инструкция */}
        <Card className="p-8 shadow-xl border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Как это работает
          </h2>

          <div className="space-y-6">
            {/* Шаг 1 - DRAG & DROP */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3">Перетащите кнопку в закладки</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    👇 Просто зажмите эту кнопку мышкой и перетащите на панель закладок вашего браузера
                  </p>
                  <a 
                    href={bookmarkletCode}
                    className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-move"
                    draggable="true"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('⚠️ Не нажимайте!\n\nПеретащите эту кнопку на панель закладок вашего браузера (обычно вверху)');
                    }}
                  >
                    📋→CRM
                  </a>
                  <p className="text-xs text-gray-500 mt-4">
                    ⬆️ Зажмите и тащите вверх на панель закладок
                  </p>
                </div>
                
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Или скопируйте код вручную (альтернативный способ)
                  </summary>
                  <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
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
                </details>
              </div>
            </m.div>

            {/* Шаг 2 */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
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
            <li>• <strong>CRM должна быть доступна</strong> - bookmarklet отправляет данные на: <code className="bg-yellow-100 px-2 py-1 rounded">{crmUrl}</code></li>
            <li>• <strong>Работает с авторизацией</strong> - использует вашу текущую сессию в браузере</li>
            <li>• <strong>Безопасно</strong> - не передаёт пароли, работает только с вашей CRM</li>
            <li>• <strong>Проверяйте данные</strong> - всегда проверяйте извлечённые данные перед сохранением</li>
          </ul>
        </Card>

      </div>
    </div>
  );
}
