import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "ID token não fornecido." }, { status: 400 });
    }

    // Define a validade do cookie (ex: 5 dias)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias em milissegundos

    // Cria o cookie de sessão a partir do token do cliente
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Prepara a resposta de sucesso e anexa o cookie
    const response = NextResponse.json({ status: "success" });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true, // O cookie não pode ser acessado por JavaScript no navegador
      secure: process.env.NODE_ENV !== "development", // Usar 'secure' em produção (HTTPS)
      sameSite: "strict",
      maxAge: expiresIn / 1000, // Tempo em segundos
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Erro ao criar cookie de sessão:", error);
    return NextResponse.json({ error: "Autenticação no servidor falhou." }, { status: 401 });
  }
}