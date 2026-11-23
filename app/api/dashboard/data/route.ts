import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { TENAGA_KERJA_HEADERS } from "@/types/tenagakerja";
import { isAuthenticatedMode } from "@/lib/access-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (isAuthenticatedMode() && !(await getCurrentUser())) {
    return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  }

  const [snapshot, laborSnapshot] = await Promise.all([
    firestore.collection("dashboardData").orderBy("Tahun").get(),
    firestore.collection("laborData").orderBy("Tahun").get(),
  ]);
  const demografiByYear = snapshot.docs.flatMap((document) => {
    const data = document.data();
    if (typeof data.Tahun !== "number" || !Array.isArray(data.demografi)) return [];
    return [{ Tahun: data.Tahun, demografi: data.demografi }];
  });
  const records = snapshot.docs.flatMap((document) => {
    const data = document.data();
    if (
      typeof data.Tahun !== "number" ||
      !data.pdrbLu ||
      !data.pdrbExp ||
      !data.socioeko
    ) {
      return [];
    }

    return [{
      Tahun: data.Tahun,
      pdrbLu: data.pdrbLu,
      pdrbExp: data.pdrbExp,
      socioeko: data.socioeko,
      ...(Array.isArray(data.demografi) ? { demografi: data.demografi } : {}),
    }];
  });

  const tenagakerja = laborSnapshot.docs.flatMap((document) => {
    const data = document.data();
    if (typeof data.Tahun !== "number") return [];
    return [Object.fromEntries(TENAGA_KERJA_HEADERS.map((header) => [header, data[header]]))];
  });

  const response = NextResponse.json({ records, demografiByYear, tenagakerja });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
