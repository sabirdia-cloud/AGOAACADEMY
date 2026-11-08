import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Printer, Loader2, Image as ImageIcon, X } from "lucide-react";
import { exportToPDF, exportToPNG } from "@/lib/pdf-export";

interface PrintPortalProps {
  children: React.ReactNode;
  id?: string;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  fileName?: string;
}

export function PrintPortal({ children, isOpen, onClose, title, fileName, id = "print-section" }: PrintPortalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (isOpen === false) return null;

  const finalFileName = fileName || title || 'document';

  return createPortal(
    <div id={id} className="fixed inset-0 z-[9999] bg-zinc-950/90 text-white overflow-auto p-4 md:p-8 flex flex-col print:static print:block print:overflow-visible print:p-0" style={{ direction: 'rtl' }}>
      <div className="max-w-5xl w-full mx-auto mb-6 flex justify-between items-center border-b border-zinc-800 pb-4 print:hidden shrink-0">
        <div>
          <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
            {title || "معاينة الوثيقة"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">تأكد من مراجعة المعلومات قبل الطباعة أو التصدير.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setIsExporting('png');
              try {
                await exportToPNG(`${id}-content`, finalFileName);
              } catch (err) {
                console.error("Manual PNG export failed:", err);
              } finally {
                setIsExporting(null);
              }
            }}
            disabled={!!isExporting}
            className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            تحميل PNG
          </button>
          <button
            onClick={async () => {
              setIsExporting('pdf');
              try {
                await exportToPDF(`${id}-content`, finalFileName);
              } catch (err) {
                console.error("Manual PDF export failed:", err);
              } finally {
                setIsExporting(null);
              }
            }}
            disabled={!!isExporting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            تحميل PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            طباعة
          </button>
          <button
            onClick={onClose}
            className="bg-zinc-800 text-zinc-400 p-2 rounded-xl hover:bg-zinc-700 transition-all active:scale-95"
            title="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full overflow-auto bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 md:p-12 flex justify-center items-start shadow-inner print:p-0 print:border-none print:bg-white print:block print:overflow-visible custom-scrollbar">
        <div id={`${id}-content`} className="bg-white shadow-2xl origin-top print:shadow-none print:m-0" style={{ minWidth: 'fit-content' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
