import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";
import { Video } from "@/lib/types";
import { SiteFooter } from "@/components/site-footer";

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const supabase = await createClient();

  let videos: Video[] = [];
  let searchError = false;

  if (query) {
    // Ambil video publik, lalu cocokkan judul, deskripsi,
    // kategori, dan tag tanpa bergantung pada relasi tabel lain.
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Search videos error:", error.message);
      searchError = true;
    } else {
      const normalizedQuery = query.toLocaleLowerCase();

      videos = ((data ?? []) as any[])
        .filter((video) => {
          const title = String(video.title ?? "").toLocaleLowerCase();
          const description = String(
            video.description ?? ""
          ).toLocaleLowerCase();
          const category = String(
            video.category ?? ""
          ).toLocaleLowerCase();

          const tags: string[] = Array.isArray(video.tags)
            ? video.tags.map((tag: unknown) => String(tag))
            : [];

          return (
            title.includes(normalizedQuery) ||
            description.includes(normalizedQuery) ||
            category.includes(normalizedQuery) ||
            tags.some((tag) =>
              tag.toLocaleLowerCase().includes(normalizedQuery)
            )
          );
        })
        .map((video) => ({
          ...video,
          creator_name: undefined,
          creator_avatar: undefined,
          category_name: video.category ?? undefined,
        })) as Video[];
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-[1500px] px-5 py-8">
        <h1 className="mb-6 text-2xl font-bold">
          {query
            ? `Search results for “${query}”`
            : "Search videos"}
        </h1>

        {videos.length > 0 ? (
          <>
            <p className="mb-5 text-sm text-zinc-500">
              {videos.length} video{videos.length === 1 ? "" : "s"} found
            </p>

            <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : (
          <p className="py-20 text-center text-zinc-500">
            {searchError
              ? "Search failed. Please try again."
              : query
                ? `Video Not Found for “${query}”`
                : "Enter a video title or tag to search."}
          </p>
        )}
      </main>

      <SiteFooter />
    </>
  );
}