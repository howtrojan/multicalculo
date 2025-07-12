"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaSyncAlt } from "react-icons/fa";
import { Timestamp } from "firebase/firestore";

// As interfaces e constantes podem vir de um arquivo compartilhado
interface CotationDocument {
  id: string;
  payload: any;
  userEmail: string;
  createdAt: Timestamp;
  allInsurerQuotes: {
    insurerName: string;
    status: string;
  }[];
}

const STATUS_OPTIONS = ["Todos", "Em análise", "Aceita", "Emitida", "Recusada", "Cancelada", "Pendente"];
const TIME_FILTER_OPTIONS = ["Hoje", "7 Dias", "15 Dias", "30 Dias", "Todos"];
const STATUS_COLORS: Record<string, string> = {
  "Em análise": "bg-yellow-100 text-yellow-800",
  "Aceita": "bg-green-100 text-green-800",
  "Emitida": "bg-blue-100 text-blue-800",
  "Recusada": "bg-red-100 text-red-800",
  "Cancelada": "bg-gray-200 text-gray-700",
  "Pendente": "bg-orange-100 text-orange-800",
};

function formatDate(date: any): string {
  if (!date || !date.seconds) return "-";
  try {
    const d = new Date(date.seconds * 1000);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return "-";
  }
}

export default function DashboardClient({ initialCotacoes }: { initialCotacoes: CotationDocument[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado local para a busca de texto e para o botão de tempo ativo
  const [search, setSearch] = useState("");
  const [activeTimeFilter, setActiveTimeFilter] = useState(() => searchParams.get('timeFilter') || 'Todos');

  // Valores dos filtros lidos da URL
  const statusFilter = searchParams.get("status") || "Todos";
  const dateStart = searchParams.get("dateStart") || "";
  const dateEnd = searchParams.get("dateEnd") || "";

  // Função para aplicar os filtros de tempo
  const applyTimeFilter = (filter: string) => {
    setActiveTimeFilter(filter); // Atualiza o botão ativo na UI
    const params = new URLSearchParams(searchParams.toString());
    
    if (filter === "Todos") {
        params.delete("dateStart");
        params.delete("dateEnd");
        params.delete("timeFilter");
    } else {
        const today = new Date();
        const startDate = new Date(today);
        
        if (filter === "7 Dias") startDate.setDate(today.getDate() - 7);
        else if (filter === "15 Dias") startDate.setDate(today.getDate() - 15);
        else if (filter === "30 Dias") startDate.setDate(today.getDate() - 30);
        
        params.set('dateStart', startDate.toISOString().split('T')[0]);
        params.set('dateEnd', today.toISOString().split('T')[0]);
        params.set('timeFilter', filter);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Função para filtros manuais (status e data)
  const handleManualFilterChange = (filters: { status?: string; dateStart?: string; dateEnd?: string }) => {
    setActiveTimeFilter('Custom'); // Desativa os botões de tempo
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(filters).forEach(([key, value]) => {
        if(value && value !== "Todos") params.set(key, value);
        else params.delete(key);
    });
    params.delete('timeFilter');
    router.push(`/dashboard?${params.toString()}`);
  };

  // Funções de navegação para as ações
  const handleVerDetalhes = (cotacaoId: string) => {
    localStorage.setItem("lastCotacaoDocId", cotacaoId);
    router.push("/resultado");
  };

  const handleRecalcular = (payload: any) => {
    localStorage.setItem("cotacao_recalcular", JSON.stringify(payload));
    router.push("/formulario");
  };

  // Filtragem final por texto (cliente)
  const cotacoesFiltradas = useMemo(() => {
    if (!search) return initialCotacoes;
    const busca = search.toLowerCase();
    return initialCotacoes.filter(c => 
      (c.payload?.participants?.[0]?.contact?.name || "").toLowerCase().includes(busca) ||
      (c.id || "").toLowerCase().includes(busca)
    );
  }, [search, initialCotacoes]);

  return (
    <main className="flex-1 p-6 flex flex-col bg-gradient-to-b from-secondary to-primary">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
        {/* Filtros */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary mb-4">COTAÇÕES</h2>          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {TIME_FILTER_OPTIONS.map(filter => (
                <button
                  key={filter}
                  onClick={() => applyTimeFilter(filter)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTimeFilter === filter
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => handleManualFilterChange({ status: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => handleManualFilterChange({ dateStart: e.target.value, dateEnd })}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm"
              />
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => handleManualFilterChange({ dateStart, dateEnd: e.target.value })}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Cotações */}
        <div className="overflow-x-auto flex-1">
          {cotacoesFiltradas.length === 0 ? (
            <div className="text-center p-16 text-gray-500">
              <h3 className="text-xl font-semibold">Nenhuma cotação encontrada</h3>
              <p>Tente ajustar os filtros ou criar uma nova cotação.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Opções</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cotacoesFiltradas.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{c.payload?.participants?.[0]?.contact?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{c.payload?.participants?.[0]?.contact?.documentNumber || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {c.allInsurerQuotes?.map((insurer, idx) => (
                            <span key={idx} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[insurer.status] || "bg-gray-100 text-gray-700"}`}>
                              {insurer.insurerName}: {insurer.status}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.userEmail}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-4">
                          <button onClick={() => handleVerDetalhes(c.id)} title="Ver Detalhes" className="text-gray-600 hover:text-primary transition-colors"><FaEye /></button>
                          <button onClick={() => handleRecalcular(c.payload)} title="Recalcular" className="text-gray-600 hover:text-orange-500 transition-colors"><FaSyncAlt /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}