'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { getStatusColor } from '@/lib/tender-utils';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { Calendar, DollarSign, MapPin, ExternalLink, FileText, Edit } from 'lucide-react';
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
            className="bg-white rounded-t-3xl w-full flex flex-col"
            style={{ maxHeight: 'min(80vh, 700px)', marginBottom: '80px' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Шапка - sticky */}
            <div className="sticky top-0 bg-white z-10 px-6 pt-3 pb-4 border-b border-gray-100">
              {/* Индикатор свайпа */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Заголовок + Статус */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 flex-1">
                  {tender.name}
                </h2>
                {tender.status !== 'новый' && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(
                      tender.status
                    )}`}
                  >
                    {STATUS_LABELS[tender.status]}
                  </span>
                )}
              </div>
            </div>

            {/* Контент - скроллится */}
            <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-behavior-contain">
              {/* Компактные карточки с данными */}
              <div className="space-y-3">
                {/* Номер закупки */}
                {tender.purchase_number && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Номер закупки</span>
                    </div>
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {tender.purchase_number}
                    </div>
                  </div>
                )}

                {/* Регион */}
                {tender.region && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Регион</span>
                    </div>
                    <div className="font-medium text-gray-900">{tender.region}</div>
                  </div>
                )}

                {/* Даты */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Публикация</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      {tender.publication_date ? formatDate(tender.publication_date) : '—'}
                    </div>
                  </div>

                  {/* Дата подачи */}
                  {tender.status !== 'новый' && tender.status !== 'подано' && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Дата подачи</span>
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
                  )}
                </div>

                {/* Цены */}
                {tender.start_price && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
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
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
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

                {/* Цена победы */}
                {(tender.status === 'победа' ||
                  tender.status === 'в работе' ||
                  tender.status === 'завершён') &&
                  tender.win_price && (
                    <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                      <div className="flex items-center gap-2 text-xs text-yellow-700 mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Цена победы</span>
                      </div>
                      <div className="font-bold text-lg text-yellow-900">
                        {formatPrice(tender.win_price)}
                      </div>
                    </div>
                  )}

                {/* Ссылка */}
                {tender.link && (
                  <a
                    href={tender.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <ExternalLink className="w-4 h-4" />
                      <span>Открыть тендер</span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Футер - sticky */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 py-3 bg-gradient-to-br from-primary-500 to-secondary-600 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
