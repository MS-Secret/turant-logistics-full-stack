"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  FileText,
  Package,
  CreditCard,
  Shield,
  Car,
  IdCard,
  Calendar,
  TrendingUp,
  MapPin as LocationIcon,
} from "lucide-react";
import DriversService from "@/services/drivers";

interface DriverDetailsMainProps {
  driverId: string;
}

// Define TypeScript interfaces based on the provided API response
interface UserProfile {
  address: {
    country: string;
  };
}

interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  language: string;
  currency: string;
}

interface UserMetadata {
  loginCount: number;
  deviceInfo: any[];
  lastLoginAt: string;
}

interface User {
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
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  fullName: string;
  id: string;
  profile: UserProfile;
  preferences: UserPreferences;
  metadata: UserMetadata;
}

interface DriverRatings {
  averageRating: number;
  totalRatings: number;
}

interface DriverEarnings {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

interface DriverStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalDistance: number;
  onlineHours: number;
}

interface KycOwner {
  aadhaarCard: {
    frontImageUrl: string;
    backImageUrl: string;
  };
  panCard: {
    imageUrl: string;
  };
  name: string;
  ownerPhotoUrl: string;
}

interface KycVehicle {
  vehicleBodyDetails: {
    name: string;
    capacity: string;
  };
  vehicleNumber: string;
  vehicleRCImgUrl: string;
  operationCity: string;
  vehicleType: string;
  vehicleBodyType: string;
  vehicleFuelType: string;
}

interface KycDriver {
  licenseImageUrl: string;
  licenseNumber: string;
  name: string;
  phoneNumber: string;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    passbookImageUrl: string;
  };
}

interface Kyc {
  _id: string;
  userId: string;
  status: string;
  stepCompleted: number;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  owner: KycOwner;
  vehicle: KycVehicle;
  driver: KycDriver;
}

interface Driver {
  _id: string;
  userId: string;
  driverId: string;
  workingStatus: "AVAILABLE" | "ON_TRIP" | "OFFLINE";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  kycStatus: string;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  currentLocation: {
    type: string;
    coordinates: number[];
  };
  ratings: DriverRatings;
  earnings: DriverEarnings;
  statistics: DriverStatistics;
  kyc?: Kyc;
}

type TabType = "details" | "documents" | "orders" | "payments";

