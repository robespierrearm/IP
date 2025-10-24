'use client';

import { m, PanInfo } from 'framer-motion';
import { Tender } from '@/lib/supabase';
import { Trash2, Clock, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { memo } from 'react';

interface TenderCardAppleProps {
  tender: Tender;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
}

const TenderCardAppleComponent = ({ 
  tender, 
  onDelete, 
  onClick, 
  isOpen, 
  onOpen,
  getStatusColor 
}: TenderCardAppleProps) => {
  const deleteButtonWidth = 80;

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

  // Определяем срочность
  const getUrgency = () => {
    if (!daysLeft) return null;
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 3) return 'urgent';
    if (daysLeft <= 7) return 'soon';
    return 'normal';
  };

  const urgency = getUrgency();

  // Дедлайн актуален только для новых и поданных тендеров
  const isDeadlineRelevant = tender.status === 'новый' || tender.status === 'подано';

  const handleDrag = (_event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 5 && !isOpen) {
      onOpen(-1);
    }
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const openThreshold = deleteButtonWidth * 0.5;
    const closeThreshold = 20;

    if (info.offset.x < -openThreshold) {
      onOpen(tender.id);
    } else if (info.offset.x > closeThreshold) {
      onOpen(-1);
    } else {
      onOpen(-1);
    }
  };

  const handleCardClick = () => {
    if (isOpen) {
      onOpen(-1);
    } else {
      onClick(tender);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(tender);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Кнопка удаления */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-xl"
        style={{ width: `${deleteButtonWidth}px` }}
      >
        <button
          onClick={handleDeleteClick}
          className="flex flex-col items-center justify-center w-full h-full text-white"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Удалить</span>
        </button>
      </div>

      {/* Карточка тендера - APPLE STYLE */}
      <m.div
        drag="x"
        dragConstraints={{ left: -deleteButtonWidth, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        initial={{ x: 0 }}
        animate={{ x: isOpen ? -deleteButtonWidth : 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 35
        }}
        className={`bg-white rounded-xl cursor-pointer select-none relative z-10 border border-gray-200/50 active:bg-gray-50 transition-colors border-l-4 ${
          tender.status === 'новый' ? 'border-l-gray-300' :
          tender.status === 'подано' ? 'border-l-blue-500' :
          tender.status === 'на рассмотрении' ? 'border-l-yellow-500' :
          tender.status === 'победа' ? 'border-l-purple-500' :
          tender.status === 'в работе' ? 'border-l-green-500' :
          tender.status === 'завершён' ? 'border-l-gray-500' :
          tender.status === 'проигрыш' ? 'border-l-red-500' :
          'border-l-gray-300'
        }`}
      >
        <div className="px-4 py-3">
          {/* Шапка: Название + Chevron */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="font-semibold text-gray-900 text-[15px] flex-1 line-clamp-2 leading-snug -tracking-[0.01em]">
              {tender.name}
            </h3>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>

          {/* Дедлайн - только для новых и поданных */}
          {isDeadlineRelevant && tender.submission_deadline && daysLeft !== null && (
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`w-4 h-4 ${
                urgency === 'urgent' ? 'text-red-500' :
                urgency === 'soon' ? 'text-orange-500' :
                urgency === 'expired' ? 'text-gray-400' :
                'text-green-500'
              }`} />
              <span className={`text-[13px] font-medium ${
                urgency === 'urgent' ? 'text-red-600' :
                urgency === 'soon' ? 'text-orange-600' :
                urgency === 'expired' ? 'text-gray-500' :
                'text-green-600'
              }`}>
                {daysLeft < 0 ? 'Просрочен' : 
                 daysLeft === 0 ? 'Сегодня' :
                 daysLeft === 1 ? 'Завтра' :
                 `Через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft >= 2 && daysLeft <= 4 ? 'дня' : 'дней'}`}
              </span>
              {urgency === 'urgent' && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-[11px] font-semibold rounded-full">
                  СРОЧНО
                </span>
              )}
            </div>
          )}

          {/* Разделитель если есть дедлайн */}
          {isDeadlineRelevant && tender.submission_deadline && (
            <div className="h-px bg-gray-100 my-2"></div>
          )}

          {/* Информация - компактно */}
          <div className="space-y-1 text-[13px] text-gray-600">
            {/* Дата подачи */}
            {tender.submission_date && tender.status !== 'новый' && (
              <div>Подано {formatDate(tender.submission_date)}</div>
            )}

            {/* Цена подачи */}
            {tender.submitted_price && tender.status !== 'новый' && (
              <div>Подача: <span className="font-semibold text-gray-900">{formatPrice(tender.submitted_price)}</span></div>
            )}

            {/* Цена победы */}
            {tender.win_price && (tender.status === 'победа' || tender.status === 'в работе' || tender.status === 'завершён') && (
              <div className="font-semibold text-green-600">🏆 {formatPrice(tender.win_price)}</div>
            )}
          </div>

          {/* Разделитель */}
          <div className="h-px bg-gray-100 my-2"></div>

          {/* Метаданные - компактно */}
          <div className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-3 text-gray-500">
              {tender.region && (
                <span className="truncate max-w-[120px]">{tender.region}</span>
              )}
            </div>
            {/* Начальная цена - только для новых */}
            {tender.start_price && tender.status === 'новый' && (
              <span className="font-semibold text-gray-900">
                {formatPrice(tender.start_price)}
              </span>
            )}
          </div>

          {/* Статус - внизу, тонко */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${getStatusColor(
                tender.status
              )}`}
            >
              {tender.status}
            </span>
          </div>
        </div>
      </m.div>
    </div>
  );
};

export const TenderCardApple = memo(TenderCardAppleComponent);
