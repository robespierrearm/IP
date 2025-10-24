'use client';

import { m, AnimatePresence } from 'framer-motion';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { getStatusColor } from '@/lib/tender-utils';
import { formatPrice, formatDate } from '@/lib/utils';
import { Calendar, DollarSign, MapPin, ExternalLink, FileText, Edit, Bell, Clock } from 'lucide-react';
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

  if (!tender) return null;

  const handleEdit = () => {
    router.push(`/m/tenders/edit/${tender.id}`);
  };

  // Расчет дней до дедлайна
  const getDaysUntilDeadline = () => {
    if (!tender.submission_deadline) return null;
    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDeadline();
  
  // Определяем цвет дедлайна
  const getDeadlineColor = () => {
    if (!daysLeft) return null;
    if (daysLeft < 0) return 'expired'; // Просрочен
    if (daysLeft <= 3) return 'urgent'; // Срочно
    if (daysLeft <= 7) return 'soon'; // Скоро
    return 'normal'; // Нормально
  };

  const deadlineColor = getDeadlineColor();

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
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                
                {/* ДЕДЛАЙН - ПЕРВОЕ МЕСТО! */}
                {tender.submission_deadline && (
                  <div className={`rounded-xl p-4 border-l-4 ${
                    deadlineColor === 'expired' ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-500' :
                    deadlineColor === 'urgent' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-500' :
                    deadlineColor === 'soon' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-500' :
                    'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`w-4 h-4 ${
                            deadlineColor === 'expired' ? 'text-gray-600' :
                            deadlineColor === 'urgent' ? 'text-red-600' :
                            deadlineColor === 'soon' ? 'text-yellow-600' :
                            'text-green-600'
                          }`} />
                          <p className={`text-xs font-medium ${
                            deadlineColor === 'expired' ? 'text-gray-600' :
                            deadlineColor === 'urgent' ? 'text-red-600' :
                            deadlineColor === 'soon' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            ДЕДЛАЙН ПОДАЧИ
                          </p>
                        </div>
                        <p className={`text-2xl font-bold ${
                          deadlineColor === 'expired' ? 'text-gray-900' :
                          deadlineColor === 'urgent' ? 'text-red-900' :
                          deadlineColor === 'soon' ? 'text-yellow-900' :
                          'text-green-900'
                        }`}>
                          {formatDate(tender.submission_deadline)}
                        </p>
                      </div>
                      {daysLeft !== null && (
                        <div className="text-right">
                          <p className={`text-xs ${
                            deadlineColor === 'expired' ? 'text-gray-600' :
                            deadlineColor === 'urgent' ? 'text-red-600' :
                            deadlineColor === 'soon' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {daysLeft < 0 ? 'Просрочен' : 'Осталось'}
                          </p>
                          <p className={`text-xl font-bold ${
                            deadlineColor === 'expired' ? 'text-gray-900' :
                            deadlineColor === 'urgent' ? 'text-red-900' :
                            deadlineColor === 'soon' ? 'text-yellow-900' :
                            'text-green-900'
                          }`}>
                            {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'день' : daysLeft >= 2 && daysLeft <= 4 ? 'дня' : 'дней'}
                          </p>
                        </div>
                      )}
                    </div>
                    {deadlineColor === 'urgent' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-200">
                        <Bell className="w-4 h-4 text-red-600 animate-pulse" />
                        <p className="text-xs text-red-700 font-medium">⚠️ СРОЧНО! Требуется внимание</p>
                      </div>
                    )}
                  </div>
                )}

                {/* СЕКЦИЯ: ОСНОВНОЕ */}
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <h3 className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ОСНОВНОЕ
                  </h3>
                  <div className="space-y-2">
                    {tender.purchase_number && (
                      <div>
                        <p className="text-xs text-blue-600">📄 Номер закупки</p>
                        <p className="font-mono text-sm font-medium text-blue-900">{tender.purchase_number}</p>
                      </div>
                    )}
                    {tender.region && (
                      <div>
                        <p className="text-xs text-blue-600">📍 Регион</p>
                        <p className="text-sm font-medium text-blue-900">{tender.region}</p>
                      </div>
                    )}
                    {tender.link && (
                      <a
                        href={tender.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:text-blue-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>🔗 Открыть тендер →</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* СЕКЦИЯ: ДАТЫ */}
                <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-500">
                  <h3 className="text-xs font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    ДАТЫ
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-orange-600 mb-1">Публикация</p>
                      <p className="text-sm font-bold text-orange-900">
                        {tender.publication_date ? formatDate(tender.publication_date) : '—'}
                      </p>
                    </div>
                    {tender.submission_date && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-orange-600 mb-1">Подача</p>
                        <p className="text-sm font-bold text-orange-900">
                          {formatDate(tender.submission_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* СЕКЦИЯ: ФИНАНСЫ */}
                <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                  <h3 className="text-xs font-bold text-green-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    ФИНАНСЫ
                  </h3>
                  <div className="space-y-2">
                    {tender.start_price && (
                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-400">
                        <p className="text-xs text-gray-600">Начальная цена</p>
                        <p className="text-lg font-bold text-gray-900">{formatPrice(tender.start_price)}</p>
                      </div>
                    )}
                    {tender.submitted_price && (
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <p className="text-xs text-blue-600">Цена подачи</p>
                        <p className="text-lg font-bold text-blue-900">{formatPrice(tender.submitted_price)}</p>
                      </div>
                    )}
                    {tender.win_price && (
                      <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                        <p className="text-xs text-purple-600">Цена победы</p>
                        <p className="text-lg font-bold text-purple-900">{formatPrice(tender.win_price)}</p>
                      </div>
                    )}
                  </div>
                </div>

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
