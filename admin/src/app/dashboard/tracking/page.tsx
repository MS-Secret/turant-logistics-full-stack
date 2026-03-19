"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { io, Socket } from 'socket.io-client';
import { MapPin, Truck, RefreshCw, User, Phone, Package, Activity, Navigation, Clock } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (e.g., Central India / Delhi)
const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

interface DriverLocation {
  driverId: string;
  name?: string;
  mobile?: string;
  vehicleType?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  orderId?: string;
  status: string; // 'ONLINE', 'BUSY'
  lastUpdated: number;
}

const TrackingPage = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeDrivers, setActiveDrivers] = useState<{ [key: string]: DriverLocation }>({});
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(11);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  // Initialize Socket Connection
  useEffect(() => {
    const restApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // Determine backend URL for Sockets (fallback to local if not set or not using ngrok)
    // If using ngrok (e.g., https://something.ngrok-free.app/api), remove '/api' to get the base socket URL
    let backendUrl = 'http://localhost:4000';
    if (restApiUrl.includes('ngrok-free.app')) {
      backendUrl = restApiUrl.replace('/api', '');
    }

    // Connect to backend socket
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Fetch initial drivers from backend REST API
    const fetchInitialDrivers = async () => {
      try {
        const res = await fetch(`${restApiUrl}/admin/tracking/active-drivers`);
        const result = await res.json();
        if (result.success && result.data) {
          const initialMap: { [key: string]: DriverLocation } = {};
          result.data.forEach((d: DriverLocation) => {
            initialMap[d.driverId] = d;
          });
          setActiveDrivers(prev => ({ ...prev, ...initialMap }));
        }
      } catch (err) {
        console.error('Failed to fetch initial active drivers:', err);
      }
    };
    fetchInitialDrivers();

    newSocket.on('connect', () => {
      console.log('✅ Admin Tracking Socket Connected:', newSocket.id);
      // Join the admin tracking room
      newSocket.emit('join-admin-tracking');
    });

    // Listen for live driver location updates
    newSocket.on('admin-driver-location-update', (data: DriverLocation) => {
      console.log('📍 Driver location update received:', data);
      setActiveDrivers(prev => ({
        ...prev,
        [data.driverId]: {
          ...data,
          lastUpdated: Date.now()
        }
      }));
    });

    // Optionally handle driver disconnects/offline
    newSocket.on('admin-driver-offline', (data: { driverId: string }) => {
      setActiveDrivers(prev => {
        const newState = { ...prev };
        delete newState[data.driverId];
        return newState;
      });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Calculate stats
  const activeDriverList = Object.values(activeDrivers);
  const onlineCount = activeDriverList.filter(d => d.status === 'ONLINE').length;
  const onTripCount = activeDriverList.filter(d => d.status === 'BUSY').length;

  const handleDriverClick = (driver: DriverLocation) => {
    setMapCenter({ lat: driver.location.latitude, lng: driver.location.longitude });
    setZoom(15);
    setSelectedDriver(driver);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUSY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ONLINE': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loadError) {
    return <div className="p-6 text-red-500">Error loading maps. Please check API Key.</div>;
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor all active vehicles and ongoing orders in real-time</p>
        </div>
        <div className="flex space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates Active</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar: Driver List */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Stats Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-green-700">
              <Activity className="w-5 h-5" />
              <span className="font-semibold text-lg">{onlineCount + onTripCount} Active</span>
            </div>
            <div className="flex space-x-3 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                <span>{onlineCount} Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></div>
                <span>{onTripCount} On Trip</span>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeDriverList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                <Navigation className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600">No active drivers</p>
                <p className="text-sm mt-1">Drivers will appear here when they go online or accept a trip.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDriverList.sort((a,b) => b.lastUpdated - a.lastUpdated).map((driver) => (
                  <div 
                    key={driver.driverId}
                    onClick={() => handleDriverClick(driver)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDriver?.driverId === driver.driverId 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-1.5 rounded-md mr-2">
                          <Truck className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{driver.name || `Driver ${driver.driverId.substring(0,6)}`}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{driver.vehicleType || 'Unknown Vehicle'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusColor(driver.status)}`}>
                        {driver.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 space-x-4 mt-2">
                      {driver.mobile && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {driver.mobile}
                        </div>
                      )}
                      {driver.orderId && (
                        <div className="flex items-center text-orange-600 font-medium tracking-tight">
                          <Package className="w-3 h-3 mr-1" />
                          Order: {driver.orderId.substring(0,8)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Google Map */}
        <div className="flex-1 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative shadow-sm">
          {!isLoaded ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
               <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
               <p className="text-gray-500 font-medium">Loading Live Map...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={zoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
              }}
            >
              {/* Render markers for each active driver */}
              {activeDriverList.map((driver) => {
                const isSelected = selectedDriver?.driverId === driver.driverId;
                const iconColor = driver.status === 'BUSY' ? '#f97316' : '#22c55e'; // orange vs green
                
                return (
                  <Marker
                    key={driver.driverId}
                    position={{ lat: driver.location.latitude, lng: driver.location.longitude }}
                    onClick={() => handleDriverClick(driver)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: iconColor,
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                      scale: isSelected ? 10 : 7,
                    }}
                  >
                    {isSelected && (
                      <InfoWindow
                        position={{ lat: driver.location.latitude, lng: driver.location.longitude }}
                        onCloseClick={() => setSelectedDriver(null)}
                      >
                        <div className="p-1 min-w-[150px]">
                          <p className="font-bold text-gray-900 mb-1">{driver.name || 'Driver'}</p>
                          <p className="text-xs text-gray-600 flex items-center mb-1">
                            <Phone className="w-3 h-3 mr-1" /> {driver.mobile || 'N/A'}
                          </p>
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-sm text-white ${driver.status === 'BUSY' ? 'bg-orange-500' : 'bg-green-500'}`}>
                            {driver.status.replace('_', ' ')}
                          </span>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                );
              })}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
