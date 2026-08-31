// Formatação brasileira: moeda R$, datas dd/mm/aaaa e número CNJ.

export function formatBRL(v: number | null | undefined): string {
  const n = typeof v === "number" ? v : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Máscara CNJ: 0000000-00.0000.0.00.0000
export function maskCNJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 20);
  let out = d;
  if (d.length > 7) out = `${d.slice(0, 7)}-${d.slice(7)}`;
  if (d.length > 9) out = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`;
  if (d.length > 13) out = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`;
  if (d.length > 14) out = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14)}`;
  if (d.length > 16)
    out = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`;
  return out;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}
