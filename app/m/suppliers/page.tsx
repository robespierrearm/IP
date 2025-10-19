'use client';

import { useEffect, useState } from 'react';
import { supabase, Supplier } from '@/lib/supabase';
import { Search, Phone, Mail, Building2, User, Plus } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSuppliers(data);
    }
    setIsLoading(false);
  };

  const filterSuppliers = () => {
    if (!searchQuery) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const query = searchQuery.toLowerCase();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
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
              onClick={() => setSelectedSupplier(supplier)}
              className="bg-white rounded-2xl p-4 shadow-sm active:shadow-md transition-shadow"
            >
              {/* Название и категория */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{supplier.name}</h3>
                  {supplier.category && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      {supplier.category}
                    </span>
                  )}
                </div>
                <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>

              {/* Контактная информация */}
              <div className="space-y-2">
                {supplier.contact_person && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>{supplier.contact_person}</span>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <a
                      href={`tel:${supplier.phone.replace(/\D/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-green-600"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                )}

                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <a
                      href={`mailto:${supplier.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-blue-600 truncate"
                    >
                      {supplier.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB кнопка добавления */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-full shadow-lg active:shadow-xl transition-shadow flex items-center justify-center z-30">
        <Plus className="w-6 h-6" />
      </button>

      {/* Модальное окно детального просмотра */}
      {selectedSupplier && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedSupplier(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Индикатор свайпа */}
            <div className="flex justify-center py-3">
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
                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Позвонить
                  </button>
                )}
                {selectedSupplier.email && (
                  <button
                    onClick={() => handleEmail(selectedSupplier.email!)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Написать
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedSupplier(null)}
                className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
