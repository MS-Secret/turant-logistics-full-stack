"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import ConsumersService from "@/services/consumers";
import { useRouter } from "next/navigation";

interface Consumer {
  _id: string;
  userId: string;
  consumerId: string;
  isActive: boolean;
  registrationSource: string;
  isDeleted: boolean;
  version: number;
  addresses: any[];
  emergencyContacts: any[];
  createdAt: string;
  updatedAt: string;
  orderHistory: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
  };
  preferences: {
    notifications: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
    };
    preferredLanguage: string;
    preferredCurrency: string;
    paymentMethod: string;
  };
  loyaltyPoints: {
    current: number;
    lifetime: number;
    tier: string;
  };
  ratings: {
    averageRating: number;
    totalRatings: number;
  };
  user: {
    _id: string;
    userId: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    isDeleted: boolean;
    version: number;
    permissions: any[];
    createdAt: string;
    updatedAt: string;
    fullName: string;
    id: string;
    profile: {
      address: {
        country: string;
      };
    };
    preferences: {
      notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
      };
      language: string;
      currency: string;
    };
    metadata: {
      loginCount: number;
      deviceInfo: any[];
      lastLoginAt: string;
    };
  };
}

const ConsumersMain = () => {
  const router = useRouter();
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "VIP":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Blocked":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleGetConsumers = async () => {
    try {
      setLoading(true);
      const response = await ConsumersService.GetConsumerList({ page, limit, search: debouncedSearch });
      setConsumers(response.data.data.consumers);
      setTotal(response.data.data.totalConsumers);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch consumers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetConsumers();
  }, [page, limit, debouncedSearch]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Consumers Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your customer base and their order history
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Consumer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Consumers</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {consumers.filter((c) => c.isActive).length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gold Tier</p>
              <p className="text-2xl font-bold text-purple-600">
                {
                  consumers.filter((c) => c?.loyaltyPoints?.tier === "GOLD")
                    .length
                }
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600">
                {consumers.filter((c) => c?.user?.phoneVerified).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search consumers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Status</option>
              <option>Active</option>
              <option>VIP</option>
              <option>Inactive</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consumers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consumers.map((consumer) => (
          <div
            onClick={() => router.push(`/dashboard/consumers/${consumer?._id}`)}
            key={consumer._id}
            className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {consumer.user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {consumer.user?.username || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-500">{consumer.consumerId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    router.push(`/dashboard/consumers/${consumer?._id}`)
                  }
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                {consumer.user?.phone || "N/A"}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                {consumer.user?.email || "N/A"}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                {consumer.user?.profile?.address?.country || "Location N/A"}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                  consumer.isActive
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {consumer.isActive ? "Active" : "Inactive"}
              </span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm font-medium text-gray-900">
                  {consumer.ratings?.averageRating || 0}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({consumer.ratings?.totalRatings || 0})
                </span>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center mb-1">
                  <Package className="w-4 h-4 text-blue-500 mr-1" />
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {consumer.orderHistory.totalOrders}
                </div>
                <div className="text-xs text-gray-500">Total Orders</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-semibold text-gray-900">
                  ₹{consumer.orderHistory.totalSpent}
                </div>
                <div className="text-xs text-gray-500">Total Spent</div>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Loyalty Points</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {consumer.loyaltyPoints?.current || 0} pts
                </div>
                <div className="text-xs text-gray-500">
                  {consumer.loyaltyPoints?.tier || "Standard"} tier
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Joined {new Date(consumer.createdAt).toLocaleDateString()}
                </span>
                <span>
                  {consumer.user?.phoneVerified ? (
                    <span className="text-green-600 font-medium">Verified</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {consumers.length === 0 && !loading && (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No consumers found
          </h3>
          <p className="text-gray-500">
            Get started by adding your first consumer.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded-xl"></div>
                <div className="h-16 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {consumers.length > 0 && (
        <div className="bg-white px-6 py-3 border border-gray-200 rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                {page}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumersMain;
