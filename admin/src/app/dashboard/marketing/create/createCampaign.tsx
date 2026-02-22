"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Image as ImageIcon, Sparkles, Clock, CalendarDays, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import CampaignService from "@/services/campaign";

const CreateCampaign = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        targetAudience: "ALL_USERS",
        scheduledTime: new Date().toISOString().slice(0, 16), // current time in YYYY-MM-DDThh:mm format
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            toast.error("Title and Message are required");
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();
            payload.append("title", formData.title);
            payload.append("message", formData.message);
            payload.append("targetAudience", formData.targetAudience);

            // Ensure time is converted to full ISO string
            const scheduledDate = new Date(formData.scheduledTime);
            payload.append("scheduledTime", scheduledDate.toISOString());

            if (imageFile) {
                payload.append("image", imageFile);
            }

            const response = await CampaignService.CreateCampaign(payload);

            if (response?.data?.success) {
                toast.success("Campaign scheduled successfully!");
                router.push("/dashboard/marketing");
            } else {
                toast.error(response?.data?.message || "Failed to create campaign");
            }
        } catch (error) {
            console.error("Campaign creation error:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <Link
                    href="/dashboard/marketing"
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        Create Campaign <Sparkles className="h-5 w-5 text-yellow-500" />
                    </h1>
                    <p className="text-sm text-slate-500">Design and schedule your push notification</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Form Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            Notification Content
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Campaign Title</label>
                            <input
                                type="text"
                                placeholder="E.g., Special Weekend Offer!"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Message Body</label>
                            <textarea
                                rows={4}
                                placeholder="Write your push notification message here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                                required
                            />
                            <p className="text-xs text-slate-400 text-right">{formData.message.length} characters</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Promotional Image (Optional)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                                {previewUrl ? (
                                    <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-slate-100">
                                        <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-md hover:bg-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="text-center">
                                            <label className="text-violet-600 font-medium cursor-pointer hover:text-violet-700">
                                                <span>Click to upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            Target & Schedule
                        </h3>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" /> Target Audience
                            </label>
                            <select
                                value={formData.targetAudience}
                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white"
                            >
                                <option value="ALL_USERS">All Customers</option>
                                <option value="ALL_DRIVERS">All Partner Drivers</option>
                                <option value="INACTIVE_USERS">Inactive Customers (30+ days)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-slate-400" /> Schedule Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                required
                            />
                            <p className="text-xs text-slate-500">Pick current time to send immediately.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-5 py-3.5 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Send className="h-5 w-5" /> Schedule Campaign
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCampaign;
