"use client"
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import ConsumersService from '@/services/consumers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ConsumerDetailsMain = ({consumerId}: {consumerId: string}) => {
    const [consumerDetails, setConsumerDetails] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('details');
    
    const handleGetConsumerDetails=async()=>{
        try{
            const response=await ConsumersService.GetConsumerById(consumerId);
            if(response?.status===200){
                setConsumerDetails(response.data?.data);
            }
        }catch(error){
            console.log("Error in fetching consumer details", error);
            toast.error("Error in fetching consumer details");
        }
    }

    useEffect(()=>{
        handleGetConsumerDetails();
    },[consumerId])

    if (!consumerDetails) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-3xl w-48 mb-6"></div>
                    <div className="h-64 bg-gray-200 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'details', label: 'Details', icon: '👤' },
        { id: 'orders', label: 'Orders', icon: '📦' },
        { id: 'payment', label: 'Payment', icon: '💳' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                                            {consumerDetails.user.username?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{consumerDetails.user.username}</h3>
                                        <p className="text-gray-600">{consumerDetails.consumerId}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="text-gray-900">{consumerDetails.user.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="text-gray-900">{consumerDetails.user.phone}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Status:</span>
                                        <Badge variant={consumerDetails.user.status === 'ACTIVE' ? 'default' : 'destructive'} className="rounded-full">
                                            {consumerDetails.user.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Country:</span>
                                        <span className="text-gray-900">{consumerDetails.user.profile.address.country}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">State / City:</span>
                                        <span className="text-gray-900">
                                            {consumerDetails.user.profile.address.state || consumerDetails.user.profile.address.city || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification Status */}
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Verification Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-2xl">
                                    <span className="text-gray-700">Phone Verified</span>
                                    <Badge variant={consumerDetails.user.phoneVerified ? 'default' : 'destructive'} className="rounded-full">
                                        {consumerDetails.user.phoneVerified ? '✓ Verified' : '✗ Not Verified'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-2xl">
                                    <span className="text-gray-700">Email Verified</span>
                                    <Badge variant={consumerDetails.user.emailVerified ? 'default' : 'destructive'} className="rounded-full">
                                        {consumerDetails.user.emailVerified ? '✓ Verified' : '✗ Not Verified'}
                                    </Badge>
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                                    <h4 className="font-medium text-blue-900 mb-2">Account Activity</h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p>Login Count: {consumerDetails.user.metadata.loginCount}</p>
                                        <p>Last Login: {new Date(consumerDetails.user.metadata.lastLoginAt).toLocaleDateString()}</p>
                                        <p>Registration: {consumerDetails.registrationSource}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preferences */}
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl">
                                        <h5 className="font-medium text-gray-700 mb-2">Language</h5>
                                        <p className="text-gray-900 capitalize">{consumerDetails.preferences.preferredLanguage}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-2xl">
                                        <h5 className="font-medium text-gray-700 mb-2">Currency</h5>
                                        <p className="text-gray-900">{consumerDetails.preferences.preferredCurrency}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-2xl">
                                    <h5 className="font-medium text-green-900 mb-2">Payment Method</h5>
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 rounded-full">
                                        {consumerDetails.preferences.paymentMethod}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loyalty & Ratings */}
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Loyalty & Ratings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-purple-50 rounded-2xl">
                                    <h5 className="font-medium text-purple-900 mb-3">Loyalty Points</h5>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-purple-600">{consumerDetails.loyaltyPoints.current}</p>
                                            <p className="text-xs text-purple-700">Current</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-purple-600">{consumerDetails.loyaltyPoints.lifetime}</p>
                                            <p className="text-xs text-purple-700">Lifetime</p>
                                        </div>
                                        <div>
                                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                                {consumerDetails.loyaltyPoints.tier}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-2xl">
                                    <h5 className="font-medium text-yellow-900 mb-2">Ratings</h5>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">⭐</span>
                                            <span className="text-xl font-semibold text-yellow-700">{consumerDetails.ratings.averageRating}</span>
                                        </div>
                                        <span className="text-yellow-700">({consumerDetails.ratings.totalRatings} reviews)</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'orders':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-gray-200 rounded-3xl shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl mb-2">📦</div>
                                <h3 className="text-2xl font-bold text-blue-600">{consumerDetails.orderHistory.totalOrders}</h3>
                                <p className="text-blue-700 font-medium">Total Orders</p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 rounded-3xl shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl mb-2">✅</div>
                                <h3 className="text-2xl font-bold text-green-600">{consumerDetails.orderHistory.completedOrders}</h3>
                                <p className="text-green-700 font-medium">Completed</p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 rounded-3xl shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl mb-2">❌</div>
                                <h3 className="text-2xl font-bold text-red-600">{consumerDetails.orderHistory.cancelledOrders}</h3>
                                <p className="text-red-700 font-medium">Cancelled</p>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 rounded-3xl shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl mb-2">💰</div>
                                <h3 className="text-2xl font-bold text-purple-600">₹{consumerDetails.orderHistory.totalSpent}</h3>
                                <p className="text-purple-700 font-medium">Total Spent</p>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'payment':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Payment Preferences</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-green-100 rounded-full">
                                            <span className="text-2xl">💵</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-green-800">Cash Payment</h3>
                                            <p className="text-green-600">Preferred payment method</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-gray-200 rounded-3xl shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-800">Currency Settings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-full">
                                            <span className="text-2xl">🇮🇳</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-blue-800">Indian Rupee (INR)</h3>
                                            <p className="text-blue-600">Default currency</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Consumer Details</h1>
            <p className="text-gray-600">Manage and view consumer information</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center space-x-2">
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            {renderTabContent()}
        </div>
    </div>
  )
}

export default ConsumerDetailsMain