'use client';

import { m, PanInfo } from 'framer-motion';
import { Tender } from '@/lib/supabase';
import { Calendar, DollarSign, Trash2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { memo, MouseEvent, TouchEvent, PointerEvent } from 'react';

interface SwipeableTenderCardProps {
  tender: Tender;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
}

const SwipeableTenderCardComponent = ({ 
  tender, 
  onDelete, 
  onClick, 
  isOpen, 
  onOpen,
  getStatusColor 
}: SwipeableTenderCardProps) => {
  const deleteButtonWidth = 80;

  const handleDrag = (_event: any, info: PanInfo) => {
    // Если начали свайпить эту карточку - закрываем все другие СРАЗУ
    if (Math.abs(info.offset.x) > 5 && !isOpen) {
      onOpen(-1); // Закрываем все открытые карточки
    }
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const openThreshold = deleteButtonWidth * 0.5; // 50% для открытия
    const closeThreshold = 20; // Минимум для закрытия

    // Если свайп влево достаточно сильный - открываем
    if (info.offset.x < -openThreshold) {
      onOpen(tender.id);
    } 
    // Если свайп вправо - всегда закрываем
    else if (info.offset.x > closeThreshold) {
      onOpen(-1);
    }
    // Любой другой случай - закрываем (предотвращаем застревание)
    else {
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
    <div className="relative overflow-hidden rounded-2xl">
      {/* Кнопка удаления (фон) */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-2xl"
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

      {/* Карточка тендера */}
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
        className={`bg-white border border-gray-200 rounded-2xl p-4 shadow-lg active:shadow-xl cursor-pointer select-none relative z-10 border-l-4 ${
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
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-2">
            {tender.name}
          </h3>
          <span
            className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(
              tender.status
            )}`}
          >
            {tender.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>{formatDate(tender.publication_date)}</span>
          </div>
          {tender.start_price && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium text-gray-900">
                {formatPrice(tender.start_price)}
              </span>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
};

// Экспортируем мемоизированную версию
export const SwipeableTenderCard = memo(SwipeableTenderCardComponent);
