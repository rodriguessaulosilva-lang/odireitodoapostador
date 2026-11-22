'use client';

import { useEffect, useState } from 'react';

export default function DJENPage() {
  const [capturas, setCapturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const capturar = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/capturar-publicacoes', {
        method: 'POST',
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao capturar');
      }

      setResult(data);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📡 DJEN - Captura de Publicações</h1>
      
      <button
        onClick={capturar}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '⏳ Capturando...' : '🔄 Capturar Agora'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          ✅ {result.importados} importadas, {result.duplicados} duplicadas
        </div>
      )}
    </div>
  );
}
