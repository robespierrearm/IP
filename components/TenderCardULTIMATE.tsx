'use client';

import { useState, useEffect } from 'react';
import { Tender, DocumentType, supabase, STATUS_LABELS } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TenderStatusChanger } from '@/components/TenderStatusChanger';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { TenderFinancialModal } from '@/components/TenderFinancialModal';
import { 
  MapPin, ExternalLink, BarChart3, FileText, Receipt, 
  Pencil, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { formatPrice, formatDate, getStatusColor } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';
import { extractDomain } from '@/lib/url-utils';
import { m } from 'framer-motion';

interface TenderCardULTIMATEProps {
  tender: Tender;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (tenderId: number, newStatus: Tender['status'], additionalData?: Partial<Tender>) => Promise<void>;
}

/**
 * ULTIMATE VERSION - Полностью переработанная карточка
 * 
 * Закрытая: Чуть компактнее, убраны лишние иконки
 * Раскрытая: Timeline + Единая таблица + Компактные кнопки
 */
export function TenderCardULTIMATE({ tender, onEdit, onDelete, onStatusChange }: TenderCardULTIMATEProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('прочее');
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [docCounts, setDocCounts] = useState({ docs: 0, closing: 0 });
  const [expenses, setExpenses] = useState(0);
  const [bankExpenses, setBankExpenses] = useState(0);

  const notification = getSmartNotification(tender);

  useEffect(() => {
    if (isExpanded) {
      Promise.all([
        supabase.from('files').select('document_type').eq('tender_id', tender.id),
        supabase.from('tender_links').select('document_type').eq('tender_id', tender.id),
        supabase.from('expenses').select('amount, is_cash').eq('tender_id', tender.id),
      ]).then(([files, links, exp]) => {
        let docs = 0, closing = 0;
        [...(files.data || []), ...(links.data || [])].forEach(item => {
          if (item.document_type === 'тендерная документация') docs++;
          else if (item.document_type === 'закрывающие документы') closing++;
        });
        setDocCounts({ docs, closing });
        const totalExp = exp.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const bankExp = exp.data?.filter(e => !e.is_cash).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        setExpenses(totalExp);
        setBankExpenses(bankExp);
      });
    }
  }, [isExpanded, tender.id]);

  // Расчёты
  const reduction = tender.start_price && tender.submitted_price 
    ? { amount: tender.start_price - tender.submitted_price, pct: ((tender.start_price - tender.submitted_price) / tender.start_price) * 100 }
    : null;
  
  const income = tender.win_price || 0;
  const taxableProfit = income - bankExpenses;
  const tax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const profit = income - expenses - tax;
  const profitPct = income ? (profit / income) * 100 : 0;

  // Умные метрики (как в NEW версии)
  const getMetrics = () => {
    const status = tender.status;

    if (status === 'новый') {
      const daysLeft = tender.submission_deadline 
        ? Math.ceil((new Date(tender.submission_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      return [
        { label: 'До дедлайна', value: daysLeft ? `${daysLeft}д` : '—', color: daysLeft && daysLeft <= 2 ? 'text-red-600' : 'text-orange-600', icon: '⏰' },
        { label: 'Начальная', value: tender.start_price ? formatPrice(tender.start_price) : '—', color: 'text-gray-900', icon: '💰' },
      ];
    }

    if (status === 'подано' || status === 'на рассмотрении') {
      return [
        { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}%` : '—', color: 'text-green-600', icon: '↓' },
        { label: 'Подано', value: tender.submitted_price ? formatPrice(tender.submitted_price) : '—', color: 'text-blue-700', icon: '💰' },
      ];
    }

    if (status === 'победа') {
      return [
        { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}%` : '—', color: 'text-green-600', icon: '↓' },
        { label: 'Победа', value: tender.win_price ? formatPrice(tender.win_price) : '—', color: 'text-purple-700', icon: '🏆' },
      ];
    }

    if (status === 'в работе' || status === 'завершён') {
      return [
        { label: 'Прибыль', value: formatPrice(profit), color: profit > 0 ? 'text-green-600' : 'text-red-600', icon: '💰' },
        { label: 'Маржа', value: `${profitPct.toFixed(0)}%`, color: profitPct > 30 ? 'text-green-600' : profitPct > 0 ? 'text-blue-600' : 'text-red-600', icon: '📊' },
      ];
    }

    if (status === 'проигрыш') {
      return [
        { label: 'Подано', value: tender.submitted_price ? formatPrice(tender.submitted_price) : '—', color: 'text-gray-600', icon: '💰' },
        { label: 'Снижение', value: reduction ? `${reduction.pct.toFixed(0)}%` : '—', color: 'text-gray-500', icon: '↓' },
      ];
    }

    return [];
  };

  const metrics = getMetrics();

  // Timeline stages
  const getTimelineStages = () => {
    const stages = [
      { status: 'новый', label: 'Новый', date: tender.publication_date },
      { status: 'подано', label: 'Подано', date: tender.submission_date },
      { status: 'на рассмотрении', label: 'Рассм.', date: null },
      { status: 'победа', label: 'Победа', date: null },
      { status: 'в работе', label: 'Работа', date: null },
      { status: 'завершён', label: 'Готово', date: null },
    ];

    const currentIndex = stages.findIndex(s => s.status === tender.status);
    
    return stages.map((stage, index) => ({
      ...stage,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  };

  const timelineStages = getTimelineStages();

  return (
    <>
      <Card 
        className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
          tender.status === 'новый' ? 'border-l-gray-400' :
          tender.status === 'подано' ? 'border-l-blue-500' :
          tender.status === 'на рассмотрении' ? 'border-l-yellow-500' :
          tender.status === 'победа' ? 'border-l-purple-500' :
          tender.status === 'в работе' ? 'border-l-green-500' :
          tender.status === 'завершён' ? 'border-l-gray-600' :
          tender.status === 'проигрыш' ? 'border-l-red-500' :
          'border-l-gray-400'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* ЗАКРЫТАЯ КАРТОЧКА */}
        <div className="flex flex-col gap-3">
          {/* Верхняя строка: Название + Статус + Кнопка */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Название */}
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <h3 className="font-semibold text-base text-gray-900 truncate">{tender.name}</h3>
              </div>

              {/* Ссылка + Регион */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap text-xs">
                {tender.link && (
                  <a
                    href={tender.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="font-medium">{extractDomain(tender.link)}</span>
                  </a>
                )}
                {tender.region && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-700 rounded border border-gray-200">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span>{tender.region}</span>
                  </div>
                )}
              </div>

              {/* Статус + Уведомление */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
                  {STATUS_LABELS[tender.status]}
                </span>
                {notification && (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm ${
                    notification.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                    notification.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    notification.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    notification.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    notification.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    <span>{notification.icon}</span>
                    <span className="font-medium">{notification.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопки справа */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Смена статуса */}
              <div className="hidden sm:block">
                <TenderStatusChanger tender={tender} onStatusChange={onStatusChange} />
              </div>

              {/* Редактировать */}
              <m.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-200"
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
              </m.div>

              {/* Удалить */}
              <m.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 border border-red-200"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </m.div>

              {/* Раскрыть/Свернуть */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Компактная сетка данных - БЕЗ лишних иконок */}
          <div className="grid grid-cols-5 gap-2 text-xs border-t pt-2">
            <div>
              <p className="text-gray-500 mb-0.5">Публикация</p>
              <p className="font-medium text-gray-900">{formatDate(tender.publication_date)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Подача</p>
              <p className="font-medium text-gray-900">{formatDate(tender.submission_date)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Начальная</p>
              <p className="font-medium text-gray-900">{formatPrice(tender.start_price)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Подано</p>
              <p className="font-medium text-gray-900">{formatPrice(tender.submitted_price)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Победа</p>
              <p className="font-medium text-green-700">{formatPrice(tender.win_price)}</p>
            </div>
          </div>

          {/* Мобильный StatusChanger */}
          <div className="sm:hidden border-t pt-2" onClick={(e) => e.stopPropagation()}>
            <TenderStatusChanger tender={tender} onStatusChange={onStatusChange} />
          </div>
        </div>

        {/* РАСКРЫТАЯ КАРТОЧКА - 2 КОЛОНКИ */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-[2fr_1fr] gap-6">
              
              {/* ЛЕВАЯ КОЛОНКА: Timeline + Таблица данных */}
              <div className="space-y-3">
                {/* TIMELINE + МЕТРИКИ В ОДНУ СТРОКУ */}
                <div className="grid grid-cols-[2fr_0.8fr_0.8fr] gap-2">
                  {/* TIMELINE - компактный с подписями */}
                  {tender.status !== 'проигрыш' && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        {timelineStages.map((stage, index) => (
                          <div key={stage.status} className="flex-1 flex flex-col items-center relative">
                            {/* Линия */}
                            {index < timelineStages.length - 1 && (
                              <div className={`absolute top-3 left-1/2 w-full h-0.5 -z-0 ${
                                stage.isActive ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                            )}
                            
                            {/* Точка */}
                            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                              stage.isCurrent ? 'bg-blue-500 text-white scale-110' :
                              stage.isActive ? 'bg-blue-200 text-blue-700' :
                              'bg-gray-200 text-gray-400'
                            }`}>
                              {index + 1}
                            </div>

                            {/* Подпись */}
                            <div className="text-[9px] text-gray-600 text-center">{stage.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Если проигрыш - пустая колонка */}
                  {tender.status === 'проигрыш' && <div />}

                  {/* МЕТРИКИ - 2 компактные карточки */}
                  {metrics.map((metric, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[9px] text-gray-500 mb-0.5">{metric.label}</div>
                      <div className={`text-sm font-bold ${metric.color} flex items-center gap-1`}>
                        <span className="text-xs">{metric.icon}</span>
                        <span>{metric.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ЕДИНАЯ ТАБЛИЦА ДАННЫХ */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Публикация</span>
                    <span className="font-medium text-gray-900">{formatDate(tender.publication_date)}</span>
                  </div>
                  
                  {tender.submission_date && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Подача</span>
                      <span className="font-medium text-gray-900">{formatDate(tender.submission_date)}</span>
                    </div>
                  )}

                  {tender.submission_deadline && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Дедлайн</span>
                      <span className="font-medium text-orange-700">{formatDate(tender.submission_deadline)}</span>
                    </div>
                  )}

                  {tender.start_price && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Начальная цена</span>
                      <span className="font-medium text-gray-900">{formatPrice(tender.start_price)}</span>
                    </div>
                  )}

                  {tender.submitted_price && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Подано</span>
                      <span className="font-medium text-blue-700">
                        {formatPrice(tender.submitted_price)}
                        {reduction && (
                          <span className="ml-2 text-xs text-green-600">
                            ↓{reduction.pct.toFixed(0)}% ({formatPrice(reduction.amount)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {tender.win_price && (
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Победа</span>
                      <span className="font-medium text-purple-700">{formatPrice(tender.win_price)} 🏆</span>
                    </div>
                  )}

                  {(tender.status === 'в работе' || tender.status === 'завершён') && tender.win_price && (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-600">Расходы - УСН 7% ({formatPrice(tax)})</span>
                        <span className="font-medium text-red-700">{formatPrice(expenses + tax)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-200">
                        <span className="text-gray-900 font-semibold">Чистая прибыль</span>
                        <span className={`font-bold text-lg ${profit > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatPrice(profit)}
                          {tender.win_price > 0 && (
                            <span className="ml-2 text-xs">
                              ({Math.round((profit / tender.win_price) * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА: Номер закупки + Кнопки */}
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {/* Номер закупки */}
                {tender.purchase_number && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Номер закупки</div>
                    <div className="font-mono text-sm font-semibold text-gray-900">
                      #{tender.purchase_number}
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedDocType('тендерная документация'); setDocumentsModalOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-blue-50 border border-gray-300 rounded-lg transition-colors"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-green-50 border border-gray-300 rounded-lg transition-colors"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-purple-50 border border-gray-300 rounded-lg transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Финансы</span>
                  </button>

                  {tender.region && (
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tender.region || '')}`, '_blank')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-orange-50 border border-gray-300 rounded-lg transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span>Карта</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Модалки */}
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
