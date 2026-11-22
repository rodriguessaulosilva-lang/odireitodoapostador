'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase/useAuth';

interface Captura {
  id: string;
  external_id: string;
  texto: string;
  categoria: string;
  data_publicacao: string;
  matched_processo_id: string | null;
  url: string | null;
  foi_importado: boolean;
  created_at: string;
}

interface Processo {
  id: string;
  numero_cnj: string;
  cliente: { nome_completo: string } | null;
}

export default function PublicacoesView({
  capturas: initialCapturas,
  processos,
}: {
  capturas: Captura[];
  processos: Processo[];
}) {
  const { session } = useAuth();
  const [capturas, setCapturas] = useState(initialCapturas);
  const [isCapturando, setIsCapturando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const handleCapturar = async () => {
    setIsCapturando(true);
    setErro(null);
    setResultado(null);

    try {
      const res = await fetch('/api/admin/capturar-publicacoes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao capturar');
      }

      const data = await res.json();
      setResultado(data);

      // Recarregar capturas (simplificado - ideal seria usar SWR ou similar)
      window.location.reload();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsCapturando(false);
    }
  };

  const capturasFiltered = filtroCategoria
    ? capturas.filter(c => c.categoria === filtroCategoria)
    : capturas;

  return (
    <div className="space-y-6">
      {/* Botão de captura */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
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
            onClick={handleCapturar}
            disabled={isCapturando}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
          >
            {isCapturando ? '⏳ Capturando...' : '📡 Capturar agora'}
          </button>
        </div>

        {resultado && (
          <div className="mt-4 text-sm text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 p-3 rounded">
            ✅ {resultado.importados} novo(s), {resultado.duplicados} duplicado(s)
            <br />
            Período: {resultado.periodoInicio} a {resultado.periodoFim}
          </div>
        )}

        {erro && (
          <div className="mt-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            ❌ {erro}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroCategoria(null)}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            filtroCategoria === null
              ? 'bg-brand text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-ink dark:text-slate-100 hover:bg-slate-300'
          }`}
        >
          Todas ({capturas.length})
        </button>
        {['intimacao', 'despacho', 'sentenca', 'acordao', 'pauta'].map(cat => {
          const count = capturas.filter(c => c.categoria === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                filtroCategoria === cat
                  ? 'bg-brand text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-ink dark:text-slate-100 hover:bg-slate-300'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de publicações */}
      <div className="space-y-3">
        {capturasFiltered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Nenhuma publicação encontrada. Clique em "Capturar agora" para buscar.
          </div>
        ) : (
          capturasFiltered.map(captura => (
            <PublicacaoCard
              key={captura.id}
              captura={captura}
              processos={processos}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PublicacaoCard({
  captura,
  processos,
}: {
  captura: Captura;
  processos: Processo[];
}) {
  const [expanded, setExpanded] = useState(false);

  const processoLigado = processos.find(p => p.id === captura.matched_processo_id);

  const badgeColor = {
    intimacao: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    despacho: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    sentenca: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    acordao: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    pauta: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  }[captura.categoria] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

  return (
    <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
              {captura.categoria?.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(captura.data_publicacao).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <p className="text-sm text-ink dark:text-slate-100 line-clamp-2 mb-2">
            {captura.texto.slice(0, 150)}...
          </p>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
              {captura.texto}
              {captura.url && (
                <div className="mt-2">
                  <a
                    href={captura.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver original →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ligação com processo */}
        <div className="text-right">
          {processoLigado ? (
            <div className="text-xs">
              <div className="text-green-600 dark:text-green-400 font-semibold">
                ✓ Ligado
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-1">
                {processoLigado.numero_cnj}
              </div>
            </div>
          ) : (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              ⚠ Não ligado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
