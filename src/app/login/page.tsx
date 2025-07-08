"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../../../public/assets/logo.svg";
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para visibilidade da senha
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

   return (
    // O container pai precisa ser relative para que o filho absolute seja posicionado em relação a ele.
    // Removido 'items-center justify-center' do pai para que o filho possa ser posicionado livremente.
    <div className="min-h-screen bg-gradient-to-b from-secondary to-primary relative">
      
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg flex flex-col items-center
                      absolute top-1/2 -translate-y-1/2 right-[45%] -translate-x-1/2 h-[70vh] justify-around">
                      
        <Image
          src={Logo} // Usa o objeto importado
          alt="Logo SterSi Corretora de Seguros"
          width={210} // Defina a largura explícita
          height={210} // Defina a altura explícita (pode ser ajustada para manter a proporção)
          className="mb-0" // Aplique as classes Tailwind restantes
        />
        {/* Título centralizado */}
        <h1 className="text-4xl font-bold text-primary mb-6 text-center">
          MULTICÁLCULO
        </h1>{" "}
        {/* Adicionado text-center explicitamente */}
        {/* O formulário ocupa toda a largura do cartão (w-full) e seus itens internos são distribuídos verticalmente (flex-col gap-4) */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
          <input
            type="email"
            placeholder="E-mail"
            className="border border-cyan-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              className="border border-cyan-300 rounded px-4 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Esta div flex com justify-between faz com que "Lembrar-me" fique à esquerda e "Esqueci minha senha" à direita. */}
          <div className="flex justify-between items-center text-sm mt-1 w-full">
            {" "}
            {/* Adicionado w-full para garantir que o espaçamento funcione em toda a largura */}
            <div className="flex items-center text-gray-700">
              <input
                type="checkbox"
                id="rememberMe"
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="select-none">
                Lembrar-me
              </label>
            </div>
            <a href="#" className="text-primary hover:underline">
              Esqueci minha senha
            </a>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center mt-2">{error}</div>
          )}

          {/* Botão "Acessar" que ocupa a largura total do formulário, e centralizado pelo flex-col items-center do pai */}
          <button
            type="submit"
            className="pointer bg-primary hover:bg-secondary text-white font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60 mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Acessando..." : "Acessar"}
          </button>
        </form>
        {/* Link "Registre-se" centralizado */}
        <div className="mt-4 text-sm text-primary">
          <a href="/cadastro" className="hover:underline">
            Registre-se
          </a>
        </div>
      </div>
    </div>
  );
}
