/**
 * Анимированная обёртка для карточки тендера
 * Использует Framer Motion для плавных появлений/удалений
 * Оптимизировано с React.memo для предотвращения лишних ре-рендеров
 */

import { memo } from 'react';
import { m } from 'framer-motion';
import { SwipeableTenderCard } from './SwipeableTenderCard';
import { TenderCardModern } from './TenderCardModern';
import { TenderCardApple } from './TenderCardApple';
import { Tender } from '@/lib/supabase';

type CardStyle = 'original' | 'modern' | 'apple';

interface AnimatedTenderCardProps {
  tender: Tender;
  index: number;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
  isDeleting?: boolean;
  cardStyle?: CardStyle;
}

export const AnimatedTenderCard = memo(function AnimatedTenderCard({
  tender,
  index,
  onDelete,
  onClick,
  isOpen,
  onOpen,
  getStatusColor,
  isDeleting = false,
  cardStyle = 'original',
}: AnimatedTenderCardProps) {
  // Выбираем компонент карточки в зависимости от стиля
  const CardComponent = 
    cardStyle === 'modern' ? TenderCardModern :
    cardStyle === 'apple' ? TenderCardApple :
    SwipeableTenderCard;

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isDeleting ? 0 : 1, 
        y: 0, 
        scale: 1,
        x: isDeleting ? -100 : 0 
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9, 
        x: -100,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05, // Каскадное появление
        ease: [0.4, 0, 0.2, 1],
        layout: { duration: 0.3 }
      }}
    >
      <CardComponent
        tender={tender}
        onDelete={onDelete}
        onClick={onClick}
        isOpen={isOpen}
        onOpen={onOpen}
        getStatusColor={getStatusColor}
      />
    </m.div>
  );
});
