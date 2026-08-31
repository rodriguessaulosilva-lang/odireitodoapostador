"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Scale, Wallet, Users, CheckSquare, Megaphone, Settings, Scale as ScaleIcon,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/processos", label: "Processos", icon: Scale },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/redes", label: "Redes sociais", icon: Megaphone },
];

export default function Sidebar({
  nome,
  role,
}: {
  nome: string;
  role: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
          <ScaleIcon size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">Rodrigues Dantas</p>
          <p className="text-[11px] text-slate-400">Advocacia Associada</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon size={18} className={isActive(href) ? "text-brand" : "text-slate-400"} />
            {label}
          </Link>
        ))}
        {role === "admin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/admin") ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings size={18} className={isActive("/admin") ? "text-brand" : "text-slate-400"} />
            Administração
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15 text-xs font-semibold uppercase text-brass">
            {initials(nome)}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-ink">{nome}</p>
            <p className="text-[11px] capitalize text-slate-400">
              {role === "admin" ? "Sócio administrador" : "Sócia"}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
