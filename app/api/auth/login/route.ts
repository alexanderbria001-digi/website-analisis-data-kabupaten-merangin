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

const loginSchema = z.object({ idToken: z.string().min(1).max(10_000) });

function getFailureResponse(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const isAuthError = code.startsWith("auth/");

  return NextResponse.json(
    {
      message: isAuthError
        ? code === "auth/email-not-verified"
          ? "Verifikasi alamat email sebelum masuk."
          : "Sesi Firebase tidak valid. Silakan masuk kembali."
        : "Login belum dapat diproses. Periksa konfigurasi Firebase Auth dan Firestore.",
    },
    { status: isAuthError ? 401 : 503 },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Sesi Firebase tidak valid." }, { status: 400 });
  }

  try {
    const session = await createAuthenticatedSession(parsed.data.idToken);
    if (!isAuthenticatedMode() && session.user.role !== "admin") {
      return NextResponse.json({ message: "Login hanya tersedia untuk admin." }, { status: 403 });
    }

    const response = NextResponse.json({ user: session.user });
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
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
    console.error("[api/auth/login] Session creation failed", {
      name: details.name,
      code,
      message: details.message,
    });
    return getFailureResponse(error);
  }
}
