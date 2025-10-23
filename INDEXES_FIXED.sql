-- Индексы для таблицы tenders
CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_created_at ON public.tenders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_submission_deadline ON public.tenders(submission_deadline);

-- Индексы для таблицы expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tender_id ON public.expenses(tender_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- Индексы для таблицы suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON public.suppliers(created_at DESC);

-- Индексы для таблицы files
CREATE INDEX IF NOT EXISTS idx_files_tender_id ON public.files(tender_id);
CREATE INDEX IF NOT EXISTS idx_files_document_type ON public.files(document_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON public.files(uploaded_at DESC);
