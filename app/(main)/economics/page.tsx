import AnalyticsStat from "@/components/economics/AnalyticsStatEco";
import AdminDashboardDataLink from "@/components/admin/AdminDashboardDataLink";
import { getDashboardUser } from "@/lib/auth";

const EconomicsPage = async () => {
    const user = await getDashboardUser();

    return(
        <>
            {user?.role === "admin" && <AdminDashboardDataLink />}
            <AnalyticsStat />
        </>
    );
};

export default EconomicsPage;
