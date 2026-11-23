export type DashboardAccessMode = "public" | "authenticated";

export const dashboardAccessMode: DashboardAccessMode =
  process.env.NEXT_PUBLIC_DASHBOARD_ACCESS_MODE === "authenticated"
    ? "authenticated"
    : "public";

export const isAuthenticatedMode = () => dashboardAccessMode === "authenticated";
