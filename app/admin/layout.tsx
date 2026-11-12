import Link from "next/link";
import { LayoutDashboard, Video, LogOut, Plus, BookOpen } from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: admin } = await s
    .from("admin_users")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin?.is_active) redirect("/");

  return (
    <div className="min-h-screen bg-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#242429] bg-[#070708] p-5 md:block">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="mt-9 grid gap-2 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-[#171116] hover:text-[#ff168a]"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link
            href="/admin/videos"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-[#171116] hover:text-[#ff168a]"
          >
            <Video size={18} />
            Videos
          </Link>
          <Link
            href="/admin/magazine"
            className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-[#171116] hover:text-[#ff168a]"
          >
            <BookOpen size={18} />
            Magazine
          </Link>
          <Link
            href="/admin/new"
            className="mt-4 flex items-center gap-3 rounded-lg bg-[#ff168a] px-3 py-3 font-bold text-black"
          >
            <Plus size={18} />
            Add Video
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 md:pl-60">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#242429] bg-black/90 px-3 py-3 backdrop-blur sm:px-5">
          <div className="md:hidden">
            <Logo small />
          </div>
          <span className="ml-auto text-xs text-zinc-500 sm:text-sm md:ml-0">Admin Dashboard</span>
          <form action="/auth/logout" method="post">
            <button className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-400 hover:text-white">
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </header>
        <nav aria-label="Admin navigation" className="grid grid-cols-4 gap-1 border-b border-[#242429] bg-[#080809] p-2 text-center text-xs sm:text-sm md:hidden">
          <Link href="/admin" className="rounded-lg px-1 py-2.5 text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]">Dashboard</Link>
          <Link href="/admin/videos" className="rounded-lg px-1 py-2.5 text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]">Videos</Link>
          <Link href="/admin/magazine" className="rounded-lg px-1 py-2.5 text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]">Magazine</Link>
          <Link href="/admin/new" className="rounded-lg bg-[#ff168a] px-1 py-2.5 font-semibold text-black">+ Video</Link>
        </nav>
        <main className="min-w-0 p-3 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
