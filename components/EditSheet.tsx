"use client";
import { Popup } from "konsta/react";
import { useT } from "./useT";

/** Full-screen editor opened from a settings row: title, content, and a Done button. */
export function EditSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  return (
    <Popup opened={open} onBackdropClick={onClose}>
      <div className="flex h-full flex-col bg-porcelain">
        <div className="flex items-center justify-between gap-3 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-2">
          <h2 className="text-title text-ink">{title}</h2>
          <button onClick={onClose} className="flex min-h-11 items-center px-2 text-headline text-cobalt">{t.common.done}</button>
        </div>
        <div className="flex-1 space-y-stack overflow-auto px-4 pb-[calc(40px+env(safe-area-inset-bottom))]">{open && children}</div>
      </div>
    </Popup>
  );
}
