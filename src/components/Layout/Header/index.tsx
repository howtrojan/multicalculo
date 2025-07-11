// src/components/Layout/DashboardLayout.tsx
"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../../../../public/assets/logo.svg"; // Ajuste o caminho conforme necessário
import { FaSearch, FaUserCircle } from "react-icons/fa"; // Ícone de usuário para o avatar
import { signOut } from "firebase/auth"; // Importe o signOut
import { auth } from "@/lib/firebase"; // Importe sua instância de auth
import Link from "next/link";

interface DashboardLayoutProps {
  children: ReactNode;
  pathname: string; // Isso está correto e foi adicionado anteriormente
}

export default function Header({ children, pathname }: DashboardLayoutProps) { // Recebe o pathname aqui
  const router = useRouter();
  const [search, setSearch] = useState(""); // Estado para a busca no header
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Estado para o dropdown do avatar
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref para detectar cliques fora do dropdown

  // Função para fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Fecha o dropdown antes de sair
    await signOut(auth);
    router.push("/login");
  };

  // VAI ADICIONAR ESTA LINHA DE VOLTA
  const isDashboardPage = pathname === '/dashboard'; // Ou o caminho exato da sua página Dashboard

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Fixo - Topo da Página */}
      <header className="bg-white shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center"> {/* Adicionei flex items-center para manter o alinhamento se houver texto/outros itens no Link */}
            <Image
              src={Logo}
              alt="Logo SterSi Corretora de Seguros"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>
          {/* Campo de Busca no Header - CONDICIONALMENTE RENDERIZADO */}
          {isDashboardPage && ( // <-- Adicione a condição aqui
            <div className="relative flex items-center w-64">
              <input
                type="text"
                placeholder="BUSCAR"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FaSearch className="absolute left-3 text-gray-400" />
            </div>
          )} {/* <-- Feche a condição aqui */}
        </div>

        {/* Botões do lado direito: Novo Cálculo e Avatar com Dropdown */}
        <div className="flex items-center gap-4">
          {/* Botão Novo Cálculo - CONDICIONALMENTE RENDERIZADO */}
          {isDashboardPage && ( // <-- Adicione a condição aqui
            <button
              onClick={() => router.push("/formulario")}
              className="bg-primary hover:bg-secondary text-white font-semibold rounded-md px-6 py-2 text-sm transition-colors flex items-center gap-2"
            >
              <span className="material-icons text-xl">add_circle_outline</span>
              NOVO CÁLCULO
            </button>
          )} {/* <-- Feche a condição aqui */}

          {/* Avatar com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="Opções do usuário"
            >
              <FaUserCircle className="text-2xl" /> {/* Ícone de usuário */}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo da Página */}
      {children}
    </div>
  );
}