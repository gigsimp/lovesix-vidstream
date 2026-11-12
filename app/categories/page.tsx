"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoCard } from "@/components/video-card";
import { Pagination } from "@/components/pagination";
import type { Video } from "@/lib/types";

const PAGE_SIZE = 32;

const CATEGORY_OPTIONS = [
  { label: "Indonesian", value: "Indonesia" },
  { label: "Livestream", value: "Livestream" },
  { label: "Jilbab", value: "Jilbab" },
  { label: "Korean", value: "Korea" },
  { label: "Japanese", value: "Japan" },
  { label: "Western", value: "Western" },
  { label: "Others", value: "Others" },
];

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const selectedSort = searchParams.get("sort") || "latest";
  const page = Math.max(
    1,
    Number(searchParams.get("page") || "1") || 1,
  );

  const [videos, setVideos] = useState<Video[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);

      const supabase = createClient();

      let query = supabase
        .from("videos")
        .select("*", { count: "exact" })
        .eq("is_published", true);

      if (selectedCategory) {
        if (selectedCategory === "Others") {
          query = query
            .not("category", "is", null)
            .not(
              "category",
              "in",
              '("Indonesia","Livestream","Jilbab","Korea","Japan","Western")',
            );
        } else {
          query = query.ilike("category", selectedCategory);
        }
      }

      if (selectedSort === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else {
        query = query
          .order("created_at", { ascending: false });
      }

      const from = (page - 1) * PAGE_SIZE;

      const { data, count, error } = await query.range(
        from,
        from + PAGE_SIZE - 1,
      );

      if (cancelled) return;

      if (error) {
        console.error("Category videos query error:", error);
        setVideos([]);
        setTotalPages(1);
      } else {
        setVideos((data || []) as Video[]);
        setTotalPages(
          Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
        );
      }

      setLoading(false);
    }

    loadVideos();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, selectedSort, page]);

  function updateFilters(category: string, sort: string) {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (sort !== "latest") params.set("sort", sort);

    // Filter berubah, mulai lagi dari halaman pertama.
    router.push(
      `/categories${params.size ? `?${params.toString()}` : ""}`,
    );
  }

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find(
      (item) =>
        item.value.toLowerCase() === selectedCategory.toLowerCase(),
    )?.label || selectedCategory;

  const currentFilterLabel = [
    selectedSort === "oldest" ? "Oldest" : "Latest",
    selectedCategory ? selectedCategoryLabel : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white">
      <SiteHeader />

      <main className="mx-auto min-h-[65vh] w-full min-w-0 max-w-[1500px] flex-1 px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
        <div className="mb-6 flex min-w-0 items-start justify-between gap-3 sm:mb-7 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Categories</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Browse videos by category.
            </p>
            <p className="mt-2 text-sm text-[#ff168a]">
              Filter: {currentFilterLabel}
            </p>
          </div>

          <div className="relative shrink-0 pt-1">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              aria-expanded={filterOpen}
              className="flex items-center gap-1.5 rounded-lg border border-[#29292d] px-3 py-2.5 text-xs transition hover:border-[#ff168a] sm:gap-2 sm:px-4 sm:text-sm"
            >
              <SlidersHorizontal size={16} />
              Filter
              <ChevronDown
                size={15}
                className={`transition ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {filterOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close filter menu"
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setFilterOpen(false)}
                />

                <div className="absolute right-0 z-30 mt-2 max-h-96 w-56 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl border border-[#29292d] bg-[#0b0b0d] p-2 shadow-xl">
                  {[
                    { label: "Latest", value: "latest" },
                    { label: "Oldest", value: "oldest" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateFilters(selectedCategory, option.value)
                      }
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#171116] ${
                        selectedSort === option.value
                          ? "text-[#ff168a]"
                          : "text-zinc-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  <div className="my-2 border-t border-[#29292d]" />

                  {CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        updateFilters(category.value, selectedSort)
                      }
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#171116] ${
                        selectedCategory.toLowerCase() ===
                        category.value.toLowerCase()
                          ? "text-[#ff168a]"
                          : "text-zinc-300"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}

                  <div className="my-2 border-t border-[#29292d]" />

                  <button
                    type="button"
                    onClick={() => updateFilters("", selectedSort)}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-[#171116] hover:text-white"
                  >
                    Clear category
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <p className="py-20 text-center text-zinc-500">
            Loading videos...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {!videos.length && (
              <p className="py-20 text-center text-zinc-500">
                Video Not Found
              </p>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/categories"
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#050505] text-white">
          <SiteHeader />
          <main className="flex-1">
            <p className="py-20 text-center text-zinc-500">
              Loading...
            </p>
          </main>
          <SiteFooter />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}