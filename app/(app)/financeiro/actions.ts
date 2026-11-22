"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function pagarParcela(id: string, dataPagamento?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("parcelas")
    .update({ status: "pago", data_pagamento: dataPagamento ?? new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidatePath("/financeiro");
  return error ? { error: error.message } : { ok: true };
}

export async function estornarParcela(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("parcelas")
    .update({ status: "pendente", data_pagamento: null })
    .eq("id", id);
  revalidatePath("/financeiro");
  return error ? { error: error.message } : { ok: true };
}

export async function setStatusRpv(id: string, status: "aguardando" | "sacado") {
  const supabase = createClient();
  const { error } = await supabase.from("honorarios").update({ status_rpv: status }).eq("id", id);
  revalidatePath("/financeiro");
  return error ? { error: error.message } : { ok: true };
}

export async function setStatusExito(id: string, status: "aguardando" | "recebido") {
  const supabase = createClient();
  const { error } = await supabase.from("honorarios").update({ status_exito: status }).eq("id", id);
  revalidatePath("/financeiro");
  return error ? { error: error.message } : { ok: true };
}
