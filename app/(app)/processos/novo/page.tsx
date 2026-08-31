import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import ProcessoForm from "@/components/processos/ProcessoForm";

export const dynamic = "force-dynamic";

export default async function NovoProcessoPage() {
  const supabase = createClient();
  const [{ data: clientes }, { data: profiles }] = await Promise.all([
    supabase.from("clientes").select("id, nome_completo").order("nome_completo"),
    supabase.from("profiles").select("id, nome").eq("ativo", true),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="Novo processo" subtitle="Cadastro de processo" />
      <div className="p-6">
        <ProcessoForm clientes={clientes ?? []} profiles={profiles ?? []} />
      </div>
    </div>
  );
}
