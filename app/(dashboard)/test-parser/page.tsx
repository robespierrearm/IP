'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link as LinkIcon, Sparkles, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedTender {
  name: string;
  purchase_number: string;
  link: string;
  region: string;
  publication_date: string;
  submission_deadline: string;
  start_price: number | null;
}

export default function TestParserPage() {
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTender | null>(null);
  const [error, setError] = useState('');
  const [errorHint, setErrorHint] = useState('');
  const [useMode, setUseMode] = useState<'url' | 'html'>('url');

  // Парсинг через ИИ
  const handleParse = async () => {
    if (useMode === 'url' && !url.trim()) {
      toast.error('Введите ссылку на тендер');
      return;
    }

    if (useMode === 'html' && !htmlContent.trim()) {
      toast.error('Вставьте HTML код страницы');
      return;
    }

    setIsParsing(true);
    setError('');
    setErrorHint('');
    setParsedData(null);

    try {
      const response = await fetch('/api/parse-tender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: useMode === 'url' ? url : null,
          html: useMode === 'html' ? htmlContent : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Ошибка парсинга';
        const hint = result.hint || '';
        
        setError(errorMsg);
        setErrorHint(hint);
        toast.error('Ошибка парсинга', { 
          description: errorMsg,
          duration: 8000 
        });
        throw new Error(errorMsg);
      }

      setParsedData(result.data);
      toast.success('✅ Тендер успешно распознан!');
    } catch (err: any) {
      if (!error) { // Только если ещё не установлена ошибка выше
        setError(err.message);
        toast.error('Ошибка', { description: err.message });
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Копировать JSON
  const handleCopyJson = () => {
    if (!parsedData) return;
    navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
    toast.success('JSON скопирован в буфер обмена');
  };

  // Добавить в CRM
  const handleAddToCRM = () => {
    if (!parsedData) return;
    
    // Сохраняем в localStorage для передачи в форму
    localStorage.setItem('parsedTender', JSON.stringify(parsedData));
    
    // Открываем страницу тендеров с параметром
    window.location.href = '/tenders?action=add-from-parser';
    
    toast.success('Переход к форме добавления...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🤖 Тестовый парсер тендеров
          </h1>
          <p className="text-gray-600">
            Вставьте ссылку или HTML код страницы тендера - ИИ автоматически извлечёт все данные
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Левая панель - Ввод */}
          <Card className="p-6 shadow-xl border-2 border-blue-100">
            <div className="space-y-6">
              {/* Переключатель режима */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <Button
                  onClick={() => setUseMode('url')}
                  variant={useMode === 'url' ? 'default' : 'ghost'}
                  className="flex-1"
                  size="sm"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  По ссылке
                </Button>
                <Button
                  onClick={() => setUseMode('html')}
                  variant={useMode === 'html' ? 'default' : 'ghost'}
                  className="flex-1"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  По HTML
                </Button>
              </div>

              {/* Поле ввода URL */}
              {useMode === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Ссылка на тендер
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tender-site.ru/tender/12345"
                    className="h-12 text-sm"
                    disabled={isParsing}
                  />
                  <p className="text-xs text-gray-500">
                    💡 Вставьте ссылку с любого сайта тендеров
                  </p>
                </div>
              )}

              {/* Поле ввода HTML */}
              {useMode === 'html' && (
                <div className="space-y-2">
                  <Label htmlFor="html" className="text-sm font-medium">
                    HTML код страницы
                  </Label>
                  <Textarea
                    id="html"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<html>...</html>"
                    className="min-h-[300px] font-mono text-xs"
                    disabled={isParsing}
                  />
                  <p className="text-xs text-gray-500">
                    💡 Откройте страницу тендера → Ctrl+U (или Cmd+Option+U) → Скопируйте код → Вставьте сюда
                  </p>
                </div>
              )}

              {/* Кнопка парсинга */}
              <Button
                onClick={handleParse}
                disabled={isParsing}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Анализирую через ИИ...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Распарсить тендер
                  </>
                )}
              </Button>

              {/* Ошибка */}
              {error && (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Ошибка парсинга</p>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                  
                  {errorHint && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">💡 Как исправить:</p>
                        <p className="text-xs text-blue-700 mt-1 whitespace-pre-line">{errorHint}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Правая панель - Результат */}
          <Card className="p-6 shadow-xl border-2 border-green-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Результат парсинга
                </h3>
                {parsedData && (
                  <Button
                    onClick={handleCopyJson}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Копировать JSON
                  </Button>
                )}
              </div>

              {!parsedData && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    Вставьте ссылку или HTML и нажмите "Распарсить"
                  </p>
                </div>
              )}

              {parsedData && (
                <div className="space-y-4">
                  {/* Успех */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      Тендер успешно распознан ИИ
                    </p>
                  </div>

                  {/* Поля */}
                  <div className="space-y-3">
                    <div className="p-3 bg-white border rounded-lg">
                      <Label className="text-xs text-gray-500">Название</Label>
                      <p className="text-sm font-medium mt-1">{parsedData.name || '—'}</p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <Label className="text-xs text-gray-500">Номер закупки</Label>
                      <p className="text-sm font-medium mt-1">{parsedData.purchase_number || '—'}</p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <Label className="text-xs text-gray-500">Регион</Label>
                      <p className="text-sm font-medium mt-1">{parsedData.region || '—'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border rounded-lg">
                        <Label className="text-xs text-gray-500">Дата публикации</Label>
                        <p className="text-sm font-medium mt-1">{parsedData.publication_date || '—'}</p>
                      </div>

                      <div className="p-3 bg-white border rounded-lg">
                        <Label className="text-xs text-gray-500">Дедлайн</Label>
                        <p className="text-sm font-medium mt-1">{parsedData.submission_deadline || '—'}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <Label className="text-xs text-gray-500">Начальная цена</Label>
                      <p className="text-sm font-medium mt-1">
                        {parsedData.start_price 
                          ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(parsedData.start_price)
                          : '—'
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <Label className="text-xs text-gray-500">Ссылка</Label>
                      <p className="text-xs text-blue-600 mt-1 truncate">{parsedData.link || '—'}</p>
                    </div>
                  </div>

                  {/* Кнопка добавления */}
                  <Button
                    onClick={handleAddToCRM}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Добавить тендер в CRM
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Инструкция */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Как использовать:
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Способ 1 (Ссылка):</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Скопируйте ссылку на тендер</li>
              <li>Вставьте в поле "Ссылка на тендер"</li>
              <li>Нажмите "Распарсить тендер"</li>
              <li>ИИ автоматически извлечёт все данные</li>
            </ol>

            <p className="mt-4"><strong>Способ 2 (HTML):</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Откройте страницу тендера (где залогинены)</li>
              <li>Нажмите Ctrl+U (Windows) или Cmd+Option+U (Mac)</li>
              <li>Скопируйте весь HTML код</li>
              <li>Вставьте в поле "HTML код страницы"</li>
              <li>Нажмите "Распарсить тендер"</li>
            </ol>

            <p className="mt-4 text-blue-700 font-medium">
              💡 ИИ понимает любые сайты тендеров и извлекает данные автоматически!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
