/**
 * Анимированная обёртка для карточки тендера
 * Использует Framer Motion для плавных появлений/удалений
 */

import { motion } from 'framer-motion';
import { SwipeableTenderCard } from './SwipeableTenderCard';
import { Tender } from '@/lib/supabase';

interface AnimatedTenderCardProps {
  tender: Tender;
  index: number;
  onDelete: (tender: Tender) => void;
  onClick: (tender: Tender) => void;
  isOpen: boolean;
  onOpen: (id: number) => void;
  getStatusColor: (status: Tender['status']) => string;
  isDeleting?: boolean;
}

export function AnimatedTenderCard({
  tender,
  index,
  onDelete,
  onClick,
  isOpen,
  onOpen,
  getStatusColor,
  isDeleting = false,
}: AnimatedTenderCardProps) {
  return (
    <motion.div
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
      <SwipeableTenderCard
        tender={tender}
        onDelete={onDelete}
        onClick={onClick}
        isOpen={isOpen}
        onOpen={onOpen}
        getStatusColor={getStatusColor}
      />
    </motion.div>
  );
}
