import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DOWNLOAD_COLUMN_METADATA, DOWNLOAD_DATASETS } from "@/lib/download-catalog";
import { getDashboardDatasetRows } from "@/lib/download-data";
import type { DownloadDatasetId } from "@/types/downloads";
import { isAuthenticatedMode } from "@/lib/access-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function createCsv(rows: object[]) {
  const headers = Object.keys(rows[0] ?? {});
  return `\uFEFF${[headers, ...rows.map((row) => headers.map((header) => (row as Record<string, unknown>)[header]))]
    .map((values) => values.map(escapeCsv).join(","))
    .join("\r\n")}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  if (isAuthenticatedMode() && !(await getCurrentUser())) {
    return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  }

  const { dataset } = await params;
  const definition = DOWNLOAD_DATASETS.find((item) => item.id === dataset);
  if (!definition) {
    return NextResponse.json({ message: "Dataset tidak ditemukan." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  if (format !== "csv" && format !== "json" && format !== "metadata") {
    return NextResponse.json({ message: "Format unduhan harus CSV, JSON, atau metadata." }, { status: 400 });
  }

  const rows = await getDashboardDatasetRows(dataset as DownloadDatasetId);
  const yearParam = url.searchParams.get("year");
  let selectedYear: number | null = null;
  if (yearParam && yearParam !== "all") {
    if (!/^\d{4}$/.test(yearParam)) {
      return NextResponse.json({ message: "Tahun unduhan tidak valid." }, { status: 400 });
    }
    selectedYear = Number(yearParam);
    if (!rows.some((row) => row.Tahun === selectedYear)) {
      return NextResponse.json({ message: "Data untuk tahun tersebut tidak tersedia." }, { status: 400 });
    }
  }

  const filteredRows = selectedYear === null ? rows : rows.filter((row) => row.Tahun === selectedYear);
  const csv = createCsv(filteredRows);
  const suffix = selectedYear === null ? "" : `-${selectedYear}`;
  const csvFileName = `dadam-${definition.id}${suffix}.csv`;
  const fileName = format === "metadata"
    ? `dadam-${definition.id}${suffix}.metadata.json`
    : `dadam-${definition.id}${suffix}.${format}`;

  let body: string;
  if (format === "csv") {
    body = csv;
  } else if (format === "json") {
    body = JSON.stringify(filteredRows, null, 2);
  } else {
    const columns = Object.keys(filteredRows[0] ?? {}).map((key) => ({
      key,
      ...(DOWNLOAD_COLUMN_METADATA[definition.id][key] ?? {
        label: key,
        description: "Keterangan kolom belum tersedia.",
        unit: "Mengikuti sumber data",
      }),
    }));
    body = JSON.stringify({
      dataset: {
        id: definition.id,
        name: definition.title,
        description: definition.description,
        category: definition.category,
      },
      csv: {
        fileName: csvFileName,
        year: selectedYear ?? "Semua tahun",
        rowCount: filteredRows.length,
        columnCount: columns.length,
        sizeBytes: new TextEncoder().encode(csv).byteLength,
        generatedAt: new Date().toISOString(),
        encoding: "UTF-8 dengan BOM",
        delimiter: "koma (,)",
        lineEnding: "CRLF",
        decimalSeparator: "titik (.)",
        textQualifier: "tanda kutip ganda; tanda kutip di dalam teks digandakan",
        emptyValues: "Nilai kosong direpresentasikan sebagai sel kosong.",
      },
      source: "Data dasar dashboard DADAM digabungkan dengan pembaruan yang tersimpan di Firestore, jika tersedia.",
      columns,
    }, null, 2);
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
