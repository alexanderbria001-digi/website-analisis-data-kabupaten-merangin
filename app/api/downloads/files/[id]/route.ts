import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { isAuthenticatedMode } from "@/lib/access-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeContentDisposition(fileName: string) {
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (isAuthenticatedMode() && !(await getCurrentUser())) {
    return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10,128}$/.test(id)) {
    return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  }

  const fileRef = firestore.collection("downloadFiles").doc(id);
  const fileSnapshot = await fileRef.get();
  if (!fileSnapshot.exists) {
    return NextResponse.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  }

  const metadata = fileSnapshot.data();
  if (
    typeof metadata?.fileName !== "string" || typeof metadata.contentType !== "string" ||
    typeof metadata.size !== "number" || metadata.size < 1 || metadata.size > 5 * 1024 * 1024
  ) {
    return NextResponse.json({ message: "Metadata berkas tidak valid." }, { status: 500 });
  }

  const chunkSnapshot = await fileRef.collection("chunks").orderBy("index", "asc").get();
  const chunks = chunkSnapshot.docs.map((document) => document.data().content);
  if (chunks.length === 0 || chunks.some((chunk) => typeof chunk !== "string")) {
    return NextResponse.json({ message: "Isi berkas tidak tersedia." }, { status: 500 });
  }

  const content = Buffer.concat(chunks.map((chunk: string) => Buffer.from(chunk, "base64")));
  if (content.byteLength !== metadata.size) {
    return NextResponse.json({ message: "Berkas tidak dapat dibaca secara utuh." }, { status: 500 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": metadata.contentType,
      "Content-Disposition": safeContentDisposition(metadata.fileName),
      "Content-Length": String(content.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
