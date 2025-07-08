import { NextRequest, NextResponse } from "next/server";

const client_id = "44b0d67b-ed47-4761-a673-cff85db93fb9";
const client_secret = "a21bd748-4bdc-488f-a4a5-4873db76176b";
const TOKEN_COOKIE = "pottencial_access_token";
const EXPIRES_COOKIE = "pottencial_token_exp";

async function getAccessTokenFromApi() {
  const credentials = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
  const url = "https://api-sandbox.pottencial.com.br/oauth/v3/access-token";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`
    }
  });

  if (!response.ok) {
    throw new Error("Erro ao obter access_token da Pottencial");
  }

  const data = await response.json();
  return {
    token: data.access_token,
    expires_in: data.expires_in || 3600 // segundos
  };
}

async function getAccessToken(req: NextRequest, res: NextResponse) {
  const cookies = req.cookies;
  const token = cookies.get(TOKEN_COOKIE)?.value;
  const expires = cookies.get(EXPIRES_COOKIE)?.value;
  const now = Math.floor(Date.now() / 1000);

  if (token && expires && Number(expires) > now + 60) {
    // Token válido (com 1 min de margem)
    return token;
  }

  // Buscar novo token
  const { token: newToken, expires_in } = await getAccessTokenFromApi();
  const exp = now + expires_in;
  // Setar cookies protegidos
  res.cookies.set(TOKEN_COOKIE, newToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: expires_in
  });
  res.cookies.set(EXPIRES_COOKIE, String(exp), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: expires_in
  });
  return newToken;
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const body = await req.json();
    const access_token = await getAccessToken(req, res);

    // Endpoint da API de cotação da Pottencial
    const url = "https://api-sandbox.pottencial.com.br/insurance/v1/fianca-locaticia/quotes";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "client_id": client_id,
        "access_token": access_token,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log("Status da resposta:", response.status);
    console.log("Corpo da resposta:", text);

    // Se status 201 ou 200, retorna dados fictícios
    if ((response.status === 201 || response.status === 200)) {
      let data;
      try {
        data = text ? JSON.parse(text) : null;
        return NextResponse.json(data);
      } catch {
        // Se não for JSON válido, retorna dados fictícios
        return NextResponse.json({
          quoteId: "FICTICIO-123456",
          status: "Em análise",
          totalPremium: 1234.56,
          message: "Cotação criada com sucesso! (dados fictícios)",
          createdAt: new Date().toISOString(),
          plan: body.riskObjects?.[0]?.planKey || "Basic",
          tenantName: body.participants?.[0]?.contact?.name || "João da Silva",
          propertyAddress: body.riskObjects?.[0]?.riskLocation?.address?.street || "Rua Exemplo, 123",
        });
      }
    }

    // Se não for sucesso, retorna erro real
    return NextResponse.json({ error: text }, { status: response.status });
  } catch (error: unknown) {
    console.error("Erro na API /api/fianca:", error);
    return NextResponse.json({ error: error || "Erro interno ao processar a cotação." }, { status: 500 });
  }
}
