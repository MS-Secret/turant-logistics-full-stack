"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Truck, 
  Users, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  IndianRupee
} from 'lucide-react'
import DashboardServices from '@/services/dashboard'

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    activeDrivers: 0,
    totalConsumers: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await DashboardServices.GetDashboardStats();
      if (response?.status === 200 && response?.data?.success) {
        setStatsData(response.data.data.stats);
        setRecentOrders(response.data.data.recentOrders);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Orders',
      value: statsData.totalOrders.toLocaleString(),
      change: '+10%',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Drivers',
      value: statsData.activeDrivers.toLocaleString(),
      change: '+5%',
      changeType: 'positive',
      icon: Truck,
      color: 'bg-green-500'
    },
    {
      title: 'Total Consumers',
      value: statsData.totalConsumers.toLocaleString(),
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenue',
      value: `₹${statsData.totalRevenue.toLocaleString()}`,
      change: '+8%',
      changeType: 'positive',
      icon: IndianRupee,
      color: 'bg-yellow-500'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CREATED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'DRIVER_ACCEPTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status?.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ') || 'Unknown'
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your logistics right now.</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                  <div className="flex items-center mt-2 opacity-60">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-gray-500 ml-1">Trend estimates</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Loading recent orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                No orders found in the system yet.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Link href={`/dashboard/orders/${order.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {order.id}
                      </Link>
                      <p className="text-sm text-gray-600 flex items-center mt-0.5">
                        <Users className="w-3 h-3 mr-1" /> {order.customer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{order.amount}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/dashboard/orders" className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-blue-800 font-semibold">View All Orders</span>
              </Link>
              <Link href="/dashboard/drivers" className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-green-800 font-semibold">Manage Drivers</span>
              </Link>
              <Link href="/dashboard/tracking" className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-purple-800 font-semibold">Live Map Tracking</span>
              </Link>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              Alerts
              {statsData.activeDrivers < 5 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">1 New</span>
              )}
            </h3>
            
            <div className="space-y-3">
              {statsData.activeDrivers < 5 ? (
                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Low Driver Availability</p>
                    <p className="text-xs text-red-700 mt-1">Only {statsData.activeDrivers} driver(s) are currently online or busy. Consider matching incentives.</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4 italic border border-dashed rounded-lg">
                  No critical alerts at the moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard