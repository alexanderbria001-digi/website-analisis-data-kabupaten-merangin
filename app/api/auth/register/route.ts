import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createAuthenticatedSession,
  isSameOriginRequest,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { isAuthenticatedMode } from "@/lib/access-mode";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  idToken: z.string().min(1).max(10_000),
});

export async function POST(request: NextRequest) {
  if (!isAuthenticatedMode()) {
    return NextResponse.json(
      { message: "Pendaftaran akun pengguna sedang dinonaktifkan." },
      { status: 403 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Nama atau sesi Firebase tidak valid." },
      { status: 400 },
    );
  }

  try {
    const session = await createAuthenticatedSession(
      parsed.data.idToken,
      parsed.data.name,
    );
    const response = NextResponse.json({ user: session.user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, session.sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const details = error instanceof Error ? error : new Error(String(error));
    const errorCode = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
    console.error("[api/auth/register] Session creation failed", {
      name: details.name,
      code: errorCode,
      message: details.message,
    });
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    const isAuthError = code.startsWith("auth/");

    return NextResponse.json(
      {
        message: isAuthError
          ? code === "auth/email-not-verified"
            ? "Verifikasi alamat email sebelum melanjutkan."
            : "Sesi Firebase tidak valid. Silakan daftar kembali."
          : "Pendaftaran belum dapat diproses. Periksa konfigurasi Firebase Auth dan Firestore.",
      },
      { status: isAuthError ? 401 : 503 },
    );
  }
}
