import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    const valid = await verifyPassword(password, user.password);
    if (!valid) return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    const token = await createToken({ userId: user.id, email: user.email, name: user.name ?? undefined });
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, success: true });
    response.cookies.set("auth-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
