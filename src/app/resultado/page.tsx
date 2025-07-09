"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";

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

interface FirestoreCotacaoDoc {
    cotacao?: any;
    payload?: any;
    allInsurerQuotes: InsurerQuote[];
    userId: string;
    userEmail: string;
    createdAt: Timestamp;
}

export default function ResultadoPage() {
  const [cotacoes, setCotacoes] = useState<InsurerQuote[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchCotacoes = async () => {
      console.log("1. [ResultadoPage] Iniciando fetchCotacoes. Loading = true.");
      setLoading(true);
      setError(null);
      const lastCotacaoDocId = localStorage.getItem("lastCotacaoDocId");
      console.log("2. [ResultadoPage] lastCotacaoDocId do localStorage:", lastCotacaoDocId);

      if (!lastCotacaoDocId) {
        console.log("3. [ResultadoPage] ERRO: ID de cotação não encontrado no localStorage.");
        setError("Nenhum ID de cotação encontrado no armazenamento local. Por favor, faça uma nova cotação.");
        setLoading(false);
        setCotacoes([]);
        return;
      }

      try {
        const docRef = doc(db, "cotacoes", lastCotacaoDocId);
        console.log("4. [ResultadoPage] Tentando buscar documento do Firestore com ID:", lastCotacaoDocId);
        
        // --- ADIÇÃO DO TIMEOUT PARA DIAGNÓSTICO ---
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite excedido ao buscar cotação do Firebase (10s).')), 10000)
        );

        const docSnap = await Promise.race([
          getDoc(docRef),
          timeoutPromise
        ]);
        console.log("5. [ResultadoPage] getDoc (ou timeout) finalizado.");

        if (docSnap.exists()) {
          console.log("6. [ResultadoPage] Documento existe no Firestore.");
          const data = docSnap.data() as FirestoreCotacaoDoc;
          if (data.allInsurerQuotes && Array.isArray(data.allInsurerQuotes)) {
            setCotacoes(data.allInsurerQuotes);
            console.log("7. [ResultadoPage] Cotações definidas. Dados carregados:", data.allInsurerQuotes);
          } else {
            setError("Dados de cotação de seguradoras não encontrados ou em formato incorreto no documento do Firebase.");
            setCotacoes([]);
            console.log("8. [ResultadoPage] ERRO: Dados de seguradoras ausentes ou incorretos.");
          }
        } else {
          setError("Documento de cotação não encontrado no Firebase com o ID fornecido.");
          setCotacoes([]);
          console.log("9. [ResultadoPage] ERRO: Documento não existe para o ID.");
        }
      } catch (err: unknown) {
        let errorMessage = "Erro ao buscar cotação do Firebase.";
        if (err instanceof Error) {
          errorMessage += `: ${err.message}`;
        } else if (typeof err === 'string') {
          errorMessage += `: ${err}`;
        }
        console.error("10. [ResultadoPage] ERRO CAPTURADO:", errorMessage, err);
        setError(errorMessage);
        setCotacoes([]);
      } finally {
        setLoading(false);
        console.log("11. [ResultadoPage] fetchCotacoes finalizado. Loading = false.");
      }
    };

    fetchCotacoes();
  }, []);

  // Função para formatar a data
  const formatDate = (date: Timestamp | string | undefined): string => {
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
      console.error("Erro ao formatar data:", e);
      return "-";
    }
  };


  // Renderização condicional com base nos estados
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-cyan-900 mb-4">Carregando resultados...</h2>
          <p className="text-cyan-600">Buscando cotações no Firebase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar resultados</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2">Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  if (!cotacoes || cotacoes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-cyan-900 mb-4">Nenhum resultado encontrado</h2>
          <p className="text-gray-700 mb-4">Por favor, faça uma nova cotação.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2">Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-900 to-cyan-600 flex flex-col items-center justify-center py-10 px-4">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Resultados da Cotação</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {cotacoes.map((cotacao, index) => (
          <div key={cotacao.quoteId || index} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center mb-4 border-b pb-4">
              <Image
                src={cotacao.insurerLogo}
                alt={`${cotacao.insurerName} Logo`}
                width={80}
                height={80}
                className="mr-4 rounded-full"
              />
              <h3 className="text-xl font-bold text-cyan-900">{cotacao.insurerName}</h3>
            </div>

            {cotacao.message && (
              <div className="mb-3 text-sm text-green-700 font-semibold">{cotacao.message}</div>
            )}

            <div className="mb-3">
              <div className="text-cyan-800 font-semibold">ID da Cotação:</div>
              <div className="text-cyan-700 break-all text-sm">{cotacao.quoteId}</div>
            </div>
            <div className="mb-3">
              <div className="text-cyan-800 font-semibold">Status:</div>
              <div className="text-cyan-700 font-medium">{cotacao.status}</div>
            </div>
            <div className="mb-3">
              <div className="text-cyan-800 font-semibold">Valor Total:</div>
              <div className="text-cyan-700 text-lg font-bold">{cotacao.totalPremium ? `R$ ${cotacao.totalPremium}` : "-"}</div>
            </div>

            {cotacao.plan && (
              <div className="mb-3">
                <div className="text-cyan-800 font-semibold">Plano:</div>
                <div className="text-cyan-700 text-sm">{cotacao.plan}</div>
              </div>
            )}
            {cotacao.tenantName && (
              <div className="mb-3">
                <div className="text-cyan-800 font-semibold">Locatário:</div>
                <div className="text-cyan-700 text-sm">{cotacao.tenantName}</div>
              </div>
            )}
            {cotacao.propertyAddress && (
              <div className="mb-3">
                <div className="text-cyan-800 font-semibold">Endereço do Imóvel:</div>
                <div className="text-cyan-700 text-sm">{cotacao.propertyAddress}</div>
              </div>
            )}
            {cotacao.createdAt && (
              <div className="mb-3">
                <div className="text-cyan-800 font-semibold">Data da Cotação:</div>
                <div className="text-cyan-700 text-sm">{formatDate(cotacao.createdAt)}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-4 border-t">
              <button onClick={() => router.push("/dashboard")} className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2 flex-grow">Voltar ao Dashboard</button>
              <button onClick={() => alert(`Você selecionou a cotação ${cotacao.quoteId} da ${cotacao.insurerName}`)} className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded px-4 py-2 flex-grow">Selecionar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}