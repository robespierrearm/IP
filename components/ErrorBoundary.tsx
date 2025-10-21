'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary - ловит ошибки в дочерних компонентах
 * Показывает красивый экран ошибки вместо белого экрана
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            {/* Иконка ошибки */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Заголовок */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Что-то пошло не так
            </h1>

            {/* Описание */}
            <p className="text-gray-600 mb-6">
              Произошла непредвиденная ошибка. Попробуйте вернуться назад или перезагрузить страницу.
            </p>

            {/* Детали ошибки (только в dev режиме) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl text-left">
                <p className="text-xs text-gray-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
