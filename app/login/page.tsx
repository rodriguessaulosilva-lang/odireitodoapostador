"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Scale, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brass text-white">
            <Scale size={26} />
          </div>
          <h1 className="text-lg font-semibold text-white">Rodrigues Dantas</h1>
          <p className="text-sm text-brand-100/70">Advocacia Associada</p>
        </div>

        <form onSubmit={entrar} className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Acessar o sistema</h2>

          <label className="lbl">E-mail</label>
          <input
            type="email"
            className="input mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className="lbl">Senha</label>
          <input
            type="password"
            className="input mb-4"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />

          {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-brand-100/50">
          Acesso restrito aos sócios do escritório.
        </p>
      </div>
    </div>
  );
}
