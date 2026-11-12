import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoCard } from "@/components/video-card";
import type { Video } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Cek apakah user adalah admin
  const { data: admin } = await supabase
    .from("admin_users")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  // Ambil daftar video favorit milik user
  const { data: favorites, error: favoritesError } = await supabase
    .from("video_favorites")
    .select("video_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  let favoriteVideos: Video[] = [];

  if (!favoritesError && favorites && favorites.length > 0) {
    const videoIds = favorites.map((favorite) => favorite.video_id);

    // Ambil detail video yang sudah dipublikasikan
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .in("id", videoIds)
      .eq("is_published", true);

    if (!videosError && videos) {
      // Pertahankan urutan sesuai waktu video di-favorite
      const videoMap = new Map(
        videos.map((video) => [video.id, video])
      );

      favoriteVideos = videoIds
        .map((id) => videoMap.get(id))
        .filter((video): video is NonNullable<typeof video> => Boolean(video))
        .map((video) => ({
          ...video,
          category_name: video.category ?? null,
          creator_name: null,
          creator_avatar: null,
        })) as Video[];
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto min-h-[70vh] max-w-[1200px] px-5 py-10">
        <h1 className="text-3xl font-bold text-white">
          My Dashboard
        </h1>

        <p className="mt-2 text-zinc-400">
          Welcome back,{" "}
          {user.user_metadata?.full_name || user.email}.
        </p>

        {admin?.is_active && (
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-lg bg-[#ff168a] px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            Open Admin Dashboard
          </Link>
        )}

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">
              ❤️ Favorite Videos
            </h2>

            <span className="text-sm text-zinc-400">
              {favoriteVideos.length} videos
            </span>
          </div>

          {favoritesError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              Gagal memuat video favorit. Coba refresh halaman.
            </div>
          ) : favoriteVideos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {favoriteVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <div className="mb-4 text-5xl">♡</div>

              <h3 className="text-lg font-bold text-white">
                Belum ada video favorit
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                Klik tombol Favorite di halaman video untuk
                menyimpan video kesukaan lu di sini.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-lg bg-[#ff168a] px-5 py-3 font-bold text-black transition hover:opacity-90"
              >
                Jelajahi Video
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}