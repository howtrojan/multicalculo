import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Filters {
  status?: string;
  dateStart?: string;
  dateEnd?: string;
}

/**
 * Busca cotações no Firestore com base em um userId e filtros.
 * Esta função roda no servidor.
 */
export async function getFilteredCotacoes(userId: string, filters: Filters) {
  const { status, dateStart, dateEnd } = filters;

  // Query base: busca cotações do usuário, ordenadas pela mais recente
  let q = query(
    collection(db, "cotacoes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  // Filtro de Status: adicionado apenas se não for "Todos"
  // ATENÇÃO: Para esta query funcionar bem, seu documento no Firestore
  // deve ter um campo de status de fácil acesso, como "mainStatus".
  if (status && status !== "Todos") {
    q = query(q, where("mainStatus", "==", status)); 
  }

  // Filtro de Data Inicial
  if (dateStart) {
    q = query(q, where("createdAt", ">=", Timestamp.fromDate(new Date(dateStart))));
  }

  // Filtro de Data Final
  if (dateEnd) {
    const endDateObj = new Date(dateEnd);
    endDateObj.setHours(23, 59, 59, 999); // Garante que a busca inclua o dia inteiro
    q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDateObj)));
  }

  const querySnapshot = await getDocs(q);

  const cotacoes = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return cotacoes;
}