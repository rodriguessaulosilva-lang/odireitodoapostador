import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_ID = '24fd8a0b-e91c-4caf-906d-797c88bb18a5'; // Saulo Rodrigues

// Mapa de meses português → (número, ano)
const MESES_MAP: Record<string, [number, number]> = {
  'Abril': [4, 2024],
  'Maio': [5, 2024],
  'Junho': [6, 2024],
  'Julho': [7, 2024],
  'Agosto': [8, 2024],
  'Setembro': [9, 2024],
  'Outubro': [10, 2024],
  'Novembro': [11, 2024],
  'Dezembro': [12, 2024],
  'Janeiro': [1, 2025],
  'Fevereiro': [2, 2025],
  'Março': [3, 2025],
};

export async function POST(req: NextRequest) {
  try {
    // Verificar se está autenticado como admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Sem autenticação' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    // Receber dados JSON (após parse do Excel no cliente)
    const body = await req.json();
    const { clientes } = body as {
      clientes: Array<{
        nome: string;
        valor_total: number;
        parcelas: Array<{
          mes: string;
          mes_num: number;
          ano: number;
          valor: number;
        }>;
      }>;
    };

    const results = [];

    for (const cliente_data of clientes) {
      // Obter ou criar cliente
      let cliente_id: string;
      const existing = await supabase
        .from('clientes')
        .select('id')
        .eq('nome_completo', cliente_data.nome)
        .single();

      if (existing.data?.id) {
        cliente_id = existing.data.id;
      } else {
        const { data: newCliente } = await supabase
          .from('clientes')
          .insert({
            nome_completo: cliente_data.nome,
            escopo: 'escritorio',
            etapa_funil: 'contratado',
            created_by: ADMIN_ID,
          })
          .select('id')
          .single();

        if (!newCliente) {
          results.push({
            nome: cliente_data.nome,
            status: 'erro',
            mensagem: 'Falha ao criar cliente',
          });
          continue;
        }
        cliente_id = newCliente.id;
      }

      // Criar honorário
      const { data: honorario } = await supabase
        .from('honorarios')
        .insert({
          cliente_id,
          tipo: 'parcelado',
          valor_total: cliente_data.valor_total,
          valor_recebido: 0,
          num_parcelas: cliente_data.parcelas.length,
        })
        .select('id')
        .single();

      if (!honorario) {
        results.push({
          nome: cliente_data.nome,
          status: 'erro',
          mensagem: 'Falha ao criar honorário',
        });
        continue;
      }

      // Criar parcelas
      const parcelas = cliente_data.parcelas.map((p, idx) => ({
        honorario_id: honorario.id,
        numero: idx + 1,
        valor: p.valor,
        vencimento: new Date(p.ano, p.mes_num - 1, 15)
          .toISOString()
          .split('T')[0],
        status: 'pendente',
      }));

      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelas);

      if (parcelasError) {
        results.push({
          nome: cliente_data.nome,
          status: 'erro',
          mensagem: `Falha ao criar parcelas: ${parcelasError.message}`,
        });
        continue;
      }

      results.push({
        nome: cliente_data.nome,
        status: 'ok',
        cliente_id,
        honorario_id: honorario.id,
        parcelas_count: parcelas.length,
      });
    }

    return NextResponse.json({
      total: clientes.length,
      importados: results.filter(r => r.status === 'ok').length,
      erros: results.filter(r => r.status === 'erro').length,
      resultados: results,
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
