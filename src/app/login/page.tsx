"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../../../public/assets/logo.svg";
import Image from 'next/image';
import { toast } from "react-toastify";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Autentica no Firebase (cliente)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Pega o token de ID do usuário autenticado
    const idToken = await userCredential.user.getIdToken();
    
    // 3. Envia o token para a API criar o cookie de sessão no servidor
    await axios.post('/api/auth/login', { idToken });

    // 4. Mostra o toast de sucesso
    toast.success("Login realizado com sucesso!", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });

    // 5. Redireciona para o dashboard
    router.push("/dashboard");

  } catch (err: any) {
    // Em caso de erro em qualquer etapa, mostra o toast de erro
    toast.error("E-mail ou senha inválidos. Tente novamente.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
    console.error("Falha no processo de login:", err);

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-primary relative flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg flex flex-col items-center gap-y-6">
        <Image
          src={Logo}
          alt="Logo SterSi Corretora de Seguros"
          width={210}
          height={210}
          className=""
        />
        <h1 className="text-4xl font-bold text-primary text-center">
          MULTICÁLCULO
        </h1>
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
          <div className="flex justify-between items-center text-sm mt-1 w-full">
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
          <button
            type="submit"
            className="pointer bg-primary hover:bg-secondary text-white font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60 w-full"
            disabled={loading}
          >
            {loading ? "Acessando..." : "Acessar"}
          </button>
        </form>
        <div className="text-sm text-primary">
          <a href="/cadastro" className="hover:underline">
            Registre-se
          </a>
        </div>
      </div>
    </div>
  );
}
