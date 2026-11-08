-- ===================================================
-- جداول نظام فواتير المصاريف
-- قم بتشغيل هذا الكود في Supabase SQL Editor
-- ===================================================

-- 1. جدول المعاملات المالية البسيطة (المداخيل)
CREATE TABLE IF NOT EXISTS finances (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'income',   -- 'income' or 'expense'
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول رأس الفاتورة
CREATE TABLE IF NOT EXISTS expense_invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number TEXT,
    supplier_name TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    category TEXT DEFAULT 'مشتريات',
    notes TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    type TEXT DEFAULT 'expense',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول سلع الفاتورة
CREATE TABLE IF NOT EXISTS expense_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES expense_invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_expense_invoices_date ON expense_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_invoice_items_invoice_id ON expense_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(date DESC);

-- تعطيل RLS مؤقتاً للاختبار (يمكن تفعيله لاحقاً)
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON finances FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON expense_invoices FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON expense_invoice_items FOR ALL USING (true);
