'use client';

import { useEffect, useState } from 'react';
import { supabase, File } from '@/lib/supabase';
import { Search, FileText, Download, Eye, Upload, Folder } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState<string>('all');

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, selectedDocType]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        setFiles(data);
      }
    } catch (error) {
      console.log('📦 Файлы недоступны офлайн');
    }
    setIsLoading(false);
  };

  const filterFiles = () => {
    let filtered = [...files];

    if (searchQuery) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedDocType !== 'all') {
      filtered = filtered.filter((f) => f.document_type === selectedDocType);
    }

    setFilteredFiles(filtered);
  };

  const handleDownload = async (file: File) => {
    const { data, error } = await supabase.storage.from('files').download(file.file_path);

    if (error) {
      alert('Ошибка скачивания файла');
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

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="w-6 h-6 text-gray-400" />;

    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (mimeType.includes('image')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (mimeType.includes('word')) return <FileText className="w-6 h-6 text-blue-600" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return <FileText className="w-6 h-6 text-green-600" />;

    return <FileText className="w-6 h-6 text-gray-400" />;
  };

  const docTypes = [
    { value: 'all', label: 'Все', icon: '📁' },
    { value: 'тендерная документация', label: 'Тендерная', icon: '📄' },
    { value: 'закрывающие документы', label: 'Закрывающие', icon: '🧾' },
    { value: 'прочее', label: 'Прочее', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Файлы</h1>

        {/* Поиск */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск файлов..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {docTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedDocType(type.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedDocType === type.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Список файлов */}
      <div className="px-6 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Файлы не найдены' : 'Файлов пока нет'}
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Иконка файла */}
                <div className="flex-shrink-0">{getFileIcon(file.mime_type)}</div>

                {/* Информация о файле */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{file.name}</h3>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploaded_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      {file.document_type}
                    </span>
                    {file.uploaded_by && (
                      <span className="text-xs text-gray-500">от {file.uploaded_by}</span>
                    )}
                  </div>
                </div>

                {/* Кнопка скачивания */}
                <button
                  onClick={() => handleDownload(file)}
                  className="flex-shrink-0 w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center active:bg-primary-100 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB кнопка загрузки */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-full shadow-lg active:shadow-xl transition-shadow flex items-center justify-center z-30">
        <Upload className="w-6 h-6" />
      </button>
    </div>
  );
}
