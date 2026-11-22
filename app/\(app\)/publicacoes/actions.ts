'use server';

import { createClient } from '@/lib/supabase/server';

export async function atualizarProcessoLigado(
  capturaId: string,
  processoId: string | null
) {
  const supabase = createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  // Verificar admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Sem permissão');

  // Atualizar
  const { error } = await supabase
    .from('captura_publicacoes')
    .update({ matched_processo_id: processoId })
    .eq('id', capturaId);

  if (error) throw error;

  return { sucesso: true };
}

export async function importarPublicacaoParaProcesso(
  capturaId: string,
  processoId: string
) {
  const supabase = createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  // Verificar admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Sem permissão');

  // Obter captura
  const { data: captura } = await supabase
    .from('captura_publicacoes')
    .select('*')
    .eq('id', capturaId)
    .single();

  if (!captura) throw new Error('Captura não encontrada');

  // Criar publicação ligada
  const { error } = await supabase
    .from('publicacoes')
    .insert({
      processo_id: processoId,
      texto: captura.texto,
      data_publicacao: captura.data_publicacao,
      categoria: captura.categoria,
    });

  if (error) throw error;

  // Marcar como importada
  await supabase
    .from('captura_publicacoes')
    .update({
      matched_processo_id: processoId,
      foi_importado: true,
    })
    .eq('id', capturaId);

  return { sucesso: true };
}
