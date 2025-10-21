'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, Message } from '@/lib/supabase';
import { Send, Plus, Link as LinkIcon, StickyNote } from 'lucide-react';
import { formatTime } from '@/lib/utils';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    loadMessages();

    // Подписка на новые сообщения
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
    } catch (error) {
      console.log('📦 Чат недоступен офлайн');
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const messageData = {
      user_id: currentUser.id,
      username: currentUser.username,
      message_type: 'message' as const,
      content: newMessage.trim(),
    };

    const { error } = await supabase.from('messages').insert([messageData]);

    if (!error) {
      setNewMessage('');
    }
  };

  const getNoteColor = (color: string | null) => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300';
      case 'blue':
        return 'bg-blue-100 border-blue-300';
      case 'green':
        return 'bg-green-100 border-green-300';
      case 'red':
        return 'bg-red-100 border-red-300';
      case 'purple':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Чат</h1>
        <p className="text-sm text-gray-600 mt-1">Общение с командой</p>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Сообщений пока нет</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = currentUser && message.user_id === currentUser.id;

            if (message.message_type === 'note') {
              return (
                <div key={message.id} className={`rounded-2xl p-4 border-2 ${getNoteColor(message.note_color)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-4 h-4" />
                    <span className="font-semibold text-sm">{message.username}</span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">{formatTime(message.created_at)}</p>
                </div>
              );
            }

            if (message.message_type === 'link') {
              return (
                <div key={message.id} className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm">{message.username}</span>
                  </div>
                  <p className="text-sm mb-2">{message.content}</p>
                  {message.link_url && (
                    <a
                      href={message.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm underline break-all"
                    >
                      {message.link_url}
                    </a>
                  )}
                  <p className="text-xs text-blue-600 mt-2">{formatTime(message.created_at)}</p>
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isOwnMessage
                      ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="font-semibold text-sm mb-1 text-gray-900">{message.username}</div>
                  )}
                  <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>{message.content}</p>
                  <p className={`text-xs mt-2 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 safe-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
