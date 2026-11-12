"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type NoticeType = "success" | "error" | "info";

type AdminNoticeProps = {
  open: boolean;
  title: string;
  message: string;
  type?: NoticeType;
  onClose: () => void;
};

export default function AdminNotice({
  open,
  title,
  message,
  type = "info",
  onClose,
}: AdminNoticeProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 size={21} />,
      color: "text-[#ff168a]",
      background: "bg-[#ff168a]/10",
    },
    error: {
      icon: <AlertCircle size={21} />,
      color: "text-red-400",
      background: "bg-red-500/10",
    },
    info: {
      icon: <Info size={21} />,
      color: "text-sky-400",
      background: "bg-sky-500/10",
    },
  }[type];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-notice-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.background} ${styles.color}`}
            >
              {styles.icon}
            </div>

            <h2
              id="admin-notice-title"
              className="text-base font-semibold text-white"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6">
          <p className="whitespace-pre-line break-words text-sm leading-6 text-zinc-400">
            {message}
          </p>
        </div>

        <div className="flex justify-end border-t border-white/10 bg-white/[0.02] px-5 py-4">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg bg-[#ff168a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}