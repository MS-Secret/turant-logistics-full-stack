"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Truck, 
  RefreshCw,
  Weight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Ban
} from 'lucide-react'
import OrderServices from '@/services/orders'

const OrderDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await OrderServices.GetOrderById(orderId)
      if (response?.status === 200 && response?.data?.success) {
        setOrder(response.data.data)
      } else {
        setError('Failed to load order details')
      }
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

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
    return status?.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ') || 'Unknown'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 rounded-lg text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Order</h2>
        <p className="text-red-600 mb-4">{error || "Order not found"}</p>
        <button 
          onClick={() => router.back()} 
          className="bg-white px-4 py-2 border border-red-200 rounded text-red-700 hover:bg-red-50"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order {order.orderId}
              <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchOrderDetails}
          className="flex items-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Timeline / Route */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Route Details
            </h2>
            
            <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              
              {/* Pickup */}
              <div className="relative flex items-start space-x-4">
                <div className="absolute -left-9 bg-white border-2 border-blue-500 rounded-full w-4 h-4 mt-1.5 z-10 mx-auto left-0 ml-7"></div>
                <div className="flex-1 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">Pickup Location</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">
                    {order.pickupLocation?.address || order.senderDetails?.location?.address || 'N/A'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 border-t border-blue-100 pt-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {order.senderDetails?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {order.senderDetails?.mobile || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropoff */}
              <div className="relative flex items-start space-x-4">
                <div className="absolute -left-9 bg-white border-2 border-green-500 rounded-full w-4 h-4 mt-1.5 z-10 mx-auto left-0 ml-7"></div>
                <div className="flex-1 bg-green-50/50 p-4 rounded-lg border border-green-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">Dropoff Location</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">
                    {order.dropoffLocation?.address || order.receiverDetails?.location?.address || 'N/A'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 border-t border-green-100 pt-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {order.receiverDetails?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {order.receiverDetails?.mobile || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Package Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-600" />
              Package Details
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Package Type</span>
                <span className="font-medium text-gray-900">{order.packageDetails?.packageType || 'Standard'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Weight</span>
                <span className="font-medium text-gray-900 flex items-center">
                  <Weight className="w-4 h-4 mr-1 text-gray-400" />
                  {order.packageDetails?.weight || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Total Distance</span>
                <span className="font-medium text-gray-900">{order.distance || 0} km</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">Total Time</span>
                <span className="font-medium text-gray-900">{order.estimatedTime || 'N/A'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar details) */}
        <div className="space-y-6">
          
          {/* Payment & Pricing */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
              Payment Details
            </h2>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md mb-4 border border-gray-100">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{order.payment?.method === 'ONLINE' ? '💳' : '💵'}</span>
                <div>
                  <div className="text-sm font-medium">{order.payment?.method || 'CASH'}</div>
                  <div className={`text-xs ${order.payment?.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.payment?.status || 'PENDING'}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                ₹{order.pricing?.totalAmount || order.finalFare || 0}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Base Fare</span>
                <span>₹{order.pricing?.baseFare || (order.pricing?.totalAmount || order.finalFare || 0)}</span>
              </div>
              {order.pricing?.waitingCharge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Waiting Charges</span>
                  <span>+ ₹{order.pricing.waitingCharge}</span>
                </div>
              )}
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{order.pricing.discount}</span>
                </div>
              )}
              <div className="pt-2 border-t mt-2 flex justify-between font-medium text-gray-900">
                <span>Total Amount</span>
                <span>₹{order.pricing?.totalAmount || order.finalFare || 0}</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Customer Details
            </h2>
            {order.customerDetails ? (
               <div className="space-y-3">
                 <div className="flex justify-between border-b pb-2 text-sm">
                   <span className="text-gray-500">Name</span>
                   <span className="font-medium text-gray-900">{order.customerDetails.firstName} {order.customerDetails.lastName}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2 text-sm">
                   <span className="text-gray-500">Phone</span>
                   <span className="font-medium text-gray-900">{order.customerDetails.phone || order.customerDetails.mobileNumber}</span>
                 </div>
               </div>
            ) : (
               <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded">
                  Customer info fetched from Users Database
               </div>
            )}
          </div>

          {/* Driver Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-orange-600" />
              Driver Details
            </h2>
            
            {!order.driverId ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No driver assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                    {order.driverDetails?.firstName?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {order.driverDetails?.firstName} {order.driverDetails?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {order.driverDetails?.phone || order.driverDetails?.mobileNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-4 pt-4 border-t border-gray-100">
                   <div className="bg-gray-50 p-2 rounded">
                     <span className="text-xs text-gray-500 block">Driver ID</span>
                     <span className="font-medium text-gray-900 truncate block" title={order.driverId}>{order.driverId}</span>
                   </div>
                   <div className="bg-gray-50 p-2 rounded">
                     <span className="text-xs text-gray-500 block">Vehicle</span>
                     <span className="font-medium text-gray-900">{order.vehicleDetails?.vehicleType || 'N/A'}</span>
                   </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default OrderDetailsPage