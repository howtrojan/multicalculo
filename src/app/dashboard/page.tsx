import { getFilteredCotacoes } from "@/services/cotacaoService";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Força a página a ser sempre dinâmica
export const dynamic = "force-dynamic";

async function getUserId() {
  try {
    const sessionCookie = (await cookies()).get("session")?.value || "";
    if (!sessionCookie) return null;
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }

  // Extrair manualmente os search params da URL
  const headersList = headers();
  const url = (await headersList).get("x-url") || (await headersList).get("referer") || "";
  const parsedUrl = new URL(url || " "); 

  const status = parsedUrl.searchParams.get("status") || undefined;
  const dateStart = parsedUrl.searchParams.get("dateStart") || undefined;
  const dateEnd = parsedUrl.searchParams.get("dateEnd") || undefined;

  const cotacoes = await getFilteredCotacoes(userId, {
    status,
    dateStart,
    dateEnd,
  });

  return (
    <DashboardClient initialCotacoes={JSON.parse(JSON.stringify(cotacoes))} />
  );
}
