"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import AdminNotice, { type NoticeType } from "@/components/admin-notice";
import { createClient } from "@/lib/supabase-browser";
import {
  Plus,
  Trash2,
  Link2,
  Image as ImageIcon,
  Clock,
  Tag,
  Upload,
  X,
} from "lucide-react";

type Server = {
  id: number;
  name: string;
  url: string;
};

const CATEGORIES = [
  { value: "indonesia", label: "Indonesia" },
  { value: "livestream", label: "Livestream" },
  { value: "jilbab", label: "Jilbab" },
  { value: "korea", label: "Korea" },
  { value: "japan", label: "Japan" },
  { value: "western", label: "Western" },
  { value: "others", label: "Others" },
];

const MIN_THUMBNAIL_SIZE = 10 * 1024;
const MAX_THUMBNAIL_SIZE = 500 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewVideo() {
  const [servers, setServers] = useState<Server[]>([
    { id: 1, name: "Vidara", url: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const router = useRouter();

  const [notice, setNotice] = useState<{
    open: boolean;
    type: NoticeType;
    title: string;
    message: string;
  }>({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  function showNotice(type: NoticeType, title: string, message: string) {
    setNotice({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeNotice() {
    const shouldRedirect = notice.type === "success";

    setNotice((current) => ({ ...current, open: false }));

    if (shouldRedirect) {
      window.location.assign("/admin/videos");
    }
  }

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnail);
    setThumbnailPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnail]);

  function handleThumbnailChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showNotice(
        "error",
        "Format Tidak Didukung",
        "Format thumbnail harus JPG, PNG, atau WebP.",
      );
      e.target.value = "";
      return;
    }

    if (file.size < MIN_THUMBNAIL_SIZE) {
      showNotice(
        "error",
        "File Terlalu Kecil",
        "Ukuran thumbnail minimal 10 KB.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      showNotice(
        "error",
        "File Terlalu Besar",
        "Ukuran thumbnail maksimal 500 KB.",
      );
      e.target.value = "";
      return;
    }

    setThumbnail(file);
  }

  function addServer() {
    setServers((current) => [
      ...current,
      { id: Date.now(), name: "", url: "" },
    ]);
  }

  function removeServer(id: number) {
    if (servers.length === 1) return;
    setServers((current) => current.filter((server) => server.id !== id));
  }

  function updateServer(id: number, field: "name" | "url", value: string) {
    setServers((current) =>
      current.map((server) =>
        server.id === id ? { ...server, [field]: value } : server,
      ),
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      showNotice(
        "error",
        "Sesi Login Berakhir",
        "Session login tidak ditemukan. Silakan login kembali.",
      );
      return;
    }

    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const duration = String(formData.get("duration") || "").trim();
    const tagsValue = String(formData.get("tags") || "").trim();
    const isPublished = formData.get("is_published") === "on";

    if (!title) {
      showNotice("error", "Judul Belum Diisi", "Video title wajib diisi.");
      return;
    }

    if (!category) {
      showNotice("error", "Kategori Belum Dipilih", "Silakan pilih category.");
      return;
    }

    const durationPattern = /^(?:\d{1,3}):[0-5]\d(?::[0-5]\d)?$/;

    if (duration && !durationPattern.test(duration)) {
      showNotice(
        "error",
        "Format Durasi Tidak Valid",
        "Gunakan format MM:SS atau H:MM:SS. Contoh: 16:18 atau 1:25:20.",
      );
      return;
    }

    const validServers = servers.filter(
      (server) => server.name.trim() && server.url.trim(),
    );

    if (validServers.length === 0) {
      showNotice(
        "error",
        "Video Server Belum Diisi",
        "Minimal 1 video server wajib diisi dengan nama dan URL.",
      );
      return;
    }

    const tags = [
      ...new Set(
        tagsValue
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];

    const slugBase =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "video";
    const slug = `${slugBase}-${Date.now()}`;

    let uploadedThumbnailPath: string | null = null;

    try {
      setSaving(true);

      let thumbnailUrl: string | null = null;

      if (thumbnail) {
        const extension =
          thumbnail.type === "image/png"
            ? "png"
            : thumbnail.type === "image/webp"
              ? "webp"
              : "jpg";

        const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(filePath, thumbnail, {
            contentType: thumbnail.type,
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload thumbnail gagal: ${uploadError.message}`);
        }

        uploadedThumbnailPath = filePath;

        const { data: publicUrlData } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          title,
          slug,
          category,
          description: description || null,
          thumbnail_url: thumbnailUrl,
          duration: duration || null,
          tags,
          is_published: isPublished,
        })
        .select("id")
        .single();

      if (videoError) {
        throw new Error(`Gagal menyimpan video: ${videoError.message}`);
      }

      if (!video?.id) {
        throw new Error("ID video tidak ditemukan.");
      }

      const { error: serverError } = await supabase
        .from("video_servers")
        .insert(
          validServers.map((server, index) => ({
            video_id: video.id,
            server_name: server.name.trim(),
            server_url: server.url.trim(),
            sort_order: index,
            is_active: true,
          })),
        );

      if (serverError) {
        const { error: deleteError } = await supabase
          .from("videos")
          .delete()
          .eq("id", video.id);

        if (deleteError) {
          console.error("Rollback video error:", deleteError);
        }

        throw new Error(`Video server gagal disimpan: ${serverError.message}`);
      }

      showNotice(
        "success",
        "Video Berhasil Disimpan",
        "Video baru berhasil ditambahkan ke katalog LOVE6.",
      );
    } catch (error) {
      console.error("Save video error:", error);

      if (uploadedThumbnailPath) {
        const { error: cleanupError } = await supabase.storage
          .from("thumbnails")
          .remove([uploadedThumbnailPath]);

        if (cleanupError) {
          console.error("Thumbnail cleanup error:", cleanupError);
        }
      }

      showNotice(
        "error",
        "Gagal Menyimpan Video",
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {notice.open && (
        <AdminNotice
          open={notice.open}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={closeNotice}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff168a]/10 text-[#ff168a]">
          <Plus size={21} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Video</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add a new video to your LOVE6 catalog.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section className="glass rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Basic Information</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Information displayed on the video page.
            </p>
          </div>

          <div className="grid gap-5">
            <Field
              label="Video Title"
              name="title"
              placeholder="Enter video title"
              required
            />

            <div className="grid gap-2 text-sm">
              <label htmlFor="category" className="font-medium">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue=""
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#29292d] bg-black px-4 pr-12 outline-none focus:border-[#ff168a]"
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <label htmlFor="description" className="font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Write a description for this video..."
                className="rounded-xl border border-[#29292d] bg-black px-4 py-3 outline-none focus:border-[#ff168a]"
              />
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link2 size={18} className="text-[#ff168a]" />
                <h2 className="text-lg font-bold">Video Servers</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Add one or more video hosting servers.
              </p>
            </div>

            <button
              type="button"
              onClick={addServer}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-[#ff168a]/40 bg-[#ff168a]/10 px-3 py-2 text-sm font-semibold text-[#ff168a]"
            >
              <Plus size={16} /> Add Server
            </button>
          </div>

          <div className="space-y-4">
            {servers.map((server, index) => (
              <div
                key={server.id}
                className="rounded-xl border border-[#29292d] bg-black/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff168a]/10 text-xs font-bold text-[#ff168a]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">
                      Server {index + 1}
                    </span>
                  </div>
                  {servers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServer(server.id)}
                      className="rounded-lg p-2 text-zinc-500 hover:text-red-400"
                      title="Remove server"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="grid gap-2 text-sm">
                    <label
                      htmlFor={`server-name-${server.id}`}
                      className="font-medium"
                    >
                      Server Name
                    </label>
                    <input
                      id={`server-name-${server.id}`}
                      value={server.name}
                      onChange={(e) =>
                        updateServer(server.id, "name", e.target.value)
                      }
                      placeholder="Vidara"
                      className="h-12 rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]"
                    />
                  </div>
                  <div className="grid gap-2 text-sm">
                    <label
                      htmlFor={`server-url-${server.id}`}
                      className="font-medium"
                    >
                      Video URL
                    </label>
                    <input
                      id={`server-url-${server.id}`}
                      value={server.url}
                      onChange={(e) =>
                        updateServer(server.id, "url", e.target.value)
                      }
                      placeholder="https://..."
                      type="url"
                      className="h-12 rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[#ff168a]/10 bg-[#ff168a]/5 px-4 py-3 text-xs leading-5 text-zinc-400">
            <span className="font-semibold text-[#ff168a]">Tip:</span> You can
            add multiple servers such as Vidara, LuluStream, StreamWish, or
            another provider.
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-[#ff168a]" />
              <h2 className="text-lg font-bold">Media</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Upload thumbnail and set video duration.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid content-start gap-3 text-sm">
              <label htmlFor="thumbnail-upload" className="font-medium">
                Thumbnail
              </label>

              {thumbnailPreview ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-[#29292d] bg-black">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="aspect-video w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs text-zinc-400">
                      {thumbnail?.name} ·{" "}
                      {((thumbnail?.size || 0) / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnail(null);
                        const input = document.getElementById(
                          "thumbnail-upload",
                        ) as HTMLInputElement | null;
                        if (input) input.value = "";
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="thumbnail-upload"
                  className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#3a3a40] bg-black/40 px-4 text-center transition hover:border-[#ff168a]"
                >
                  <Upload size={26} className="text-[#ff168a]" />
                  <span className="font-medium">Choose thumbnail</span>
                  <span className="text-xs text-zinc-500">
                    JPG, PNG, WebP · 10–500 KB
                  </span>
                </label>
              )}

              <input
                id="thumbnail-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailChange}
                className="sr-only"
              />

              <p className="text-xs leading-5 text-zinc-500">
                Recommended ratio 16:9, ideally 1280 × 720 pixels. Thumbnail is
                optional.
              </p>
            </div>

            <div className="grid content-start gap-2 text-sm">
              <label
                htmlFor="duration"
                className="flex items-center gap-2 font-medium"
              >
                <Clock size={15} className="text-zinc-500" />
                Duration
              </label>
              <input
                id="duration"
                name="duration"
                type="text"
                inputMode="text"
                placeholder="16:18 atau 1:25:20"
                pattern="[0-9]{1,3}:[0-5][0-9](:[0-5][0-9])?"
                title="Gunakan format MM:SS atau H:MM:SS, contoh 16:18 atau 1:25:20"
                className="h-12 w-full rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]"
              />
              <p className="text-xs text-zinc-500">
                Format MM:SS atau H:MM:SS. Contoh: 16:18 atau 1:25:20.
              </p>
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[#ff168a]" />
              <h2 className="text-lg font-bold">Tags</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Separate tags with commas.
            </p>
          </div>
          <input
            name="tags"
            placeholder="Separate tags with commas."
            className="h-12 w-full rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]"
          />
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">Publishing</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Choose whether this video is visible immediately.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[#ff168a]"
              />
              <span className="text-sm font-medium">Publish immediately</span>
            </label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin/videos";
            }}
            className="rounded-xl border border-[#29292d] px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#ff168a] px-8 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Video"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2 text-sm">
      <label htmlFor={name} className="font-medium">
        {label}
        {required && <span className="ml-1 text-[#ff168a]">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-12 rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]"
      />
    </div>
  );
}
