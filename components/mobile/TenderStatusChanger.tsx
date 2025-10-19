'use client';

import { useState } from 'react';
import { Tender, STATUS_TRANSITIONS, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { ArrowRight, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface MobileTenderStatusChangerProps {
  tender: Tender;
  onStatusChanged: () => void;
}

export function MobileTenderStatusChanger({ tender, onStatusChanged }: MobileTenderStatusChangerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Tender['status'] | null>(null);
  const [submittedPrice, setSubmittedPrice] = useState<string>('');
  const [winPrice, setWinPrice] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const availableTransitions = STATUS_TRANSITIONS[tender.status];
  const isFinished = availableTransitions.length === 0;

  // Валидация перед сменой статуса
  const validateTransition = (newStatus: Tender['status']): string | null => {
    if (tender.status === 'новый' && newStatus === 'подано') {
      if (!tender.name || !tender.start_price || !tender.submission_deadline) {
        return 'Заполните обязательные поля: название, начальная цена, дедлайн';
      }
    }

    if (tender.status === 'победа' && newStatus === 'в работе') {
      if (!tender.win_price) {
        return 'Заполните поле "Цена победы" перед переходом в работу';
      }
    }

    return null;
  };

  // Обработка клика на кнопку смены статуса
  const handleStatusClick = (newStatus: Tender['status']) => {
    const error = validateTransition(newStatus);
    if (error) {
      setValidationError(error);
      setIsDialogOpen(true);
      setSelectedStatus(null);
      return;
    }

    setSelectedStatus(newStatus);
    setValidationError('');
    setIsDialogOpen(true);
  };

  // Подтверждение смены статуса
  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsProcessing(true);

    try {
      const additionalData: Partial<Tender> = {};

      // Автоматические действия при смене статуса
      switch (selectedStatus) {
        case 'подано':
          additionalData.submission_date = new Date().toISOString().split('T')[0];
          if (submittedPrice) {
            additionalData.submitted_price = parseFloat(submittedPrice);
          }
          // Сначала переводим в "Подано"
          await apiClient.updateTender(tender.id, { status: selectedStatus, ...additionalData });
          
          // Затем автоматически переводим в "На рассмотрении"
          await apiClient.updateTender(tender.id, { status: 'на рассмотрении' });
          
          setIsDialogOpen(false);
          setSelectedStatus(null);
          setSubmittedPrice('');
          alert('👀 Тендер на рассмотрении');
          onStatusChanged();
          setIsProcessing(false);
          return;

        case 'победа':
          if (winPrice) {
            additionalData.win_price = parseFloat(winPrice);
          }
          break;

        case 'в работе':
          if (!tender.win_price) {
            setValidationError('Цена победы не заполнена');
            setIsProcessing(false);
            return;
          }
          break;
      }

      await apiClient.updateTender(tender.id, { status: selectedStatus, ...additionalData });
      
      setIsDialogOpen(false);
      setSelectedStatus(null);
      setWinPrice('');
      setSubmittedPrice('');
      
      // Показать уведомление
      const messages: Record<Tender['status'], string> = {
        'новый': '',
        'подано': '✅ Заявка подана',
        'на рассмотрении': '👀 Тендер на рассмотрении',
        'победа': '🎉 Тендер выигран!',
        'в работе': '🔧 Тендер в работе',
        'завершён': '✅ Тендер завершён',
        'проигрыш': '❌ Тендер проигран',
      };
      if (messages[selectedStatus]) {
        alert(messages[selectedStatus]);
      }
      
      onStatusChanged();
    } catch (error) {
      console.error('Ошибка смены статуса:', error);
      setValidationError('Ошибка при смене статуса');
    } finally {
      setIsProcessing(false);
    }
  };

  // Получить стиль для статуса
  const getStatusStyle = (status: Tender['status']) => {
    switch (status) {
      case 'подано':
        return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200';
      case 'победа':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200';
      case 'в работе':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200';
      case 'завершён':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-md shadow-gray-200';
      case 'проигрыш':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-200';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-200';
    }
  };

  if (isFinished) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2">
        <CheckCircle className="w-4 h-4" />
        <span>Финальный статус</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {availableTransitions.map((nextStatus) => (
          <button
            key={nextStatus}
            onClick={() => handleStatusClick(nextStatus)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 ${getStatusStyle(nextStatus)}`}
          >
            {nextStatus === 'победа' && <CheckCircle className="w-4 h-4" />}
            {nextStatus === 'проигрыш' && <XCircle className="w-4 h-4" />}
            {nextStatus !== 'победа' && nextStatus !== 'проигрыш' && <ArrowRight className="w-4 h-4" />}
            {STATUS_LABELS[nextStatus]}
          </button>
        ))}
      </div>

      {/* Модальное окно */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => {
            setIsDialogOpen(false);
            setSelectedStatus(null);
            setWinPrice('');
            setSubmittedPrice('');
            setValidationError('');
          }}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {validationError ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      Ошибка валидации
                    </div>
                  ) : (
                    `Изменить статус на "${selectedStatus ? STATUS_LABELS[selectedStatus] : ''}"`
                  )}
                </h2>
                <button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedStatus(null);
                    setWinPrice('');
                    setSubmittedPrice('');
                    setValidationError('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                {validationError || 'Подтвердите изменение статуса тендера'}
              </p>

              {/* Поле цены подачи */}
              {!validationError && selectedStatus === 'подано' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена подачи (₽) *
                  </label>
                  <input
                    type="number"
                    value={submittedPrice}
                    onChange={(e) => setSubmittedPrice(e.target.value)}
                    placeholder="Введите цену по которой подали"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Укажите стоимость по которой вы подали заявку на тендер
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-2">
                    ℹ️ После подачи статус автоматически изменится на "На рассмотрении"
                  </p>
                </div>
              )}

              {/* Поле цены победы */}
              {!validationError && selectedStatus === 'победа' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена победы (₽) *
                  </label>
                  <input
                    type="number"
                    value={winPrice}
                    onChange={(e) => setWinPrice(e.target.value)}
                    placeholder="Введите цену победы"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Это обязательное поле для перехода в статус "Победа"
                  </p>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-3 mt-6">
                {!validationError && (
                  <button
                    onClick={handleConfirm}
                    disabled={
                      isProcessing || 
                      (selectedStatus === 'подано' && !submittedPrice) ||
                      (selectedStatus === 'победа' && !winPrice)
                    }
                    className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-4 rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isProcessing ? 'Обработка...' : 'Подтвердить'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedStatus(null);
                    setWinPrice('');
                    setSubmittedPrice('');
                    setValidationError('');
                  }}
                  className="px-6 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium active:bg-gray-200 transition-colors"
                >
                  {validationError ? 'Закрыть' : 'Отмена'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
