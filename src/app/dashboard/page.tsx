"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

// --- Interfaces de Tipagem ---
interface InsurerQuote {
  insurerName: string;
  insurerLogo: string;
  quoteId: string;
  status: string;
  totalPremium: string;
  message?: string;
  plan?: string;
  tenantName?: string;
  propertyAddress?: string;
  createdAt?: string;
}

interface DashboardCotacaoDoc {
  id: string;
  userId: string;
  userEmail?: string;
  payload: any;
  cotacao: InsurerQuote; // O resultado da Pottencial
  allInsurerQuotes?: InsurerQuote[]; // O array opcional com as 3 seguradoras
  createdAt: Timestamp;
}

const STATUS_OPTIONS = [
  "Todos",
  "Em análise",
  "Aceita",
  "Emitida",
  "Recusada",
  "Cancelada",
  "Pendente",
];

const STATUS_COLORS: Record<string, string> = {
  "Em análise": "bg-yellow-100 text-yellow-800 border-yellow-300",
  Aceita: "bg-green-100 text-green-800 border-green-300",
  Emitida: "bg-blue-100 text-blue-800 border-blue-300",
  Recusada: "bg-red-100 text-red-800 border-red-300",
  Cancelada: "bg-gray-200 text-gray-700 border-gray-300",
  Pendente: "bg-orange-100 text-orange-800 border-orange-300",
};

