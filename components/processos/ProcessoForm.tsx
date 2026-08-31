"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProcesso } from "@/app/(app)/processos/actions";
import { maskCNJ } from "@/lib/format";
import { lbl, AREAS, FASES, MANDATOS } from "@/lib/labels";
import { Loader2 } from "lucide-react";

export default function ProcessoForm({
  clientes,
  profiles,
}: {
  clientes: { id: string; nome_completo: string }[];
  profiles: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [cnj, setCnj] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setErro(null);
    setSaving(true);
    const res = await createProcesso(formData);
    if (res?.error) {
      setErro(res.error);
      setSaving(false);
    }
    // sucesso: a action faz redirect
  }

  return (
    <form action={onSubmit} className="max-w-3xl space-y-6">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Dados do processo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="lbl">Número CNJ</label>
            <input name="numero_cnj" className="input" value={cnj}
              onChange={(e) => setCnj(maskCNJ(e.target.value))}
              placeholder="0000000-00.0000.0.00.0000" inputMode="numeric" />
          </div>

          <div>
            <label className="lbl">Tipo de mandato *</label>
            <select name="tipo_mandato" className="input" required defaultValue="">
              <option value="" disabled>Selecione…</option>
              {MANDATOS.map((m) => <option key={m} value={m}>{lbl(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Cliente</label>
            <select name="cliente_id" className="input" defaultValue="">
              <option value="">— sem cliente —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
            </select>
          </div>

          <div>
            <label className="lbl">Área</label>
            <select name="area" className="input" defaultValue="">
              <option value="">Selecione…</option>
              {AREAS.map((a) => <option key={a} value={a}>{lbl(a)}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Fase</label>
            <select name="fase" className="input" defaultValue="inicial">
              {FASES.map((f) => <option key={f} value={f}>{lbl(f)}</option>)}
            </select>
          </div>

          <div>
            <label className="lbl">Comarca</label>
            <input name="comarca" className="input" defaultValue="Santa Helena de Goiás" />
          </div>
          <div>
            <label className="lbl">Vara</label>
            <input name="vara" className="input" />
          </div>
          <div>
            <label className="lbl">Juiz(a)</label>
            <input name="juiz" className="input" />
          </div>
          <div>
            <label className="lbl">Data de distribuição</label>
            <input type="date" name="data_distribuicao" className="input" />
          </div>

          <div>
            <label className="lbl">Responsável</label>
            <select name="responsavel_id" className="input" defaultValue="">
              <option value="">— não definido —</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <label className="lbl">Observações estratégicas</label>
        <textarea name="observacoes_estrategicas" className="input min-h-[100px]" placeholder="Tese, estratégia, pontos de atenção…" />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />} Salvar processo
        </button>
        <button type="button" className="btn-outline" onClick={() => router.back()}>Cancelar</button>
      </div>
    </form>
  );
}
