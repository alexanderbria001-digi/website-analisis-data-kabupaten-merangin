import DownloadDataClient from "@/components/downloads/DownloadDataClient";
import { getDashboardDatasetSummaries, getUploadedDownloadFiles } from "@/lib/download-data";
import { getDashboardUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DownloadDataPage() {
  const user = await getDashboardUser();
  const [datasets, files] = await Promise.all([
    getDashboardDatasetSummaries(),
    getUploadedDownloadFiles(),
  ]);

  return <DownloadDataClient role={user?.role ?? null} datasets={datasets} files={files} />;
}
