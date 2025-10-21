'use client';

import { useState, useRef, useEffect } from 'react';
import { Supplier } from '@/lib/supabase';
import { Phone, Mail, Building2, User, Trash2 } from 'lucide-react';

interface SwipeableSupplierCardProps {
  supplier: Supplier;
  onDelete: (supplier: Supplier) => void;
  onClick: (supplier: Supplier) => void;
}

export function SwipeableSupplierCard({ supplier, onDelete, onClick }: SwipeableSupplierCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteButtonWidth = 80; // Ширина кнопки удаления

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - translateX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX - startX;
    
    // Ограничиваем свайп только влево (отрицательные значения)
    if (currentX <= 0 && currentX >= -deleteButtonWidth) {
      setTranslateX(currentX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Если свайпнули больше половины ширины кнопки - показываем кнопку
    if (translateX < -deleteButtonWidth / 2) {
      setTranslateX(-deleteButtonWidth);
    } else {
      // Иначе возвращаем на место
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - translateX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX - startX;
    
    if (currentX <= 0 && currentX >= -deleteButtonWidth) {
      setTranslateX(currentX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    if (translateX < -deleteButtonWidth / 2) {
      setTranslateX(-deleteButtonWidth);
    } else {
      setTranslateX(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, translateX]);

  const handleCardClick = () => {
    // Если кнопка удаления видна, закрываем её
    if (translateX < 0) {
      setTranslateX(0);
    } else {
      onClick(supplier);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(supplier);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Кнопка удаления (фон) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-2xl"
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

      {/* Карточка поставщика */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
        className="bg-white rounded-2xl p-4 shadow-sm active:shadow-md cursor-pointer select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base mb-1">
              {supplier.name}
            </h3>
            {supplier.category && (
              <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg">
                {supplier.category}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {supplier.contact_person && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{supplier.contact_person}</span>
            </div>
          )}

          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <a
                href={`tel:${supplier.phone.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:underline"
              >
                {supplier.phone}
              </a>
            </div>
          )}

          {supplier.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a
                href={`mailto:${supplier.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:underline truncate"
              >
                {supplier.email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
