import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  /** Extra max-width / layout classes on the dialog panel (e.g. lore pages). */
  dialogClassName?: string;
}

export function Modal({ open, title, onClose, children, wide, dialogClassName }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-10">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={cn(
          "glass-surface-strong relative z-10 max-h-[min(90vh,880px)] overflow-y-auto rounded-3xl transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95",
          wide ? "w-full max-w-3xl" : "w-full max-w-lg",
          dialogClassName,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-black/[0.06] hover:text-foreground"
            aria-label="Close"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
