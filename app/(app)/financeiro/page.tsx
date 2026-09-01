import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import FinanceiroView from "@/components/financeiro/FinanceiroView";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const supabase = createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);

  const [{ data: receb }, { data: processos }, { data: rpvs }, { data: exitos }] = await Promise.all([
    supabase.from("vw_recebiveis").select("*").order("vencimento", { ascending: true }),
    supabase.from("processos").select("id, numero_cnj, tipo_mandato, cliente:clientes(nome_completo)"),
    supabase.from("honorarios").select("id, processo_id, valor_total, status_rpv, data_expedicao_rpv").eq("tipo", "dativo_rpv"),
    supabase.from("honorarios").select("id, processo_id, percentual_exito, valor_projetado, status_exito").eq("tipo", "exito"),
  ]);

  const procMap = new Map(
    (processos ?? []).map((p: any) => [p.id, { numero: p.numero_cnj, cliente: p.cliente?.nome_completo, tipo: p.tipo_mandato }])
  );

  const recebiveis = (receb ?? []).map((r: any) => ({
    ...r,
    cliente: procMap.get(r.processo_id)?.cliente ?? null,
  }));
  const rpvList = (rpvs ?? []).map((r: any) => ({ ...r, ...procMap.get(r.processo_id) }));
  const exitoList = (exitos ?? []).map((r: any) => ({ ...r, ...procMap.get(r.processo_id) }));

  // KPIs
  const pend = recebiveis.filter((r: any) => r.status === "pendente");
  const soma = (arr: any[], f = (x: any) => Number(x.valor)) => arr.reduce((s, x) => s + f(x), 0);
  const fim3m = new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString().slice(0, 10);

  const kpis = {
    mes: soma(pend.filter((r: any) => r.vencimento.slice(0, 7) === mesAtual)),
    tresMeses: soma(pend.filter((r: any) => r.vencimento >= hoje && r.vencimento <= fim3m)),
    vencido: soma(pend.filter((r: any) => r.atrasado)),
    vencidoQtd: pend.filter((r: any) => r.atrasado).length,
    recebidoMes: soma(recebiveis.filter((r: any) => r.status === "pago" && (r.data_pagamento ?? "").slice(0, 7) === mesAtual)),
    rpvAguardando: soma((rpvs ?? []).filter((r: any) => r.status_rpv === "aguardando"), (x) => Number(x.valor_total)),
    projExito: soma((exitos ?? []).filter((r: any) => r.status_exito === "aguardando"), (x) => Number(x.valor_projetado ?? 0)),
  };

  // Split RD x pessoal (recebíveis pendentes futuros)
  const rd = soma(pend.filter((r: any) => r.tipo_mandato === "privado_rd"));
  const naoRd = soma(pend.filter((r: any) => r.tipo_mandato !== "privado_rd"));
  const split = { rd, escritorioCadaSocio: rd * 0.5, saulo: rd * 0.5 + naoRd };

  return (
    <div className="pb-10">
      <PageHeader title="Financeiro" subtitle="Honorários, recebíveis e projeções" />
      <div className="p-6">
        <FinanceiroView
          recebiveis={recebiveis}
          rpvs={rpvList}
          exitos={exitoList}
          kpis={kpis}
          split={split}
        />
      </div>
    </div>
  );
}
