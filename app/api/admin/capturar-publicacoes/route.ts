import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DJEN_API = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
const OAB_NUMBER = '65292'; // OAB de Saulo/Dantas
const OAB_STATE = 'GO';

// Headers para evitar WAF
const DJEN_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Referer': 'https://comunica.pje.jus.br/',
  'Origin': 'https://comunica.pje.jus.br',
};

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sem autenticação' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar publicações do DJEN dos últimos 30 dias
    const dataFim = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log(`[DJEN] Buscando publicações de ${dataInicio} a ${dataFim}...`);

    const response = await fetch(
      `${DJEN_API}?numeroOab=${OAB_NUMBER}&ufOab=${OAB_STATE}&dataInicio=${dataInicio}&dataFim=${dataFim}&pagina=1&tamanhoPagina=100`,
      {
        headers: DJEN_HEADERS,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[DJEN] Erro ${response.status}:`, text.slice(0, 200));

      if (response.status === 403) {
        return NextResponse.json(
          {
            error: 'Acesso negado ao DJEN (403). Pode ser necessário rodar de IP brasileiro.',
            sugestao: 'Use o script Python local: scripts/djen-capture.py',
          },
          { status: 400 }
        );
      }

      throw new Error(`DJEN API error: ${response.status}`);
    }

    const data = await response.json();
    const publicacoes = data?.dados ?? [];

    console.log(`[DJEN] Encontradas ${publicacoes.length} publicações`);

    // Importar para banco
    const results = [];

    for (const pub of publicacoes) {
      const externalId = `${pub.id || pub.numeroProcesso}-${pub.dataPublicacao}`;

      // Verificar se já existe
      const existing = await supabase
        .from('captura_publicacoes')
        .select('id')
        .eq('external_id', externalId)
        .single();

      if (existing.data) {
        results.push({ external_id: externalId, status: 'duplicado' });
        continue;
      }

      // Tentar matching por número do processo
      const numeroProcesso = pub.numeroProcesso?.split(/[\s\-]/).join('') ?? '';
      const matchProcess = await supabase
        .from('processos')
        .select('id')
        .or(`numero_cnj.ilike.%${numeroProcesso}%`)
        .limit(1)
        .single();

      // Inserir publicação capturada
      const { data: inserted, error } = await supabase
        .from('captura_publicacoes')
        .insert({
          external_id: externalId,
          texto: pub.descricao || pub.teor || '',
          categoria: mapCategoria(pub.tipo),
          data_publicacao: pub.dataPublicacao,
          numero_oab: OAB_NUMBER,
          uf_oab: OAB_STATE,
          url: pub.url,
          matched_processo_id: matchProcess.data?.id ?? null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao inserir:', error);
        results.push({
          external_id: externalId,
          status: 'erro',
          mensagem: error.message,
        });
        continue;
      }

      // Se achou processo, criar publicação ligada
      if (matchProcess.data?.id && inserted?.id) {
        await supabase
          .from('publicacoes')
          .insert({
            processo_id: matchProcess.data.id,
            texto: pub.descricao || pub.teor || '',
            data_publicacao: pub.dataPublicacao,
            categoria: mapCategoria(pub.tipo),
          });
      }

      results.push({
        external_id: externalId,
        status: 'importado',
        processo_id: matchProcess.data?.id,
      });
    }

    const importados = results.filter(r => r.status === 'importado').length;
    const duplicados = results.filter(r => r.status === 'duplicado').length;

    return NextResponse.json({
      sucesso: true,
      total: publicacoes.length,
      importados,
      duplicados,
      periodoInicio: dataInicio,
      periodoFim: dataFim,
    });
  } catch (error) {
    console.error('Erro na captura:', error);
    return NextResponse.json(
      { error: 'Erro ao capturar publicações', detalhes: String(error) },
      { status: 500 }
    );
  }
}

function mapCategoria(tipo: string) {
  const map: Record<string, string> = {
    'intimacao': 'intimacao',
    'despacho': 'despacho',
    'sentença': 'sentenca',
    'sentenca': 'sentenca',
    'acórdão': 'acordao',
    'acordao': 'acordao',
    'pauta': 'pauta',
  };
  return map[tipo?.toLowerCase()] ?? null;
}
