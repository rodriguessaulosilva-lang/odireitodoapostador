import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ProcessoDetail from "@/components/processos/ProcessoDetail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProcessoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: processo } = await supabase
    .from("processos")
    .select("*, cliente:clientes(id, nome_completo)")
    .eq("id", id)
    .maybeSingle();

  if (!processo) notFound();

  const [{ data: andamentos }, { data: publicacoes }, { data: prazos }, { data: audiencias }, { data: honorarios }, { data: profiles }] =
    await Promise.all([
      supabase.from("andamentos").select("*").eq("processo_id", id).order("data", { ascending: false }),
      supabase.from("publicacoes").select("*").eq("processo_id", id).order("data_publicacao", { ascending: false }),
      supabase.from("prazos").select("*").eq("processo_id", id).order("data_vencimento", { ascending: true }),
      supabase.from("audiencias").select("*").eq("processo_id", id).order("data", { ascending: true }),
      supabase.from("honorarios").select("*, parcelas(*)").eq("processo_id", id),
      supabase.from("profiles").select("id, nome").eq("ativo", true),
    ]);

  return (
    <div className="pb-10">
      <PageHeader
        title={processo.numero_cnj ?? "Processo sem número"}
        subtitle={processo.cliente?.nome_completo ?? "Sem cliente vinculado"}
        action={
          <Link href="/processos" className="btn-ghost"><ArrowLeft size={16} /> Voltar</Link>
        }
      />
      <div className="p-6">
        <ProcessoDetail
          processo={processo}
          andamentos={andamentos ?? []}
          publicacoes={publicacoes ?? []}
          prazos={prazos ?? []}
          audiencias={audiencias ?? []}
          honorarios={honorarios ?? []}
          profiles={profiles ?? []}
        />
      </div>
    </div>
  );
}