function formatDate(date: Timestamp | string | undefined): string {
  if (!date) return "-";
  try {
    if (typeof window === "undefined") return "-";

    let d: Date;
    if (typeof date === "string") {
      d = new Date(date);
    } else if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      return "-";
    }

    if (isNaN(d.getTime())) {
      console.warn("Data inválida recebida para formatação:", date);
      return "-";
    }

    return d.toLocaleString();
  } catch (e) {
    console.error("Erro ao formatar data:", e, "Data original:", date);
    return "-";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [cotacoes, setCotacoes] = useState<DashboardCotacaoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (_user) => {
      if (!_user) {
        router.push("/login");
      } else {
        setUser(_user);
        const q = query(
          collection(db, "cotacoes"),
          where("userId", "==", _user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const cotacoesList: DashboardCotacaoDoc[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DashboardCotacaoDoc, 'id'>)
        }));
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

  const handleVerDetalhes = (cotacao: DashboardCotacaoDoc) => {
    localStorage.setItem("lastCotacaoDocId", cotacao.id);
    router.push("/resultado");
  };

  const handleRecalcular = (cotacao: DashboardCotacaoDoc) => {
    localStorage.setItem("cotacao_recalcular", JSON.stringify(cotacao.payload));
    router.push("/formulario");
  };

  const handleVisualizar = (cotacao: DashboardCotacaoDoc) => {
    localStorage.setItem("lastCotacaoDocId", cotacao.id);
    router.push("/resultado");
  };

  // Filtro e busca ajustados para incluir nomes das seguradoras no filtro de busca
  const cotacoesFiltradas = cotacoes.filter((c) => {
    const busca = search.toLowerCase();
    const nomeLocatario = (c.payload?.tenantName || c.cotacao?.tenantName || "").toLowerCase();
    const idCotacao = (c.cotacao?.quoteId || c.id || "").toLowerCase();
    const emailUsuario = (c.userEmail || "").toLowerCase();
    const statusCotacao = (c.cotacao?.status || "").toLowerCase();

    // Novo: Nomes das seguradoras no array allInsurerQuotes
    const insurerNames = c.allInsurerQuotes
      ? c.allInsurerQuotes.map(iq => iq.insurerName.toLowerCase()).join(' ')
      : '';

    const matchBusca =
      nomeLocatario.includes(busca) ||
      idCotacao.includes(busca) ||
      emailUsuario.includes(busca) ||
      statusCotacao.includes(busca) ||
      insurerNames.includes(busca); // Inclui a busca pelos nomes das seguradoras

    const matchStatus =
      statusFilter === "Todos" ||
      statusCotacao === statusFilter.toLowerCase();

    let matchData = true;
    if (dateStart) {
      const dataCotacao = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : null;
      if (dataCotacao && new Date(dateStart) > dataCotacao) matchData = false;
    }
    if (dateEnd) {
      const dataCotacao = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : null;
      if (dataCotacao && new Date(dateEnd) < dataCotacao) matchData = false;
    }
    return matchBusca && matchStatus && matchData;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-primary flex flex-col items-center py-10 px-2 justify-center">
      <div
        style={{ height: "80vh" }}
        className="w-4/5 mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10 "
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-primary">Minhas Cotações</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="text-orange-600 hover:underline text-sm"
            >
              Sair
            </button>
            <button
              onClick={() => router.push("/formulario")}
              className="bg-primary hover:bg-secondary text-white font-semibold rounded px-4 py-2 transition-colors ml-2"
            >
              Nova Cotação
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nome, status, ID, e-mail, seguradora..." // Atualizado placeholder
            className="flex-1 border border-primary rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-primary rounded px-4 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border border-primary rounded px-4 py-2"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            title="Data inicial"
          />
          <input
            type="date"
            className="border border-primary rounded px-4 py-2"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            title="Data final"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-primary">
          {loading ? (
            <div className="text-center text-primary py-8">
              Carregando cotações...
            </div>
          ) : cotacoesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-primary">
              <span className="material-icons text-6xl mb-4 text-primary">
                inbox
              </span>
              <h3 className="text-xl font-semibold mb-2">
                Ainda não existem cotações
              </h3>
              <p className="mb-4 text-primary">
                Clique em <span className="font-bold">Nova Cotação</span> para
                criar sua primeira cotação!
              </p>
              <button
                onClick={() => router.push("/formulario")}
                className="bg-primary hover:bg-secondary text-white font-semibold rounded px-6 py-2 transition-colors"
              >
                Nova Cotação
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm text-secondary">
              <thead>
                <tr className="bg-primary/10">
                  <th className="px-4 py-2 text-left text-primary">ID</th>
                  <th className="px-4 py-2 text-left text-primary">Cliente</th>
                  <th className="px-4 py-2 text-left text-primary">Status</th>
                  <th className="px-4 py-2 text-left text-primary">Data</th>
                  <th className="px-4 py-2 text-left text-primary">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cotacoesFiltradas.map((c) => (
                  <tr
                    className="border-b hover:bg-primary/5 transition-colors"
                    key={c.id}
                  >
                    <td className="px-4 py-2 font-mono text-xs sm:text-sm text-primary">
                      {c.cotacao?.quoteId || c.id}
                    </td>
                    {/* Alterado para listar as seguradoras se houver mais de uma, ou o nome do locatário */}
                    <td className="px-4 py-2 text-primary">
                      {c.payload.participants[0].contact.name || "-"}
                    </td>
                     <td className="px-4 py-2">
                      {c.allInsurerQuotes && c.allInsurerQuotes.length > 0 ? (
                        <div className="flex gap-1 items-start"> {/* Flex-col para empilhar, items-start para alinhar à esquerda */}
                          {c.allInsurerQuotes.map((insurer, idx) => (
                            <span
                              key={idx} 
                              className={`inline-block px-2 py-1 gap-1 flex rounded border text-xs font-semibold ${
                                STATUS_COLORS[insurer.status] || "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              
                              {insurer.insurerName}. {insurer.status} 
                            </span>
                          ))}
                        </div>
                      ) : (                        
                        <span
                          className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${
                            STATUS_COLORS[c.cotacao?.status || ''] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {c.cotacao?.status || "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-primary">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-2 flex gap-6 items-center flex-wrap">
                      <button
                        onClick={() => handleVisualizar(c)}
                        title="Visualizar"
                        className="text-primary hover:text-secondary text-xs flex items-center gap-1"
                      >
                        <span className="material-icons text-base">
                          visibility
                        </span>
                        Visualizar
                      </button>
                      <button
                        onClick={() => handleVerDetalhes(c)}
                        title="Detalhes"
                        className="text-primary hover:text-secondary text-xs flex items-center gap-1"
                      >
                        <span className="material-icons text-base">info</span>
                        Detalhes
                      </button>
                      <button
                        onClick={() => handleRecalcular(c)}
                        title="Recalcular"
                        className="text-orange-600 hover:text-orange-900 text-xs flex items-center gap-1"
                      >
                        <span className="material-icons text-base">
                          refresh
                        </span>
                        Recalcular
                      </button>
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