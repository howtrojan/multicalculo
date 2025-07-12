"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Importe o componente Image
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { FaCopy, FaPrint, FaTrashAlt } from "react-icons/fa";

// --- Interfaces de Tipagem (sem alterações) ---
interface InsurerQuote {
  insurerName: string;
  insurerLogo: string;
  quoteId: string;
  status: string;
  totalPremium: string;
  message?: string;
  plan?: string;
}

interface FirestoreCotacaoDoc {
  payload: {
    participants: {
      contact: {
        name: string;
        documentNumber: string;
      };
    }[];
    riskObjects: {
      occupation: string; // Usado para "Finalidade"
      type: string; // Poderia ser usado para "Tipo"
      riskLocation: {
        address: {
          zipCode: string;
          state: string;
          city: string;
          street: string;
        };
      };
    }[];
    commissionedAgents: {
      commissionPercentage: number;
    }[];
    policyPeriodStart: string;
  };
  allInsurerQuotes: InsurerQuote[];
  userId: string;
  userEmail: string;
  createdAt: Timestamp;
}

export default function ResultadoPage() {
  const [cotacaoDoc, setCotacaoDoc] = useState<FirestoreCotacaoDoc | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCotacaoDoc = async () => {
      setLoading(true);
      const docId = localStorage.getItem("lastCotacaoDocId");

      if (!docId) {
        setError("Nenhum ID de cotação encontrado.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "cotacoes", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCotacaoDoc(docSnap.data() as FirestoreCotacaoDoc);
        } else {
          setError("Documento de cotação não encontrado.");
        }
      } catch (err) {
        setError("Erro ao buscar os dados da cotação.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCotacaoDoc();
  }, []);

  // O resto do seu código (estados de loading/error, etc.) permanece o mesmo...

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-b from-secondary to-primary">
        <p className="text-white text-xl">Carregando resultados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-b from-secondary to-primary">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Ocorreu um Erro
          </h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 bg-primary hover:bg-secondary text-white font-semibold rounded px-6 py-2"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!cotacaoDoc) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-b from-secondary to-primary">
        <p className="text-white text-xl">Nenhuma cotação encontrada.</p>
      </div>
    );
  }

  const segurado = cotacaoDoc.payload?.participants?.[0]?.contact;
  const imovel = cotacaoDoc.payload?.riskObjects?.[0];
  const comissao = cotacaoDoc.payload?.commissionedAgents?.find(
    (a) => a.commissionPercentage
  )?.commissionPercentage;

  return (
    <main className="flex-1 p-4 sm:p-6 flex flex-col bg-gradient-to-b from-secondary to-primary">
      
        

        {/* Box de Informações Gerais com TODOS os campos do Figma */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col p-10">
          <h2 className="text-2xl font-bold text-primary mb-6 text-start">
          RESULTADOS
        </h2>
        <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
          <div className="border rounded-md p-4 grid grid-cols-12 gap-x-6 gap-y-4 text-sm">
            {/* Linha 1 */}
            <div className="col-span-12 sm:col-span-6 md:col-span-5">
              <p className="font-semibold text-gray-500">Segurado</p>
              <p className="text-gray-800 truncate">{segurado?.name || "-"}</p>
            </div>
            <div className="col-span-6 sm:col-span-3 md:col-span-3">
              <p className="font-semibold text-gray-500">CPF</p>
              <p className="text-gray-800">{segurado?.documentNumber || "-"}</p>
            </div>
            <div className="col-span-6 sm:col-span-3 md:col-span-4">
              <p className="font-semibold text-gray-500">Vigência</p>
              <p className="text-gray-800">
                {cotacaoDoc.payload?.policyPeriodStart || "-"}
              </p>
            </div>

            {/* Linha 2 */}
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">Finalidade</p>
              <p className="text-gray-800">{imovel?.occupation || "-"}</p>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">Tipo</p>
              <p className="text-gray-800">-</p>{" "}
              {/* Dado não encontrado no payload */}
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">Local</p>
              <p className="text-gray-800">-</p>{" "}
              {/* Dado não encontrado no payload */}
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">CEP</p>
              <p className="text-gray-800">
                {imovel?.riskLocation.address.zipCode || "-"}
              </p>
            </div>

            {/* Linha 3 */}
            <div className="col-span-12 sm:col-span-6">
              <p className="font-semibold text-gray-500">Logradouro</p>
              <p className="text-gray-800 truncate">
                {imovel?.riskLocation.address.street || "-"}
              </p>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">Cidade</p>
              <p className="text-gray-800">
                {imovel?.riskLocation.address.city || "-"}
              </p>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-semibold text-gray-500">UF</p>
              <p className="text-gray-800">
                {imovel?.riskLocation.address.state || "-"}
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col p-10">
          <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
          {/* Cabeçalho da Tabela */}
          <div className="flex bg-gray-50 p-3 rounded-t-md border-b text-xs font-bold text-gray-600 uppercase">
            <div className="w-3/12 pl-2">Seguradora</div>
            <div className="w-2/12">Prêmio</div>
            <div className="w-1/12">Franquia</div>
            <div className="w-1/12">Comissão</div>
            <div className="w-2/12">Cobertura</div>
            <div className="w-2/12">Cotação</div>
            <div className="w-1/12 text-center">Opções</div>
          </div>

          {/* Corpo da Tabela */}
        <div className="border-l border-r border-b rounded-b-md divide-y divide-gray-200">
          {cotacaoDoc.allInsurerQuotes.map((quote, index) => (
            <div key={index} className="flex items-center p-3 text-sm text-gray-700 min-h-[60px]">
              
              {/* Coluna da Seguradora (sempre visível) */}
              <div className="w-3/12 font-semibold text-primary flex items-center">
                <Image
                  src={quote.insurerLogo}
                  alt={`${quote.insurerName} Logo`}
                  width={24}
                  height={24}
                  className="mr-3 rounded-full object-contain"
                />
                {quote.insurerName}
              </div>

              {/* AQUI ESTÁ A LÓGICA CONDICIONAL */}
              {quote.status === "Recusado" ? (
                // SE RECUSADO: Mostra a mensagem em vermelho
                <div className="flex-grow flex items-center justify-center px-4">
                  <p className="text-red-600 font-semibold">{quote.message || "Cotação recusada"}</p>
                </div>
              ) : (
                // CASO CONTRÁRIO: Mostra todas as outras colunas
                <>
                  <div className="w-2/12">
                    <p className="font-bold text-gray-800">
                      {quote.totalPremium ? `R$ ${quote.totalPremium}` : "-"}
                    </p>
                    {quote.totalPremium && <p className="text-xs text-gray-500">10x sem juros</p>}
                  </div>
                  <div className="w-1/12">-</div>
                  <div className="w-1/12">{comissao ? `${comissao}%` : "-"}</div>
                  <div className="w-2/12">-</div>
                  <div className="w-2/12 text-gray-500 truncate" title={quote.quoteId || ""}>
                    {quote.quoteId || "-"}
                  </div>
                  <div className="w-1/12 flex justify-center items-center gap-4 text-gray-500">
                    <button title="Copiar" className="hover:text-primary"><FaCopy /></button>
                    <button title="Imprimir" className="hover:text-primary"><FaPrint /></button>
                    <button title="Excluir" className="hover:text-red-500"><FaTrashAlt /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
  );
}

