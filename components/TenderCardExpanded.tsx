'use client';

import { useState, useEffect } from 'react';
import { Tender, DocumentType, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, BarChart3, FileText, Receipt, ChevronDown, ChevronUp, Hash, TrendingDown, DollarSign } from 'lucide-react';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { TenderFinancialModal } from '@/components/TenderFinancialModal';

interface TenderCardExpandedProps {
  tender: Tender;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TenderCardExpanded({ tender, isExpanded, onToggle }: TenderCardExpandedProps) {
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('прочее');
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [materialCounts, setMaterialCounts] = useState({
    'тендерная документация': 0,
    'закрывающие документы': 0,
  });

  // Загрузка счетчиков материалов
  const loadMaterialCounts = async () => {
    try {
      // Загружаем файлы
      const { data: files } = await supabase
        .from('files')
        .select('document_type')
        .eq('tender_id', tender.id);

      // Загружаем ссылки
      const { data: links } = await supabase
        .from('tender_links')
        .select('document_type')
        .eq('tender_id', tender.id);

      // Считаем материалы по типам
      const counts = {
        'тендерная документация': 0,
        'закрывающие документы': 0,
      };

      // Считаем файлы
      files?.forEach(file => {
        if (file.document_type === 'тендерная документация') {
          counts['тендерная документация']++;
        } else if (file.document_type === 'закрывающие документы') {
          counts['закрывающие документы']++;
        }
      });

      // Считаем ссылки
      links?.forEach(link => {
        if (link.document_type === 'тендерная документация') {
          counts['тендерная документация']++;
        } else if (link.document_type === 'закрывающие документы') {
          counts['закрывающие документы']++;
        }
      });

      setMaterialCounts(counts);
    } catch (error) {
      console.error('Ошибка загрузки счетчиков:', error);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadMaterialCounts();
    }
  }, [isExpanded, tender.id]);

  const openGoogleMaps = () => {
    if (!tender.region) return;
    const query = encodeURIComponent(tender.region);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Расчёт снижения цены
  const calculateReduction = () => {
    if (!tender.start_price || !tender.submitted_price) return null;
    
    const reduction = tender.start_price - tender.submitted_price;
    const percentage = (reduction / tender.start_price) * 100;
    
    return {
      amount: reduction,
      percentage: percentage,
    };
  };

  const reduction = calculateReduction();

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Раскрывающееся содержимое - НОВЫЙ ДИЗАЙН */}
      {isExpanded && (
        <div className="border-t bg-white p-4 animate-in slide-in-from-top-2 duration-300">
          {/* Информация и действия - в две колонки */}
          <div className="grid grid-cols-2 gap-3">
            {/* Левая колонка - Информация */}
            <div className="space-y-2">
              {/* Снижение цены */}
              {reduction && (
                <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-green-700 font-medium">Снижение цены</p>
                    <p className="text-xs font-bold text-green-600 truncate">
                      {formatAmount(reduction.amount)} ({reduction.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              )}

              {/* Регион - кликабельный с красной булавкой */}
              {tender.region && (
                <button 
                  onClick={openGoogleMaps}
                  className="w-full flex items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 hover:border-red-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="h-4 w-4 text-red-600 fill-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-red-700 font-medium">Регион / Карта</p>
                      <p className="text-xs font-bold text-red-600 truncate">{tender.region}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-red-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Правая колонка - Действия */}
            <div className="space-y-2">
              {/* Финансовая сводка */}
              <button 
                onClick={() => setFinancialModalOpen(true)}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-purple-700">Финансовая сводка</p>
                  <p className="text-[10px] text-purple-600">Доходы и расходы</p>
                </div>
              </button>

              {/* Документация */}
              <button 
                onClick={() => {
                  setSelectedDocType('тендерная документация');
                  setDocumentsModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-700">
                    Документация {materialCounts['тендерная документация'] > 0 && `(${materialCounts['тендерная документация']})`}
                  </p>
                  <p className="text-[10px] text-blue-600">Тендерные документы</p>
                </div>
              </button>

              {/* Закрывающие документы */}
              <button 
                onClick={() => {
                  setSelectedDocType('закрывающие документы');
                  setDocumentsModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700">
                    Закрывающие {materialCounts['закрывающие документы'] > 0 && `(${materialCounts['закрывающие документы']})`}
                  </p>
                  <p className="text-[10px] text-emerald-600">Акты, счета</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальные окна */}
      <TenderDocumentsModal
        open={documentsModalOpen}
        onOpenChange={setDocumentsModalOpen}
        tenderId={tender.id}
        tenderName={tender.name}
        documentType={selectedDocType}
        onMaterialsChange={loadMaterialCounts}
      />

      <TenderFinancialModal
        open={financialModalOpen}
        onOpenChange={setFinancialModalOpen}
        tender={tender}
      />
    </>
  );
}
