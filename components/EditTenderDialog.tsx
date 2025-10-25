'use client';

import { useState, useEffect } from 'react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold">Редактировать тендер</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Измените информацию о тендере и управляйте файлами
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name" className="text-xs font-medium">Название тендера *</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Введите название тендера"
                className="h-9"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-status" className="text-xs font-medium">Статус</Label>
              <select
                id="edit-status"
                value={formData.status || 'новый'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Tender['status'] })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-purchase_number" className="text-xs font-medium">Номер гос закупки</Label>
              <Input
                id="edit-purchase_number"
                value={formData.purchase_number || ''}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_number: e.target.value })
                }
                placeholder="№ 0123456789012345678901"
                className="h-9"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-link" className="text-xs font-medium">Ссылка на тендер</Label>
              <Input
                id="edit-link"
                type="url"
                value={formData.link || ''}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="https://..."
                className="h-9"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-region" className="text-xs font-medium">Регион / Адрес</Label>
              <Input
                id="edit-region"
                type="text"
                value={formData.region || ''}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="Москва, Россия"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-publication_date" className="text-xs font-medium">Дата публикации</Label>
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
                  className="h-9"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-submission_date" className="text-xs font-medium">Дата подачи заявки</Label>
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
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-start_price" className="text-xs font-medium">Начальная цена (₽)</Label>
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
                  placeholder="0"
                  className="h-9"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-submission_deadline" className="text-xs font-medium">Дедлайн подачи</Label>
                <Input
                  id="edit-submission_deadline"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.submission_deadline || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, submission_deadline: e.target.value })
                  }
                  className="h-9"
                />
              </div>
            </div>

            {formData.status === 'победа' && (
              <div className="grid gap-1.5">
                <Label htmlFor="edit-win_price" className="text-xs font-medium">Цена победы (₽)</Label>
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
                  className="h-9"
                />
              </div>
            )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <TenderFilesList tenderId={tender.id} tenderStatus={tender.status} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
