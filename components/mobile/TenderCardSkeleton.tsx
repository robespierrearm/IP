/**
 * Skeleton для карточки тендера (мобильная версия)
 * Показывается во время загрузки данных
 * Улучшенная версия с плавной анимацией
 */

export function TenderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm overflow-hidden relative">
      {/* Градиентная анимация */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/50 to-transparent"></div>
      
      {/* Заголовок и статус */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded-lg w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16 ml-2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      </div>

      {/* Информация */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.15s' }}></div>
          <div className="h-3 bg-gray-100 rounded-lg w-32 animate-pulse" style={{ animationDelay: '0.25s' }}></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-3 bg-gray-100 rounded-lg w-24 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Группа skeleton карточек
 */
export function TenderCardSkeletonGroup({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TenderCardSkeleton key={index} />
      ))}
    </div>
  );
}
