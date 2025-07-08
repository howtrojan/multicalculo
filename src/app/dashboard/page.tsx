"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const STATUS_OPTIONS = [
  "Todos",
  "Em análise",
  "Aceita",
  "Emitida",
  "Recusada",
  "Cancelada",
  "Pendente"
];

const STATUS_COLORS: Record<string, string> = {
  "Em análise": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Aceita": "bg-green-100 text-green-800 border-green-300",
  "Emitida": "bg-blue-100 text-blue-800 border-blue-300",
  "Recusada": "bg-red-100 text-red-800 border-red-300",
  "Cancelada": "bg-gray-200 text-gray-700 border-gray-300",
  "Pendente": "bg-orange-100 text-orange-800 border-orange-300",
};

function formatDate(date: any) {
  if (!date) return "-";
  try {
    if (typeof window === "undefined") return "-"; // só formata no client
    if (typeof date === "string") return new Date(date).toLocaleDateString();
    if (date.toDate) return date.toDate().toLocaleDateString();
    return "-";
  } catch {
    return "-";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        // Buscar cotações do usuário
        const q = query(
          collection(db, "cotacoes"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const cotacoesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCotacoes(cotacoesList);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleVerDetalhes = (cotacao: any) => {
    localStorage.setItem("cotacao_result", JSON.stringify(cotacao.cotacao));
    router.push("/resultado");
  };

  const handleRecalcular = (cotacao: any) => {
    localStorage.setItem("cotacao_recalcular", JSON.stringify(cotacao.payload));
    router.push("/formulario");
  };

  const handleVisualizar = (cotacao: any) => {
    localStorage.setItem("cotacao_result", JSON.stringify(cotacao.cotacao));
    router.push("/resultado");
  };

  // Filtro e busca
  const cotacoesFiltradas = cotacoes.filter((c) => {
    const busca = search.toLowerCase();
    const nome = c.payload?.tenantName?.toLowerCase() || "";
    const id = (c.cotacao.quoteId || c.id || "").toLowerCase();
    const email = c.userEmail?.toLowerCase() || "";
    const status = (c.cotacao.status || "").toLowerCase();
    const matchBusca =
      nome.includes(busca) ||
      id.includes(busca) ||
      email.includes(busca) ||
      status.includes(busca);
    const matchStatus =
      statusFilter === "Todos" ||
      (c.cotacao.status || "").toLowerCase() === statusFilter.toLowerCase();
    let matchData = true;
    if (dateStart) {
      const dataCotacao = c.createdAt?.toDate ? c.createdAt.toDate() : null;
      if (dataCotacao && new Date(dateStart) > dataCotacao) matchData = false;
    }
    if (dateEnd) {
      const dataCotacao = c.createdAt?.toDate ? c.createdAt.toDate() : null;
      if (dataCotacao && new Date(dateEnd) < dataCotacao) matchData = false;
    }
    return matchBusca && matchStatus && matchData;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-900 to-cyan-600 flex flex-col items-center py-10 px-2">
      <div className="w-4/5 mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-cyan-900">Minhas Cotações</h2>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="text-cyan-700 hover:underline text-sm">Sair</button>
            <button onClick={() => router.push("/formulario")} className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2 transition-colors ml-2">Nova Cotação</button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nome, status, ID, e-mail..."
            className="flex-1 border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border border-cyan-300 rounded px-4 py-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            type="date"
            className="border border-cyan-300 rounded px-4 py-2"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
            title="Data inicial"
          />
          <input
            type="date"
            className="border border-cyan-300 rounded px-4 py-2"
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
            title="Data final"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-cyan-100">
          {loading ? (
            <div className="text-center text-cyan-700 py-8">Carregando cotações...</div>
          ) : cotacoesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cyan-700">
              <span className="material-icons text-6xl mb-4 text-cyan-200">inbox</span>
              <h3 className="text-xl font-semibold mb-2">Ainda não existem cotações</h3>
              <p className="mb-4 text-cyan-500">Clique em <span className="font-bold">Nova Cotação</span> para criar sua primeira cotação!</p>
              <button onClick={() => router.push("/formulario")} className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-6 py-2 transition-colors">Nova Cotação</button>
            </div>
          ) : (
            <table className="min-w-full text-sm text-cyan-900">
              <thead>
                <tr className="bg-cyan-100">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cotacoesFiltradas.map((c) => (
                  <tr className="border-b hover:bg-cyan-50 transition-colors" key={c.id}>
                    <td className="px-4 py-2 font-mono text-xs sm:text-sm">{c.cotacao.quoteId || c.id}</td>
                    <td className="px-4 py-2">{c.payload?.tenantName || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${STATUS_COLORS[c.cotacao.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {c.cotacao.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-2 flex gap-2 flex-wrap">
                      <button onClick={() => handleVisualizar(c)} title="Visualizar" className="text-cyan-700 hover:underline text-xs flex items-center gap-1"><span className="material-icons text-base">visibility</span>Visualizar</button>
                      <button onClick={() => handleVerDetalhes(c)} title="Detalhes" className="text-cyan-700 hover:underline text-xs flex items-center gap-1"><span className="material-icons text-base">info</span>Detalhes</button>
                      <button onClick={() => handleRecalcular(c)} title="Recalcular" className="text-orange-600 hover:underline text-xs flex items-center gap-1"><span className="material-icons text-base">refresh</span>Recalcular</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 