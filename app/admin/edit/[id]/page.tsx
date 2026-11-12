import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { AdminServerFields } from "@/components/admin-server-fields";
import { AdminEditNotice } from "@/components/admin-edit-notice";

type ServerRow = {
  id: string;
  server_name: string;
  server_url: string;
  sort_order: number;
  is_active: boolean;
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

const inputClass =
  "h-12 w-full rounded-xl border border-[#29292d] bg-black px-4 outline-none focus:border-[#ff168a]";

export default async function Edit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();

  const [
    { data: video, error: videoError },
    { data: servers, error: serverError },
  ] = await Promise.all([
    supabase.from("videos").select("*").eq("id", id).single(),
    supabase
      .from("video_servers")
      .select("id, server_name, server_url, sort_order, is_active")
      .eq("video_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (videoError || !video) notFound();

  if (serverError) {
    throw new Error(`Gagal mengambil server: ${serverError.message}`);
  }

  const existingServers: ServerRow[] = servers ?? [];

  async function save(formData: FormData) {
    "use server";

    const db = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    if (!title) throw new Error("Judul video wajib diisi.");

    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();

    if (!category) {
      throw new Error("Silakan pilih kategori.");
    }

    if (duration && !/^(?:\d{1,3}):[0-5]\d(?::[0-5]\d)?$/.test(duration)) {
      throw new Error("Format durasi harus MM:SS atau H:MM:SS.");
    }

    const tags = [
      ...new Set(
        String(formData.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];

    const { data: authData, error: authError } = await db.auth.getUser();

    if (authError || !authData.user) {
      throw new Error("Sesi login berakhir. Silakan login kembali.");
    }

    // Pertahankan thumbnail lama jika tidak memilih file baru.
    let thumbnailUrl =
      String(formData.get("thumbnail_url") ?? "").trim() || null;

    const thumbnailFile = formData.get("thumbnail_file");

    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(thumbnailFile.type)) {
        throw new Error("Thumbnail harus JPG, PNG, atau WebP.");
      }

      if (thumbnailFile.size < 10 * 1024 || thumbnailFile.size > 500 * 1024) {
        throw new Error("Ukuran thumbnail harus 10–500 KB.");
      }

      const extension =
        thumbnailFile.type === "image/png"
          ? "png"
          : thumbnailFile.type === "image/webp"
            ? "webp"
            : "jpg";

      const path = `${authData.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await db.storage
        .from("thumbnails")
        .upload(path, thumbnailFile, {
          contentType: thumbnailFile.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload thumbnail gagal: ${uploadError.message}`);
      }

      thumbnailUrl = db.storage.from("thumbnails").getPublicUrl(path)
        .data.publicUrl;
    }

    // UPDATE video yang sudah ada, bukan INSERT video baru.
    const { error: updateError } = await db
      .from("videos")
      .update({
        title,
        description: description || null,
        category,
        thumbnail_url: thumbnailUrl,
        duration: duration || null,
        tags,
        is_published: formData.get("is_published") === "on",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Gagal menyimpan video: ${updateError.message}`);
    }

    // Simpan perubahan server video.
    const ids = formData.getAll("server_id").map(String);
    const names = formData.getAll("server_name").map(String);
    const urls = formData.getAll("server_url").map(String);
    const activeIndexes = new Set(formData.getAll("server_active").map(String));
    const retainedIds = new Set<string>();

    for (let index = 0; index < names.length; index++) {
      const serverId = ids[index] || "";
      const name = names[index].trim();
      const url = (urls[index] || "").trim();

      // Kedua field kosong berarti server dihapus.
      if (!name && !url) continue;

      if (!name || !url) {
        throw new Error(
          `Server ${index + 1}: isi nama dan URL, atau kosongkan keduanya.`,
        );
      }

      const values = {
        server_name: name,
        server_url: url,
        sort_order: index,
        is_active: activeIndexes.has(String(index)),
        updated_at: new Date().toISOString(),
      };

      if (serverId) {
        retainedIds.add(serverId);

        const { error } = await db
          .from("video_servers")
          .update(values)
          .eq("id", serverId)
          .eq("video_id", id);

        if (error) {
          throw new Error(`Gagal mengubah server: ${error.message}`);
        }
      } else {
        const { error } = await db
          .from("video_servers")
          .insert({ ...values, video_id: id });

        if (error) {
          throw new Error(`Gagal menambahkan server: ${error.message}`);
        }
      }
    }

    // Hapus server lama yang tidak lagi dikirim oleh form.
    const removedIds = existingServers
      .filter((server) => !retainedIds.has(server.id))
      .map((server) => server.id);

    if (removedIds.length > 0) {
      const { error } = await db
        .from("video_servers")
        .delete()
        .eq("video_id", id)
        .in("id", removedIds);

      if (error) {
        throw new Error(`Gagal menghapus server: ${error.message}`);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/videos");

    if (video.slug) {
      revalidatePath(`/video/${video.slug}`);
    }

    redirect(`/admin/edit/${id}?saved=1`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminEditNotice saved={saved === "1"} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff168a]/10 text-[#ff168a]">
          <span className="text-xl">✎</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Video</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Update video details in your LOVE6 catalog.
          </p>
        </div>
      </div>

      <form
        action={save}
        className="mt-8 space-y-6"
      >
        {/* BASIC INFORMATION */}
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
              defaultValue={video.title}
              placeholder="Enter video title"
              required
            />
            ```tsx
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Category</span>

              <div className="relative">
                <select
                  name="category"
                  required
                  defaultValue={video.category ?? ""}
                  className={`${inputClass} cursor-pointer appearance-none pr-12`}
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  {video.category &&
                    !CATEGORIES.some(
                      (item) => item.value === video.category,
                    ) && (
                      <option value={video.category}>{video.category}</option>
                    )}

                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
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
            </label>
            ```
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Description</span>
              <textarea
                name="description"
                defaultValue={video.description ?? ""}
                rows={5}
                placeholder="Write a description for this video..."
                className="rounded-xl border border-[#29292d] bg-black px-4 py-3 outline-none focus:border-[#ff168a]"
              />
            </label>
          </div>
        </section>

        {/* VIDEO SERVERS */}
        <section className="glass rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Video Servers</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Edit existing servers, add new ones, or remove servers.
            </p>
          </div>

          <AdminServerFields servers={existingServers} />
        </section>

        {/* MEDIA */}
        <section className="glass rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Media</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Change the thumbnail and update the video duration.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid content-start gap-3 text-sm">
              <span className="font-medium">Thumbnail</span>

              {/* Klik gambar langsung membuka pemilih file. */}
              <label
                htmlFor="thumbnail_file"
                className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[#29292d] bg-black hover:border-[#ff168a]"
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt="Current thumbnail"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-zinc-500">No thumbnail</span>
                )}

                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 text-center opacity-0 transition group-hover:opacity-100">
                  <span className="text-2xl text-[#ff168a]">↑</span>
                  <span className="font-medium">Choose new thumbnail</span>
                  <span className="text-xs text-zinc-300">
                    JPG, PNG, WebP · 10–500 KB
                  </span>
                </span>
              </label>

              <input
                id="thumbnail_file"
                name="thumbnail_file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <input
                type="hidden"
                name="thumbnail_url"
                value={video.thumbnail_url ?? ""}
                readOnly
              />

              <p className="text-xs leading-5 text-zinc-500">
                Klik gambar untuk memilih thumbnail baru. Kosongkan pilihan file
                jika ingin mempertahankan thumbnail lama.
              </p>
            </div>

            <Field
              label="Duration"
              name="duration"
              defaultValue={video.duration ?? ""}
              placeholder="16:18 or 1:25:20"
            />
          </div>
        </section>

        {/* TAGS */}
        <section className="glass rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Tags</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Separate tags with commas.
            </p>
          </div>

          <Field
            label="Video Tags"
            name="tags"
            defaultValue={(video.tags ?? []).join(", ")}
            placeholder="tag1, tag2, tag3"
          />
        </section>

        {/* PUBLISHING */}
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
                defaultChecked={video.is_published}
                className="h-4 w-4 accent-[#ff168a]"
              />
              <span className="text-sm font-medium">Publish video</span>
            </label>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
          <a
            href="/admin/videos"
            className="rounded-xl border border-[#29292d] px-6 py-3 text-center text-sm font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </a>

          <button
            type="submit"
            className="rounded-xl bg-[#ff168a] px-8 py-3 text-sm font-bold text-white"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">
        {label}
        {required && <span className="ml-1 text-[#ff168a]">*</span>}
      </span>

      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}
