'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  DollarSign, 
  Package, 
  BarChart3, 
  Settings, 
  Bell,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'


const Sidebar = () => {
  const router=useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'text-blue-500'
    },
    {
      title: 'Orders',
      icon: Package,
      href: '/dashboard/orders',
      color: 'text-green-500'
    },
    {
      title: 'Drivers',
      icon: Truck,
      href: '/dashboard/drivers',
      color: 'text-orange-500'
    },
    {
      title: 'Consumers',
      icon: Users,
      href: '/dashboard/consumers',
      color: 'text-purple-500'
    },
    {
      title: 'Pricing',
      icon: DollarSign,
      href: '/dashboard/pricing',
      color: 'text-yellow-500'
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-pink-500'
    },
    {
      title: 'Tracking',
      icon: MapPin,
      href: '/dashboard/tracking',
      color: 'text-red-500'
    },
    {
      title: 'Schedule',
      icon: Calendar,
      href: '/dashboard/schedule',
      color: 'text-indigo-500'
    },
    {
      title: 'Reports',
      icon: FileText,
      href: '/dashboard/reports',
      color: 'text-teal-500'
    },
    {
      title: 'Staff',
      icon: UserCheck,
      href: '/dashboard/staff',
      color: 'text-cyan-500'
    },
    {
      title: 'Notifications',
      icon: Bell,
      href: '/dashboard/notifications',
      color: 'text-amber-500'
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'text-gray-500'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-lg`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 flex items-center justify-between ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Turant</h1>
              <p className="text-xs text-gray-500">Logistics Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${active 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700' 
                  : 'hover:bg-gray-50 text-gray-600 hover:text-gray-800'
                }
                ${isCollapsed ? 'justify-center px-2' : ''}
              `}
            >
              <Icon 
                className={`
                  w-5 h-5 transition-colors
                  ${active ? item.color : 'text-gray-500 group-hover:text-gray-700'}
                  ${isCollapsed ? 'w-6 h-6' : ''}
                `} 
              />
              {!isCollapsed && (
                <span className={`font-medium ${active ? 'text-blue-700' : ''}`}>
                  {item.title}
                </span>
              )}
              {!isCollapsed && active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@turant.com</p>
            </div>
          </div>
        )}
        
        <button
          onClick={()=>{
            localStorage.clear();
            router.push("/login")
          }}
          className={`
            w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? 'w-6 h-6' : ''}`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar