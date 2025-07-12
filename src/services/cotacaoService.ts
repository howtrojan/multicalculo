import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Filters {
  status?: string;
  dateStart?: string;
  dateEnd?: string;
}

// Função auxiliar para criar datas com fuso horário ajustado para UTC-3 (horário de Brasília)
function parseDateWithTimezone(dateStr: string, endOfDay = false): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Data inválida: ${dateStr}`);
  }

  // Ajusta hora local manualmente para garantir que o Firestore interprete corretamente
  // UTC-3 = +3 horas de diferença
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

/**
 * Busca cotações no Firestore com base em um userId e filtros.
 * Esta função roda no servidor.
 */
export async function getFilteredCotacoes(userId: string, filters: Filters) {
  const { status, dateStart, dateEnd } = filters;

  let q = query(
    collection(db, "cotacoes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  if (status && status !== "Todos") {
    q = query(q, where("mainStatus", "==", status));
  }

  if (dateStart) {
    try {
      const startDate = parseDateWithTimezone(dateStart);
      q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
    } catch (err) {
      console.warn("Data inicial inválida:");
    }
  }

  if (dateEnd) {
    try {
      const endDate = parseDateWithTimezone(dateEnd, true);
      q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
    } catch (err) {
      console.warn("Data final inválida:");
    }
  }

  const querySnapshot = await getDocs(q);

  const cotacoes = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return cotacoes;
}
