"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, MandatoBadge } from "@/components/Badge";
import { formatBRL, formatDate } from "@/lib/format";
import { lbl } from "@/lib/labels";
import { pagarParcela, estornarParcela, setStatusRpv, setStatusExito } from "@/app/(app)/financeiro/actions";
import { Wallet, CalendarClock, AlertTriangle, Landmark, TrendingUp, CheckCircle2, Undo2, Banknote } from "lucide-react";

type Any = any;

export default function FinanceiroView({
  recebiveis, rpvs, exitos, kpis, split,
}: {
  recebiveis: Any[]; rpvs: Any[]; exitos: Any[];
  kpis: Any; split: Any;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("recebiveis");
  const [filtro, setFiltro] = useState("pendentes");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<any>) {
    setBusy(id);
    const res = await fn();
    setBusy(null);
    if (res?.error) alert("Erro: " + res.error);
    else router.refresh();
  }

  const recebFiltrados = useMemo(() => {
    return recebiveis.filter((r) => {
      if (filtro === "pendentes") return r.status === "pendente";
      if (filtro === "atrasadas") return r.status === "pendente" && r.atrasado;
      if (filtro === "pagas") return r.status === "pago";
      return true;
    });
  }, [recebiveis, filtro]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Wallet size={18} />} tone="emerald" label="A receber neste mês" value={formatBRL(kpis.mes)} />
        <Kpi icon={<CalendarClock size={18} />} tone="blue" label="A receber (3 meses)" value={formatBRL(kpis.tresMeses)} />
        <Kpi icon={<AlertTriangle size={18} />} tone="red" label={`Inadimplência (${kpis.vencidoQtd})`} value={formatBRL(kpis.vencido)} />
        <Kpi icon={<Banknote size={18} />} tone="emerald" label="Recebido neste mês" value={formatBRL(kpis.recebidoMes)} />
        <Kpi icon={<Landmark size={18} />} tone="amber" label="RPVs aguardando" value={formatBRL(kpis.rpvAguardando)} />
        <Kpi icon={<TrendingUp size={18} />} tone="violet" label="Projeção de êxito" value={formatBRL(kpis.projExito)} />
        <div className="card col-span-2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Divisão da receita em aberto</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <SplitCell label="Escritório (RD)" value={formatBRL(split.rd)} />
            <SplitCell label="Cada sócio (50%)" value={formatBRL(split.escritorioCadaSocio)} />
            <SplitCell label="Sua parte total" value={formatBRL(split.saulo)} strong />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: "recebiveis", label: "Recebíveis" },
          { id: "rpvs", label: "RPVs (dativos)" },
          { id: "exito", label: "Êxito" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recebiveis" && (
        <div className="space-y-3">
          <div className="flex gap-1">
            {["pendentes", "atrasadas", "pagas", "todas"].map((f) => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  filtro === f ? "bg-brand text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}>{f}</button>
            ))}
          </div>
          {recebFiltrados.length === 0 ? (
            <Vazio texto="Nenhuma parcela nesse filtro. Parcelas são criadas ao lançar honorários parcelados no processo." />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="th">Cliente / Processo</th>
                      <th className="th">Mandato</th>
                      <th className="th">Parcela</th>
                      <th className="th">Vencimento</th>
                      <th className="th text-right">Valor</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recebFiltrados.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="td">
                          <span className="font-medium text-ink">{r.cliente ?? "—"}</span>
                          <span className="block text-xs text-slate-400">{r.numero_cnj ?? "sem nº"} · {lbl(r.honorario_tipo)}</span>
                        </td>
                        <td className="td"><MandatoBadge tipo={r.tipo_mandato} /></td>
                        <td className="td">{r.numero}</td>
                        <td className="td">{formatDate(r.vencimento)}</td>
                        <td className="td text-right font-medium">{formatBRL(r.valor)}</td>
                        <td className="td">
                          {r.status === "pago" ? <Chip tone="emerald">pago</Chip>
                            : r.atrasado ? <Chip tone="red">atrasado {r.dias_atraso}d</Chip>
                            : <Chip tone="slate">pendente</Chip>}
                        </td>
                        <td className="td text-right">
                          {r.status === "pago" ? (
                            <button disabled={busy === r.id} onClick={() => run(r.id, () => estornarParcela(r.id))}
                              className="btn-ghost px-2 py-1 text-xs"><Undo2 size={14} /> Estornar</button>
                          ) : (
                            <button disabled={busy === r.id} onClick={() => run(r.id, () => pagarParcela(r.id))}
                              className="btn-primary px-2.5 py-1 text-xs"><CheckCircle2 size={14} /> Dar baixa</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "rpvs" && (
        <div className="space-y-2">
          {rpvs.length === 0 ? <Vazio texto="Nenhuma RPV lançada. Lance honorários do tipo Dativo/RPV nos processos." /> :
            rpvs.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.cliente ?? r.numero ?? "RPV"}</p>
                  <p className="text-xs text-slate-400">{r.numero ?? "sem nº"} {r.data_expedicao_rpv && `· expedição ${formatDate(r.data_expedicao_rpv)}`}</p>
                </div>
                <span className="text-sm font-semibold">{formatBRL(r.valor_total)}</span>
                {r.status_rpv === "sacado"
                  ? <button disabled={busy === r.id} onClick={() => run(r.id, () => setStatusRpv(r.id, "aguardando"))} className="btn-ghost px-2 py-1 text-xs"><Undo2 size={14} /> Reabrir</button>
                  : <button disabled={busy === r.id} onClick={() => run(r.id, () => setStatusRpv(r.id, "sacado"))} className="btn-primary px-2.5 py-1 text-xs"><CheckCircle2 size={14} /> Marcar sacada</button>}
              </div>
            ))}
        </div>
      )}

      {tab === "exito" && (
        <div className="space-y-2">
          {exitos.length === 0 ? <Vazio texto="Nenhum honorário de êxito lançado." /> :
            exitos.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.cliente ?? r.numero ?? "Êxito"}</p>
                  <p className="text-xs text-slate-400">{r.numero ?? "sem nº"} · {r.percentual_exito ?? 0}%</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{formatBRL(r.valor_projetado)}</span>
                  <span className="block text-[11px] text-slate-400">projetado</span>
                </div>
                {r.status_exito === "recebido"
                  ? <Chip tone="emerald">recebido</Chip>
                  : <button disabled={busy === r.id} onClick={() => run(r.id, () => setStatusExito(r.id, "recebido"))} className="btn-primary px-2.5 py-1 text-xs"><CheckCircle2 size={14} /> Recebido</button>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="card p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function SplitCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`text-sm ${strong ? "font-semibold text-brand" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <div className="card p-10 text-center text-sm text-slate-400">{texto}</div>;
}
