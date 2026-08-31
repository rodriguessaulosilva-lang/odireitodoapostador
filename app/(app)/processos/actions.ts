"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(v: FormDataEntryValue | null) {
  const s = (v as string | null)?.toString().trim();
  return s ? s : null;
}
function num(v: FormDataEntryValue | null) {
  const s = str(v);
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

export async function createProcesso(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("processos")
    .insert({
      numero_cnj: str(formData.get("numero_cnj")),
      cliente_id: str(formData.get("cliente_id")),
      tipo_mandato: str(formData.get("tipo_mandato")),
      area: str(formData.get("area")),
      fase: str(formData.get("fase")) ?? "inicial",
      comarca: str(formData.get("comarca")),
      vara: str(formData.get("vara")),
      juiz: str(formData.get("juiz")),
      data_distribuicao: str(formData.get("data_distribuicao")),
      responsavel_id: str(formData.get("responsavel_id")),
      observacoes_estrategicas: str(formData.get("observacoes_estrategicas")),
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/processos");
  redirect(`/processos/${data.id}`);
}

export async function updateFase(id: string, fase: string) {
  const supabase = createClient();
  await supabase.from("processos").update({ fase }).eq("id", id);
  revalidatePath("/processos");
}

export async function addAndamento(processoId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("andamentos").insert({
    processo_id: processoId,
    data: str(formData.get("data")),
    descricao: str(formData.get("descricao")),
    created_by: user?.id,
  });
  revalidatePath(`/processos/${processoId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function addPublicacao(processoId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const data_publicacao = str(formData.get("data_publicacao"));
  const { data: pub, error } = await supabase
    .from("publicacoes")
    .insert({
      processo_id: processoId,
      texto: str(formData.get("texto")),
      data_publicacao,
      categoria: str(formData.get("categoria")),
      created_by: user?.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Gera prazo automaticamente se solicitado
  const dias = num(formData.get("dias_prazo"));
  if (dias && data_publicacao) {
    await supabase.from("prazos").insert({
      processo_id: processoId,
      publicacao_id: pub.id,
      descricao: str(formData.get("descricao_prazo")) ?? "Prazo da publicação",
      dias_prazo: dias,
      data_publicacao,
      responsavel_id: str(formData.get("responsavel_id")),
    });
    await supabase.from("publicacoes").update({ gerou_prazo: true }).eq("id", pub.id);
  }
  revalidatePath(`/processos/${processoId}`);
  return { ok: true };
}

export async function addPrazo(processoId: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("prazos").insert({
    processo_id: processoId,
    descricao: str(formData.get("descricao")),
    dias_prazo: num(formData.get("dias_prazo")),
    data_publicacao: str(formData.get("data_publicacao")),
    responsavel_id: str(formData.get("responsavel_id")),
  });
  revalidatePath(`/processos/${processoId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function setPrazoStatus(id: string, processoId: string, status: string) {
  const supabase = createClient();
  await supabase.from("prazos").update({ status }).eq("id", id);
  revalidatePath(`/processos/${processoId}`);
}

export async function addAudiencia(processoId: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("audiencias").insert({
    processo_id: processoId,
    data: str(formData.get("data")),
    hora: str(formData.get("hora")),
    tipo: str(formData.get("tipo")),
    modalidade: str(formData.get("modalidade")) ?? "presencial",
    local: str(formData.get("local")),
    link_video: str(formData.get("link_video")),
    observacoes: str(formData.get("observacoes")),
  });
  revalidatePath(`/processos/${processoId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function addHonorario(processoId: string, formData: FormData) {
  const supabase = createClient();
  const tipo = str(formData.get("tipo"));
  const { data: hon, error } = await supabase
    .from("honorarios")
    .insert({
      processo_id: processoId,
      tipo,
      valor_total: num(formData.get("valor_total")) ?? 0,
      num_parcelas: num(formData.get("num_parcelas")),
      percentual_exito: num(formData.get("percentual_exito")),
      base_calculo_estimada: num(formData.get("base_calculo_estimada")),
      valor_projetado: num(formData.get("valor_projetado")),
      status_exito: tipo === "exito" ? "aguardando" : null,
      status_rpv: tipo === "dativo_rpv" ? "aguardando" : null,
      data_expedicao_rpv: str(formData.get("data_expedicao_rpv")),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Gera parcelas para honorário parcelado
  const parcelas = num(formData.get("num_parcelas"));
  const valorParcela = num(formData.get("valor_parcela"));
  const primeiroVenc = str(formData.get("primeiro_vencimento"));
  if (tipo === "parcelado" && parcelas && valorParcela && primeiroVenc) {
    const rows = [];
    const base = new Date(primeiroVenc + "T00:00:00");
    for (let i = 0; i < parcelas; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      rows.push({
        honorario_id: hon.id,
        numero: i + 1,
        valor: valorParcela,
        vencimento: d.toISOString().slice(0, 10),
      });
    }
    await supabase.from("parcelas").insert(rows);
  }
  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/financeiro");
  return { ok: true };
}
