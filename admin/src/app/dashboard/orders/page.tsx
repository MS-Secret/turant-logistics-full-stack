"use client"
import React, { useEffect, useState } from 'react'
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Clock,
  User,
  CreditCard,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Weight,
  Ban
} from 'lucide-react'
import OrderServices from '@/services/orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from 'next/link';

// TypeScript interfaces for the order data
interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface OrderDetails {
  location: Location;
  name: string;
  mobile: string;
  addressType: string;
}

interface PackageDetails {
  weight: string;
}

interface Pricing {
  totalAmount: number;
}

interface Payment {
  method: string;
  status: string;
}

interface Tracking {
  pickupImages: string[];
  deliveryImages: string[];
}

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  receiverDetails: OrderDetails;
  senderDetails: OrderDetails;
  packageDetails: PackageDetails;
  pricing: Pricing;
  payment: Payment;
  tracking: Tracking;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  driverId?: string;
}

interface Pagination {
  totalOrders: number;
  totalPages: number;
  currentPage: string;
  isNextPage: boolean;
  isPrevPage: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

const OrdersPage = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [refreshing, setRefreshing] = useState(false);

  // Force Cancel State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('User No-Show or Driver Request');
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DRIVER_ACCEPTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PICKUP_COMPLETED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  const getPaymentMethodIcon = (method: string) => {
    return method === 'ONLINE' ? '💳' : '💵';
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600'
      case 'PENDING': return 'text-yellow-600'
      case 'FAILED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const truncateAddress = (address: string, maxLength: number = 30) => {
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const getStatusStats = () => {
    const stats = {
      total: orders.length,
      created: 0,
      driverAccepted: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      switch (order.status) {
        case 'CREATED': stats.created++; break;
        case 'DRIVER_ACCEPTED': stats.driverAccepted++; break;
        case 'IN_TRANSIT': stats.inTransit++; break;
        case 'DELIVERED': 
        case 'COMPLETED':
          stats.delivered++; break;
        case 'CANCELLED': stats.cancelled++; break;
      }
    });

    return stats;
  }

  const handleGetOrders = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await OrderServices.GetAllOrders({ page, limit: 10 });
      console.log('Orders fetched successfully:', response);

      if (response?.status === 200) {
        setOrders(response?.data?.data?.orders);
        setPagination(response?.data?.data?.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleGetOrders(currentPage);
    setRefreshing(false);
  }

  const handleForceCancel = async () => {
    if (!selectedOrderForCancel) return;
    setIsCancelling(true);
    try {
      const response = await OrderServices.ForceCancelOrder(selectedOrderForCancel.orderId, cancelReason);
      if (response?.status === 200) {
        // Refresh orders after successful cancellation
        handleGetOrders(currentPage);
        setIsCancelDialogOpen(false);
        setSelectedOrderForCancel(null);
      } else {
        alert("Failed to cancel order: " + (response?.data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error force cancelling order:', error);
      alert("An error occurred while trying to cancel the order.");
    } finally {
      setIsCancelling(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      handleGetOrders(newPage);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.senderDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.receiverDetails.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    handleGetOrders();
  }, [])

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all your logistics orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{pagination?.totalOrders || stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-2xl font-bold text-blue-600">{stats.created}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Driver Accepted</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.driverAccepted}</p>
            </div>
            <Truck className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inTransit}</p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order ID, sender, or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Status</option>
              <option value="CREATED">Created</option>
              <option value="DRIVER_ACCEPTED">Driver Accepted</option>
              <option value="PICKUP_COMPLETED">Pickup Completed</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Loading orders...</span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No orders found</p>
                      <p className="text-sm">Try adjusting your search criteria or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                            <div className="text-xs text-gray-500">ID: {order._id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-40">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <User className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                            {order.senderDetails.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                            {order.senderDetails.mobile}
                          </div>
                          <div className="text-xs text-gray-500 flex items-start mt-1">
                            <MapPin className="w-3 h-3 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{truncateAddress(order.senderDetails.location.address, 25)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-40">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <User className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                            {order.receiverDetails.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                            {order.receiverDetails.mobile}
                          </div>
                          <div className="text-xs text-gray-500 flex items-start mt-1">
                            <div className="w-3 h-3 mr-1 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            </div>
                            <span className="break-words">{truncateAddress(order.receiverDetails.location.address, 25)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Weight className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="font-medium">{order.packageDetails.weight}kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <span className="mr-1">{getPaymentMethodIcon(order.payment.method)}</span>
                            ₹{order.pricing.totalAmount}
                          </div>
                          <div className={`text-xs ${getPaymentStatusColor(order.payment.status)} font-medium`}>
                            {order.payment.method} • {order.payment.status}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Truck className="w-4 h-4 text-gray-400 mr-1" />
                          <span className={order.driverId ? "text-gray-900" : "text-gray-400 italic"}>
                            {order.driverId ? `DRV_${order.driverId.substring(4, 12)}...` : "Not Assigned"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(order.createdAt)}
                          </div>
                          {order.updatedAt !== order.createdAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated: {formatDate(order.updatedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/dashboard/orders/${order.orderId}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Force Cancel Action */}
                          {['ARRIVED', 'DRIVER_ARRIVED', 'STARTED', 'IN_TRANSIT'].includes(order.status) && (
                            <button
                              onClick={() => {
                                setSelectedOrderForCancel(order);
                                setIsCancelDialogOpen(true);
                              }}
                              title="Force Cancel Order"
                              className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && !loading && (
        <div className="bg-white px-6 py-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-gray-700">
              Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
              <span className="font-medium">{pagination.totalPages}</span> pages
              <span className="block md:inline md:ml-1">
                ({pagination.totalOrders} total orders)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.isPrevPage || loading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = currentPage - 2 + i;
                  if (pageNum < 1) pageNum = i + 1;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }).filter(Boolean)}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.isNextPage || loading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Cancel Ride</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel Order <strong>{selectedOrderForCancel?.orderId}</strong>? This action will set the driver available again and initiate refunds if prepaid.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. User Unreachable, Vehicle Breakdown"
            />
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isCancelling}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleForceCancel}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Force Cancel'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdersPage