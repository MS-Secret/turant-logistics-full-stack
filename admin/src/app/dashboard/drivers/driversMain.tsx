'use client'
import React, { useEffect, useState } from 'react'
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  MapPin,
  Star,
  Activity,
  Clock,
  Mail,
  Ban
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import DriversService from '@/services/drivers'
import { useRouter } from 'next/navigation';

// Define TypeScript interfaces based on API response
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

interface Driver {
  _id: string;
  userId: string;
  driverId: string;
  workingStatus: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
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
}

const DriversPage = () => {
  const router=useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-200'
      case 'On Trip': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Offline': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Maintenance': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      case 'On Trip': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      case 'Offline': return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
      case 'Maintenance': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
    }
  }

  const handleGetDrivers=async()=>{
    setLoading(true);
    try{
      const payload={
        page,
        limit:pageSize
      }
      const response=await DriversService.GetDrivers(payload);
      if(response?.status===200){
        console.log("Drivers data:", response.data);
        setDrivers(response.data?.data?.drivers || []);
        setTotalDrivers(response.data?.data?.totalDrivers || 0);
      }
    }catch(error){
      console.error("Error fetching drivers:", error);
    }finally{
      setLoading(false);
    }
  }

  const handleToggleBlock = async (e: React.MouseEvent, driver: Driver) => {
    e.stopPropagation();
    const isBlocking = driver.isActive;
    const confirmMsg = isBlocking 
      ? `Are you sure you want to block ${driver.user.fullName || driver.user.username}?`
      : `Are you sure you want to unblock ${driver.user.fullName || driver.user.username}?`;
    
    if (confirm(confirmMsg)) {
      try {
        const response = isBlocking 
          ? await DriversService.BlockDriver(driver.userId)
          : await DriversService.UnblockDriver(driver.userId);
        
        if (response?.status === 200) {
          toast.success(`Driver ${isBlocking ? 'blocked' : 'unblocked'} successfully`);
          handleGetDrivers(); // Refresh list
        } else {
          toast.error(`Failed to ${isBlocking ? 'block' : 'unblock'} driver`);
        }
      } catch (error) {
        console.error("Error toggling block status:", error);
        toast.error("An error occurred");
      }
    }
  }

  useEffect(()=>{
    handleGetDrivers();
  },[page, pageSize])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet drivers and their assignments</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter(driver => driver.workingStatus === 'AVAILABLE').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Trip</p>
              <p className="text-2xl font-bold text-blue-600">
                {drivers.filter(driver => driver.workingStatus === 'ON_TRIP').length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">
                {drivers.filter(driver => driver.workingStatus === 'OFFLINE').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
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
                placeholder="Search drivers..."
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
              <option>Available</option>
              <option>On Trip</option>
              <option>Offline</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500 text-lg">No drivers found</p>
          </div>
        ) : (
          drivers.map((driver) => (
            <div key={driver._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" onClick={()=>{
              router.push(`/dashboard/drivers/${driver._id}`)
            }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {driver.user.username ? driver.user.username.charAt(0).toUpperCase() : "D"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{driver.user.username || "N/A"}</h3>
                    <p className="text-sm text-gray-500">{driver.driverId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(driver.workingStatus === 'AVAILABLE' ? 'Available' : 
                                 driver.workingStatus === 'ON_TRIP' ? 'On Trip' : 'Offline')}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    getStatusColor(driver.workingStatus === 'AVAILABLE' ? 'Available' : 
                                   driver.workingStatus === 'ON_TRIP' ? 'On Trip' : 'Offline')
                  }`}>
                    {driver.workingStatus === 'AVAILABLE' ? 'Available' : 
                     driver.workingStatus === 'ON_TRIP' ? 'On Trip' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{driver.user.phone || "N/A"}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{driver.user.email || "N/A"}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {driver.user.profile?.address?.country || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{driver.ratings?.averageRating || "0.0"}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {driver.statistics?.completedOrders || 0} orders
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Joined: {new Date(driver.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() =>{
                      router.push(`/dashboard/drivers/${driver._id}`)
                    }}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900 p-1 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleToggleBlock(e, driver)}
                    className={`${driver.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-blue-600 hover:text-blue-900'} p-1 rounded`}
                    title={driver.isActive ? "Block Driver" : "Unblock Driver"}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{drivers.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-medium">{Math.min(page * pageSize, totalDrivers)}</span> of{' '}
            <span className="font-medium">{totalDrivers}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => page > 1 && setPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              Previous
            </button>
            
            {[...Array(Math.min(3, Math.ceil(totalDrivers / pageSize)))].map((_, i) => (
              <button 
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 ${
                  page === i + 1 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                } rounded-md text-sm transition-colors`}
              >
                {i + 1}
              </button>
            ))}
            
            <button 
              onClick={() => page < Math.ceil(totalDrivers / pageSize) && setPage(page + 1)}
              disabled={page >= Math.ceil(totalDrivers / pageSize)}
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                page >= Math.ceil(totalDrivers / pageSize) ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriversPage