import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { formatViews } from "@/lib/utils";
import { Plus } from "lucide-react";
import DeleteButton from "@/components/delete-button";

export default async function Videos() {
  const s = await createClient();

  const { data, error } = await s
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-900 p-4 text-red-400">
        Gagal memuat daftar video: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Videos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All videos in your catalog.
          </p>
        </div>

        <Link
          href="/admin/new"
          className="flex items-center gap-2 rounded-lg bg-[#ff168a] px-4 py-2.5 text-sm font-bold"
        >
          <Plus size={17} />
          Add
        </Link>
      </div>

      <div className="glass mt-7 overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-[#29292d] text-zinc-500">
              <tr>
                <th className="p-4">Title</th>
                <th>Views</th>
                <th>Status</th>
                <th>Created</th>
                <th className="pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data?.map((v) => (
                <tr key={v.id} className="border-b border-[#19191c]">
                  <td className="p-4">{v.title}</td>

                  <td>{formatViews(v.views)}</td>

                  <td>
                    {v.is_published ? "Published" : "Draft"}
                  </td>

                  <td>
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>

                  <td className="pr-4">
                    <div className="flex items-center gap-4">
                      <Link
                        className="text-[#ff168a] hover:text-pink-400"
                        href={`/admin/edit/${v.id}`}
                      >
                        Edit
                      </Link>

                      <DeleteButton
                        videoId={v.id}
                        videoTitle={v.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {(!data || data.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-zinc-500"
                  >
                    Belum ada video.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}