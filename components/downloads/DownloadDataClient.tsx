"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ChartNoAxesColumn,
  ChartPie,
  CheckCircle2,
  Database,
  FileJson2,
  FileSpreadsheet,
  FileText,
  MapPinned,
  ShieldCheck,
  Upload,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOWNLOAD_DATASETS, DOWNLOAD_FILE_CATEGORIES } from "@/lib/download-catalog";
import type { DownloadDatasetSummary, UploadedDownloadFile } from "@/types/downloads";

type UserRole = "admin" | "user";

const datasetIcons = {
  chart: ChartNoAxesColumn,
  pie: ChartPie,
  users: UsersRound,
  map: MapPinned,
};

const maxFileSize = 5 * 1024 * 1024;

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function formatDate(value: string) {
  if (!value) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function DashboardDatasetCard({ summary }: { summary: DownloadDatasetSummary }) {
  const [selectedYear, setSelectedYear] = useState("all");
  const dataset = DOWNLOAD_DATASETS.find(({ id }) => id === summary.id);
  if (!dataset) return null;

  const Icon = datasetIcons[dataset.icon];
  const isLaborDataset = summary.id === "ketenagakerjaan";
  const baseHref = `/api/downloads/datasets/${dataset.id}`;
  const yearQuery = selectedYear === "all" ? "" : `&year=${selectedYear}`;
  const years = [...summary.years].sort((left, right) => right - left);

  return (
    <article className={`group flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${isLaborDataset ? "border-orange-200 bg-gradient-to-br from-orange-50/70 via-card to-card hover:border-orange-300 dark:border-orange-900/70 dark:from-orange-950/25 dark:hover:border-orange-800" : "border-slate-200 bg-card hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-700"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${isLaborDataset ? "bg-orange-100/80 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200" : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"}`}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isLaborDataset ? "border-orange-200 bg-orange-100/70 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
          {dataset.category}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{dataset.title}</h3>
        <p className="mt-1.5 min-h-12 text-sm leading-6 text-muted-foreground">{dataset.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">
          Tahun {summary.yearRange}
        </span>
        <span className="rounded-md bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">
          {summary.rowCount.toLocaleString("id-ID")} baris
        </span>
      </div>

      <div className="mt-4 grid gap-1.5">
        <label htmlFor={`download-year-${dataset.id}`} className="text-xs font-medium text-foreground">
          Tahun data
        </label>
        <select
          id={`download-year-${dataset.id}`}
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
          className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Semua tahun</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
        <Button asChild variant="outline" className="min-w-0 justify-between px-3">
          <a href={`${baseHref}?format=csv${yearQuery}`} download>
            <span className="flex min-w-0 items-center gap-2">
              <FileSpreadsheet aria-hidden="true" className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              CSV
            </span>
            <ArrowDownToLine aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </Button>
        <Button asChild variant="outline" className="min-w-0 justify-between px-3">
          <a href={`${baseHref}?format=json${yearQuery}`} download>
            <span className="flex min-w-0 items-center gap-2">
              <FileJson2 aria-hidden="true" className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              JSON
            </span>
            <ArrowDownToLine aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </Button>
        <Button asChild variant="outline" className="col-span-2 min-w-0 justify-between px-3 xl:col-span-1">
          <a
            href={`${baseHref}?format=metadata${yearQuery}`}
            download
            aria-label={`Download Metadata CSV ${dataset.title}, ${selectedYear === "all" ? "semua tahun" : `tahun ${selectedYear}`}`}
            title="Metadata berisi deskripsi kolom dan rincian file CSV"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-sky-700 dark:text-sky-300" />
              <span className="truncate">Download Metadata</span>
            </span>
            <ArrowDownToLine aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function DownloadFileUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih berkas yang ingin ditambahkan.");
      return;
    }
    if (file.size > maxFileSize) {
      setError("Ukuran berkas maksimal 5 MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/downloads/files", {
        method: "POST",
        body: new FormData(form),
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message ?? "Berkas belum dapat ditambahkan.");
      }

      const title = String(new FormData(form).get("title") ?? "Berkas");
      form.reset();
      setSuccess(`“${title}” berhasil ditambahkan ke daftar unduhan.`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Berkas belum dapat ditambahkan.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={uploadFile} className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/25 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-300">
          <Upload aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">Tambahkan berkas unduhan</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Berkas akan tersedia untuk semua pengguna dan tidak mengubah data aktif pada grafik dashboard.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="download-title" className="text-sm font-medium">Judul data</label>
          <input
            id="download-title"
            name="title"
            required
            minLength={3}
            maxLength={100}
            placeholder="Contoh: Tabel PDRB Kabupaten Merangin 2025"
            className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="download-category" className="text-sm font-medium">Kategori</label>
          <select
            id="download-category"
            name="category"
            required
            defaultValue="Ekonomi"
            className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DOWNLOAD_FILE_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="download-description" className="text-sm font-medium">Deskripsi <span className="font-normal text-muted-foreground">(opsional)</span></label>
          <input
            id="download-description"
            name="description"
            maxLength={500}
            placeholder="Cakupan data, tahun, atau sumber"
            className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="download-file" className="text-sm font-medium">Berkas XLSX, JSON, atau CSV</label>
          <input
            ref={inputRef}
            id="download-file"
            name="file"
            type="file"
            required
            accept=".xlsx,.json,.csv,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-describedby="download-file-help"
            className="block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-sky-100 file:px-3 file:py-1 file:font-medium file:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:file:bg-sky-950 dark:file:text-sky-100"
          />
          <p id="download-file-help" className="text-xs text-muted-foreground">Maksimal 5 MB per berkas.</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      {success && <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{success}</p>}

      <Button type="submit" disabled={isUploading} className="mt-4 w-full sm:w-auto">
        <Upload aria-hidden="true" />
        {isUploading ? "Mengunggah berkas…" : "Unggah ke daftar unduhan"}
      </Button>
    </form>
  );
}

function UploadedFileCard({ file }: { file: UploadedDownloadFile }) {
  const isSpreadsheet = file.fileName.toLocaleLowerCase("id-ID").endsWith(".xlsx");
  const isJson = file.fileName.toLocaleLowerCase("id-ID").endsWith(".json");
  const Icon = isSpreadsheet ? FileSpreadsheet : isJson ? FileJson2 : FileText;

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold">{file.title}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{file.category}</span>
          </div>
          {file.description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{file.description}</p>}
          <p className="mt-1.5 break-all text-xs text-muted-foreground">
            {file.fileName} <span aria-hidden="true">·</span> {formatFileSize(file.size)} <span aria-hidden="true">·</span> {formatDate(file.createdAt)}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
        <a href={`/api/downloads/files/${encodeURIComponent(file.id)}`} download>
          <ArrowDownToLine aria-hidden="true" />
          Unduh berkas
        </a>
      </Button>
    </article>
  );
}

export default function DownloadDataClient({
  role,
  datasets,
  files,
}: {
  role: UserRole | null;
  datasets: DownloadDatasetSummary[];
  files: UploadedDownloadFile[];
}) {
  const isAdmin = role === "admin";

  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="relative isolate overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/50 sm:p-7">
        <div aria-hidden="true" className="absolute -right-10 -top-16 -z-10 size-56 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/20" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-wide text-sky-700 dark:text-sky-300">Pusat data DADAM</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Download Data</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Pilih tahun referensi, lalu unduh data CSV atau JSON. Metadata CSV menjelaskan arti dan satuan setiap kolom.
              {isAdmin ? " Anda juga dapat menambahkan berkas unduhan untuk semua pengguna." : " Berkas tambahan disediakan oleh administrator."}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isAdmin ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200" : "border-sky-200 bg-white/80 text-sky-800 dark:border-sky-800 dark:bg-slate-900/70 dark:text-sky-200"}`}>
            {isAdmin ? <ShieldCheck aria-hidden="true" className="size-4" /> : <Database aria-hidden="true" className="size-4" />}
            {isAdmin ? "Mode admin" : role === "user" ? "Akses pengguna" : "Akses publik"}
          </span>
        </div>
      </header>

      <section aria-label="Ringkasan ketersediaan unduhan" className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"><Database aria-hidden="true" className="size-4" /></span>
          <div><p className="text-xs text-muted-foreground">Dataset dashboard</p><p className="text-sm font-semibold">{datasets.length} dataset</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><FileText aria-hidden="true" className="size-4" /></span>
          <div><p className="text-xs text-muted-foreground">Berkas tambahan</p><p className="text-sm font-semibold">{files.length} berkas tersedia</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"><ArrowDownToLine aria-hidden="true" className="size-4" /></span>
          <div><p className="text-xs text-muted-foreground">Format data</p><p className="text-sm font-semibold">CSV · JSON · XLSX</p></div>
        </div>
      </section>

      <section aria-labelledby="dashboard-datasets-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Data terstruktur</p>
            <h2 id="dashboard-datasets-heading" className="mt-0.5 text-xl font-semibold tracking-tight">Dataset dashboard</h2>
          </div>
          <p className="text-xs text-muted-foreground">CSV untuk spreadsheet · JSON untuk aplikasi · Metadata untuk deskripsi kolom CSV</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((summary) => <DashboardDatasetCard key={summary.id} summary={summary} />)}
        </div>
      </section>

      <section aria-labelledby="additional-downloads-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Koleksi berkas</p>
            <h2 id="additional-downloads-heading" className="mt-0.5 text-xl font-semibold tracking-tight">Berkas tambahan</h2>
          </div>
          <p className="text-xs text-muted-foreground">Dikelola oleh administrator DADAM</p>
        </div>

        {isAdmin ? (
          <DownloadFileUploadForm />
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" />
            <p>Berkas tambahan dapat diunduh oleh semua pengguna. Pengelolaan dan penambahan berkas dilakukan oleh administrator.</p>
          </div>
        )}

        {files.length > 0 ? (
          <div className="grid gap-3">
            {files.map((file) => <UploadedFileCard key={file.id} file={file} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-card px-5 py-8 text-center dark:border-slate-700">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><FileText aria-hidden="true" className="size-5" /></span>
            <h3 className="mt-3 font-semibold">Belum ada berkas tambahan</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-muted-foreground">
              {isAdmin ? "Tambahkan file referensi atau publikasi melalui formulir di atas agar dapat diunduh semua pengguna." : "Berkas referensi atau publikasi tambahan akan muncul di sini setelah ditambahkan admin."}
            </p>
          </div>
        )}
      </section>

      <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
        Dataset dashboard selalu menggabungkan data dasar project dan pembaruan yang tersimpan. Berkas tambahan disajikan dalam bentuk file asli yang diunggah admin.
      </p>
    </div>
  );
}
