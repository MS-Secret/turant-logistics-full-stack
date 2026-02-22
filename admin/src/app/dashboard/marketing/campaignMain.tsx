"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Search, Filter, Speaker, Clock, CalendarDays, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import CampaignService from "@/services/campaign";

interface CampaignData {
    _id: string;
    title: string;
    message: string;
    targetAudience: string;
    scheduledTime: string;
    status: string;
    sentCount: number;
    imageUrl?: string;
}

const CampaignMain = () => {
    const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await CampaignService.GetAllCampaigns();
            if (response?.data?.data && Array.isArray(response.data.data)) {
                setCampaignData(response.data.data);
            } else {
                setCampaignData([]);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this campaign?")) {
            try {
                const response = await CampaignService.DeleteCampaign(id);
                if (response?.data?.success) {
                    toast.success("Campaign deleted successfully");
                    fetchCampaigns();
                } else {
                    toast.error("Failed to delete campaign");
                }
            } catch (error) {
                toast.error("Error deleting campaign");
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Completed</span>;
            case "SCHEDULED":
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Scheduled</span>;
            case "DRAFT":
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Draft</span>;
            case "FAILED":
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Failed</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Speaker className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Push Notifications</h1>
                        <p className="text-sm text-slate-500">Scheduled campaigns & marketing</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/marketing/create"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    Create Campaign
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mb-4"></div>
                        Loading Campaigns...
                    </div>
                ) : campaignData.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Speaker className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No campaigns yet</h3>
                        <p className="text-slate-500 max-w-sm mb-6">Create your first push notification campaign to engage users or partners.</p>
                        <Link
                            href="/dashboard/marketing/create"
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all"
                        >
                            Create First Campaign
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/80 text-slate-600 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Title / Message</th>
                                    <th className="px-6 py-4">Targeting</th>
                                    <th className="px-6 py-4">Scheduled For</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campaignData.map((campaign) => (
                                    <tr key={campaign._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {campaign.imageUrl ? (
                                                    <img src={campaign.imageUrl} alt="campaign" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                                                        <Speaker className="h-5 w-5 text-violet-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-900">{campaign.title}</p>
                                                    <p className="text-slate-500 max-w-[200px] truncate" title={campaign.message}>
                                                        {campaign.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                {campaign.targetAudience.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-slate-600">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {new Date(campaign.scheduledTime).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(campaign.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <BarChart2 className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium">{campaign.sentCount || 0}</span> reached
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(campaign.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleDelete(campaign._id, e)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignMain;
