"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  LoaderCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type DeleteButtonProps = {
  videoId: string;
  videoTitle: string;
};

export default function DeleteButton({
  videoId,
  videoTitle,
}: DeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      // Hapus server video terlebih dahulu
      const { error: serversError } = await supabase
        .from("video_servers")
        .delete()
        .eq("video_id", videoId);

      if (serversError) throw serversError;

      // Hapus data video
      const { error: videoError } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (videoError) throw videoError;

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Gagal menghapus video:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-red-500 transition hover:text-red-400"
      >
        <Trash2 size={15} />
        Delete
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle size={19} />
                </div>

                <h2
                  id="delete-modal-title"
                  className="text-base font-semibold text-white"
                >
                  Delete video
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-6">
              <p className="text-sm leading-6 text-zinc-400">
                Are you sure you want to delete this video? This action
                cannot be undone.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="break-words text-sm font-semibold text-white">
                  {videoTitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Video data and its associated servers will be deleted.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-4 break-words rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                >
                  Failed to delete video: {errorMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}