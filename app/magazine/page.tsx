import Image from "next/image";
import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Pagination } from "@/components/pagination";

type Magazine = {
  id: string;
  title: string;
  cover_url: string;
  url: string;
  created_at: string;
};

const PAGE_SIZE = 20;

export default async function MagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("magazines")
    .select("id,title,cover_url,url,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const magazines = (error ? [] : data ?? []) as Magazine[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[65vh] w-full min-w-0 max-w-[1500px] flex-1 px-3 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff168a]">LOVE6</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Magazine</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">Discover our latest magazine covers and featured collections.</p>

        {magazines.length ? (
          <div className="mt-7 grid w-full grid-cols-1 gap-x-3 gap-y-6 sm:mt-8 sm:gap-x-5 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-4">
            {magazines.map((magazine) => (
              <a
                key={magazine.id}
                href={magazine.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block min-w-0"
                aria-label={`Open ${magazine.title} on KaryaKarsa in a new tab`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-[#ff168a]/60 group-hover:shadow-[0_10px_35px_rgba(255,22,138,0.12)]">
                  <Image
                    src={magazine.cover_url}
                    alt={magazine.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    unoptimized
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/75 p-2 text-white opacity-0 transition group-hover:opacity-100">
                    <ExternalLink size={16} />
                  </span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-sm font-semibold text-zinc-100 transition group-hover:text-[#ff168a] sm:text-base">
                  {magazine.title}
                </h2>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 text-center">
            <BookOpen size={34} className="text-zinc-600" />
            <h2 className="mt-4 text-lg font-semibold">Magazine coming soon</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">New covers and featured picks will appear here soon.</p>
          </div>
        )}

        {!error && magazines.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/magazine"
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
