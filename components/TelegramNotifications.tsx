'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TelegramConnection {
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  is_active: boolean;
}

interface NotificationSettings {
  recipients: string[];
  notify_new_tender: boolean;
  notify_won: boolean;
  notify_lost: boolean;
  notify_status_change: boolean;
}

export function TelegramNotifications() {
  const [connections, setConnections] = useState<TelegramConnection[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    recipients: [],
    notify_new_tender: true,
    notify_won: true,
    notify_lost: false,
    notify_status_change: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Загружаем подключения
    const { data: connectionsData } = await supabase
      .from('telegram_connections')
      .select('telegram_id, telegram_username, telegram_first_name, is_active')
      .eq('is_active', true);
    
    if (connectionsData) {
      setConnections(connectionsData);
    }

    // Загружаем настройки
    let { data: settingsData, error: settingsError } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle(); // Используем maybeSingle вместо single
    
    // Если настроек нет - создаём
    if (!settingsData) {
      console.log('📝 Настроек нет, создаю...');
      const { data: newSettings, error: insertError } = await supabase
        .from('telegram_notification_settings')
        .insert({
          id: 1,
          recipients: [],
          notify_new_tender: true,
          notify_won: true,
          notify_lost: false,
          notify_status_change: false,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Ошибка создания настроек:', insertError);
      } else {
        settingsData = newSettings;
        console.log('✅ Настройки созданы:', settingsData);
      }
    }
    
    if (settingsData) {
      setSettings({
        recipients: settingsData.recipients || [],
        notify_new_tender: settingsData.notify_new_tender,
        notify_won: settingsData.notify_won,
        notify_lost: settingsData.notify_lost,
        notify_status_change: settingsData.notify_status_change,
      });
    }

    setIsLoading(false);
  };

  const handleRecipientToggle = (telegramId: string) => {
    setSettings(prev => ({
      ...prev,
      recipients: prev.recipients.includes(telegramId)
        ? prev.recipients.filter(id => id !== telegramId)
        : [...prev.recipients, telegramId],
    }));
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    console.log('💾 Сохраняю настройки:', settings);

    const { data, error } = await supabase
      .from('telegram_notification_settings')
      .update({
        recipients: settings.recipients,
        notify_new_tender: settings.notify_new_tender,
        notify_won: settings.notify_won,
        notify_lost: settings.notify_lost,
        notify_status_change: settings.notify_status_change,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select();

    if (error) {
      toast.error('Ошибка при сохранении настроек');
      console.error('❌ Ошибка сохранения:', error);
    } else {
      console.log('✅ Настройки сохранены:', data);
      toast.success('Настройки сохранены!');
      // Перезагружаем данные для проверки
      await loadData();
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Уведомления в Telegram</h3>
            <p className="text-sm text-gray-600">Настройте кому и какие уведомления отправлять</p>
          </div>
        </div>

        {/* Кому отправлять */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">👥 Кому отправлять</h4>
          
          {connections.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 px-4 bg-gray-50 rounded-lg">
              Нет подключённых пользователей. Подключите Telegram в разделе "Подключения".
            </p>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <label
                  key={conn.telegram_id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={settings.recipients.includes(conn.telegram_id)}
                    onChange={() => handleRecipientToggle(conn.telegram_id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {conn.telegram_first_name || 'Пользователь'}
                    </div>
                    {conn.telegram_username && (
                      <div className="text-sm text-gray-500">@{conn.telegram_username}</div>
                    )}
                  </div>
                  {settings.recipients.includes(conn.telegram_id) && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Разделитель */}
        <div className="border-t border-gray-200"></div>

        {/* Какие уведомления */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">🔔 Какие уведомления отправлять</h4>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.notify_new_tender}
                onChange={() => handleNotificationToggle('notify_new_tender')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">📋 Новый тендер</div>
                <div className="text-sm text-gray-500">При добавлении нового тендера</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.notify_won}
                onChange={() => handleNotificationToggle('notify_won')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">🎉 Победа</div>
                <div className="text-sm text-gray-500">Когда статус становится "Победа"</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.notify_lost}
                onChange={() => handleNotificationToggle('notify_lost')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">😔 Проигрыш</div>
                <div className="text-sm text-gray-500">Когда статус становится "Проигрыш"</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.notify_status_change}
                onChange={() => handleNotificationToggle('notify_status_change')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">🔄 Другие изменения</div>
                <div className="text-sm text-gray-500">При изменении на другие статусы (кроме Победы/Проигрыша)</div>
              </div>
            </label>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить настройки'
            )}
          </Button>
        </div>

      </div>
    </Card>
  );
}
