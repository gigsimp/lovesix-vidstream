import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";
import { Pagination } from "@/components/pagination";
import type { Video } from "@/lib/types";
import { SiteFooter } from "@/components/site-footer";

const PAGE_SIZE = 32;
const TRENDING_THRESHOLD = 100;

export default async function Trending({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Hitung total views video yang sudah dipublikasikan.
  const { data: publishedVideos, error: viewsError } = await supabase
    .from("videos")
    .select("views")
    .eq("is_published", true);

  if (viewsError) {
    console.error("Trending views query error:", viewsError.message);
  }

  const totalViews = (publishedVideos ?? []).reduce(
    (sum, video) => sum + (Number(video.views) || 0),
    0,
  );

  // Views masih sedikit: video terbaru.
  // Sudah mencapai ambang: views tertinggi.
  const sortByViews =
    !viewsError && totalViews >= TRENDING_THRESHOLD;

  let query = supabase
    .from("videos")
    .select("*", { count: "exact" })
    .eq("is_published", true);

  if (sortByViews) {
    query = query
      .order("views", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Trending videos query error:", error.message);
  }

  const videos = (data ?? []).map((video: any) => ({
    ...video,
    video_url: video.video_url ?? "",
    duration:
      video.duration == null ? "" : String(video.duration),
    category_name: video.category ?? null,
  })) as Video[];

  const totalPages = Math.max(
    1,
    Math.ceil((count ?? 0) / PAGE_SIZE),
  );

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff168a]">
            LOVE6
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Trending
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {sortByViews
              ? "The most-viewed videos in the catalog."
              : "Recently added videos. Trending rankings will appear as views grow."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {error ? (
          <p className="py-20 text-center text-zinc-500">
            Videos could not be loaded. Please try again.
          </p>
        ) : !videos.length ? (
          <p className="py-20 text-center text-zinc-500">
            Video Not Found
          </p>
        ) : null}

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/trending"
        />
      </main>

      <SiteFooter />
    </>
  );
}