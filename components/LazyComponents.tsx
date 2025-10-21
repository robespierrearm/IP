/**
 * Lazy-loaded компоненты для оптимизации bundle size
 * Загружаются только когда нужны
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

// Модальные окна (загружаются по требованию)
export const LazyTenderModal = dynamic(
  () => import('./mobile/TenderModal').then(mod => ({ default: mod.TenderModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    ),
    ssr: false
  }
);

// Чарты (тяжёлые, загружаются только на странице статистики)
export const LazyChart = dynamic(
  () => import('react-chartjs-2').then(mod => ({ default: mod.Line })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Загрузка графика...</div>
      </div>
    ),
    ssr: false
  }
);

// PDF viewer (очень тяжёлый)
export const LazyPDFViewer = dynamic(
  () => import('./PDFViewer'),
  {
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка PDF...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

// Markdown editor (тяжёлый)
export const LazyMarkdownEditor = dynamic(
  () => import('./MarkdownEditor'),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Загрузка редактора...</div>
      </div>
    ),
    ssr: false
  }
);
