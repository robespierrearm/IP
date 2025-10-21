'use client';

import { motion, PanInfo } from 'framer-motion';
import { Supplier } from '@/lib/supabase';
import { Phone, Mail, Building2, User, Trash2 } from 'lucide-react';

interface SwipeableSupplierCardProps {
  supplier: Supplier;
  onDelete: (supplier: Supplier) => void;
  onClick: (supplier: Supplier) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
}

export function SwipeableSupplierCard({ supplier, onDelete, onClick, isOpen, onOpen }: SwipeableSupplierCardProps) {
  const deleteButtonWidth = 80;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = deleteButtonWidth * 0.5; // 50% порог для открытия
    const closeThreshold = 20; // Минимальный порог для закрытия

    if (info.offset.x < -threshold) {
      // Свайп влево достаточно сильный - открываем кнопку удаления
      onOpen(supplier.id);
    } else if (info.offset.x > closeThreshold && isOpen) {
      // Свайп вправо - закрываем
      onOpen(-1);
    } else if (Math.abs(info.offset.x) < threshold && !isOpen) {
      // Недостаточный свайп - закрываем (предотвращаем застревание)
      onOpen(-1);
    }
    // Если уже открыто и свайп недостаточный - оставляем открытым
  };

  const handleCardClick = () => {
    // Если кнопка удаления видна, закрываем её
    if (isOpen) {
      onOpen(-1);
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
      </motion.div>
    </div>
  );
}
