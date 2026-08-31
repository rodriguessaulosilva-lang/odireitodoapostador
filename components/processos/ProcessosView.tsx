"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { List, KanbanSquare, Search } from "lucide-react";
import { MandatoBadge, Chip } from "@/components/Badge";
import { lbl, FASES, AREAS, MANDATOS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

type Processo = any;

export default function ProcessosView({ processos }: { processos: Processo[] }) {
  const [view, setView] = useState<"lista" | "kanban">("lista");
  const [q, setQ] = useState("");
  const [fMandato, setFMandato] = useState("");
  const [fArea, setFArea] = useState("");
  const [fFase, setFFase] = useState("");

  const filtered = useMemo(() => {
    return processos.filter((p) => {
      if (fMandato && p.tipo_mandato !== fMandato) return false;
      if (fArea && p.area !== fArea) return false;
      if (fFase && p.fase !== fFase) return false;
      if (q) {
        const hay = `${p.numero_cnj ?? ""} ${p.cliente_nome ?? ""} ${p.comarca ?? ""} ${p.vara ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [processos, q, fMandato, fArea, fFase]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nº, cliente, comarca…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={fMandato} onChange={(e) => setFMandato(e.target.value)}>
          <option value="">Todos os mandatos</option>
          {MANDATOS.map((m) => <option key={m} value={m}>{lbl(m)}</option>)}
        </select>
        <select className="input w-auto" value={fArea} onChange={(e) => setFArea(e.target.value)}>
          <option value="">Todas as áreas</option>
          {AREAS.map((a) => <option key={a} value={a}>{lbl(a)}</option>)}
        </select>
        <select className="input w-auto" value={fFase} onChange={(e) => setFFase(e.target.value)}>
          <option value="">Todas as fases</option>
          {FASES.map((f) => <option key={f} value={f}>{lbl(f)}</option>)}
        </select>
        <div className="ml-auto flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button onClick={() => setView("lista")} className={`rounded-md p-1.5 ${view === "lista" ? "bg-brand text-white" : "text-slate-500"}`} title="Lista"><List size={16} /></button>
          <button onClick={() => setView("kanban")} className={`rounded-md p-1.5 ${view === "kanban" ? "bg-brand text-white" : "text-slate-500"}`} title="Kanban"><KanbanSquare size={16} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">
          Nenhum processo encontrado. Clique em <span className="font-medium text-slate-600">Novo processo</span> para começar.
        </div>
      ) : view === "lista" ? (
        <Lista processos={filtered} />
      ) : (
        <Kanban processos={filtered} />
      )}
    </div>
  );
}

function Lista({ processos }: { processos: Processo[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Nº / Cliente</th>
              <th className="th">Mandato</th>
              <th className="th">Área</th>
              <th className="th">Fase</th>
              <th className="th">Comarca / Vara</th>
              <th className="th">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td">
                  <Link href={`/processos/${p.id}`} className="block">
                    <span className="font-medium text-brand-700 hover:underline">
                      {p.numero_cnj ?? "Sem número"}
                    </span>
                    <span className="block text-xs text-slate-500">{p.cliente_nome ?? "—"}</span>
                  </Link>
                </td>
                <td className="td"><MandatoBadge tipo={p.tipo_mandato} /></td>
                <td className="td">{lbl(p.area)}</td>
                <td className="td"><Chip>{lbl(p.fase)}</Chip></td>
                <td className="td">
                  <span className="text-sm">{p.comarca ?? "—"}</span>
                  <span className="block text-xs text-slate-400">{p.vara ?? ""}</span>
                </td>
                <td className="td text-slate-600">{p.responsavel_nome ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kanban({ processos }: { processos: Processo[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {FASES.map((fase) => {
        const items = processos.filter((p) => p.fase === fase);
        return (
          <div key={fase} className="w-72 flex-shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-600">{lbl(fase)}</h3>
              <span className="text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((p) => (
                <Link key={p.id} href={`/processos/${p.id}`} className="card block p-3 hover:border-brand/40">
                  <div className="mb-1.5 flex items-center justify-between">
                    <MandatoBadge tipo={p.tipo_mandato} />
                    <span className="text-[11px] text-slate-400">{lbl(p.area)}</span>
                  </div>
                  <p className="text-sm font-medium text-ink">{p.numero_cnj ?? "Sem número"}</p>
                  <p className="text-xs text-slate-500">{p.cliente_nome ?? "—"}</p>
                  {p.data_distribuicao && (
                    <p className="mt-1 text-[11px] text-slate-400">Dist. {formatDate(p.data_distribuicao)}</p>
                  )}
                </Link>
              ))}
              {items.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300">vazio</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
