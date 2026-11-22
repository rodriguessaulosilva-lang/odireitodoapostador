import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function PublicacoesPage() {
  const supabase = createClient();

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

  const { data: capturas } = await supabase
    .from('captura_publicacoes')
    .select('*')
    .order('data_publicacao', { ascending: false });

  return (
    <div className="pb-10">
      <PageHeader 
        title="📋 Publicações" 
        subtitle="Capturas do DJEN"
      />
      <div className="p-6">
        <CapturarPublicacoes />
        <ListaPublicacoes capturas={capturas ?? []} />
      </div>
    </div>
  );
}

function CapturarPublicacoes() {
  return (
    <form action={async () => {
      'use server';
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('https://' + (process.env.VERCEL_URL || 'localhost:3000') + '/api/admin/capturar-publicacoes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      return response.json();
    }} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            🔄 Capturar do DJEN
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            OAB 65292/GO - Últimos 30 dias
          </p>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          📡 Capturar agora
        </button>
      </div>
    </form>
  );
}

interface Captura {
  id: string;
  texto: string;
  categoria: string;
  data_publicacao: string;
  foi_importado: boolean;
  matched_processo_id: string | null;
  url: string | null;
}

function ListaPublicacoes({ capturas }: { capturas: Captura[] }) {
  if (capturas.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Nenhuma publicação encontrada. Clique em "Capturar agora" para buscar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {capturas.map(cap => (
        <div key={cap.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                  {cap.categoria || 'SEM CATEGORIA'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(cap.data_publicacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                {cap.texto.slice(0, 150)}...
              </p>
            </div>
            <div className="text-right ml-4">
              {cap.foi_importado ? (
                <div className="text-xs text-green-600 dark:text-green-400">✓ Importado</div>
              ) : (
                <div className="text-xs text-orange-600 dark:text-orange-400">⚠ Não importado</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
