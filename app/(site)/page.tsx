
import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { SectionGrid } from "@/components/section-grid";
import { Video } from "@/lib/types";
import { Logo } from "@/components/logo";
import { SiteFooter } from '@/components/site-footer'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const videoSelect =
    "id, title, slug, description, category, thumbnail_url, duration, tags, is_published, created_at";

  const recentQuery = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(16);

  const trendQuery = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(16);

  const [
    { data: recent, error: recentError },
    { data: trend, error: trendError },
  ] = await Promise.all([recentQuery, trendQuery]);

  if (recentError) {
    console.error("Homepage recent videos error:", recentError);
  }

  if (trendError) {
    console.error("Homepage trending videos error:", trendError);
  }

  const mapVideos = (rows: any[]): Video[] =>
    rows.map((video) => ({
      id: video.id,
      title: video.title,
      slug: video.slug,
      description: video.description ?? null,
      video_url: "",
      thumbnail_url: video.thumbnail_url ?? null,

      // Simpan durasi sebagai teks, misalnya "16:18".
      duration: video.duration == null ? "" : String(video.duration),

      views: 0,
      created_at: video.created_at,
      category_id: null,
      creator_name: null,
      creator_avatar: null,
      category_name: video.category ?? null,
      is_published: video.is_published,
      tags: Array.isArray(video.tags) ? video.tags : [],
    }));

  const recentVideos = mapVideos(recent ?? []);
  const trendingVideos = mapVideos(trend ?? []);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 px-3 sm:px-5 lg:px-8">
        <SectionGrid
          title="Recently Added"
          videos={recentVideos}
        />

        <SectionGrid
          title="Trending / Viral"
          videos={trendingVideos}
          kind="trend"
        />
      </main>

      <SiteFooter />
    </>
  );
}
