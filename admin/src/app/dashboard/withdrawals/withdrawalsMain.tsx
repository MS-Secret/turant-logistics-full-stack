'use client'
import React, { useEffect, useState } from 'react'
import {
    DollarSign,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Banknote,
    Smartphone
} from 'lucide-react'
import WithdrawalsService from '@/services/withdrawals'
import { toast } from 'react-hot-toast'

interface UserInfo {
    fullName: string;
    phone: string;
    email: string;
}

interface DriverInfo {
    _id: string;
    userId: UserInfo;
}

interface BankDetails {
    accountNumber?: string;
    ifsc?: string;
    accountHolderName?: string;
}

interface UpiDetails {
    upiId?: string;
}

interface WithdrawalRequest {
    _id: string;
    driver: DriverInfo;
    amount: number;
    method: 'BANK' | 'UPI';
    bankDetails?: BankDetails;
    upiDetails?: UpiDetails;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';
    requestDate: string;
}

const WithdrawalsPage = () => {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // For reject modal
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');

    const fetchPendingWithdrawals = async () => {
        setLoading(true);
        try {
            const response = await WithdrawalsService.GetPendingWithdrawals();
            if (response?.data?.success) {
                setRequests(response.data.data || []);
            } else {
                toast.error("Failed to fetch withdrawals");
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast.error("Error fetching withdrawals");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPendingWithdrawals();
    }, [])

    const handleApprove = async (id: string) => {
        if (!window.confirm("Are you sure you want to approve this withdrawal? Funds will be transferred immediately via Cashfree.")) {
            return;
        }

        setProcessingId(id);
        try {
            const response = await WithdrawalsService.ApproveWithdrawal(id);
            if (response?.data?.success) {
                toast.success("Withdrawal approved successfully!");
                fetchPendingWithdrawals(); // Refresh list
            } else {
                toast.error(response?.data?.message || "Failed to approve");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setProcessingId(null);
        }
    }

    const openRejectModal = (id: string) => {
        setSelectedRequest(id);
        setAdminNote('');
        setIsRejectModalOpen(true);
    }

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!adminNote.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setProcessingId(selectedRequest);
        setIsRejectModalOpen(false);

        try {
            const response = await WithdrawalsService.RejectWithdrawal(selectedRequest, adminNote);
            if (response?.data?.success) {
                toast.success("Withdrawal rejected and amount refunded.");
                fetchPendingWithdrawals(); // Refresh list
            } else {
                toast.error(response?.data?.message || "Failed to reject");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setProcessingId(null);
            setSelectedRequest(null);
        }
    }

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pending Withdrawals</h1>
                    <p className="text-gray-600 mt-1">Review and approve driver withdrawal requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Pending Amount</p>
                            <p className="text-2xl font-bold text-blue-600">
                                ₹{requests.reduce((sum, req) => sum + req.amount, 0).toFixed(2)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Driver</th>
                                <th scope="col" className="px-6 py-3">Amount</th>
                                <th scope="col" className="px-6 py-3">Method</th>
                                <th scope="col" className="px-6 py-3">Details</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No pending withdrawal requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request._id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(request.requestDate).toLocaleDateString()}
                                            <div className="text-xs text-gray-400">
                                                {new Date(request.requestDate).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {request.driver?.userId?.fullName || 'Unknown Driver'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {request.driver?.userId?.phone || 'No Phone'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            ₹{request.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-1">
                                                {request.method === 'BANK' ? (
                                                    <Banknote className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <Smartphone className="w-4 h-4 text-gray-500" />
                                                )}
                                                <span className="font-medium text-gray-700">{request.method}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.method === 'BANK' ? (
                                                <div className="text-xs">
                                                    <p><span className="text-gray-400">A/C:</span> {request.bankDetails?.accountNumber}</p>
                                                    <p><span className="text-gray-400">IFSC:</span> {request.bankDetails?.ifsc}</p>
                                                    <p><span className="text-gray-400">Name:</span> {request.bankDetails?.accountHolderName}</p>
                                                </div>
                                            ) : (
                                                <div className="text-xs">
                                                    <p><span className="text-gray-400">UPI ID:</span> {request.upiDetails?.upiId}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {processingId === request._id ? (
                                                <div className="flex justify-end">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleApprove(request._id)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Approve</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(request._id)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Withdrawal</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Provide a reason for rejecting this withdrawal. The amount will be refunded to the driver's wallet.
                        </p>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            rows={3}
                            placeholder="e.g., Invalid bank details"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WithdrawalsPage
