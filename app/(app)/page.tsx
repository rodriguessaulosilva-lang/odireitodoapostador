import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { Chip } from "@/components/Badge";
import { formatBRL, formatDate } from "@/lib/format";
import { lbl } from "@/lib/labels";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Wallet, TrendingUp, Landmark, Scale } from "lucide-react";

export const dynamic = "force-dynamic";

function monthKey(d: string) {
  return d.slice(0, 7);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  const [{ data: prazos }, { data: receb }, { data: rpvs }, { data: exitos }, { data: procs }] =
    await Promise.all([
      supabase.from("vw_prazos_abertos").select("*").order("data_vencimento", { ascending: true }).limit(50),
      supabase.from("vw_recebiveis").select("*"),
      supabase.from("honorarios").select("valor_total, status_rpv").eq("tipo", "dativo_rpv").eq("status_rpv", "aguardando"),
      supabase.from("honorarios").select("valor_projetado, status_exito").eq("tipo", "exito").eq("status_exito", "aguardando"),
      supabase.from("processos").select("tipo_mandato, ativo").eq("ativo", true),
    ]);

  const recebiveis = receb ?? [];
  const pend = recebiveis.filter((r: any) => r.status === "pendente");

  const aReceberMes = pend
    .filter((r: any) => monthKey(r.vencimento) === mesAtual)
    .reduce((s: number, r: any) => s + Number(r.valor), 0);

  const prox3 = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0).toISOString().slice(0, 10);
  const aReceber3m = pend
    .filter((r: any) => r.vencimento >= hoje.toISOString().slice(0, 10) && r.vencimento <= prox3)
    .reduce((s: number, r: any) => s + Number(r.valor), 0);

  const vencidas = pend.filter((r: any) => r.atrasado);
  const totalVencido = vencidas.reduce((s: number, r: any) => s + Number(r.valor), 0);

  const rpvAguardando = (rpvs ?? []).reduce((s: number, r: any) => s + Number(r.valor_total), 0);
  const projExito = (exitos ?? []).reduce((s: number, r: any) => s + Number(r.valor_projetado ?? 0), 0);

  // Receita do mês por origem (RD x pessoal/dativo)
  const mesPend = pend.filter((r: any) => monthKey(r.vencimento) === mesAtual);
  const receitaRD = mesPend.filter((r: any) => r.tipo_mandato === "privado_rd").reduce((s: number, r: any) => s + Number(r.valor), 0);
  const receitaSaulo = receitaRD * 0.5 + mesPend.filter((r: any) => r.tipo_mandato !== "privado_rd").reduce((s: number, r: any) => s + Number(r.valor), 0);

  const prazosAlerta = (prazos ?? []).filter((p: any) => p.em_alerta);
  const countProc = (procs ?? []).length;

  return (
    <div className="pb-10">
      <PageHeader title="Dashboard" subtitle="Visão geral do escritório" />

      <div className="space-y-6 p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<Wallet size={18} />} tone="emerald" label="A receber neste mês" value={formatBRL(aReceberMes)} />
          <StatCard icon={<CalendarClock size={18} />} tone="blue" label="A receber (3 meses)" value={formatBRL(aReceber3m)} />
          <StatCard icon={<AlertTriangle size={18} />} tone="red" label={`Inadimplência (${vencidas.length})`} value={formatBRL(totalVencido)} />
          <StatCard icon={<Landmark size={18} />} tone="amber" label="RPVs aguardando" value={formatBRL(rpvAguardando)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Prazos */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-ink">Próximos prazos</h2>
              <Link href="/processos" className="text-xs font-medium text-brand-600 hover:underline">Ver processos</Link>
            </div>
            {(prazos ?? []).length === 0 ? (
              <Empty texto="Nenhum prazo em aberto. Prazos aparecem aqui ao lançar publicações nos processos." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {(prazos ?? []).slice(0, 8).map((p: any) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg text-xs font-semibold ${
                      p.dias_restantes < 0 ? "bg-red-50 text-red-600" : p.em_alerta ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {p.dias_restantes}d
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.descricao}</p>
                      <p className="truncate text-xs text-slate-500">{p.numero_cnj ?? "sem nº"} · {p.comarca ?? ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink">{formatDate(p.data_vencimento)}</p>
                      {p.em_alerta && <Chip tone="amber">em alerta</Chip>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Resumo lateral */}
          <div className="space-y-6">
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <TrendingUp size={16} className="text-brand" /> Receita do mês
              </div>
              <Row label="Escritório (RD)" value={formatBRL(receitaRD)} />
              <Row label="Sua parte (50% RD + pessoal)" value={formatBRL(receitaSaulo)} strong />
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Row label="Projeção de êxito" value={formatBRL(projExito)} muted />
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
                <Scale size={16} className="text-brand" /> Processos ativos
              </div>
              <p className="text-3xl font-semibold text-ink">{countProc}</p>
              <p className="text-xs text-slate-500">total visível para você</p>
              {prazosAlerta.length > 0 && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {prazosAlerta.length} prazo(s) em alerta nos próximos dias
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="card p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${muted ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
      <span className={`text-sm ${strong ? "font-semibold text-ink" : muted ? "text-slate-400" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-400">{texto}</p>;
}
