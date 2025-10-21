'use client';

import { useState, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteButtonWidth = 80;

  const translateX = isOpen ? -deleteButtonWidth : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - translateX);
    onOpen(tender.id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX - startX;
    
    if (currentX <= 0 && currentX >= -deleteButtonWidth && cardRef.current) {
      cardRef.current.style.transform = `translateX(${currentX}px)`;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (!cardRef.current) return;

    const currentTransform = cardRef.current.style.transform;
    const match = currentTransform.match(/translateX\((-?\d+(?:\.\d+)?)px\)/);
    const currentX = match ? parseFloat(match[1]) : 0;

    if (currentX < -deleteButtonWidth / 2) {
      onOpen(tender.id);
    } else {
      onOpen(-1);
    }

    cardRef.current.style.transform = '';
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
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        className="bg-white rounded-2xl p-4 shadow-sm active:shadow-md cursor-pointer select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
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
      </div>
    </div>
  );
}
