import AnalyticsStat from "@/components/summary/AnalyticsStat";
import AdminDashboardDataLink from "@/components/admin/AdminDashboardDataLink";
import { getDashboardUser } from "@/lib/auth";

const SummaryPage = async () => {
    const user = await getDashboardUser();

    return(
        <>
            {user?.role === "admin" && <AdminDashboardDataLink />}
            <AnalyticsStat />
        </>
    );
};

export default SummaryPage;
