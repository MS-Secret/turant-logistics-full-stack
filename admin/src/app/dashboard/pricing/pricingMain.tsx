"use client";
import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Truck,
  Package,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CreatePricing from "./createPricing";
import toast from "react-hot-toast";
import PricingService from "@/services/pricing";

interface VehicleBodyDetails {
  name: string;
  length: string;
  capacity: string;
}

interface DistanceSlab {
  minDistance: number;
  maxDistance: number;
  farePerKm: number;
  _id: string;
}

interface WeightSlab {
  minWeight: number;
  maxWeight: number;
  farePerKg: number;
  _id: string;
}

interface PricingData {
  vehicleBodyDetails: VehicleBodyDetails;
  _id: string;
  vehicleType: string;
  vehicleName: string;
  vehicleImageUrl: string;
  vehicleBodyType: string;
  vehicleFuelType: string;
  minOrderFare: number;
  distanceSlabs: DistanceSlab[];
  weightSlabs: WeightSlab[];
  platformSurchargePercentage: number;
  discountPercentage: number;
  waitingChargePerMin: number;
  freeWaitingMinutes: number;
  returnTripFeePercentage: number;
  nightSurchargePercentage: number;
  codHandlingFee: number;
  loadingCharge: number;
  offloadingCharge: number;
  extraHandsCharge: number;
  isActive: boolean;
  isDelete: boolean;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const PricingMain = () => {
  const [addPricingDialogOpen, setAddPricingDialogOpen] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [refreshData, setRefreshData] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingData | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        const response = await PricingService.GetAllPricing();
        if (response?.data?.data && Array.isArray(response.data.data)) {
          setPricingData(response.data.data);
        } else if (Array.isArray(response?.data)) {
          setPricingData(response.data);
        } else {
          console.warn("Unexpected pricing data format:", response);
          setPricingData([]);
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error);
        toast.error("Failed to load pricing rules");
        setPricingData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [refreshData]);

  const stats = [
    {
      title: "Total Pricing Rules",
      value: (pricingData?.length || 0).toString(),
      change: "+3",
      changeType: "positive",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Active Rules",
      value: (pricingData?.filter(item => item.isActive)?.length || 0).toString(),
      change: "+2",
      changeType: "positive",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Average Min Fare",
      value: (pricingData?.length > 0) ?
        `₹${Math.round(pricingData.reduce((sum, item) => sum + (item.minOrderFare || 0), 0) / pricingData.length)}`
        : "₹0",
      change: "+8%",
      changeType: "positive",
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Vehicle Types",
      value: new Set(pricingData?.map(item => item.vehicleType) || []).size.toString(),
      change: "+5%",
      changeType: "positive",
      icon: MapPin,
      color: "bg-yellow-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "2 Wheeler":
        return <Package className="w-6 h-6 text-blue-600" />;
      case "3 Wheeler":
        return <Truck className="w-6 h-6 text-green-600" />;
      case "4 Wheeler":
        return <Truck className="w-6 h-6 text-yellow-600" />;
      case "Heavy Vehicle":
        return <Truck className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const handleDelete = async (id: string) => {

    if (confirm("Are you sure you want to delete this pricing rule?")) {
      try {
        const response = await PricingService.DeletePricing(id);
        if (response?.status === 200) {
          toast.success("Pricing rule deleted successfully");
          setRefreshData(!refreshData);
        }
      } catch (error) {
        console.error("Error deleting pricing:", error);
        toast.error("Failed to delete pricing rule");
      }
    }
  };

  const handleEdit = (pricing: PricingData) => {
    setEditingPricing(pricing);
    setAddPricingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pricing Management
          </h1>
          <p className="text-gray-600 mt-1">
            Configure delivery pricing rules and rates
          </p>
        </div>
        <button
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => {
            setEditingPricing(null);
            setAddPricingDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Pricing Rule</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      from last month
                    </span>
                  </div>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search pricing rules..."
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
              <option>Inactive</option>
              <option>Expired</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Vehicle Types</option>
              <option>2 Wheeler</option>
              <option>3 Wheeler</option>
              <option>4 Wheeler</option>
              <option>Heavy Vehicle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.isArray(pricingData) && pricingData.map((pricing) => (
          <div
            key={pricing._id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {pricing.vehicleImageUrl && !imageErrors.has(pricing._id) ? (
                    <img
                      src={pricing.vehicleImageUrl}
                      alt={pricing.vehicleName}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(pricing._id));
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      {getVehicleIcon(pricing.vehicleType)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{pricing.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{pricing.vehicleBodyDetails.name}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                  pricing.isActive ? "Active" : "Inactive"
                )}`}
              >
                {pricing.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Vehicle Details */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {pricing.vehicleBodyDetails.length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {pricing.vehicleBodyDetails.capacity}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {pricing.vehicleFuelType}
                  </span>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">
                    ₹{pricing.minOrderFare}
                  </p>
                  <p className="text-xs text-blue-700">Min Order Fare</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {pricing.platformSurchargePercentage}%
                  </p>
                  <p className="text-xs text-green-700">Platform Surcharge</p>
                </div>
              </div>

              {/* Distance & Weight Slabs */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Distance Slabs</h4>
                  <div className="space-y-2">
                    {pricing.distanceSlabs.slice(0, 2).map((slab, index) => (
                      <div key={slab._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {slab.minDistance}-{slab.maxDistance}km
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{slab.farePerKm}/km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Weight Slabs</h4>
                  <div className="space-y-2">
                    {pricing.weightSlabs.slice(0, 2).map((slab, index) => (
                      <div key={slab._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {slab.minWeight}-{slab.maxWeight}kg
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{slab.farePerKg}/kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-bold text-yellow-600">
                    ₹{pricing.waitingChargePerMin}/min
                  </p>
                  <p className="text-xs text-yellow-700">Waiting Charge</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-sm font-bold text-purple-600">
                    ₹{pricing.codHandlingFee}
                  </p>
                  <p className="text-xs text-purple-700">COD Fee</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Updated: {new Date(pricing.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="text-green-600 hover:text-green-900 p-1 rounded"
                    onClick={() => handleEdit(pricing)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                    onClick={() => handleDelete(pricing._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(pricingData?.length || 0) === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <DollarSign className="h-24 w-24" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pricing data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new pricing rule.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setEditingPricing(null);
                setAddPricingDialogOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Pricing Rule
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {(pricingData?.length || 0) > 0 && (
        <div className="bg-white px-6 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{pricingData.length}</span> of{" "}
              <span className="font-medium">{pricingData.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={addPricingDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingPricing(null);
          setAddPricingDialogOpen(open);
        }}
      >
        <DialogContent
          className="min-w-[900px] max-h-[90vh] rounded-2xl border border-gray-200 p-0 overflow-y-scroll"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <DialogTitle className="sr-only">
            {editingPricing ? "Edit Pricing Rule" : "Create New Pricing Rule"}
          </DialogTitle>
          <div className="p-6 w-full h-full">
            <CreatePricing
              onClose={() => {
                setAddPricingDialogOpen(false);
                setEditingPricing(null);
              }}
              refreshData={refreshData}
              setRefreshData={setRefreshData}
              initialData={editingPricing}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingMain;
