import Request from "@/config/apiConfig";

const GetWithdrawals = async (status?: string) =>
    Request({
        method: "GET",
        url: "wallet/admin/requests",
        params: status ? { status } : {},
        secure: true,
    });

const ApproveWithdrawal = async (requestId: string) =>
    Request({
        method: "POST",
        url: "wallet/admin/approve",
        secure: true,
        data: { requestId },
    });

const RejectWithdrawal = async (requestId: string, adminNote: string) =>
    Request({
        method: "POST",
        url: "wallet/admin/reject",
        secure: true,
        data: { requestId, adminNote },
    });

const WithdrawalsService = {
    GetWithdrawals,
    ApproveWithdrawal,
    RejectWithdrawal,
};

export default WithdrawalsService;
