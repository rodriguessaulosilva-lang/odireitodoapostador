import { lbl, mandatoBadge } from "@/lib/labels";

export function MandatoBadge({ tipo }: { tipo: string }) {
  return (
    <span className={`badge ${mandatoBadge[tipo] ?? "bg-slate-100 text-slate-600"}`}>
      {lbl(tipo)}
    </span>
  );
}

export function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/15",
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  };
  return <span className={`badge ${tones[tone] ?? tones.slate}`}>{children}</span>;
}
