import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: "success" });
  // Seta um cookie com o mesmo nome, mas com valor vazio e data de expiração no passado
  response.cookies.set("session", "", { expires: new Date(0), path: "/" });
  return response;
}