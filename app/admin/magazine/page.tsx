"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const MAX_COVER_SIZE = 500 * 1024;
const MIN_COVER_SIZE = 10 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Magazine = {
  id: string;
  title: string;
  cover_url: string;
  url: string;
  created_at: string;
};

export default function AdminMagazinePage() {
  const supabase = createClient();
  const router = useRouter();

  const [items, setItems] = useState<Magazine[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Magazine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);

    const { data, error: loadError } = await supabase
      .from("magazines")
      .select("id,title,cover_url,url,created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      setMessage(
        `Gagal memuat magazine: ${loadError.message}. Pastikan SQL migration sudah dijalankan.`
      );
      setError(true);
    } else {
      setItems((data ?? []) as Magazine[]);
      setMessage("");
      setError(false);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!cover) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(cover);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [cover]);

  // Menutup modal dengan tombol Escape.
  useEffect(() => {
    if (!deleteTarget || deleting) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDeleteTarget(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, deleting]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage("Format cover harus JPG, PNG, atau WebP.");
      setError(true);
      setCover(null);
      input.value = "";
      return;
    }

    if (file.size < MIN_COVER_SIZE || file.size > MAX_COVER_SIZE) {
      setMessage(
        "Ukuran cover harus antara 10 KB dan 500 KB, sama seperti thumbnail video."
      );
      setError(true);
      setCover(null);
      input.value = "";
      return;
    }

    setCover(file);
    setMessage("");
    setError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !cover || !url.trim()) {
      setMessage("Isi title, upload cover, dan masukkan URL KaryaKarsa.");
      setError(true);
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url.trim());
    } catch {
      setMessage("URL KaryaKarsa tidak valid.");
      setError(true);
      return;
    }

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.protocol !== "http:"
    ) {
      setMessage("URL harus menggunakan http atau https.");
      setError(true);
      return;
    }

    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const extension =
        cover.type === "image/png"
          ? "png"
          : cover.type === "image/webp"
            ? "webp"
            : "jpg";

      const path = `magazine/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(path, cover, {
          contentType: cover.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Upload cover gagal: ${uploadError.message}`);
        setError(true);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("magazines")
        .insert({
          title: title.trim(),
          cover_url: publicUrl.publicUrl,
          url: parsedUrl.toString(),
        });

      if (insertError) {
        await supabase.storage.from("thumbnails").remove([path]);
        setMessage(`Gagal menyimpan magazine: ${insertError.message}`);
        setError(true);
        return;
      }

      setTitle("");
      setUrl("");
      setCover(null);

      const input = document.getElementById(
        "magazine-cover"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      setMessage("Magazine berhasil ditambahkan.");
      setError(false);

      await loadItems();
      router.refresh();
    } catch {
      setMessage("Terjadi kesalahan saat menyimpan magazine. Coba lagi.");
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    const item = deleteTarget;

    setDeleting(true);
    setMessage("");
    setError(false);

    try {
      const { error: deleteError } = await supabase
        .from("magazines")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        setMessage(`Gagal menghapus: ${deleteError.message}`);
        setError(true);
        return;
      }

      // Hapus cover dari Storage setelah data database terhapus.
      const marker = "/storage/v1/object/public/thumbnails/";
      const index = item.cover_url.indexOf(marker);

      if (index >= 0) {
        try {
          const objectPath = decodeURIComponent(
            item.cover_url.slice(index + marker.length).split("?")[0]
          );

          // Hanya hapus file di folder magazine, bukan thumbnail video.
          if (objectPath.startsWith("magazine/")) {
            const { error: storageError } = await supabase.storage
              .from("thumbnails")
              .remove([objectPath]);

            if (storageError) {
              console.error(
                "Magazine terhapus dari database, tetapi cover gagal dihapus:",
                storageError.message
              );
            }
          }
        } catch (storageError) {
          console.error("Gagal membersihkan cover:", storageError);
        }
      }

      setItems((current) =>
        current.filter((row) => row.id !== item.id)
      );
      setMessage("Magazine berhasil dihapus.");
      setError(false);
      setDeleteTarget(null);

      router.refresh();
    } catch {
      setMessage("Terjadi kesalahan saat menghapus magazine. Coba lagi.");
      setError(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff168a]">
          LOVE6 CONTENT
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Manage Magazine
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Upload a 4:5 cover and link it to the KaryaKarsa page.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass mt-6 grid min-w-0 gap-5 rounded-2xl p-3 sm:mt-7 sm:gap-6 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] md:p-7"
      >
        <div className="grid content-start gap-5">
          <label className="grid gap-2 text-sm font-medium">
            Magazine title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              required
              placeholder="Enter magazine title"
              className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#ff168a]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            KaryaKarsa URL
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              placeholder="https://karyakarsa.com/..."
              className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#ff168a]"
            />
            <span className="text-xs font-normal text-zinc-500">
              Cover akan membuka link ini di tab baru pada halaman Magazine.
            </span>
          </label>

          <div className="text-xs text-zinc-500">
            JPG, PNG, atau WebP · minimum 10 KB · maximum 500 KB
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#ff168a] px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}
            {saving ? "Saving..." : "Add Magazine"}
          </button>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={`break-words text-sm ${
                error ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <span className="mb-2 block text-sm font-medium">
            Cover image (4:5 display)
          </span>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/40">
            {preview ? (
              <img
                src={preview}
                alt="Magazine cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
                <ImagePlus size={36} />
                <span className="text-sm">Cover preview</span>
              </div>
            )}

            {preview && (
              <button
                type="button"
                onClick={() => {
                  setCover(null);
                  const input = document.getElementById(
                    "magazine-cover"
                  ) as HTMLInputElement | null;

                  if (input) input.value = "";
                }}
                aria-label="Remove selected cover"
                className="absolute right-2 top-2 rounded-full bg-black/80 p-2 text-white transition hover:bg-red-500"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <label
            htmlFor="magazine-cover"
            className="mx-auto mt-3 flex w-full max-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-3 text-sm hover:border-[#ff168a]"
          >
            <Upload size={16} className="text-[#ff168a]" />
            Choose cover
          </label>

          <input
            id="magazine-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="sr-only"
          />

          {cover && (
            <p className="mt-2 break-all text-center text-xs text-zinc-500">
              {cover.name} · {(cover.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      </form>

      <section className="mt-10">
        <h2 className="text-xl font-bold">
          Existing Magazines{" "}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {items.length}
          </span>
        </h2>

        {loading ? (
          <p className="py-8 text-sm text-zinc-500">
            Loading magazines…
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-sm text-zinc-500">
            No magazines yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <div className="aspect-[4/5] bg-zinc-900">
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">
                    {item.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-[#ff168a]"
                    >
                      Preview <ExternalLink size={13} />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
                      className="rounded-md p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Custom confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-magazine-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-[0_20px_80px_rgba(255,22,138,0.12)]"
          >
            <div className="flex items-start gap-4 p-5 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                <Trash2 size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-magazine-title"
                  className="text-lg font-bold text-white"
                >
                  Hapus Magazine?
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                  Lu yakin mau menghapus{" "}
                  <span className="font-semibold text-white">
                    “{deleteTarget.title}”
                  </span>
                  ? Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>

              <button
                type="button"
                aria-label="Tutup dialog"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {message && error && (
              <p
                role="alert"
                className="mx-5 mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 sm:mx-6"
              >
                {message}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-10 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#ff168a] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#ff4ba4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}