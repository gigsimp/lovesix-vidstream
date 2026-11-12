import { Flame, Clock3 } from "lucide-react";
import { VideoCard } from "./video-card";
import { Video } from "@/lib/types";
import Link from "next/link";

export function SectionGrid({
  title,
  videos,
  kind = "recent",
}: {
  title: string;
  videos: Video[];
  kind?: "recent" | "trend";
}) {
  const viewAllHref = kind === "trend" ? "/trending" : "/categories";

  return (
    <section className="min-w-0 py-5 sm:py-7">
      <div className="mb-4 flex min-w-0 items-end justify-between gap-3 border-b border-[#222] pb-3 sm:mb-5">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold sm:text-xl md:text-2xl">
          {kind === "trend" ? (
            <Flame className="text-[#ff168a]" />
          ) : (
            <Clock3 className="text-[#ff168a]" />
          )}
          {title}
        </h2>

        <Link
          href={viewAllHref}
          className="text-sm font-semibold text-[#ff168a]"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-4">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}