import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Логирование для диагностики (только первые символы, безопасно)
if (typeof window === 'undefined') { // Только на сервере
  console.log('[Supabase Init]', {
    env: process.env.NODE_ENV,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : '❌ MISSING',
    key: supabaseAnonKey ? `SET (${supabaseAnonKey.length} chars)` : '❌ MISSING',
  });
}

// Проверка наличия credentials (не бросаем Error на module scope!)
const hasCredentials = !!(supabaseUrl && supabaseAnonKey);

if (!hasCredentials && typeof window === 'undefined') {
  console.error('❌ CRITICAL: Supabase credentials не настроены!');
  console.error('URL:', supabaseUrl ? '✓ SET' : '✗ MISSING');
  console.error('KEY:', supabaseAnonKey ? '✓ SET' : '✗ MISSING');
  console.error('Environment:', process.env.NODE_ENV);
  console.error('\nДля Vercel: Settings → Environment Variables');
  console.error('Для локалки: Создайте .env.local с NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Создаём клиент только если credentials есть
// Иначе создаём dummy client который будет выдавать понятную ошибку
let supabaseClient: SupabaseClient;

if (hasCredentials) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  // Создаём proxy который выдаёт понятную ошибку при любом вызове
  supabaseClient = new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(
        'Supabase client не инициализирован: отсутствуют NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Проверьте environment variables в Vercel Dashboard → Settings → Environment Variables'
      );
    }
  });
}

export const supabase = supabaseClient;

/**
 * Проверяет что Supabase credentials настроены
 * @throws {Error} Если credentials отсутствуют
 */
export function checkSupabaseCredentials(): void {
  if (!hasCredentials) {
    throw new Error(
      'Supabase credentials не настроены. ' +
      'Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в environment variables.'
    );
  }
}

// Типы для базы данных
export interface Tender {
  id: number;
  name: string;
  purchase_number: string | null; // Номер гос закупки
  link: string | null;
  region: string | null; // Регион / Адрес
  publication_date: string;
  submission_date: string | null;
  submission_deadline: string | null;
  start_price: number | null;
  submitted_price: number | null; // Цена по которой подали
  win_price: number | null;
  status: 'новый' | 'подано' | 'на рассмотрении' | 'победа' | 'в работе' | 'завершён' | 'проигрыш';
  created_at?: string;
  updated_at?: string;
}

export type TenderInsert = Omit<Tender, 'id' | 'created_at' | 'updated_at'>;
export type TenderUpdate = Partial<TenderInsert>;

// Логика переходов между статусами
export const STATUS_TRANSITIONS: Record<Tender['status'], Tender['status'][]> = {
  'новый': ['подано'],
  'подано': ['на рассмотрении'], // Можно вручную перевести на рассмотрение
  'на рассмотрении': ['победа', 'проигрыш'],
  'победа': ['в работе'],
  'в работе': ['завершён'],
  'завершён': [], // финальный статус
  'проигрыш': [], // финальный статус
};

// Названия статусов для отображения
export const STATUS_LABELS: Record<Tender['status'], string> = {
  'новый': 'Новый',
  'подано': 'Подано',
  'на рассмотрении': 'На рассмотрении',
  'победа': 'Победа',
  'в работе': 'В работе',
  'завершён': 'Завершён',
  'проигрыш': 'Проигрыш',
};

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  notes: string | null;
  created_at?: string;
}

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at'>;
export type SupplierUpdate = Partial<SupplierInsert>;

// Files types
export type DocumentType = 'тендерная документация' | 'закрывающие документы' | 'прочее';

export interface File {
  id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  tender_id: number | null;
  document_type: DocumentType;
  uploaded_by: string | null;
  show_on_dashboard: boolean;
  uploaded_at: string;
  updated_at: string;
}

export interface FileInsert {
  name: string;
  original_name: string;
  file_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  category?: string;
  tender_id?: number | null;
  document_type?: DocumentType;
  uploaded_by?: string | null;
  show_on_dashboard?: boolean;
}

// Tender Links (ссылки в тендерной документации)
export interface TenderLink {
  id: number;
  tender_id: number;
  name: string;
  url: string;
  document_type: DocumentType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderLinkInsert {
  tender_id: number;
  name: string;
  url: string;
  document_type?: DocumentType;
  description?: string | null;
}

// Users (пользователи)
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  is_online: boolean;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  username: string;
  email: string;
  password: string;
  is_online?: boolean;
  last_activity?: string;
}

// Activity Logs (логи действий)
export interface ActivityLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  action_type: string;
  details: any;
  created_at: string;
}

export interface ActivityLogInsert {
  user_id?: number | null;
  username: string;
  action: string;
  action_type: string;
  details?: any;
}

export interface FileUpdate {
  name?: string;
  category?: string;
  document_type?: DocumentType;
  show_on_dashboard?: boolean;
}

export const FILE_CATEGORIES = [
  'карточка предприятия',
  'шаблон',
  'договор',
  'документация',
  'прочее',
] as const;

export const DOCUMENT_TYPES: DocumentType[] = [
  'тендерная документация',
  'закрывающие документы',
  'прочее',
];

// Иконки для типов документов
export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  'тендерная документация': '📄',
  'закрывающие документы': '🧾',
  'прочее': '📁',
};

// Цвета для типов документов
export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  'тендерная документация': 'bg-blue-100 text-blue-700',
  'закрывающие документы': 'bg-green-100 text-green-700',
  'прочее': 'bg-gray-100 text-gray-700',
};

// Типы для расходов (бухгалтерия)
export interface Expense {
  id: number;
  tender_id: number;
  category: string;
  amount: number;
  description: string | null;
  is_cash?: boolean; // Наличка или безнал
  created_at?: string;
  updated_at?: string;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
export type ExpenseUpdate = Partial<ExpenseInsert>;

// Категории расходов
export const EXPENSE_CATEGORIES = [
  'Материалы',
  'Работа',
  'Транспорт',
  'Оборудование',
  'Субподряд',
  'Налоги',
  'Прочее',
] as const;

// Messages (сообщения чата)
export type MessageType = 'message' | 'note' | 'link';

export interface Message {
  id: number;
  user_id: number;
  username: string;
  message_type: MessageType;
  content: string;
  link_url: string | null;
  note_color: string | null;
  created_at: string;
}

export interface MessageInsert {
  user_id: number;
  username: string;
  message_type: MessageType;
  content: string;
  link_url?: string | null;
  note_color?: string | null;
}

// Цвета для заметок
export const NOTE_COLORS = [
  { value: 'yellow', label: 'Желтый', class: 'bg-yellow-100 border-yellow-300' },
  { value: 'blue', label: 'Синий', class: 'bg-blue-100 border-blue-300' },
  { value: 'green', label: 'Зеленый', class: 'bg-green-100 border-green-300' },
  { value: 'red', label: 'Красный', class: 'bg-red-100 border-red-300' },
  { value: 'purple', label: 'Фиолетовый', class: 'bg-purple-100 border-purple-300' },
] as const;
