'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { TenderInsert } from '@/lib/supabase';
import { FileText, Hash, Link as LinkIcon, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tender: TenderInsert) => void;
}

export function AddTenderDialog({
  open,
  onOpenChange,
  onAdd,
}: AddTenderDialogProps) {
  const [formData, setFormData] = useState<TenderInsert>({
    name: '',
    purchase_number: '',
    link: '',
    region: '',
    publication_date: new Date().toISOString().split('T')[0], // Текущая дата по умолчанию
    submission_date: '',
    submission_deadline: '',
    start_price: null,
    submitted_price: null,
    win_price: null,
    status: 'новый',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Введите название тендера');
      return;
    }

    if (!formData.publication_date) {
      alert('Укажите дату публикации');
      return;
    }

    onAdd(formData);

    // Сброс формы
    setFormData({
      name: '',
      purchase_number: '',
      link: '',
      region: '',
      publication_date: new Date().toISOString().split('T')[0],
      submission_date: '',
      submission_deadline: '',
      start_price: null,
      submitted_price: null,
      win_price: null,
      status: 'новый',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✨ Добавить тендер</DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Заполните информацию о новом тендере
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
            >
              <div className="flex items-center gap-2 px-3 py-1 backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 rounded-r-lg shadow-sm shadow-blue-500/20 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-900">Основная информация</h3>
              </div>
              
              <div className="space-y-3">
              <m.div 
                className="grid gap-2"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Название тендера *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Строительство школы в Москве"
                  className="h-9 text-sm backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
                  required
                />
              </m.div>

              <m.div 
                className="grid gap-2"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="purchase_number" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Номер гос закупки
                </Label>
                <Input
                  id="purchase_number"
                  value={formData.purchase_number || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_number: e.target.value })
                  }
                  placeholder="№ 0123456789012345678901"
                  className="h-9 text-sm backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
                />
              </m.div>

              <m.div 
                className="grid gap-2"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="link" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <LinkIcon className="h-4 w-4 text-blue-500" />
                  Ссылка на тендер
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://zakupki.gov.ru/..."
                  className="h-9 text-sm backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
                />
              </m.div>
              </div>
            </m.div>

            {/* ЛОКАЦИЯ И СРОКИ */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 px-3 py-1 backdrop-blur-md bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 rounded-r-lg shadow-sm shadow-orange-500/20 mb-3">
                <MapPin className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm text-gray-900">Локация и сроки</h3>
              </div>

              <div className="space-y-4">
              <m.div 
                className="grid gap-2"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="region" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Регион / Адрес
                </Label>
                <Input
                  id="region"
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  placeholder="Москва, Россия"
                  className="h-9 text-sm backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
                />
              </m.div>

              <div className="grid grid-cols-2 gap-4">
                <m.div 
                  className="grid gap-2"
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="publication_date" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Дата публикации
                  </Label>
                  <Input
                    id="publication_date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.publication_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, publication_date: e.target.value })
                    }
                    className="h-9 text-sm backdrop-blur-md bg-blue-500/10 border border-blue-200 hover:bg-blue-500/20 focus:bg-blue-500/30 shadow-sm shadow-blue-500/20 transition-all duration-200"
                    required
                  />
                </m.div>

                <m.div 
                  className="grid gap-2"
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="submission_deadline" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Дедлайн *
                  </Label>
                  <Input
                    id="submission_deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.submission_deadline || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, submission_deadline: e.target.value })
                    }
                    className="h-9 text-sm backdrop-blur-md bg-orange-500/10 border border-orange-200 hover:bg-orange-500/20 focus:bg-orange-500/30 shadow-sm shadow-orange-500/20 transition-all duration-200"
                    required
                  />
                </m.div>
              </div>

              <m.div 
                className="grid gap-2"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="start_price" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Цена (₽)
                </Label>
                <Input
                  id="start_price"
                  type="number"
                  value={formData.start_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="1 000 000"
                  className="h-9 text-sm backdrop-blur-md bg-green-500/10 border border-green-200 hover:bg-green-500/20 focus:bg-green-500/30 shadow-sm shadow-green-500/20 transition-all duration-200"
                />
              </m.div>
              </div>
            </m.div>

            {formData.status === 'победа' && (
              <div className="grid gap-2">
                <Label htmlFor="win_price">Цена победы (₽)</Label>
                <Input
                  id="win_price"
                  type="number"
                  value={formData.win_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      win_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3">
            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="backdrop-blur-md bg-white/50 hover:bg-white/70 border border-white/20 transition-all duration-200"
              >
                Отмена
              </Button>
            </m.div>
            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit"
                className="backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border border-white/20 shadow-lg shadow-blue-500/50 transition-all duration-300"
              >
                ✅ Добавить тендер
              </Button>
            </m.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
