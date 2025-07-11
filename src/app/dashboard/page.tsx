"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Mantém auth e db para a lógica de dados
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
// REMOVA ESTES IMPORTS, POIS ELES AGORA PERTENCEM AO DashboardLayout
// import Image from "next/image";
// import Logo from "../../../public/assets/logo.svg";
// import { FaSearch } from "react-icons/fa"; // FaSearch também sai daqui

// MANTENHA SOMENTE OS ÍCONES QUE SÃO USADOS NA TABELA
import {
  FaEye,
  FaSyncAlt,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// --- Interfaces de Tipagem (Mantenha inalteradas) ---
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
  cotacao: InsurerQuote;
  allInsurerQuotes?: InsurerQuote[];
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

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
  const [search, setSearch] = useState(""); // Este `search` agora é para o filtro LOCAL da tabela
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeFilter, setTimeFilter] = useState("Todos");

  useEffect(() => {
    // A importação de `auth` é necessária aqui para `onAuthStateChanged`
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
        const cotacoesList: DashboardCotacaoDoc[] = querySnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<DashboardCotacaoDoc, "id">),
          })
        );
        setCotacoes(cotacoesList);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // `handleLogout` foi movido para `DashboardLayout` e não é mais necessário aqui.
  // const handleLogout = async () => { ... };

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

  const applyTimeFilter = (filter: string) => {
    setTimeFilter(filter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = "";
    let endDate = "";

    if (filter === "Hoje") {
      startDate = today.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if (filter === "7 Dias") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      startDate = sevenDaysAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if (filter === "15 Dias") {
      const fifteenDaysAgo = new Date(today);
      fifteenDaysAgo.setDate(today.getDate() - 15);
      startDate = fifteenDaysAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if (filter === "30 Dias") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }

    setDateStart(startDate);
    setDateEnd(endDate);
  };

  const cotacoesFiltradas = cotacoes.filter((c) => {
    // Este `busca` refere-se ao estado local da DashboardPage,
    // não à barra de busca do header (que é global).
    const busca = search.toLowerCase();
    const clientName = (
      c.payload?.client?.name ||
      c.payload?.participants?.[0]?.contact?.name ||
      ""
    ).toLowerCase();
    const clientCpf = (
      c.payload?.client?.document ||
      c.payload?.participants?.[0]?.contact?.document ||
      ""
    ).toLowerCase();
    const clientAddress = (
      c.payload?.property?.address
        ? `${c.payload.property.address.street}, ${
            c.payload.property.address.number || ""
          }, ${c.payload.property.address.neighborhood}, ${
            c.payload.property.address.city
          }/${c.payload.property.address.state}`
        : ""
    ).toLowerCase();

    const idCotacao = (c.cotacao?.quoteId || c.id || "").toLowerCase();
    const emailUsuario = (c.userEmail || "").toLowerCase();
    const statusCotacao = (c.cotacao?.status || "").toLowerCase();

    const insurerNames = c.allInsurerQuotes
      ? c.allInsurerQuotes.map((iq) => iq.insurerName.toLowerCase()).join(" ")
      : "";

    const matchBusca =
      clientName.includes(busca) ||
      clientCpf.includes(busca) ||
      clientAddress.includes(busca) ||
      idCotacao.includes(busca) ||
      emailUsuario.includes(busca) ||
      statusCotacao.includes(busca) ||
      insurerNames.includes(busca);

    const matchStatus =
      statusFilter === "Todos" || statusCotacao === statusFilter.toLowerCase();

    let matchData = true;
    if (dateStart) {
      const dataCotacao =
        c.createdAt instanceof Timestamp ? c.createdAt.toDate() : null;
      if (dataCotacao && new Date(dateStart) > dataCotacao) matchData = false;
    }
    if (dateEnd) {
      const dataCotacao =
        c.createdAt instanceof Timestamp ? c.createdAt.toDate() : null;
      const endDatePlusOneDay = new Date(dateEnd);
      endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);
      endDatePlusOneDay.setMilliseconds(
        endDatePlusOneDay.getMilliseconds() - 1
      );
      if (dataCotacao && dataCotacao > endDatePlusOneDay) matchData = false;
    }
    return matchBusca && matchStatus && matchData;
  });

  return (
    // Removido o div pai `flex flex-col min-h-screen bg-gray-100`
    // Removido o <header>
    <main className="flex-1 p-6 flex flex-col">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
        {/* Título e Filtros de Tempo/Data */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary mb-4">COTAÇÕES</h2>
          <div className="flex flex-wrap items-center mb-4 justify-between">
            {/* Botões de Filtro de Tempo */}
            <div className="flex rounded-md  overflow-hidden gap-4">
              {["Hoje", "7 Dias", "15 Dias", "30 Dias", "Todos"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => applyTimeFilter(filter)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      timeFilter === filter
                        ? "bg-primary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Filtro Dropdown e Data Inputs */}
              <select
                className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeFilter("Todos");
                }}
              >
                <option value="">Filtrar</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                value={dateStart}
                onChange={(e) => {
                  setDateStart(e.target.value);
                  setTimeFilter("Todos");
                }}
                title="Data inicial"
              />
              <input
                type="date"
                className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                value={dateEnd}
                onChange={(e) => {
                  setDateEnd(e.target.value);
                  setTimeFilter("Todos");
                }}
                title="Data final"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Cotações - Esta div precisa crescer para preencher o espaço */}
        <div className="overflow-x-auto flex-1 justify-between">
          {loading ? (
            <div className="text-center text-primary py-8 h-full flex items-center justify-center">
              Carregando cotações...
            </div>
          ) : cotacoesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600 h-full">
              <span className="material-icons text-6xl mb-4 text-gray-400">
                inbox
              </span>
              <h3 className="text-xl font-semibold mb-2">
                Ainda não existem cotações
              </h3>
              <p className="mb-4 text-center">
                Clique em <span className="font-bold">Novo Cálculo</span> para
                criar sua primeira cotação!
              </p>
              <button
                onClick={() => router.push("/formulario")}
                className="bg-primary hover:bg-secondary text-white font-semibold rounded px-6 py-2 transition-colors"
              >
                Novo Cálculo
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                    Data e hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">
                    Opções
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cotacoesFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.cotacao?.quoteId?.substring(0, 8) ||
                        c.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">
                        {c.payload?.participants?.[0]?.contact?.name || "N/A"}
                      </div>
                      <div className="text-gray-500">
                        CPF:{" "}
                        {c.payload?.participants?.[0]?.contact?.document ||
                          "(XX) XXXX-XXXX"}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {c.payload?.property?.address
                          ? `${c.payload.property.address.street}, ${
                              c.payload.property.address.number || "s/n"
                            }, ${c.payload.property.address.neighborhood}, ${
                              c.payload.property.address.city
                            }/${c.payload.property.address.state}`
                          : "Logradouro, nº, Comp. Bairro, Cidade/UF"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {c.allInsurerQuotes && c.allInsurerQuotes.length > 0 ? (
                          c.allInsurerQuotes.map((insurer, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                STATUS_COLORS[insurer.status] ||
                                "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {insurer.insurerName}. {insurer.status}
                            </span>
                          ))
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              STATUS_COLORS[c.cotacao?.status || ""] ||
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {c.cotacao?.status || "N/A"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Usuário
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVisualizar(c)}
                          title="Visualizar"
                          className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1 text-xs"
                        >
                          <FaEye className="text-base" />
                        </button>
                        <button
                          onClick={() => handleVerDetalhes(c)}
                          title="Detalhes"
                          className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1 text-xs"
                        >
                          <FaInfoCircle className="text-base" />
                        </button>
                        <button
                          onClick={() => handleRecalcular(c)}
                          title="Recalcular"
                          className="text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1 text-xs"
                        >
                          <FaSyncAlt className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Paginação */}
        <div className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t border-gray-200 mt-auto">
          {" "}
          <span className="text-sm text-gray-700 mr-4">
            {/* Mostrando X de Y resultados */}
          </span>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-50"
              disabled
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold">
              1
            </span>
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-50">
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
