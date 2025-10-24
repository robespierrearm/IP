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
        className="bg-white rounded-2xl shadow-sm active:shadow-md cursor-pointer select-none relative z-10 overflow-hidden"
      >
        {/* Полоска срочности сверху */}
        {urgency === 'urgent' && (
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
        )}
        {urgency === 'soon' && (
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
        )}
        {urgency === 'normal' && tender.submission_deadline && (
          <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
        )}
        {urgency === 'expired' && (
          <div className="h-1 bg-gray-400"></div>
        )}

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

          {/* ДЕДЛАЙН - ГЛАВНОЕ! */}
          {tender.submission_deadline && daysLeft !== null && (
            <div className={`mb-3 p-2.5 rounded-xl flex items-center gap-2 ${
              urgency === 'urgent' ? 'bg-red-50 border border-red-200' :
              urgency === 'soon' ? 'bg-yellow-50 border border-yellow-200' :
              urgency === 'expired' ? 'bg-gray-50 border border-gray-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <Clock className={`w-4 h-4 flex-shrink-0 ${
                urgency === 'urgent' ? 'text-red-600' :
                urgency === 'soon' ? 'text-yellow-600' :
                urgency === 'expired' ? 'text-gray-600' :
                'text-green-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  urgency === 'urgent' ? 'text-red-900' :
                  urgency === 'soon' ? 'text-yellow-900' :
                  urgency === 'expired' ? 'text-gray-900' :
                  'text-green-900'
                }`}>
                  {formatDate(tender.submission_deadline)}
                </p>
              </div>
              <div className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                urgency === 'urgent' ? 'bg-red-600 text-white' :
                urgency === 'soon' ? 'bg-yellow-600 text-white' :
                urgency === 'expired' ? 'bg-gray-600 text-white' :
                'bg-green-600 text-white'
              }`}>
                {daysLeft < 0 ? 'Просрочен' : `${daysLeft}д`}
              </div>
            </div>
          )}

          {/* Информация в 2 колонки */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Дата публикации */}
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">{formatDate(tender.publication_date)}</span>
            </div>

            {/* Цена */}
            {tender.start_price && (
              <div className="flex items-center gap-1.5 text-gray-900">
                <DollarSign className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="font-semibold truncate">
                  {formatPrice(tender.start_price)}
                </span>
              </div>
            )}

            {/* Регион */}
            {tender.region && (
              <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span className="truncate">{tender.region}</span>
              </div>
            )}
          </div>

          {/* Бейдж СРОЧНО */}
          {urgency === 'urgent' && (
            <div className="mt-2 flex items-center gap-1.5 text-red-600">
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-xs font-bold">СРОЧНО!</span>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
};

export const TenderCardModern = memo(TenderCardModernComponent);
