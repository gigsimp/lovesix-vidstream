import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100vh-144px)] w-full max-w-[1500px] px-5 py-10 text-left sm:px-8 lg:px-10">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="glass mt-7 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Account email
          </p>
          <p className="mt-2">{user.email}</p>
          <p className="mt-6 text-xs uppercase tracking-widest text-zinc-500">
            Display name
          </p>
          <p className="mt-2">
            {user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Not set"}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
