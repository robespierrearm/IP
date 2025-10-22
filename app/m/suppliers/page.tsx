'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Supplier } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { Search, Phone, Mail, Building2, User, Plus, AlertTriangle, X } from 'lucide-react';
import { SwipeableSupplierCard } from '@/components/mobile/SwipeableSupplierCard';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number>(-1);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, debouncedSearchQuery]);

  // Автозакрытие открытой карточки через 3 секунды
  useEffect(() => {
    if (openCardId !== -1) {
      const timer = setTimeout(() => {
        setOpenCardId(-1);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [openCardId]);

  // Закрытие при клике вне карточки
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openCardId !== -1) {
        const target = e.target as HTMLElement;
        const isClickOnCard = target.closest('[data-card-id]');
        
        if (!isClickOnCard) {
          setOpenCardId(-1);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openCardId]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSuppliers();
      if (response.success && response.data) {
        const data = response.data as Supplier[];
        const sorted = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setSuppliers(sorted);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    }
    setIsLoading(false);
  };

  const filterSuppliers = () => {
    if (!debouncedSearchQuery) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.phone?.toLowerCase().includes(query) ||
        s.contact_person?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
    setFilteredSuppliers(filtered);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleDeleteRequest = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    setIsDeleting(true);
    setDeletingId(supplierToDelete.id);

    try {
      await apiClient.deleteSupplier(supplierToDelete.id);

      // Анимация исчезновения - ждём 300ms перед удалением из state
      setTimeout(() => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
        setDeletingId(null);
        setSupplierToDelete(null);
        setIsDeleting(false);
      }, 300);
    } catch (error) {
      console.error('Ошибка удаления поставщика:', error);
      setIsDeleting(false);
      setDeletingId(null);
      alert('Не удалось удалить поставщика');
    }
  };

  const handleDeleteCancel = () => {
    setSupplierToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Поставщики</h1>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, телефону..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Список поставщиков */}
      <div className="px-6 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Поставщики не найдены' : 'Поставщиков пока нет'}
            </p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`transition-all duration-300 ${
                deletingId === supplier.id
                  ? 'opacity-0 scale-95 -translate-x-full'
                  : 'opacity-100 scale-100 translate-x-0'
              }`}
            >
              <SwipeableSupplierCard
                supplier={supplier}
                onDelete={handleDeleteRequest}
                onClick={setSelectedSupplier}
                isOpen={openCardId === supplier.id}
                onOpen={setOpenCardId}
              />
            </div>
          ))
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      {supplierToDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Иконка предупреждения */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Заголовок */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Удалить поставщика?
            </h3>

            {/* Описание */}
            <p className="text-gray-600 text-center mb-6">
              Вы уверены, что хотите удалить <span className="font-semibold">{supplierToDelete.name}</span>?
              <br />
              <span className="text-sm text-red-600">Это действие нельзя отменить.</span>
            </p>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium active:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно детального просмотра */}
      <AnimatePresence>
        {selectedSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end pb-20"
            onClick={() => setSelectedSupplier(null)}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => {
                // Если потянули вниз больше чем на 100px - закрываем
                if (info.offset.y > 100) {
                  setSelectedSupplier(null);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            {/* Индикатор свайпа */}
            <div className="flex justify-center py-3 sticky top-0 bg-white z-10">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              {/* Заголовок */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedSupplier.name}</h2>
                  {selectedSupplier.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {selectedSupplier.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Детали */}
              <div className="space-y-4 mb-6">
                {selectedSupplier.contact_person && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Контактное лицо</div>
                    <div className="font-medium text-gray-900">{selectedSupplier.contact_person}</div>
                  </div>
                )}

                {selectedSupplier.phone && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Телефон</div>
                    <a
                      href={`tel:${selectedSupplier.phone.replace(/\D/g, '')}`}
                      className="font-medium text-green-600 text-lg"
                    >
                      {selectedSupplier.phone}
                    </a>
                  </div>
                )}

                {selectedSupplier.email && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <a href={`mailto:${selectedSupplier.email}`} className="font-medium text-blue-600">
                      {selectedSupplier.email}
                    </a>
                  </div>
                )}

                {selectedSupplier.notes && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Примечания</div>
                    <div className="text-gray-900 bg-gray-50 rounded-xl p-3">{selectedSupplier.notes}</div>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3">
                {selectedSupplier.phone && (
                  <button
                    onClick={() => handleCall(selectedSupplier.phone!)}
                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 active:bg-green-600 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Позвонить
                  </button>
                )}
                {selectedSupplier.email && (
                  <button
                    onClick={() => handleEmail(selectedSupplier.email!)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 active:bg-blue-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Написать
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedSupplier(null);
                  router.push(`/m/suppliers/edit/${selectedSupplier.id}`);
                }}
                className="w-full mt-3 bg-primary-500 text-white py-3 rounded-xl font-medium active:bg-primary-600 transition-colors"
              >
                Редактировать
              </button>

              <button
                onClick={() => setSelectedSupplier(null)}
                className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/m/suppliers/add')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
