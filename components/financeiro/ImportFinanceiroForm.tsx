'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ClienteData {
  nome: string;
  valor_total: number;
  parcelas: Array<{
    mes: string;
    mes_num: number;
    ano: number;
    valor: number;
  }>;
}

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

export function ImportFinanceiroForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Extrair clientes e parcelas
      const clientes: ClienteData[] = [];

      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
      const headerRow = rows[1] || []; // Linha com nomes das colunas

      // Mapear índice de mês
      const mesIndexMap: Record<string, number> = {};
      headerRow.forEach((header: string, idx: number) => {
        if (MESES_MAP[header]) {
          mesIndexMap[header] = idx;
        }
      });

      // Processar linhas de clientes (a partir da linha 2)
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        const nome = row[1]; // Coluna B (índice 1)
        const valor_total = parseFloat(row[2]); // Coluna C (índice 2)

        if (!nome || !valor_total || valor_total <= 0) continue;
        if (['Receita', 'Custos', 'Lucro', 'VALOR PARA CADA UM'].includes(nome)) continue;

        const parcelas: ClienteData['parcelas'] = [];

        // Extrair parcelas por mês
        for (const [mes, [mes_num, ano]] of Object.entries(MESES_MAP)) {
          const mesIdx = mesIndexMap[mes];
          if (mesIdx === undefined) continue;

          const valor = row[mesIdx];
          if (!valor || parseFloat(valor) <= 0) continue;

          parcelas.push({
            mes,
            mes_num,
            ano,
            valor: parseFloat(valor),
          });
        }

        if (parcelas.length > 0) {
          clientes.push({
            nome,
            valor_total,
            parcelas,
          });
        }
      }

      if (clientes.length === 0) {
        setError('Nenhum cliente encontrado na planilha');
        setIsLoading(false);
        return;
      }

      // Enviar para API
      const response = await fetch('/api/admin/import-financeiro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientes }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro na importação');
      }

      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-surface rounded-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-ink dark:text-slate-100">
        Importar Financeiro
      </h2>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
            id="excel-file"
          />
          <label
            htmlFor="excel-file"
            className="cursor-pointer block"
          >
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {isLoading ? '⏳ Processando...' : '📤 Clique ou arraste um arquivo Excel'}
            </div>
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <div className="text-green-700 dark:text-green-400 font-semibold">
              ✅ Importação concluída!
            </div>
            <div className="text-sm text-green-600 dark:text-green-500 mt-2">
              <p>Total: {result.total}</p>
              <p>Importados: {result.importados}</p>
              <p>Erros: {result.erros}</p>
            </div>

            {result.resultados.some((r: any) => r.status === 'erro') && (
              <div className="mt-4 text-sm">
                <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                  Erros:
                </p>
                <ul className="space-y-1">
                  {result.resultados
                    .filter((r: any) => r.status === 'erro')
                    .map((r: any, i: number) => (
                      <li key={i} className="text-red-600 dark:text-red-400">
                        {r.nome}: {r.mensagem}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
