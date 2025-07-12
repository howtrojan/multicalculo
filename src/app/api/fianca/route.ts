import { NextRequest, NextResponse } from "next/server";

// --- Configurações e Constantes ---
const client_id = process.env.POTTENCIAL_CLIENT_ID || "44b0d67b-ed47-4761-a673-cff85db93fb9";
const client_secret = process.env.POTTENCIAL_CLIENT_SECRET || "a21bd748-4bdc-488f-a4a5-4873db76176b";

const TOKEN_COOKIE = "pottencial_access_token";
const EXPIRES_COOKIE = "pottencial_token_exp";

// --- Funções de Chamada para cada Seguradora ---

/**
 * Chama a API da Pottencial para obter uma cotação.
 */
async function callPottencialAPI(body: any, accessToken: string) {
  const url = "https://api-sandbox.pottencial.com.br/insurance/v1/fianca-locaticia/quotes";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "client_id": client_id, "access_token": accessToken },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro desconhecido da Pottencial" }));
    throw new Error(errorData.message || "Recusado pela política da Pottencial.");
  }
  
  const responseData = await response.json().catch(() => ({}));
  const aluguel = body.riskObjects?.[0]?.expenses?.find((e: any) => e.description === "VALOR_ALUGUEL")?.value || 0;
  const basePremium = Number(aluguel) * 0.08;

  return {
    insurerName: "Pottencial",
    insurerLogo: "/assets/pottencial.jpg",
    quoteId: responseData.quoteId || `POT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    status: responseData.status || "Em análise",
    totalPremium: (basePremium * 1.05).toFixed(2),
    message: "Cotação aceita para análise."
  };
}

/**
 * Simula a chamada para a API da Porto Seguro.
 */
async function callPortoAPI(body: any) {
  // TODO: No futuro, substitua esta simulação pela chamada real à API da Porto Seguro.
  // Exemplo: const response = await fetch("https://api.portoseguro.com.br/...", ...);
  // Se a chamada falhar, lance um erro com a mensagem: throw new Error("Mensagem de erro da Porto");
  
  // Simulando uma recusa por enquanto:
  return Promise.reject(new Error("Não aceito pela política da seguradora."));
}

/**
 * Simula a chamada para a API da Tokio Marine.
 */
async function callTokioAPI(body: any) {
  // TODO: No futuro, substitua esta simulação pela chamada real à API da Tokio Marine.
  // Exemplo: const response = await fetch("https://api.tokiomarine.com.br/...", ...);
  // Se a chamada falhar, lance um erro: throw new Error("Mensagem de erro da Tokio");

  // Simulando uma recusa por enquanto:
  return Promise.reject(new Error("Perfil de risco não enquadrado."));
}

// --- Rota Principal POST ---
export async function POST(req: NextRequest) {
  // Lógica de gerenciamento de token (sem alterações)
  let access_token: string | undefined;
  let new_token_data: { token: string; expires_in: number } | null = null;
  const now = Math.floor(Date.now() / 1000);
  try {
    const tokenCookie = req.cookies.get(TOKEN_COOKIE)?.value;
    const expiresCookie = req.cookies.get(EXPIRES_COOKIE)?.value;
    if (tokenCookie && expiresCookie && Number(expiresCookie) > now + 60) {
      access_token = tokenCookie;
    } else {
      new_token_data = await getNewAccessToken();
      access_token = new_token_data.token;
    }
  } catch (authError) {
    console.error(authError);
    return NextResponse.json({ error: "Falha na autenticação com a seguradora." }, { status: 500 });
  }

  try {
    const body = await req.json();

    // Array de promessas para executar em paralelo
    const quotePromises = [
      callPottencialAPI(body, access_token!),
      callPortoAPI(body),
      callTokioAPI(body),
    ];

    const promiseResults = await Promise.allSettled(quotePromises);

    // Mapeia os resultados para o formato final
    const finalResults = promiseResults.map((result, index) => {
      const insurerMap = [
        { name: "Pottencial", logo: "/assets/pottencial.jpg" },
        { name: "Porto Seguro", logo: "/assets/porto.jpg" },
        { name: "Tokio Marine", logo: "/assets/tokio.png" },
      ];
      const insurerInfo = insurerMap[index];

      if (result.status === 'fulfilled') {
        // A promessa foi resolvida com sucesso
        return result.value;
      } else {
        // A promessa foi rejeitada (falhou)
        return {
          insurerName: insurerInfo.name,
          insurerLogo: insurerInfo.logo,
          status: "Recusado",
          quoteId: null,
          totalPremium: null,
          message: result.reason.message || "Não foi possível cotar.",
        };
      }
    });

    // Cria a resposta final e anexa os cookies se necessário
    const finalResponse = NextResponse.json(finalResults);
    if (new_token_data) {
      const exp = now + new_token_data.expires_in;
      finalResponse.cookies.set(TOKEN_COOKIE, new_token_data.token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/', maxAge: new_token_data.expires_in });
      finalResponse.cookies.set(EXPIRES_COOKIE, String(exp), { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/', maxAge: new_token_data.expires_in });
    }

    return finalResponse;

  } catch (error) {
    console.error("Erro interno na API:", error);
    return NextResponse.json({ error: "Erro interno ao processar a cotação." }, { status: 500 });
  }
}

// Função para buscar token (sem alterações)
async function getNewAccessToken() {
    const credentials = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
    const url = "https://api-sandbox.pottencial.com.br/oauth/v3/access-token";
  
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Basic ${credentials}` },
      cache: 'no-store'
    });
  
    if (!response.ok) {
      console.error("Pottencial Auth Error:", await response.text());
      throw new Error("Erro ao obter access_token da Pottencial");
    }
  
    const data = await response.json();
    return {
      token: data.access_token,
      expires_in: data.expires_in || 3600
    };
  }