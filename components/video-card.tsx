import Link from "next/link";
import { Play } from "lucide-react";
import { Video } from "@/lib/types";

function displayDuration(duration: string | number | null | undefined) {
  if (duration === null || duration === undefined || duration === "") {
    return "";
  }

  const value = String(duration).trim();

  if (/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    return value;
  }

  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return "";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: Video }) {
  const duration = displayDuration(video.duration);

  return (
    <article className="group min-w-0">
      <Link
        href={`/video/${video.slug}`}
        className="relative block aspect-[4/3] min-w-0 overflow-hidden rounded-md border border-[#242429] bg-black transition group-hover:border-[#ff168a] group-hover:shadow-[0_0_20px_rgba(255,22,138,.12)]"
      >
        <img
          src={video.thumbnail_url || "/placeholder.svg"}
          alt={video.title}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.025]"
        />

        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-[11px] font-bold">
            <Play
              size={10}
              className="mr-1 inline fill-[#ff168a] text-[#ff168a]"
            />
            {duration}
          </span>
        )}
      </Link>

      <div className="mt-2 min-w-0">
        <Link
          href={`/video/${video.slug}`}
          className="line-clamp-2 break-words text-xs font-semibold hover:text-[#ff4eaa] sm:text-sm"
        >
          {video.title}
        </Link>
      </div>
    </article>
  );
}