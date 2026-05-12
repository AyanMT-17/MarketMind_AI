import { X } from "lucide-react";
import Button from "./Button";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-[#1f201d]/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-[#eadbc7] bg-[#fffaf1] shadow-[0_32px_80px_rgba(71,50,19,0.15)] animate-fade-in">
        <div className="flex items-center justify-between border-b border-[#eadbc7] px-8 py-6">
          <h3 className="text-xl font-semibold text-[#1f201d]">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-[#6a6055] transition hover:bg-[#f3e7d4] hover:text-[#1f201d]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
