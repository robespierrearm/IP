/**
 * Lazy-loaded компоненты для оптимизации bundle size
 * Загружаются только когда нужны
 * 
 * ВАЖНО: Добавляйте сюда только реально существующие компоненты!
 */

import dynamic from 'next/dynamic';

// Framer Motion компоненты (тяжёлые)
export const LazyAnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

export const LazyMotion = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false }
);
