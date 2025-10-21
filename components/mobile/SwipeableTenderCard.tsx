'use client';

import { motion, PanInfo } from 'framer-motion';
import { Tender } from '@/lib/supabase';
import { Calendar, DollarSign, Trash2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

interface SwipeableTenderCardProps {
  tender: Tender;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
}

export function SwipeableTenderCard({ 
  tender, 
  onDelete, 
  onClick, 
  isOpen, 
  onOpen,
  getStatusColor 
}: SwipeableTenderCardProps) {
  const deleteButtonWidth = 80;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = deleteButtonWidth * 0.4; // 40% порог

    if (info.offset.x < -threshold) {
      // Свайп влево - открываем кнопку удаления
      onOpen(tender.id);
    } else if (info.offset.x > threshold && isOpen) {
      // Свайп вправо - закрываем
      onOpen(-1);
    } else {
      // Недостаточный свайп - возвращаем в текущее состояние
      if (!isOpen) {
        onOpen(-1);
      }
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
      <motion.div
        drag="x"
        dragConstraints={{ left: -deleteButtonWidth, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        initial={{ x: 0 }}
        animate={{ x: isOpen ? -deleteButtonWidth : 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 35
        }}
        className="bg-white rounded-2xl p-4 shadow-sm active:shadow-md cursor-pointer select-none relative z-10"
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
            <Calendar className="w-3 h-3" />
            <span>{formatDate(tender.publication_date)}</span>
          </div>
          {tender.start_price && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span className="font-medium text-gray-900">
                {formatPrice(tender.start_price)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
