'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Sparkles, Loader2, X, ChevronDown } from 'lucide-react';
import { logActivity, ACTION_TYPES } from '@/lib/activityLogger';
import { AI_PROVIDERS, AIProvider } from '@/lib/ai-providers-client';
import { getAIContext, executeAIAction } from '@/lib/ai-client';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: 'ADD_TENDER' | 'ADD_EXPENSE' | 'ADD_SUPPLIER' | 'UPDATE_TENDER' | 'DELETE_TENDER' | 'DELETE_EXPENSE' | 'DELETE_SUPPLIER';
    data: any;
  };
}

export default function MobileAIPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('intelligence');
  const [selectedModel, setSelectedModel] = useState<string>(AI_PROVIDERS.intelligence.defaultModel);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка истории из LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_chat_history');
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    }
  }, []);

  // Сохранение истории в LocalStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Автоскролл вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Выполнение действия AI
  const handleExecuteAction = async (action: { type: string; data: any }) => {
    try {
      const result = await executeAIAction(action.type, action.data);
      
      const successMessage: AIMessage = {
        role: 'assistant',
        content: `✅ ${result.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);
      
      await logActivity(`AI выполнил действие: ${action.type}`, ACTION_TYPES.TENDER_ADD);
    } catch (error: any) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `❌ Ошибка выполнения: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Отправка сообщения ИИ
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Загружаем контекст из базы данных
      let contextMessage = '';
      try {
        const context = await getAIContext();
        if (context) {
          contextMessage = `\n\nКонтекст из базы данных:\n${JSON.stringify(context, null, 2)}`;
        }
      } catch (e) {
        console.error('Ошибка загрузки контекста:', e);
      }

      // Добавляем контекст к последнему сообщению пользователя
      const messagesWithContext = [...messages, userMessage].map((m, index) => {
        if (index === messages.length && contextMessage) {
          return { role: m.role, content: m.content + contextMessage };
        }
        return { role: m.role, content: m.content };
      });

      // Вызываем AI через безопасный API роут
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesWithContext,
          provider: selectedProvider,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при получении ответа от AI');
      }

      const data = await response.json();
      let aiResponseText = data.message;

      // Парсим команды действий
      const actionMatch = aiResponseText.match(/\[ACTION:(ADD_TENDER|ADD_EXPENSE|ADD_SUPPLIER|UPDATE_TENDER|DELETE_TENDER|DELETE_EXPENSE|DELETE_SUPPLIER)\]([\s\S]*?)\[\/ACTION\]/);
      let parsedAction = undefined;
      if (actionMatch) {
        try {
          const actionType = actionMatch[1] as 'ADD_TENDER' | 'ADD_EXPENSE' | 'ADD_SUPPLIER' | 'UPDATE_TENDER' | 'DELETE_TENDER' | 'DELETE_EXPENSE' | 'DELETE_SUPPLIER';
          const actionData = JSON.parse(actionMatch[2].trim());
          parsedAction = { type: actionType, data: actionData };
          aiResponseText = aiResponseText.replace(actionMatch[0], '').trim();
        } catch (e) {
          console.error('Ошибка парсинга команды:', e);
        }
      }
      
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString(),
        action: parsedAction,
      };

      setMessages(prev => [...prev, aiMessage]);
      await logActivity('Получен ответ от ИИ-помощника', ACTION_TYPES.LOGIN);
    } catch (error: any) {
      console.error('Ошибка:', error);
      
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Извините, произошла ошибка при получении ответа. Пожалуйста, попробуйте позже.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Очистка истории
  const handleClearHistory = () => {
    if (confirm('Вы уверены, что хотите очистить всю историю диалога?')) {
      setMessages([]);
      localStorage.removeItem('ai_chat_history');
      logActivity('Очищена история ИИ-помощника', ACTION_TYPES.TENDER_DELETE);
    }
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Хедер */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ИИ-помощник
              </h1>
              <p className="text-xs text-gray-600">Задайте вопрос</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Настройки (выдвижная панель) */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 animate-slide-down">
            {/* Выбор провайдера */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Провайдер AI</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProvider('google');
                    setSelectedModel(AI_PROVIDERS.google.defaultModel);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedProvider === 'google'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  Google AI
                </button>
                <button
                  onClick={() => {
                    setSelectedProvider('intelligence');
                    setSelectedModel(AI_PROVIDERS.intelligence.defaultModel);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedProvider === 'intelligence'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  Intelligence.io
                </button>
              </div>
            </div>

            {/* Выбор модели */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Модель</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {AI_PROVIDERS[selectedProvider].models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Окно чата */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Начните диалог с ИИ</h3>
            <p className="text-sm text-gray-600">
              Задайте вопрос, попросите совет или помощь в работе. ИИ-помощник всегда готов помочь!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'} animate-slide-up`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'flex flex-col items-end'}`}>
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-white border border-gray-200'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-gray-500' : 'text-purple-100'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
              
              {/* Кнопка подтверждения действия */}
              {message.role === 'assistant' && message.action && (
                <button
                  onClick={() => handleExecuteAction(message.action!)}
                  className={`mt-2 px-4 py-2 text-white text-sm font-medium rounded-xl shadow-md active:scale-95 transition-transform ${
                    message.action.type.startsWith('DELETE') 
                      ? 'bg-red-600' 
                      : message.action.type.startsWith('UPDATE')
                      ? 'bg-blue-600'
                      : 'bg-green-600'
                  }`}
                >
                  {message.action.type.startsWith('DELETE') && '🗑️ Подтвердить удаление'}
                  {message.action.type.startsWith('UPDATE') && '✏️ Подтвердить изменение'}
                  {message.action.type.startsWith('ADD') && '✓ Подтвердить добавление'}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-end animate-slide-up">
            <div className="max-w-[85%] bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">ИИ думает...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода (фиксированное внизу) */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Спросите у ИИ..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
