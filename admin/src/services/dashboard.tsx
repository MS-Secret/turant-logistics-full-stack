import Request from "@/config/apiConfig";

const GetDashboardStats = async () => Request({
    url: 'admin/dashboard/stats',
    method: 'GET',
    secure: true
})

const DashboardServices = {
    GetDashboardStats
}

export default DashboardServices;
