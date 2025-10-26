'use client';

import { useState, useEffect } from 'react';
import { Tender, DocumentType, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { MapPin, BarChart3, FileText, Receipt, ArrowRight, Clock, TrendingDown, Trophy, AlertCircle } from 'lucide-react';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { TenderFinancialModal } from '@/components/TenderFinancialModal';
import { formatPrice, formatDate } from '@/lib/tender-utils';

interface TenderCardExpandedNEWProps {
  tender: Tender;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * НОВАЯ ВЕРСИЯ С НУЛЯ - УМНАЯ КАРТОЧКА
 * 
 * ФИШКИ:
 * 1. Smart Status - показывает только нужное для текущего статуса
 * 2. Next Action - подсказка что делать дальше
 * 3. Quick Metrics - ключевые числа крупно
 * 4. Mini Grid - компактная таблица данных
 * 5. Progress % - не круги, а процент выполнения
 */
export function TenderCardExpandedNEW({ tender, isExpanded, onToggle }: TenderCardExpandedNEWProps) {
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('прочее');
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [docCounts, setDocCounts] = useState({ docs: 0, closing: 0 });
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    if (isExpanded) {
      Promise.all([
        supabase.from('files').select('document_type').eq('tender_id', tender.id),
        supabase.from('tender_links').select('document_type').eq('tender_id', tender.id),
        supabase.from('expenses').select('amount').eq('tender_id', tender.id),
      ]).then(([files, links, exp]) => {
        let docs = 0, closing = 0;
        [...(files.data || []), ...(links.data || [])].forEach(item => {
          if (item.document_type === 'тендерная документация') docs++;
          else if (item.document_type === 'закрывающие документы') closing++;
        });
        setDocCounts({ docs, closing });
        setExpenses(exp.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0);
      });
    }
  }, [isExpanded, tender.id]);

  // Расчёты
  const reduction = tender.start_price && tender.submitted_price 
    ? { amount: tender.start_price - tender.submitted_price, pct: ((tender.start_price - tender.submitted_price) / tender.start_price) * 100 }
    : null;
  
  const profit = (tender.win_price || 0) - expenses;
  const profitPct = tender.win_price ? (profit / tender.win_price) * 100 : 0;

  // УМНЫЙ КОНТЕКСТ - что показывать в зависимости от статуса
  const getSmartContext = () => {
    const status = tender.status;

    // НОВЫЙ - показываем дедлайн и начальную цену
    if (status === 'новый') {
      const daysLeft = tender.submission_deadline 
        ? Math.ceil((new Date(tender.submission_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      
      return {
        metrics: [
          { label: 'До дедлайна', value: daysLeft ? `${daysLeft}д` : '—', color: daysLeft && daysLeft <= 2 ? 'text-red-600' : 'text-orange-600' },
          { label: 'Начальная', value: tender.start_price ? formatPrice(tender.start_price) : '—', color: 'text-gray-900' },
        ],
        nextAction: { text: 'Подготовить заявку', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600' },
        gridData: [
          ['Публикация', formatDate(tender.publication_date)],
          ['Дедлайн', tender.submission_deadline ? formatDate(tender.submission_deadline) : '—'],
          ['Начальная цена', tender.start_price ? formatPrice(tender.start_price) : '—'],
        ],
      };
    }

    // ПОДАНО - показываем снижение и время до дедлайна
    if (status === 'подано') {
      return {
        metrics: [
          { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}% (${formatPrice(reduction.amount)})` : '—', color: 'text-green-600' },
          { label: 'Подано', value: tender.submitted_price ? formatPrice(tender.submitted_price) : '—', color: 'text-blue-700' },
        ],
        nextAction: { text: 'Ожидаем рассмотрения', icon: Clock, color: 'bg-gray-400 hover:bg-gray-500' },
        gridData: [
          ['Подано', tender.submission_date ? formatDate(tender.submission_date) : '—'],
          ['Снижение', reduction ? formatPrice(reduction.amount) : '—'],
          ['Начальная', tender.start_price ? formatPrice(tender.start_price) : '—'],
        ],
      };
    }

    // НА РАССМОТРЕНИИ - показываем снижение и ждём
    if (status === 'на рассмотрении') {
      return {
        metrics: [
          { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}% (${formatPrice(reduction.amount)})` : '—', color: 'text-green-600' },
          { label: 'Подано', value: tender.submitted_price ? formatPrice(tender.submitted_price) : '—', color: 'text-blue-700' },
        ],
        nextAction: { text: 'Ожидаем решения', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600' },
        gridData: [
          ['Подано', tender.submission_date ? formatDate(tender.submission_date) : '—'],
          ['Снижение', reduction ? `${reduction.pct.toFixed(1)}%` : '—'],
        ],
      };
    }

    // ПОБЕДА - показываем снижение и цену победы
    if (status === 'победа') {
      return {
        metrics: [
          { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}% (${formatPrice(reduction.amount)})` : '—', color: 'text-green-600' },
          { label: 'Победа', value: tender.win_price ? formatPrice(tender.win_price) : '—', color: 'text-purple-700' },
        ],
        nextAction: { text: 'Начать работу', icon: Trophy, color: 'bg-purple-500 hover:bg-purple-600' },
        gridData: [
          ['Снижение', reduction ? formatPrice(reduction.amount) : '—'],
          ['Цена победы', tender.win_price ? formatPrice(tender.win_price) : '—'],
        ],
      };
    }

    // В РАБОТЕ / ЗАВЕРШЁН - показываем прибыль
    if (status === 'в работе' || status === 'завершён') {
      return {
        metrics: [
          { label: 'Прибыль', value: formatPrice(profit), color: profit > 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Маржа', value: `${profitPct.toFixed(0)}%`, color: profitPct > 30 ? 'text-green-600' : profitPct > 0 ? 'text-blue-600' : 'text-red-600' },
        ],
        nextAction: status === 'в работе' 
          ? { text: 'Управлять расходами', icon: BarChart3, color: 'bg-green-500 hover:bg-green-600' }
          : { text: 'Просмотреть отчёт', icon: BarChart3, color: 'bg-gray-500 hover:bg-gray-600' },
        gridData: [
          ['Доход', tender.win_price ? formatPrice(tender.win_price) : '—'],
          ['Расходы', formatPrice(expenses)],
          ['Прибыль', formatPrice(profit)],
        ],
      };
    }

    // ПРОИГРЫШ - показываем что не получилось
    if (status === 'проигрыш') {
      return {
        metrics: [
          { label: 'Подано', value: tender.submitted_price ? formatPrice(tender.submitted_price) : '—', color: 'text-gray-600' },
          { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}% (${formatPrice(reduction.amount)})` : '—', color: 'text-gray-500' },
        ],
        nextAction: { text: 'Анализ проигрыша', icon: AlertCircle, color: 'bg-red-500 hover:bg-red-600' },
        gridData: [
          ['Подано', tender.submission_date ? formatDate(tender.submission_date) : '—'],
          ['Снижение', reduction ? formatPrice(reduction.amount) : '—'],
        ],
      };
    }

    return { metrics: [], nextAction: null, gridData: [] };
  };

  const context = getSmartContext();

  // Прогресс в процентах
  const getProgress = () => {
    const stages = ['новый', 'подано', 'на рассмотрении', 'победа', 'в работе', 'завершён'];
    const index = stages.indexOf(tender.status);
    if (index === -1) return 0; // проигрыш
    return Math.round(((index + 1) / stages.length) * 100);
  };

  const progress = getProgress();

  return (
    <>
      {isExpanded && (
        <div className="border-t bg-white p-4 animate-in slide-in-from-top-2 duration-200">
          {/* 2 КОЛОНКИ: Инфо слева, Действия справа */}
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            
            {/* ЛЕВАЯ: Информация */}
            <div className="space-y-3">
              {/* Ключевые метрики */}
              {context.metrics.length > 0 && (
                <div className="flex gap-3">
                  {context.metrics.map((metric, i) => (
                    <div key={i} className="flex-1 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-0.5">{metric.label}</div>
                      <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Детали - простая таблица */}
              {context.gridData.length > 0 && (
                <div className="space-y-2">
                  {context.gridData.map(([label, value], i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Номер закупки */}
              {tender.purchase_number && (
                <div className="text-xs text-gray-400 font-mono mt-2">
                  #{tender.purchase_number}
                </div>
              )}
            </div>

            {/* ПРАВАЯ: Кнопки действий */}
            <div className="space-y-2">
              {/* Кнопки в столбик */}
              <button
                onClick={() => { setSelectedDocType('тендерная документация'); setDocumentsModalOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-blue-50 border border-gray-300 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Документы</span>
                {docCounts.docs > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    {docCounts.docs}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setSelectedDocType('закрывающие документы'); setDocumentsModalOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-green-50 border border-gray-300 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                <Receipt className="h-4 w-4 text-green-600" />
                <span>Закрывающие</span>
                {docCounts.closing > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                    {docCounts.closing}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFinancialModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-purple-50 border border-gray-300 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span>Финансы</span>
              </button>

              {tender.region && (
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tender.region || '')}`, '_blank')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-orange-50 border border-gray-300 rounded-lg transition-colors text-sm font-medium text-gray-700"
                >
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span>Карта</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <TenderDocumentsModal
        open={documentsModalOpen}
        onOpenChange={setDocumentsModalOpen}
        tenderId={tender.id}
        tenderName={tender.name}
        documentType={selectedDocType}
        onMaterialsChange={() => {}}
      />

      <TenderFinancialModal
        open={financialModalOpen}
        onOpenChange={setFinancialModalOpen}
        tender={tender}
      />
    </>
  );
}
