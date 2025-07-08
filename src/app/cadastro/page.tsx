"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nome });
      setSuccess("Cadastro realizado com sucesso! Redirecionando para login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      setError(error.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-900 to-cyan-600">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-2xl font-bold text-cyan-900 mb-2">Cadastro</h1>
        <p className="text-cyan-700 mb-6 text-center">Crie sua conta para acessar o sistema</p>
        <form onSubmit={handleCadastro} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome completo"
            className="border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            className="border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            className="border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button
            type="submit"
            className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        <button onClick={() => router.push("/login")} className="mt-4 text-cyan-700 hover:underline text-sm">Já tem conta? Entrar</button>
      </div>
    </div>
  );
} 