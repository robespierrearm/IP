'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Clock, Download, FolderOpen, Briefcase, Eye, Bell, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase, File, Tender, Expense } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { FileIconComponent } from '@/lib/fileIcons';
import { getStatusColor } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';


const getStatusLabel = (status: Tender['status']) => {
  const labels: Record<Tender['status'], string> = {
    'новый': 'Новый',
    'подано': 'Подано',
    'на рассмотрении': 'На рассмотрении',
    'победа': 'Победа',
    'в работе': 'В работе',
    'завершён': 'Завершён',
    'проигрыш': 'Проигрыш',
  };
  return labels[status] || status;
};

const formatPrice = (price: number | null) => {
  if (!price) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatTenderDate = (dateString: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU');
};

// Компактное форматирование цены
const formatCompactPrice = (price: number | null) => {
  if (!price) return '—';
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${Math.round(price / 1000)}K`;
  }
  return price.toString();
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [dashboardFiles, setDashboardFiles] = useState<File[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState({
    inWork: 0,
    underReview: 0,
    reminders: 0,
    total: 0,
    new: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    totalRevenue: 0,
  });
  
  const [reminderTenders, setReminderTenders] = useState<Array<{id: number, name: string, deadline: string}>>([]);
  const [urgentTenders, setUrgentTenders] = useState<Tender[]>([]);
  const [inWorkTenders, setInWorkTenders] = useState<Tender[]>([]);
  const [tenderExpenses, setTenderExpenses] = useState<Record<number, number>>({});

  // Предпросмотр файлов
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Загрузка данных через API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();

        if (result.error) {
          console.error('Ошибка загрузки данных dashboard:', result.error);
          setTenders([]);
          setDashboardFiles([]);
          return;
        }

        if (result.data) {
          const allTenders = result.data.tenders;
          setTenders(allTenders);
          setDashboardFiles(result.data.files);
          setStats(result.data.stats);
          setReminderTenders(result.data.reminderTenders);
          
          // Вычисляем срочные тендеры (urgent + high)
          const urgent = allTenders
            .map((t: Tender) => ({ tender: t, notification: getSmartNotification(t) }))
            .filter(({ notification }: { notification: any }) => 
              notification && (notification.priority === 'urgent' || notification.priority === 'high')
            )
            .sort((a: any, b: any) => {
              if (a.notification!.priority === 'urgent' && b.notification!.priority !== 'urgent') return -1;
              if (a.notification!.priority !== 'urgent' && b.notification!.priority === 'urgent') return 1;
              return 0;
            })
            .slice(0, 3)
            .map(({ tender }: { tender: Tender }) => tender);
          setUrgentTenders(urgent);
          
          // Вычисляем тендеры в работе (топ-3 по давности)
          const inWork = allTenders
            .filter((t: Tender) => t.status === 'в работе')
            .slice(0, 3);
          setInWorkTenders(inWork);
          
          // Загружаем расходы для тендеров в работе
          if (inWork.length > 0) {
            const tenderIds = inWork.map((t: Tender) => t.id);
            const { data: expenses } = await supabase
              .from('expenses')
              .select('tender_id, amount')
              .in('tender_id', tenderIds);
            
            if (expenses) {
              const expenseMap: Record<number, number> = {};
              expenses.forEach((exp: any) => {
                expenseMap[exp.tender_id] = (expenseMap[exp.tender_id] || 0) + exp.amount;
              });
              setTenderExpenses(expenseMap);
            }
          }
        }
      } catch (err) {
        console.error('Критическая ошибка загрузки dashboard:', err);
        setTenders([]);
        setDashboardFiles([]);
      }
    };

    loadDashboardData();
  }, []);

  // Предпросмотр файла
  const handlePreview = async (file: File) => {
    const { data } = await supabase.storage
      .from('files')
      .createSignedUrl(file.file_path, 3600);

    if (data?.signedUrl) {
      setPreviewFile(file);
      setPreviewUrl(data.signedUrl);
    }
  };

  // Скачивание файла
  const handleDownload = async (file: File) => {
    const { data, error } = await supabase.storage
      .from('files')
      .download(file.file_path);

    if (error) {
      console.error('Ошибка скачивания:', error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.original_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Функция перехода на страницу тендеров с фильтром
  const navigateToTenders = (tab?: string) => {
    if (tab) {
      router.push(`/tenders?tab=${tab}`);
    } else {
      router.push('/tenders');
    }
  };

  // Функция перехода на конкретный тендер
  const navigateToTender = (tenderId: number) => {
    router.push(`/tenders?edit=${tenderId}`);
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Верхняя строка: Заголовок слева, Время справа - СТЕКЛЯННАЯ */}
        <div className="flex items-center justify-between mb-5 backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl shadow-lg p-4">
          {/* Заголовок */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Общая информация</h1>
            <p className="text-xs text-gray-600">Обзор ключевых показателей вашего бизнеса</p>
          </div>

          {/* Блок с датой и временем - СТЕКЛЯННЫЙ */}
          <div className="flex items-center justify-center gap-3 px-4 py-2.5 backdrop-blur-xl bg-blue-500/20 border border-white/20 rounded-xl shadow-lg shadow-blue-500/50">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-600 tabular-nums">
              {formatTime(currentDateTime)}
            </span>
            <span className="text-sm text-blue-400">•</span>
            <span className="text-sm font-medium text-blue-600">{formatDate(currentDateTime)}</span>
          </div>
        </div>

        {/* Три основных блока */}
        <div className="grid gap-3 md:grid-cols-3 mb-5">
          {/* 1. СРОЧНО - СТЕКЛЯННАЯ */}
          <Card className="transition-all hover:shadow-lg backdrop-blur-xl bg-red-500/10 border border-white/20 shadow-lg shadow-red-500/50 h-[240px]">
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Срочно</h3>
                  <p className="text-3xl font-bold text-gray-900">{urgentTenders.length}</p>
                </div>
              </div>
            
              {urgentTenders.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {urgentTenders.map((tender) => {
                    const notification = getSmartNotification(tender);
                    return (
                      <div
                        key={tender.id}
                        onClick={() => navigateToTender(tender.id)}
                        className="p-2 rounded-lg backdrop-blur-xl bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer border border-white/20"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                          {tender.name}
                        </p>
                        {notification && (
                          <p className={`text-xs font-medium ${
                            notification.color === 'red' ? 'text-red-600' :
                            notification.color === 'orange' ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {notification.icon} {notification.shortMessage}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">Нет срочных тендеров</p>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 h-7 text-xs px-2 mt-2" 
                onClick={() => router.push('/tenders')}
              >
                Все срочные
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </CardContent>
          </Card>

          {/* 2. В РАБОТЕ - СТЕКЛЯННАЯ */}
          <Card className="transition-all hover:shadow-lg backdrop-blur-xl bg-green-500/10 border border-white/20 shadow-lg shadow-green-500/50 h-[240px]">
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <div className="p-1.5 rounded-lg bg-green-50">
                  <Briefcase className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">В работе</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.inWork}</p>
                </div>
              </div>
            
              {inWorkTenders.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {inWorkTenders.map((tender) => {
                    const notification = getSmartNotification(tender);
                    const expenses = tenderExpenses[tender.id] || 0;
                    const contractPrice = tender.win_price || tender.submitted_price || 0;
                    const profit = contractPrice - expenses;
                    return (
                      <div
                        key={tender.id}
                        onClick={() => navigateToTender(tender.id)}
                        className="p-2 rounded-lg backdrop-blur-xl bg-green-500/10 hover:bg-green-500/20 transition-colors cursor-pointer border border-white/20"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                          {tender.name}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {notification?.shortMessage || 'В работе'}
                          </span>
                          {expenses > 0 ? (
                            <span className="font-semibold text-green-600">
                              💰 {formatCompactPrice(profit)} (из {formatCompactPrice(contractPrice)})
                            </span>
                          ) : (
                            <span className="font-semibold text-green-600">
                              {formatPrice(contractPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">Нет проектов в работе</p>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-600 hover:text-green-700 h-7 text-xs px-2 mt-2" 
                onClick={() => navigateToTenders('inwork')}
              >
                Все проекты
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </CardContent>
          </Card>

          {/* 3. СТАТИСТИКА - СТЕКЛЯННАЯ */}
          <Card className="transition-all hover:shadow-lg backdrop-blur-xl bg-blue-500/10 border border-white/20 shadow-lg shadow-blue-500/50 h-[240px]">
            <CardContent className="p-3 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Статистика</h3>
                  <p className="text-lg font-bold text-gray-900">За месяц</p>
                </div>
              </div>
            
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Новых:</span>
                  <span className="font-semibold text-gray-900">{stats.new}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Поданных:</span>
                  <span className="font-semibold text-gray-900">{stats.submitted}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Рассмотрение:</span>
                  <span className="font-semibold text-gray-900">{stats.underReview}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Побед:</span>
                  <span className="font-semibold text-green-600">{stats.won}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Проигрышей:</span>
                  <span className="font-semibold text-red-600">{stats.lost}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Выручка:</span>
                  <span className="font-semibold text-blue-600">{formatPrice(stats.totalRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Нижние два блока: Последние тендеры (70%) + Файлы (30%) */}
        <div className="grid gap-3 md:grid-cols-3">
          {/* Последние тендеры - СТЕКЛЯННАЯ */}
          <Card className="backdrop-blur-xl bg-white/40 border border-white/20 shadow-lg hover:shadow-xl transition-shadow md:col-span-2">
            <div className="border-b px-4 py-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Последние тендеры</h3>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-7 text-sm px-2" onClick={() => router.push('/tenders')}>
                  Все
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              {tenders.length > 0 ? (
                <div className="divide-y">
                  {tenders.map((tender) => {
                    const notification = getSmartNotification(tender);
                    return (
                    <div 
                      key={tender.id} 
                      className={`px-4 py-3 transition-colors cursor-pointer ${
                        tender.status === 'подано' ? 'backdrop-blur-xl bg-green-500/10 hover:bg-green-500/20' : 'hover:bg-white/50'
                      }`}
                      onClick={() => navigateToTender(tender.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base text-gray-900 truncate mb-1">{tender.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatTenderDate(tender.publication_date)}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-700">{formatPrice(tender.start_price)}</span>
                            {notification && (
                              <>
                                <span>•</span>
                                <span className={`font-medium ${
                                  notification.color === 'red' ? 'text-red-600' :
                                  notification.color === 'orange' ? 'text-orange-600' :
                                  notification.color === 'yellow' ? 'text-yellow-600' :
                                  notification.color === 'blue' ? 'text-blue-600' :
                                  notification.color === 'green' ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {notification.icon} {notification.shortMessage}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(tender.status)}`}>
                          {getStatusLabel(tender.status)}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-base">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Нет тендеров для отображения</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Файлы - СТЕКЛЯННЫЙ */}
          <Card className="backdrop-blur-xl bg-purple-500/10 border border-white/20 shadow-lg shadow-purple-500/50 hover:shadow-xl transition-shadow">
            <div className="border-b px-4 py-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  Файлы
                </h3>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-7 text-sm px-2" onClick={() => router.push('/files')}>
                  Все
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
            <CardContent className="p-2">
              {dashboardFiles.length > 0 ? (
                <div className="space-y-1.5">
                  {dashboardFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-1.5 p-1.5 backdrop-blur-xl bg-white/50 rounded hover:bg-purple-500/20 transition-colors group border border-white/20"
                    >
                      <FileIconComponent 
                        fileName={file.original_name} 
                        mimeType={file.mime_type || undefined}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate leading-tight">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {file.document_type}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(file)}
                          className="p-0.5 h-auto w-auto"
                          title="Предпросмотр"
                        >
                          <Eye className="h-3 w-3 text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          className="p-0.5 h-auto w-auto"
                          title="Скачать"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs">
                  <FolderOpen className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p>Нет файлов для отображения</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модальное окно предпросмотра */}
      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => {
            setPreviewFile(null);
            setPreviewUrl('');
          }}
          fileUrl={previewUrl}
          fileName={previewFile.original_name}
          fileSize={previewFile.file_size || 0}
          mimeType={previewFile.mime_type || ''}
        />
      )}
    </div>
  );
}
