"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MandatoBadge, Chip } from "@/components/Badge";
import { lbl, FASES } from "@/lib/labels";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import {
  updateFase, addAndamento, addPublicacao, addPrazo, setPrazoStatus, addAudiencia, addHonorario,
} from "@/app/(app)/processos/actions";
import {
  Scale, CalendarClock, Newspaper, Gavel, Wallet, CheckCircle2, XCircle, Clock,
} from "lucide-react";

type Any = any;
const TABS = [
  { id: "andamentos", label: "Andamentos", icon: Clock },
  { id: "publicacoes", label: "Publicações", icon: Newspaper },
  { id: "prazos", label: "Prazos", icon: CalendarClock },
  { id: "audiencias", label: "Audiências", icon: Gavel },
  { id: "honorarios", label: "Honorários", icon: Wallet },
] as const;

export default function ProcessoDetail({
  processo, andamentos, publicacoes, prazos, audiencias, honorarios, profiles,
}: {
  processo: Any; andamentos: Any[]; publicacoes: Any[]; prazos: Any[]; audiencias: Any[]; honorarios: Any[];
  profiles: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("andamentos");
  const [busy, setBusy] = useState(false);
  const pid = processo.id;

  async function run(fn: () => Promise<any>, form?: HTMLFormElement) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res?.error) { alert("Erro: " + res.error); return; }
    form?.reset();
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Coluna info */}
      <div className="space-y-4 lg:col-span-1">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <MandatoBadge tipo={processo.tipo_mandato} />
            <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Scale size={13} /> {lbl(processo.area)}</span>
          </div>
          <dl className="space-y-2 text-sm">
            <Info label="Comarca" value={processo.comarca} />
            <Info label="Vara" value={processo.vara} />
            <Info label="Juiz(a)" value={processo.juiz} />
            <Info label="Distribuição" value={formatDate(processo.data_distribuicao)} />
            <Info label="Responsável" value={profiles.find((p) => p.id === processo.responsavel_id)?.nome} />
          </dl>
          <div className="mt-4">
            <label className="lbl">Fase processual</label>
            <select
              className="input"
              defaultValue={processo.fase}
              disabled={busy}
              onChange={(e) => run(() => updateFase(pid, e.target.value))}
            >
              {FASES.map((f) => <option key={f} value={f}>{lbl(f)}</option>)}
            </select>
          </div>
        </div>

        {processo.observacoes_estrategicas && (
          <div className="card p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Estratégia</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{processo.observacoes_estrategicas}</p>
          </div>
        )}
      </div>

      {/* Coluna abas */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
          {TABS.map(({ id, label, icon: Icon }) => {
            const counts: Record<string, number> = {
              andamentos: andamentos.length, publicacoes: publicacoes.length,
              prazos: prazos.filter((p) => p.status === "pendente").length,
              audiencias: audiencias.length, honorarios: honorarios.length,
            };
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === id ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}>
                <Icon size={15} /> {label}
                {counts[id] > 0 && <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500">{counts[id]}</span>}
              </button>
            );
          })}
        </div>

        {tab === "andamentos" && (
          <div className="space-y-4">
            <FormCard title="Registrar andamento" onSubmit={(fd, f) => run(() => addAndamento(pid, fd), f)} busy={busy}>
              <div className="grid gap-3 sm:grid-cols-4">
                <input type="date" name="data" className="input sm:col-span-1" defaultValue={todayISO()} required />
                <input name="descricao" className="input sm:col-span-3" placeholder="Descrição do andamento" required />
              </div>
            </FormCard>
            {andamentos.length === 0 ? <Vazio /> : (
              <ol className="relative space-y-3 border-l-2 border-slate-100 pl-5">
                {andamentos.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand" />
                    <p className="text-xs text-slate-400">{formatDate(a.data)}</p>
                    <p className="text-sm text-slate-700">{a.descricao}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "publicacoes" && (
          <div className="space-y-4">
            <FormCard title="Nova publicação (DJEN / DJe-GO)" onSubmit={(fd, f) => run(() => addPublicacao(pid, fd), f)} busy={busy}>
              <div className="grid gap-3 sm:grid-cols-4">
                <input type="date" name="data_publicacao" className="input" defaultValue={todayISO()} required />
                <select name="categoria" className="input sm:col-span-1" defaultValue="intimacao">
                  {["intimacao","despacho","sentenca","acordao","pauta"].map((c) => <option key={c} value={c}>{lbl(c)}</option>)}
                </select>
                <select name="responsavel_id" className="input sm:col-span-2" defaultValue={processo.responsavel_id ?? ""}>
                  <option value="">Responsável pelo prazo…</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <textarea name="texto" className="input mt-3 min-h-[90px]" placeholder="Cole aqui o texto da publicação" required />
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <input name="dias_prazo" type="number" className="input" placeholder="Prazo (dias úteis)" />
                <input name="descricao_prazo" className="input sm:col-span-3" placeholder="Descrição do prazo (ex.: Contestação) — opcional" />
              </div>
              <p className="mt-1 text-xs text-slate-400">Preenchendo os dias, o prazo é calculado automaticamente em dias úteis a partir da publicação.</p>
            </FormCard>
            {publicacoes.length === 0 ? <Vazio /> : (
              <div className="space-y-2">
                {publicacoes.map((p) => (
                  <div key={p.id} className="card p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <Chip tone="blue">{lbl(p.categoria)}</Chip>
                      <span className="text-xs text-slate-400">{formatDate(p.data_publicacao)}{p.gerou_prazo && " · prazo gerado"}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{p.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "prazos" && (
          <div className="space-y-4">
            <FormCard title="Novo prazo manual" onSubmit={(fd, f) => run(() => addPrazo(pid, fd), f)} busy={busy}>
              <div className="grid gap-3 sm:grid-cols-4">
                <input name="descricao" className="input sm:col-span-2" placeholder="Descrição (ex.: Réplica)" required />
                <input name="dias_prazo" type="number" className="input" placeholder="Dias úteis" required />
                <input type="date" name="data_publicacao" className="input" defaultValue={todayISO()} required />
                <select name="responsavel_id" className="input sm:col-span-4" defaultValue={processo.responsavel_id ?? ""}>
                  <option value="">Responsável…</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </FormCard>
            {prazos.length === 0 ? <Vazio /> : (
              <div className="space-y-2">
                {prazos.map((p) => {
                  const dias = p.data_vencimento ? Math.ceil((new Date(p.data_vencimento).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <div key={p.id} className={`card flex items-center gap-3 p-4 ${p.status !== "pendente" ? "opacity-60" : ""}`}>
                      <div className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg text-xs font-semibold ${
                        p.status !== "pendente" ? "bg-slate-100 text-slate-400" :
                        dias !== null && dias < 0 ? "bg-red-50 text-red-600" :
                        dias !== null && dias <= 3 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {p.status === "pendente" && dias !== null ? `${dias}d` : lbl(p.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{p.descricao}</p>
                        <p className="text-xs text-slate-500">
                          {p.dias_prazo} dias úteis · vence {formatDate(p.data_vencimento)} · alerta {formatDate(p.data_alerta)}
                        </p>
                      </div>
                      {p.status === "pendente" && (
                        <div className="flex gap-1">
                          <button title="Marcar cumprido" disabled={busy} onClick={() => run(() => setPrazoStatus(p.id, pid, "cumprido"))} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={18} /></button>
                          <button title="Marcar perdido" disabled={busy} onClick={() => run(() => setPrazoStatus(p.id, pid, "perdido"))} className="rounded-md p-1.5 text-red-500 hover:bg-red-50"><XCircle size={18} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "audiencias" && (
          <div className="space-y-4">
            <FormCard title="Nova audiência" onSubmit={(fd, f) => run(() => addAudiencia(pid, fd), f)} busy={busy}>
              <div className="grid gap-3 sm:grid-cols-4">
                <input type="date" name="data" className="input" required />
                <input type="time" name="hora" className="input" />
                <select name="tipo" className="input" defaultValue="instrucao">
                  {["instrucao","conciliacao","julgamento"].map((t) => <option key={t} value={t}>{lbl(t)}</option>)}
                </select>
                <select name="modalidade" className="input" defaultValue="presencial">
                  {["presencial","virtual"].map((m) => <option key={m} value={m}>{lbl(m)}</option>)}
                </select>
                <input name="local" className="input sm:col-span-2" placeholder="Local (se presencial)" />
                <input name="link_video" className="input sm:col-span-2" placeholder="Link (se virtual)" />
                <textarea name="observacoes" className="input sm:col-span-4" placeholder="Preparação / estratégia" />
              </div>
            </FormCard>
            {audiencias.length === 0 ? <Vazio /> : (
              <div className="space-y-2">
                {audiencias.map((a) => (
                  <div key={a.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Chip tone="violet">{lbl(a.tipo)}</Chip>
                        <Chip>{lbl(a.modalidade)}</Chip>
                      </div>
                      <span className="text-sm font-medium text-ink">{formatDate(a.data)} {a.hora?.slice(0,5) ?? ""}</span>
                    </div>
                    {(a.local || a.link_video) && <p className="mt-2 text-sm text-slate-600">{a.local || a.link_video}</p>}
                    {a.observacoes && <p className="mt-1 text-xs text-slate-500">{a.observacoes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "honorarios" && (
          <div className="space-y-4">
            <FormCard title="Novo honorário" onSubmit={(fd, f) => run(() => addHonorario(pid, fd), f)} busy={busy}>
              <div className="grid gap-3 sm:grid-cols-4">
                <select name="tipo" className="input sm:col-span-2" defaultValue="inicial">
                  {["inicial","parcelado","exito","dativo_rpv"].map((t) => <option key={t} value={t}>{lbl(t === "inicial" ? "inicial_hon" : t)}</option>)}
                </select>
                <input name="valor_total" className="input sm:col-span-2" placeholder="Valor total (R$)" inputMode="decimal" />
                <input name="num_parcelas" type="number" className="input" placeholder="Nº parcelas" />
                <input name="valor_parcela" className="input" placeholder="Valor/parcela" inputMode="decimal" />
                <input type="date" name="primeiro_vencimento" className="input sm:col-span-2" title="1º vencimento (parcelado)" />
                <input name="percentual_exito" className="input" placeholder="% êxito" inputMode="decimal" />
                <input name="base_calculo_estimada" className="input" placeholder="Base cálculo (êxito)" inputMode="decimal" />
                <input name="valor_projetado" className="input" placeholder="Valor projetado (êxito)" inputMode="decimal" />
                <input type="date" name="data_expedicao_rpv" className="input" title="Expedição RPV" />
              </div>
              <p className="mt-1 text-xs text-slate-400">Parcelado: informe nº de parcelas, valor por parcela e o 1º vencimento — as parcelas mensais são geradas automaticamente.</p>
            </FormCard>
            {honorarios.length === 0 ? <Vazio /> : (
              <div className="space-y-2">
                {honorarios.map((h) => (
                  <div key={h.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <Chip tone="emerald">{lbl(h.tipo === "inicial" ? "inicial_hon" : h.tipo)}</Chip>
                      <span className="text-sm font-semibold text-ink">
                        {h.tipo === "exito" ? `${h.percentual_exito ?? 0}% · ${formatBRL(h.valor_projetado)}` : formatBRL(h.valor_total)}
                      </span>
                    </div>
                    {h.parcelas?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {h.parcelas.sort((a: Any, b: Any) => a.numero - b.numero).map((pc: Any) => (
                          <div key={pc.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Parcela {pc.numero} · vence {formatDate(pc.vencimento)}</span>
                            <span className="flex items-center gap-2">
                              {formatBRL(pc.valor)}
                              <Chip tone={pc.status === "pago" ? "emerald" : new Date(pc.vencimento) < new Date() ? "red" : "slate"}>
                                {pc.status === "pago" ? "pago" : new Date(pc.vencimento) < new Date() ? "atrasado" : "pendente"}
                              </Chip>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {h.tipo === "dativo_rpv" && (
                      <p className="mt-2 text-xs text-slate-500">RPV · {lbl(h.status_rpv)} {h.data_expedicao_rpv && `· expedição ${formatDate(h.data_expedicao_rpv)}`}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right text-slate-700">{value || "—"}</dd>
    </div>
  );
}

function Vazio() {
  return <div className="card p-8 text-center text-sm text-slate-400">Nada registrado ainda.</div>;
}

function FormCard({
  title, children, onSubmit, busy,
}: {
  title: string; children: React.ReactNode;
  onSubmit: (fd: FormData, form: HTMLFormElement) => void; busy: boolean;
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; onSubmit(new FormData(f), f); }}
      className="card p-5"
    >
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
      <div className="mt-4">
        <button type="submit" className="btn-primary" disabled={busy}>Adicionar</button>
      </div>
    </form>
  );
}
