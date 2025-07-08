"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultadoPage() {
  const router = useRouter();
  const [cotacao, setCotacao] = useState<any>(null);

  useEffect(() => {
    // Tenta recuperar o resultado do localStorage (simples para demo)
    const data = localStorage.getItem("cotacao_result");
    if (data) {
      setCotacao(JSON.parse(data));
    } else {
      setCotacao(null);
    }
  }, []);

  if (!cotacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-cyan-900 mb-4">Nenhum resultado encontrado</h2>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2">Voltar ao Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-cyan-900 mb-4">Cotação enviada com sucesso!</h2>
        {cotacao.message && (
          <div className="mb-4 text-green-700 font-semibold text-center">{cotacao.message}</div>
        )}
        <div className="mb-4">
          <div className="text-cyan-800 font-semibold">ID da Cotação:</div>
          <div className="text-cyan-700 break-all">{cotacao.quoteId || cotacao.id || "-"}</div>
        </div>
        <div className="mb-4">
          <div className="text-cyan-800 font-semibold">Status:</div>
          <div className="text-cyan-700">{cotacao.status || cotacao.message || "-"}</div>
        </div>
        <div className="mb-4">
          <div className="text-cyan-800 font-semibold">Valor Total:</div>
          <div className="text-cyan-700">{cotacao.totalPremium ? `R$ ${cotacao.totalPremium}` : "-"}</div>
        </div>
        {cotacao.plan && (
          <div className="mb-4">
            <div className="text-cyan-800 font-semibold">Plano:</div>
            <div className="text-cyan-700">{cotacao.plan}</div>
          </div>
        )}
        {cotacao.tenantName && (
          <div className="mb-4">
            <div className="text-cyan-800 font-semibold">Locatário:</div>
            <div className="text-cyan-700">{cotacao.tenantName}</div>
          </div>
        )}
        {cotacao.propertyAddress && (
          <div className="mb-4">
            <div className="text-cyan-800 font-semibold">Endereço do Imóvel:</div>
            <div className="text-cyan-700">{cotacao.propertyAddress}</div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={() => window.print()} className="bg-cyan-500 hover:bg-cyan-700 text-white font-semibold rounded px-4 py-2">Imprimir</button>
          <button onClick={() => router.push("/dashboard")} className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2">Voltar ao Dashboard</button>
        </div>
      </div>
    </div>
  );
} 