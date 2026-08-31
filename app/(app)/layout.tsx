import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user.id)
    .maybeSingle();

  const nome = profile?.nome ?? user.email ?? "Usuário";
  const role = profile?.role ?? "socia";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar nome={nome} role={role} />
      <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>
    </div>
  );
}
