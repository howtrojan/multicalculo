import { getFilteredCotacoes } from "@/services/cotacaoService";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { adminAuth } from "@/lib/firebase-admin"; // 1. O auth do admin SDK é o único que precisamos aqui.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Função para obter o ID do usuário logado no servidor
async function getUserId() {
  try {
    // 2. Corrigido: cookies() não é uma promise, não precisa de await.
    const sessionCookie = (await cookies()).get("session")?.value || "";
    
    // Se não houver cookie, não há usuário.
    if (!sessionCookie) {
      return null;
    }

    // 3. Corrigido: Usar 'adminAuth' para verificar o cookie, não 'auth'.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    // Se o cookie for inválido ou expirado, o catch tratará o erro.
    console.log("Não foi possível verificar o cookie de sessão.");
    return null;
  }
}

export default async function DashboardPage({ searchParams }: {
  searchParams: { status?: string; dateStart?: string; dateEnd?: string };
}) {
  const userId = await getUserId();

  // Se não houver usuário logado, redireciona para o login
  if (!userId) {
    redirect("/login");
  }

  // Chama o service para buscar os dados JÁ FILTRADOS
  const cotacoes = await getFilteredCotacoes(userId, searchParams);

  // Passa os dados pré-filtrados para o componente de cliente
  return <DashboardClient initialCotacoes={JSON.parse(JSON.stringify(cotacoes))} />;
}