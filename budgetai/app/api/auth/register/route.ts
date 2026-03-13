import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
  name: z.string().min(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, name: data.name },
      select: { id: true, email: true, name: true },
    });
    const token = await createToken({ userId: user.id, email: user.email, name: user.name ?? undefined });
    const response = NextResponse.json({ user, success: true }, { status: 201 });
    response.cookies.set("auth-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
