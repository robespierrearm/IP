'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { getStatusColor } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { Calendar, DollarSign, MapPin, ExternalLink, FileText, Edit, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TenderDetailsModalProps {
  tender: Tender | null;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * Модальное окно с деталями тендера (мобильная версия)
 * Вынесено в отдельный компонент для оптимизации
 */
export function TenderDetailsModal({ tender, onClose, onUpdate }: TenderDetailsModalProps) {
  const router = useRouter();
  const [editingSubmissionDate, setEditingSubmissionDate] = useState(false);
  const [editingSubmittedPrice, setEditingSubmittedPrice] = useState(false);
  const [tempSubmissionDate, setTempSubmissionDate] = useState('');
  const [tempSubmittedPrice, setTempSubmittedPrice] = useState('');
  const [expenses, setExpenses] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  // Загружаем расходы
  useEffect(() => {
    if (tender) {
      apiClient.getExpenses({ tender_id: tender.id }).then(response => {
        if (response.success && response.data && Array.isArray(response.data)) {
          const total = response.data.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          setExpenses(total);
        }
      });
    }
  }, [tender]);

  // Блокируем скролл body когда модальное окно открыто
  useEffect(() => {
    if (tender) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Восстанавливаем скролл при закрытии
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [tender]);

  if (!tender) return null;

  const handleEdit = () => {
    router.push(`/m/tenders/edit/${tender.id}`);
  };

  const handleUpdateSubmissionDate = async () => {
    await apiClient.updateTender(tender.id, { submission_date: tempSubmissionDate });
    setEditingSubmissionDate(false);
    onUpdate();
  };

  const handleUpdateSubmittedPrice = async () => {
    await apiClient.updateTender(tender.id, { submitted_price: parseFloat(tempSubmittedPrice) });
    setEditingSubmittedPrice(false);
    onUpdate();
  };

  return (
    <AnimatePresence>
      {tender && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={onClose}
        >
          <m.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="backdrop-blur-xl bg-white/95 rounded-t-3xl w-full flex flex-col border-t border-white/20 shadow-2xl"
            style={{ maxHeight: 'min(80vh, 700px)', marginBottom: '80px' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Шапка - sticky СТЕКЛЯННАЯ */}
            <div className="sticky top-0 backdrop-blur-xl bg-white/90 z-10 px-6 pt-3 pb-4 border-b border-white/20">
              {/* Индикатор свайпа */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Умное уведомление */}
              {(() => {
                const notification = getSmartNotification(tender);
                if (notification && (notification.priority === 'urgent' || notification.priority === 'high')) {
                  return (
                    <div className={`mb-3 p-3 rounded-xl backdrop-blur-xl border border-white/20 ${
                      notification.color === 'red' ? 'bg-red-500/20 shadow-red-500/50' :
                      notification.color === 'orange' ? 'bg-orange-500/20 shadow-orange-500/50' :
                      'bg-yellow-500/20 shadow-yellow-500/50'
                    } shadow-lg`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-5 h-5 ${
                          notification.color === 'red' ? 'text-red-600' :
                          notification.color === 'orange' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                        <span className={`font-semibold text-sm ${
                          notification.color === 'red' ? 'text-red-700' :
                          notification.color === 'orange' ? 'text-orange-700' :
                          'text-yellow-700'
                        }`}>
                          {notification.icon} {notification.message}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Заголовок + Статус */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex-1">
                  {tender.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(
                    tender.status
                  )}`}
                >
                  {STATUS_LABELS[tender.status]}
                </span>
              </div>

              {/* Прогресс-бар */}
              <div className="backdrop-blur-xl bg-white/50 rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  {['новый', 'подано', 'на рассмотрении', 'победа', 'в работе'].map((status, index) => {
                    const statusIndex = ['новый', 'подано', 'на рассмотрении', 'победа', 'в работе', 'завершён'].indexOf(tender.status);
                    const isActive = index <= statusIndex;
                    const isCurrent = ['новый', 'подано', 'на рассмотрении', 'победа', 'в работе'][index] === tender.status;
                    
                    return (
                      <div key={status} className="flex-1 flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent ? 'bg-blue-500 text-white scale-110 shadow-lg' :
                          isActive ? 'bg-blue-200 text-blue-700' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        {index < 4 && (
                          <div className={`h-0.5 w-full mt-4 absolute transition-all ${
                            isActive ? 'bg-blue-500' : 'bg-gray-200'
                          }`} style={{ left: `${(index + 0.5) * 20}%`, width: '20%' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                  <span>Новый</span>
                  <span>Подано</span>
                  <span>Рассм.</span>
                  <span>Победа</span>
                  <span>В раб.</span>
                </div>
              </div>
            </div>

            {/* Контент - скроллится */}
            <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-behavior-contain">
              {/* Компактные стеклянные карточки */}
              <div className="space-y-2">
                {/* Номер закупки */}
                {tender.purchase_number && (
                  <div className="backdrop-blur-xl bg-blue-500/10 rounded-lg p-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {tender.purchase_number}
                      </span>
                    </div>
                  </div>
                )}

                {/* Регион */}
                {tender.region && (
                  <div className="backdrop-blur-xl bg-purple-500/10 rounded-lg p-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">{tender.region}</span>
                    </div>
                  </div>
                )}

                {/* Даты */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="backdrop-blur-xl bg-white/50 rounded-lg p-2 border border-white/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-xs text-gray-600">Публикация</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      {tender.publication_date ? formatDate(tender.publication_date) : '—'}
                    </div>
                  </div>

                  {/* Дедлайн для новых */}
                  {(tender.status === 'новый' || tender.status === 'подано') && tender.submission_deadline ? (
                    <div className="backdrop-blur-xl bg-red-500/10 rounded-lg p-2 border border-white/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs text-red-600">Дедлайн</span>
                      </div>
                      <div className="font-semibold text-sm text-red-700">
                        {formatDate(tender.submission_deadline)}
                      </div>
                    </div>
                  ) : tender.status !== 'новый' && tender.status !== 'подано' ? (
                    <div className="backdrop-blur-xl bg-blue-500/10 rounded-lg p-2 border border-white/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-blue-600">Подача</span>
                      </div>
                      {tender.status === 'на рассмотрении' ? (
                        editingSubmissionDate ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={tempSubmissionDate}
                              onChange={(e) => setTempSubmissionDate(e.target.value)}
                              className="flex-1 px-2 py-1 border border-blue-200 rounded-lg text-xs"
                            />
                            <button
                              onClick={handleUpdateSubmissionDate}
                              className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSubmissionDate(false)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTempSubmissionDate(
                                tender.submission_date || new Date().toISOString().split('T')[0]
                              );
                              setEditingSubmissionDate(true);
                            }}
                            className="font-semibold text-sm text-blue-900 cursor-pointer hover:text-blue-700 transition-colors"
                          >
                            {tender.submission_date ? formatDate(tender.submission_date) : '— (нажмите)'}
                          </div>
                        )
                      ) : (
                        <div className="font-semibold text-sm text-blue-900">
                          {tender.submission_date ? formatDate(tender.submission_date) : '—'}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Цены */}
                {tender.start_price && (
                  <div className="backdrop-blur-xl bg-green-500/10 rounded-lg p-3 border border-white/20 shadow-sm shadow-green-500/30">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Начальная цена</span>
                    </div>
                    <div className="font-bold text-lg text-green-900">
                      {formatPrice(tender.start_price)}
                    </div>
                  </div>
                )}

                {/* Цена подачи */}
                {(tender.status === 'на рассмотрении' ||
                  tender.status === 'победа' ||
                  tender.status === 'в работе' ||
                  tender.status === 'завершён' ||
                  tender.status === 'проигрыш') && (
                  <div className="backdrop-blur-xl bg-blue-500/10 rounded-lg p-3 border border-white/20 shadow-sm shadow-blue-500/30">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Цена подачи</span>
                    </div>
                    {tender.status === 'на рассмотрении' ? (
                      editingSubmittedPrice ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={tempSubmittedPrice}
                            onChange={(e) => setTempSubmittedPrice(e.target.value)}
                            className="flex-1 px-2 py-1 border border-blue-200 rounded-lg text-sm"
                            placeholder="Введите сумму"
                          />
                          <button
                            onClick={handleUpdateSubmittedPrice}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSubmittedPrice(false)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setTempSubmittedPrice(tender.submitted_price?.toString() || '');
                            setEditingSubmittedPrice(true);
                          }}
                          className="font-bold text-lg text-blue-900 cursor-pointer hover:text-blue-700 transition-colors"
                        >
                          {tender.submitted_price ? formatPrice(tender.submitted_price) : '— (нажмите)'}
                        </div>
                      )
                    ) : (
                      <div className="font-bold text-lg text-blue-900">
                        {tender.submitted_price ? formatPrice(tender.submitted_price) : '—'}
                      </div>
                    )}
                  </div>
                )}

                {/* Цена победы + Расходы + Прибыль */}
                {(tender.status === 'победа' ||
                  tender.status === 'в работе' ||
                  tender.status === 'завершён') &&
                  tender.win_price && (
                    <div className="backdrop-blur-xl bg-yellow-500/10 rounded-lg p-3 border border-white/20 shadow-sm shadow-yellow-500/30">
                      <div className="flex items-center gap-2 text-xs text-yellow-700 mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Цена победы</span>
                      </div>
                      <div className="font-bold text-lg text-yellow-900">
                        {formatPrice(tender.win_price)}
                      </div>
                      
                      {/* Расходы и прибыль для в работе */}
                      {(tender.status === 'в работе' || tender.status === 'завершён') && expenses > 0 && (
                        <div className="mt-3 pt-3 border-t border-yellow-200">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-yellow-700">Расходы:</span>
                            <span className="font-semibold text-yellow-900">{formatPrice(expenses)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-yellow-700">Прибыль:</span>
                            <span className="font-bold text-green-600">
                              {formatPrice(tender.win_price - expenses)}
                              <span className="text-xs ml-1">({Math.round(((tender.win_price - expenses) / tender.win_price) * 100)}%)</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Ссылка */}
                {tender.link && (
                  <a
                    href={tender.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 backdrop-blur-xl bg-blue-500/10 rounded-lg p-3 border border-white/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">Открыть тендер</span>
                  </a>
                )}
              </div>
            </div>

            {/* Футер - sticky СТЕКЛЯННЫЙ */}
            <div className="sticky bottom-0 backdrop-blur-xl bg-white/90 border-t border-white/20 px-6 py-3">
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/m/tenders/edit/${tender.id}`)}
                  className="flex-1 py-2.5 backdrop-blur-xl bg-blue-500/20 text-blue-700 font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/20 shadow-sm shadow-blue-500/30"
                >
                  <Edit className="w-4 h-4" />
                  Изменить
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 backdrop-blur-xl bg-white/50 text-gray-700 font-medium rounded-lg transition-colors border border-white/20"
                >
                  ✕
                </button>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
