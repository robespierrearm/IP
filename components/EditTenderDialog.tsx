'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Hash, Link as LinkIcon, MapPin, Calendar, Clock, DollarSign, Paperclip } from 'lucide-react';
import { TenderFilesList } from '@/components/TenderFilesList';

interface EditTenderDialogProps {
  tender: Tender;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: number, updates: Partial<Tender>) => void;
}

export function EditTenderDialog({
  tender,
  open,
  onOpenChange,
  onUpdate,
}: EditTenderDialogProps) {
  const [formData, setFormData] = useState<Partial<Tender>>(tender);

  useEffect(() => {
    setFormData(tender);
  }, [tender]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert('Введите название тендера');
      return;
    }

    onUpdate(tender.id, formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✏️ Редактировать тендер</DialogTitle>
          <DialogDescription className="text-[10px] text-gray-600">
            Измените информацию о тендере и управляйте файлами
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 backdrop-blur-md bg-white/50 h-8">
            <TabsTrigger value="info" className="data-[state=active]:bg-white/90 text-xs">📋 Информация</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-white/90 text-xs">📎 Файлы</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-2">
            <form onSubmit={handleSubmit}>
              <div className="space-y-3 py-2">
            {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-1.5 px-2 py-0.5 backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-transparent border-l-3 border-blue-500 rounded-r-lg shadow-sm shadow-blue-500/20 mb-2">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <h3 className="font-semibold text-xs text-gray-900">Основная информация</h3>
              </div>
              
              <div className="space-y-2">
              <motion.div 
                className="grid gap-1"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="edit-name" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                  <FileText className="h-3 w-3 text-blue-500" />
                  Название тендера *
                </Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Введите название тендера"
                className="h-8 text-xs backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
                required
              />
              </motion.div>

              <motion.div 
                className="grid gap-1"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="edit-status" className="text-[11px] font-medium text-gray-700">Статус</Label>
              <select
                id="edit-status"
                value={formData.status || 'новый'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Tender['status'] })
                }
                className="flex h-8 w-full rounded-md border border-white/20 backdrop-blur-md bg-white/50 hover:bg-white/70 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              </motion.div>

              <motion.div 
                className="grid gap-1"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="edit-purchase_number" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                  <Hash className="h-3 w-3 text-gray-500" />
                  Номер гос закупки
                </Label>
              <Input
                id="edit-purchase_number"
                value={formData.purchase_number || ''}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_number: e.target.value })
                }
                placeholder="№ 0123456789012345678901"
                className="h-8 text-xs backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
              />
              </motion.div>

              <motion.div 
                className="grid gap-1"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="edit-link" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                  <LinkIcon className="h-3 w-3 text-blue-500" />
                  Ссылка на тендер
                </Label>
              <Input
                id="edit-link"
                type="url"
                value={formData.link || ''}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="https://..."
                className="h-8 text-xs backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
              />
              </motion.div>
              </div>
            </motion.div>

            {/* ЛОКАЦИЯ И СРОКИ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1.5 px-2 py-0.5 backdrop-blur-md bg-gradient-to-r from-orange-500/10 to-transparent border-l-3 border-orange-500 rounded-r-lg shadow-sm shadow-orange-500/20 mb-2">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
                <h3 className="font-semibold text-xs text-gray-900">Локация и сроки</h3>
              </div>

              <div className="space-y-2">
              <motion.div 
                className="grid gap-1"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="edit-region" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                  <MapPin className="h-3 w-3 text-orange-500" />
                  Регион / Адрес
                </Label>
              <Input
                id="edit-region"
                type="text"
                value={formData.region || ''}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="Москва, Россия"
                className="h-8 text-xs backdrop-blur-md bg-white/50 border border-white/20 hover:bg-white/70 focus:bg-white/90 shadow-sm transition-all duration-200"
              />
              </motion.div>

              <div className="grid grid-cols-2 gap-2">
                <motion.div 
                  className="grid gap-1"
                  whileHover={{ scale: 1.005, y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="edit-publication_date" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    Дата публикации
                  </Label>
                <Input
                  id="edit-publication_date"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.publication_date || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publication_date: e.target.value,
                    })
                  }
                    className="h-8 text-xs backdrop-blur-md bg-blue-500/10 border border-blue-200 hover:bg-blue-500/20 focus:bg-blue-500/30 shadow-sm shadow-blue-500/20 transition-all duration-200"
                    required
                  />
                </motion.div>

                <motion.div 
                  className="grid gap-1"
                  whileHover={{ scale: 1.005, y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="edit-submission_date" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                    <Calendar className="h-3 w-3 text-purple-500" />
                    Дата подачи заявки
                  </Label>
                  <Input
                    id="edit-submission_date"
                    type="date"
                    value={formData.submission_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        submission_date: e.target.value,
                      })
                    }
                    className="h-8 text-xs backdrop-blur-md bg-purple-500/10 border border-purple-200 hover:bg-purple-500/20 focus:bg-purple-500/30 shadow-sm shadow-purple-500/20 transition-all duration-200"
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <motion.div 
                  className="grid gap-1"
                  whileHover={{ scale: 1.005, y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="edit-submission_deadline" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                    <Clock className="h-3 w-3 text-orange-500" />
                    Дедлайн *
                  </Label>
                  <Input
                    id="edit-submission_deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.submission_deadline || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, submission_deadline: e.target.value })
                    }
                    className="h-8 text-xs backdrop-blur-md bg-orange-500/10 border border-orange-200 hover:bg-orange-500/20 focus:bg-orange-500/30 shadow-sm shadow-orange-500/20 transition-all duration-200"
                  />
                </motion.div>

                <motion.div 
                  className="grid gap-1"
                  whileHover={{ scale: 1.005, y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="edit-start_price" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    Цена (₽)
                  </Label>
                  <Input
                    id="edit-start_price"
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
                    className="h-8 text-xs backdrop-blur-md bg-green-500/10 border border-green-200 hover:bg-green-500/20 focus:bg-green-500/30 shadow-sm shadow-green-500/20 transition-all duration-200"
                  />
                </motion.div>
              </div>
              </div>
            </motion.div>

            {formData.status === 'победа' && (
              <motion.div 
                className="grid gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="edit-win_price" className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  Цена победы (₽)
                </Label>
                <Input
                  id="edit-win_price"
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
                  className="h-8 text-xs backdrop-blur-md bg-green-500/10 border border-green-200 hover:bg-green-500/20 focus:bg-green-500/30 shadow-sm shadow-green-500/20 transition-all duration-200"
                />
              </motion.div>
            )}

              </div>

              <DialogFooter className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="backdrop-blur-md bg-white/50 hover:bg-white/70"
                >
                  Отмена
                </Button>
                <Button type="submit" className="backdrop-blur-md bg-blue-500/90 hover:bg-blue-500 text-white">Сохранить</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="files" className="py-2 mt-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-md bg-white/30 rounded-lg p-4 border border-white/20"
            >
              <TenderFilesList tenderId={tender.id} tenderStatus={tender.status} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
