import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden">
      <div 
        className={cn(
          "bg-zinc-950 border border-zinc-800 shadow-[0_0_100px_-20px_rgba(0,0,0,1)] w-full flex flex-col animate-in fade-in zoom-in-95 duration-300 relative",
          "rounded-[2.5rem] overflow-hidden",
          "max-h-[90vh]", 
          sizeClass
        )}
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        {/* Decorative Gradient Border */}
        <div className="absolute inset-0 p-[1px] rounded-[2.5rem] bg-gradient-to-b from-zinc-700/50 to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-zinc-800/50 shrink-0 bg-zinc-900/50 backdrop-blur-md">
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-white transition-all rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 shadow-inner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="min-h-full">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
