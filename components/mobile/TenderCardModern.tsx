'use client';

import { m, PanInfo } from 'framer-motion';
import { Tender } from '@/lib/supabase';
import { Calendar, DollarSign, Trash2, Clock, MapPin, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { memo } from 'react';

interface TenderCardModernProps {
  tender: Tender;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
}

const TenderCardModernComponent = ({ 
  tender, 
  onDelete, 
  onClick, 
  isOpen, 
  onOpen,
  getStatusColor 
}: TenderCardModernProps) => {
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
    <div className="relative overflow-hidden rounded-2xl">
      {/* Кнопка удаления */}
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

      {/* Карточка тендера - СОВРЕМЕННЫЙ ДИЗАЙН */}
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
        className={`bg-white rounded-2xl shadow-sm active:shadow-md cursor-pointer select-none relative z-10 border-l-4 ${
          tender.status === 'новый' ? 'border-l-blue-500' :
          tender.status === 'подано' ? 'border-l-cyan-500' :
          tender.status === 'на рассмотрении' ? 'border-l-yellow-500' :
          tender.status === 'победа' ? 'border-l-purple-500' :
          tender.status === 'в работе' ? 'border-l-green-500' :
          tender.status === 'завершён' ? 'border-l-gray-500' :
          tender.status === 'проигрыш' ? 'border-l-red-500' :
          'border-l-gray-300'
        }`}
      >

        <div className="p-4">
          {/* Шапка: Название + Статус */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-gray-900 text-base flex-1 line-clamp-2 leading-tight">
              {tender.name}
            </h3>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                tender.status
              )}`}
            >
              {tender.status}
            </span>
          </div>

          {/* ДЕДЛАЙН - только для новых и поданных */}
          {isDeadlineRelevant && tender.submission_deadline && daysLeft !== null && (
            <div className="mb-2 flex items-center gap-2">
              <Clock className={`w-4 h-4 flex-shrink-0 ${
                urgency === 'urgent' ? 'text-red-500' :
                urgency === 'soon' ? 'text-orange-500' :
                urgency === 'expired' ? 'text-gray-400' :
                'text-gray-400'
              }`} />
              <span className="text-sm text-gray-700">
                {formatDate(tender.submission_deadline)}
              </span>
              <span className={`ml-auto text-xs font-semibold ${
                urgency === 'urgent' ? 'text-red-600' :
                urgency === 'soon' ? 'text-orange-600' :
                urgency === 'expired' ? 'text-gray-500' :
                'text-gray-500'
              }`}>
                {daysLeft < 0 ? 'Просрочен' : 
                 daysLeft === 0 ? 'Сегодня!' :
                 daysLeft === 1 ? 'Завтра' :
                 `${daysLeft} дн.`}
              </span>
              {urgency === 'urgent' && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                  СРОЧНО
                </span>
              )}
            </div>
          )}

          {/* Разделитель если есть дедлайн */}
          {isDeadlineRelevant && tender.submission_deadline && (
            <div className="h-px bg-gray-100 my-2"></div>
          )}

          {/* Информация о тендере - компактно */}
          <div className="space-y-1.5 text-sm text-gray-600">
            {/* Дата подачи */}
            {tender.submission_date && tender.status !== 'новый' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>Подано {formatDate(tender.submission_date)}</span>
              </div>
            )}

            {/* Цена подачи */}
            {tender.submitted_price && tender.status !== 'новый' && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>Подача: <span className="font-semibold text-gray-900">{formatPrice(tender.submitted_price)}</span></span>
              </div>
            )}

            {/* Цена победы */}
            {tender.win_price && (tender.status === 'победа' || tender.status === 'в работе' || tender.status === 'завершён') && (
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <span className="font-semibold text-green-600">{formatPrice(tender.win_price)}</span>
              </div>
            )}

            {/* Регион */}
            {tender.region && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{tender.region}</span>
              </div>
            )}
            
            {/* Начальная цена - только для новых */}
            {tender.start_price && tender.status === 'новый' && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">{formatPrice(tender.start_price)}</span>
              </div>
            )}
          </div>

        </div>
      </m.div>
    </div>
  );
};

export const TenderCardModern = memo(TenderCardModernComponent);
