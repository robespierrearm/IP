'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, RefreshCw, Trash2, CheckCircle, Send } from 'lucide-react';

interface TelegramConnection {
  id: number;
  user_id: number;
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  auth_code: string | null;
  is_active: boolean;
  connected_at: string;
}

interface TelegramPanelProps {
  isActive?: boolean;
}

export function TelegramPanel({ isActive = true }: TelegramPanelProps) {
  const [connections, setConnections] = useState<TelegramConnection[]>([]);
  const [authCode, setAuthCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadConnections();
    }
  }, [isActive]);

  const loadConnections = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('telegram_connections')
      .select('*')
      .order('connected_at', { ascending: false });

    if (!error && data) {
      setConnections(data);
    }
    setIsLoading(false);
  };

  const generateCode = async () => {
    setIsGenerating(true);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // Генерируем уникальный код
      const code = `TG-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Сохраняем код в БД
      const { data, error } = await supabase
        .from('telegram_connections')
        .insert([{
          user_id: currentUser.id,
          auth_code: code,
          is_active: false,
        }])
        .select()
        .single();

      if (error) {
        console.error('Ошибка генерации кода:', error);
        alert('Ошибка генерации кода');
        return;
      }

      setAuthCode(code);
      loadConnections();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка');
    }
    
    setIsGenerating(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`/start ${authCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeConnection = async (id: number) => {
    if (!confirm('Отключить этот Telegram аккаунт?')) return;

    const { error } = await supabase
      .from('telegram_connections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка отключения:', error);
      alert('Ошибка отключения');
      return;
    }

    loadConnections();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Инструкция */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-100">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Подключение Telegram бота</h3>
            <p className="text-sm text-gray-600 mb-4">
              Подключите свой Telegram аккаунт к CRM системе для получения уведомлений и работы с AI помощником.
            </p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-gray-900 mb-2">📱 Инструкция:</p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Нажмите кнопку "Сгенерировать код"</li>
                <li>Скопируйте код подключения</li>
                <li>Откройте бота <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">@TenderCRM_Bot</span> в Telegram</li>
                <li>Отправьте скопированную команду боту</li>
                <li>Готово! Вы подключены 🎉</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>

      {/* Генерация кода */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Код подключения</h3>
        
        {!authCode ? (
          <Button
            onClick={generateCode}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Сгенерировать код подключения
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <p className="text-xs text-gray-600 mb-2">Отправьте эту команду боту:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono bg-white px-4 py-3 rounded border border-gray-200">
                  /start {authCode}
                </code>
                <Button
                  onClick={copyCode}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Копировать
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setAuthCode('')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Сгенерировать новый код
            </Button>
          </div>
        )}
      </Card>

      {/* Список подключений */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Подключённые аккаунты ({connections.filter(c => c.is_active).length})
          </h3>
          <Button
            onClick={loadConnections}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Загрузка...</p>
          </div>
        ) : connections.filter(c => c.is_active).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Нет подключённых аккаунтов</p>
            <p className="text-xs text-gray-400 mt-1">Сгенерируйте код и подключите Telegram</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.filter(c => c.is_active).map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Send className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {connection.telegram_first_name || 'Пользователь'}
                      {connection.telegram_username && (
                        <span className="text-gray-500 ml-2">@{connection.telegram_username}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Подключено: {formatDate(connection.connected_at)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => revokeConnection(connection.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Информация о боте */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Возможности бота</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">AI помощник</p>
              <p className="text-gray-600 text-xs">Управление тендерами через чат</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Уведомления</p>
              <p className="text-gray-600 text-xs">О дедлайнах и событиях</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Быстрые команды</p>
              <p className="text-gray-600 text-xs">Статистика и отчёты</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Ежедневная сводка</p>
              <p className="text-gray-600 text-xs">Автоматические отчёты</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
