'use client';

import { m, PanInfo } from 'framer-motion';
import { Tender } from '@/lib/supabase';
import { Trash2, Clock, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { getSmartNotification } from '@/lib/tender-notifications';
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

  // Получаем умное уведомление для тендера
  const notification = getSmartNotification(tender);

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
        className={`bg-white border border-gray-200 rounded-xl shadow-lg cursor-pointer select-none relative z-10 active:bg-gray-50 transition-colors border-l-4 ${
          tender.status === 'новый' ? 'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-400 shadow-gray-500/20' :
          tender.status === 'подано' ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-l-blue-500 shadow-blue-500/30' :
          tender.status === 'на рассмотрении' ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-l-yellow-500 shadow-yellow-500/30' :
          tender.status === 'победа' ? 'bg-gradient-to-r from-purple-500/10 to-transparent border-l-purple-500 shadow-purple-500/30' :
          tender.status === 'в работе' ? 'bg-gradient-to-r from-green-500/10 to-transparent border-l-green-500 shadow-green-500/30' :
          tender.status === 'завершён' ? 'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-600 shadow-gray-500/20' :
          tender.status === 'проигрыш' ? 'bg-gradient-to-r from-red-500/10 to-transparent border-l-red-500 shadow-red-500/30' :
          'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-400 shadow-gray-500/20'
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

          {/* УМНОЕ УВЕДОМЛЕНИЕ */}
          {notification && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{notification.icon}</span>
                <span className={`text-[13px] font-medium flex-1 ${
                  notification.color === 'red' ? 'text-red-600' :
                  notification.color === 'orange' ? 'text-orange-600' :
                  notification.color === 'yellow' ? 'text-yellow-600' :
                  notification.color === 'blue' ? 'text-blue-600' :
                  notification.color === 'green' ? 'text-green-600' :
                  notification.color === 'purple' ? 'text-purple-600' :
                  'text-gray-600'
                }`}>
                  {notification.message}
                </span>
                {notification.priority === 'urgent' && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[11px] font-semibold rounded-full">
                    СРОЧНО
                  </span>
                )}
              </div>
              <div className="h-px bg-gray-100 my-2"></div>
            </>
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