const DriverDetailsMain: React.FC<DriverDetailsMainProps> = ({ driverId }) => {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("details");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_TRIP":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "OFFLINE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const fetchDriverDetails = async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      const response = await DriversService.GetDriverById(driverId);
      if (response?.status === 200) {
        setDriver(response.data?.data || null);
      } else {
        setError("Failed to fetch driver details");
      }
    } catch (err) {
      console.error("Error fetching driver details:", err);
      setError("An error occurred while fetching driver details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKycStatus = async (
    status: "pending" | "approved" | "rejected"
  ) => {
    try {
      const payload = {
        driverId: driver?.userId || "",
        status: status,
      };
      const formData = new FormData();
      formData.append("status", payload.status);
      const response = await DriversService.UpdateDriverKycStatus(
        payload.driverId,
        formData
      );
      if (response?.status === 200) {
        console.log("KYC status updated successfully:", response.data);
        fetchDriverDetails();
      } else {
        setError("Failed to update KYC status");
      }
    } catch (error) {
      console.error("Error updating KYC status:", error);
      setError("An error occurred while updating KYC status");
    }
  };

  useEffect(() => {
    fetchDriverDetails();
  }, [driverId]);

  // Tab components
  const DriverDetailsTab = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Full Name
            </label>
            <p className="text-gray-900">{driver?.user.username || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{driver?.user.email || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-gray-900">{driver?.user.phone || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Driver ID
            </label>
            <p className="text-gray-900">{driver?.driverId}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Country</label>
            <p className="text-gray-900">
              {driver?.user.profile?.address?.country || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Language
            </label>
            <p className="text-gray-900">
              {driver?.user.preferences?.language || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Status Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Working Status
            </label>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                driver?.workingStatus || ""
              )}`}
            >
              {driver?.workingStatus}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Approval Status
            </label>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getApprovalStatusColor(
                driver?.approvalStatus || ""
              )}`}
            >
              {driver?.approvalStatus}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Account Status
            </label>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${driver?.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {driver?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              KYC Status
            </label>
            <p className="text-gray-900">{driver?.kycStatus}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Phone Verified
            </label>
            <span
              className={`inline-flex items-center gap-1 ${driver?.user.phoneVerified ? "text-green-600" : "text-red-600"
                }`}
            >
              {driver?.user.phoneVerified ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {driver?.user.phoneVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Email Verified
            </label>
            <span
              className={`inline-flex items-center gap-1 ${driver?.user.emailVerified ? "text-green-600" : "text-red-600"
                }`}
            >
              {driver?.user.emailVerified ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {driver?.user.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {driver?.statistics.totalOrders}
              </p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-green-600">
                {driver?.statistics.completedOrders}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-blue-600">
                {driver?.statistics.totalDistance} km
              </p>
            </div>
            <LocationIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online Hours</p>
              <p className="text-2xl font-bold text-purple-600">
                {driver?.statistics.onlineHours}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="space-y-6">
      {/* Owner Documents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IdCard className="w-5 h-5" />
          Owner Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Owner Name
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.owner.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Aadhaar Card (Front)
              </label>
              {driver?.kyc?.owner.aadhaarCard.frontImageUrl ? (
                <div className="mt-2">
                  <img
                    src={driver.kyc.owner.aadhaarCard.frontImageUrl}
                    alt="Aadhaar Front"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Aadhaar Card (Back)
              </label>
              {driver?.kyc?.owner.aadhaarCard.backImageUrl ? (
                <div className="mt-2">
                  <img
                    src={driver.kyc.owner.aadhaarCard.backImageUrl}
                    alt="Aadhaar Back"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                PAN Card
              </label>
              {driver?.kyc?.owner.panCard.imageUrl ? (
                <div className="mt-2">
                  <img
                    src={driver.kyc.owner.panCard.imageUrl}
                    alt="PAN Card"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Owner Photo
              </label>
              {driver?.kyc?.owner.ownerPhotoUrl ? (
                <div className="mt-2">
                  <img
                    src={driver.kyc.owner.ownerPhotoUrl}
                    alt="Owner Photo"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Documents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5" />
          Vehicle Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Vehicle Number
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.vehicleNumber}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Vehicle Type
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.vehicleType}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Body Type
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.vehicleBodyType}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Fuel Type
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.vehicleFuelType}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Operation City
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.operationCity}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Vehicle Body Details
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.vehicle.vehicleBodyDetails.name} (
                {driver?.kyc?.vehicle.vehicleBodyDetails.capacity})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Vehicle RC
              </label>
              {driver?.kyc?.vehicle.vehicleRCImgUrl ? (
                <div className="mt-2">
                  <img
                    src={driver.kyc.vehicle.vehicleRCImgUrl}
                    alt="Vehicle RC"
                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Status Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          KYC Status Management
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current KYC Status:</p>
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-1 ${driver?.kycStatus === "approved"
                ? "bg-green-100 text-green-800 border-green-200"
                : driver?.kycStatus === "rejected"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
            >
              {driver?.kycStatus || "pending"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateKycStatus("pending")}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-xl transition-colors border border-yellow-600"
              disabled={driver?.kycStatus === "pending"}
            >
              Set Pending
            </button>
            <button
              onClick={() => handleUpdateKycStatus("approved")}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors border border-green-600"
              disabled={driver?.kycStatus === "approved"}
            >
              Approve
            </button>
            <button
              onClick={() => handleUpdateKycStatus("rejected")}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors border border-red-600"
              disabled={driver?.kycStatus === "rejected"}
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Driver Documents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Driver Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Driver Name
              </label>
              <p className="text-gray-900">{driver?.kyc?.driver.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                License Number
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.driver.licenseNumber}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Phone Number
              </label>
              <p className="text-gray-900">{driver?.kyc?.driver.phoneNumber}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Driving License
            </label>
            {driver?.kyc?.driver.licenseImageUrl ? (
              <div className="mt-2">
                <img
                  src={driver.kyc.driver.licenseImageUrl}
                  alt="Driving License"
                  className="w-full h-32 object-cover rounded-xl border border-gray-200"
                />
              </div>
            ) : (
              <p className="text-gray-500">Not uploaded</p>
            )}
          </div>
        </div>
      </div>

      {/* Bank Documents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Bank Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Account Holder Name
              </label>
              <p className="text-gray-900">{driver?.kyc?.driver.bankDetails?.accountHolderName || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Account Number
              </label>
              <p className="text-gray-900">{driver?.kyc?.driver.bankDetails?.accountNumber || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                IFSC Code
              </label>
              <p className="text-gray-900">
                {driver?.kyc?.driver.bankDetails?.ifscCode || "N/A"}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Bank Passbook / Cheque
            </label>
            {driver?.kyc?.driver.bankDetails?.passbookImageUrl ? (
              <div className="mt-2">
                <img
                  src={driver.kyc.driver.bankDetails.passbookImageUrl}
                  alt="Bank Passbook"
                  className="w-full h-32 object-cover rounded-xl border border-gray-200"
                />
              </div>
            ) : (
              <p className="text-gray-500">Not uploaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const OrdersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <Truck className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {driver?.statistics.totalOrders}
            </p>
            <p className="text-sm text-blue-600">Total Orders</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {driver?.statistics.completedOrders}
            </p>
            <p className="text-sm text-green-600">Completed Orders</p>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {driver?.statistics.cancelledOrders}
            </p>
            <p className="text-sm text-red-600">Cancelled Orders</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              Completion Rate
            </span>
            <span className="text-lg font-bold text-gray-900">
              {/* {driver?.statistics?.totalOrders > 0
                ? ((driver.statistics.completedOrders / driver.statistics.totalOrders) * 100).toFixed(1)
                : 0}% */}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent orders available</p>
          <p className="text-sm">Order history will appear here</p>
        </div>
      </div>
    </div>
  );

  const PaymentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Earnings Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(driver?.earnings.totalEarnings || 0)}
            </p>
            <p className="text-sm text-green-600">Total Earnings</p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(driver?.earnings.todayEarnings || 0)}
            </p>
            <p className="text-sm text-blue-600">Today's Earnings</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
            <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(driver?.earnings.weeklyEarnings || 0)}
            </p>
            <p className="text-sm text-purple-600">Weekly Earnings</p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
            <Clock className="w-12 h-12 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(driver?.earnings.monthlyEarnings || 0)}
            </p>
            <p className="text-sm text-orange-600">Monthly Earnings</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment History
        </h3>
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No payment history available</p>
          <p className="text-sm">Payment transactions will appear here</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800">
          Error Loading Driver Details
        </h3>
        <p className="text-red-600 mt-2">{error || "Driver not found"}</p>
        <p className="mt-4">Driver ID: {driverId}</p>
      </div>
    );
  }

  const tabs = [
    { id: "details", name: "Driver Details", icon: User },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "orders", name: "Orders", icon: Package },
    { id: "payments", name: "Payments", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Details</h1>
          <p className="text-gray-600 mt-1">
            Viewing complete information for driver {driver.driverId}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/drivers")}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-2xl transition-colors border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drivers
        </button>
      </div>

      {/* Driver Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4 md:mb-0">
            {driver.user.username
              ? driver.user.username.charAt(0).toUpperCase()
              : "D"}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {driver.user.username || "Unnamed Driver"}
                </h2>
                <p className="text-gray-500">ID: {driver.driverId}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {driver.ratings.averageRating.toFixed(1)} (
                    {driver.ratings.totalRatings} ratings)
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-2xl ${getStatusColor(
                    driver.workingStatus
                  )}`}
                >
                  {driver.workingStatus}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-2xl ${getApprovalStatusColor(
                    driver.approvalStatus
                  )}`}
                >
                  {driver.approvalStatus}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-2xl ${driver.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {driver.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "details" && <DriverDetailsTab />}
        {activeTab === "documents" && <DocumentsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "payments" && <PaymentsTab />}
      </div>
    </div>
  );
};

export default DriverDetailsMain;
