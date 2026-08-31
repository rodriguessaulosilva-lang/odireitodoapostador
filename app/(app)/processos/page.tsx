import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProcessosView from "@/components/processos/ProcessosView";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  const supabase = createClient();
  const [{ data: processos }, { data: profiles }] = await Promise.all([
    supabase
      .from("processos")
      .select("*, cliente:clientes(nome_completo)")
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id, nome"),
  ]);

  const nomeById = new Map((profiles ?? []).map((p: any) => [p.id, p.nome]));
  const rows = (processos ?? []).map((p: any) => ({
    ...p,
    cliente_nome: p.cliente?.nome_completo ?? null,
    responsavel_nome: p.responsavel_id ? nomeById.get(p.responsavel_id) ?? null : null,
  }));

  return (
    <div className="pb-10">
      <PageHeader
        title="Processos"
        subtitle={`${rows.length} processo(s)`}
        action={
          <Link href="/processos/novo" className="btn-primary">
            <Plus size={16} /> Novo processo
          </Link>
        }
      />
      <div className="p-6">
        <ProcessosView processos={rows} />
      </div>
    </div>
  );
}
