import Request from "@/config/apiConfig";

const GetPendingWithdrawals = async () =>
    Request({
        method: "GET",
        url: "wallet/admin/pending",
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
    GetPendingWithdrawals,
    ApproveWithdrawal,
    RejectWithdrawal,
};

export default WithdrawalsService;
