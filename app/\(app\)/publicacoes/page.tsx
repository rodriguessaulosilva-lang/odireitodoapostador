import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import PublicacoesView from '@/components/publicacoes/PublicacoesView';

export const dynamic = 'force-dynamic';

export default async function PublicacoesPage() {
  const supabase = createClient();

  // Verificar permissão (admin só)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-red-600">Acesso restrito a administradores.</div>
      </div>
    );
  }

  // Buscar dados
  const [
    { data: capturas },
    { data: processos },
  ] = await Promise.all([
    supabase
      .from('captura_publicacoes')
      .select('*')
      .order('data_publicacao', { ascending: false }),
    supabase
      .from('processos')
      .select('id, numero_cnj, cliente:clientes(nome_completo)')
      .order('numero_cnj'),
  ]);

  return (
    <div className="pb-10">
      <PageHeader
        title="📋 Publicações"
        subtitle="Capturas do DJEN e conexão com processos"
      />
      <div className="p-6">
        <PublicacoesView
          capturas={capturas ?? []}
          processos={processos ?? []}
        />
      </div>
    </div>
  );
}
