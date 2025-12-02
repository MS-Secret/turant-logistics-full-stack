import PricingService from "@/services/pricing";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Package,
  DollarSign,
  Clock,
  Percent,
  Upload,
  Plus,
  Minus,
  X,
  Loader2,
  Car,
  Fuel,
  Weight,
  MapPin,
} from "lucide-react";

const CreatePricing = ({ onClose,refreshData,setRefreshData }: { onClose: () => void ,refreshData:boolean,setRefreshData:React.Dispatch<React.SetStateAction<boolean>>}) => {
  const [vehicleType, setVehicleType] = useState(""); // 2 wheeler, 4 wheeler, etc.
  const [vehicleName, setVehicleName] = useState(""); // e.g.,  "bike","scooter","truck"
  const [vehicleBodyDetails, setVehicleBodyDetails] = useState({
    name: "",
    length: "",
    capacity: ""
  }); // e.g., {"name":"truck 10feet(10ton)","length":"10 feet","capacity":"10ton"}
  const [vehicleBodyTypes, setVehicleBodyTypes] = useState(""); // e.g., "open","closed"
  const [vehicleFuelType, setVehicleFuelType] = useState(""); // e.g., "petrol","diesel","electric", "cng"
  const [minOrderFare, setMinOrderFare] = useState(0);
  const [distanceSlabs, setDistanceSlabs] = useState([
    { minDistance: 0, maxDistance: 0, farePerKm: 0 }
  ]);
  const [weightSlabs, setWeightSlabs] = useState([
    { minWeight: 0, maxWeight: 0, farePerKg: 0 }
  ]);
  const [platformSurchargePercentage, setPlatformSurchargePercentage] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [waitingChargePerMin, setWaitingChargePerMin] = useState(0);
  const [freeWaitingMinutes, setFreeWaitingMinutes] = useState(0);
  const [returnTripFeePercentage, setReturnTripFeePercentage] = useState(0);
  const [nightSurchargePercentage, setNightSurchargePercentage] = useState(0);
  const [codHandlingFee, setCodHandlingFee] = useState(0);
  const [loadingCharge,setLoadingCharge] = useState(0);
  const [offLoadingCharge,setOffLoadingCharge] = useState(0);
  const [extraHandsCharge,setExtraHandsCharge] = useState(0);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [loading,setLoading]=useState(false);

  // Helper functions for dynamic arrays
  const addDistanceSlab = () => {
    setDistanceSlabs([...distanceSlabs, { minDistance: 0, maxDistance: 0, farePerKm: 0 }]);
  };

  const removeDistanceSlab = (index: number) => {
    if (distanceSlabs.length > 1) {
      setDistanceSlabs(distanceSlabs.filter((_, i) => i !== index));
    }
  };

  const updateDistanceSlab = (index: number, field: string, value: number) => {
    const updated = distanceSlabs.map((slab, i) => 
      i === index ? { ...slab, [field]: value } : slab
    );
    setDistanceSlabs(updated);
  };

  const addWeightSlab = () => {
    setWeightSlabs([...weightSlabs, { minWeight: 0, maxWeight: 0, farePerKg: 0 }]);
  };

  const removeWeightSlab = (index: number) => {
    if (weightSlabs.length > 1) {
      setWeightSlabs(weightSlabs.filter((_, i) => i !== index));
    }
  };

  const updateWeightSlab = (index: number, field: string, value: number) => {
    const updated = weightSlabs.map((slab, i) => 
      i === index ? { ...slab, [field]: value } : slab
    );
    setWeightSlabs(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVehicleImage(file);
    }
  };

  const handleSubmit=async()=>{
    setLoading(true);
    try{
      const payload=new FormData();
      payload.append("vehicleType",vehicleType);
      payload.append("vehicleName",vehicleName);
      payload.append("vehicleBodyDetails",JSON.stringify(vehicleBodyDetails));
      payload.append("vehicleBodyTypes",vehicleBodyTypes);
      payload.append("vehicleFuelType",vehicleFuelType);
      payload.append("minOrderFare",minOrderFare.toString());
      payload.append("distanceSlabs",JSON.stringify(distanceSlabs));
      payload.append("weightSlabs",JSON.stringify(weightSlabs));
      payload.append("platformSurchargePercentage",platformSurchargePercentage.toString());
      payload.append("discountPercentage",discountPercentage.toString());
      payload.append("waitingChargePerMin",waitingChargePerMin.toString());
      payload.append("freeWaitingMinutes",freeWaitingMinutes.toString());
      payload.append("returnTripFeePercentage",returnTripFeePercentage.toString());
      payload.append("nightSurchargePercentage",nightSurchargePercentage.toString());
      payload.append("codHandlingFee",codHandlingFee.toString());
      payload.append("loadingCharge",loadingCharge.toString());
      payload.append("offLoadingCharge",offLoadingCharge.toString());
      payload.append("extraHandsCharge",extraHandsCharge.toString());
      if(vehicleImage){
        payload.append("vehicleImage",vehicleImage);
      }
      const response=await PricingService.CreatePricing(payload);
      if(response?.status===200 || response?.status===201){
        toast.success("Pricing created successfully");
        setRefreshData(!refreshData);
        onClose();
      }
    }catch(error){
      console.error("Error creating pricing:", error);
      toast.error("Failed to create pricing. Please try again.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-[100%] ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Pricing Rule</h2>
          <p className="text-gray-600 mt-1">Configure vehicle pricing and rates</p>
        </div>
       
      </div>

      <div className=" overflow-y-auto pr-2">
        <div className="space-y-8">
          {/* Vehicle Information Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label  htmlFor="vehicleType">Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select vehicle type</option>
                  <option value="2 wheeler">2 Wheeler</option>
                  <option value="3 wheeler">3 Wheeler</option>
                  <option value="4 wheeler">4 Wheeler</option>
                  <option value="6 wheeler">6 Wheeler</option>
                  <option value="8 wheeler">8 Wheeler</option>
                  <option value="10 wheeler">10 Wheeler</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label  htmlFor="vehicleName">Vehicle Name *</Label>
                <Input
                  id="vehicleName"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g., bike, scooter, truck"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="bodyType">Body Type</Label>
                <select
                  id="bodyType"
                  value={vehicleBodyTypes}
                  onChange={(e) => setVehicleBodyTypes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select body type</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="container">Container</option>
                  <option value="refrigerated">Refrigerated</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label  htmlFor="fuelType">Fuel Type</Label>
                <select
                  id="fuelType"
                  value={vehicleFuelType}
                  onChange={(e) => setVehicleFuelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select fuel type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="cng">CNG</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Vehicle Body Details */}
            <div className="mt-4 space-y-4">
              <Label >Vehicle Body Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="space-y-2">
                  <Label  htmlFor="bodyName">Body Name</Label>
                  <Input
                    id="bodyName"
                    value={vehicleBodyDetails.name}
                    onChange={(e) => setVehicleBodyDetails({...vehicleBodyDetails, name: e.target.value})}
                    placeholder="e.g., truck 10feet(10ton)"
                  />
                </div>
                <div className="space-y-2">
                  <Label  htmlFor="bodyLength">Length</Label>
                  <Input
                    id="bodyLength"
                    value={vehicleBodyDetails.length}
                    onChange={(e) => setVehicleBodyDetails({...vehicleBodyDetails, length: e.target.value})}
                    placeholder="e.g., 10 feet"
                  />
                </div>
                <div className="space-y-2">
                  <Label  htmlFor="bodyCapacity">Capacity</Label>
                  <Input
                    id="bodyCapacity"
                    value={vehicleBodyDetails.capacity}
                    onChange={(e) => setVehicleBodyDetails({...vehicleBodyDetails, capacity: e.target.value})}
                    placeholder="e.g., 10ton"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Image Upload */}
            <div className="mt-4">
              <Label  htmlFor="vehicleImage">Vehicle Image</Label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label 
                  htmlFor="vehicleImage"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      {vehicleImage ? vehicleImage.name : "Click to upload vehicle image"}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                  </div>
                  <input
                    id="vehicleImage"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Pricing Structure Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Pricing</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label  htmlFor="minOrderFare">Minimum Order Fare (₹) *</Label>
                <Input
                  id="minOrderFare"
                  type="number"
                  value={minOrderFare}
                  onChange={(e) => setMinOrderFare(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Distance Slabs Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Distance Slabs</h3>
              </div>
              <Button
                type="button"
                onClick={addDistanceSlab}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Slab
              </Button>
            </div>

            <div className="space-y-3">
              {distanceSlabs.map((slab, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <Label  className="text-xs">Min Distance (km)</Label>
                      <Input
                        type="number"
                        value={slab.minDistance}
                        onChange={(e) => updateDistanceSlab(index, 'minDistance', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label  className="text-xs">Max Distance (km)</Label>
                      <Input
                        type="number"
                        value={slab.maxDistance}
                        onChange={(e) => updateDistanceSlab(index, 'maxDistance', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label  className="text-xs">Fare per KM (₹)</Label>
                      <Input
                        type="number"
                        value={slab.farePerKm}
                        onChange={(e) => updateDistanceSlab(index, 'farePerKm', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {distanceSlabs.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeDistanceSlab(index)}
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weight Slabs Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Weight className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Weight Slabs</h3>
              </div>
              <Button
                type="button"
                onClick={addWeightSlab}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Slab
              </Button>
            </div>

            <div className="space-y-3">
              {weightSlabs.map((slab, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <Label  className="text-xs">Min Weight (kg)</Label>
                      <Input
                        type="number"
                        value={slab.minWeight}
                        onChange={(e) => updateWeightSlab(index, 'minWeight', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label  className="text-xs">Max Weight (kg)</Label>
                      <Input
                        type="number"
                        value={slab.maxWeight}
                        onChange={(e) => updateWeightSlab(index, 'maxWeight', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label  className="text-xs">Fare per KG (₹)</Label>
                      <Input
                        type="number"
                        value={slab.farePerKg}
                        onChange={(e) => updateWeightSlab(index, 'farePerKg', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {weightSlabs.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeWeightSlab(index)}
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Surcharges & Fees Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Percent className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Surcharges & Additional Fees</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label  htmlFor="platformSurcharge">Platform Surcharge (%)</Label>
                <Input
                  id="platformSurcharge"
                  type="number"
                  value={platformSurchargePercentage}
                  onChange={(e) => setPlatformSurchargePercentage(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="nightSurcharge">Night Surcharge (%)</Label>
                <Input
                  id="nightSurcharge"
                  type="number"
                  value={nightSurchargePercentage}
                  onChange={(e) => setNightSurchargePercentage(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="returnTrip">Return Trip Fee (%)</Label>
                <Input
                  id="returnTrip"
                  type="number"
                  value={returnTripFeePercentage}
                  onChange={(e) => setReturnTripFeePercentage(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="codFee">COD Handling Fee (₹)</Label>
                <Input
                  id="codFee"
                  type="number"
                  value={codHandlingFee}
                  onChange={(e) => setCodHandlingFee(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Waiting & Service Charges Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Waiting & Service Charges</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label  htmlFor="waitingCharge">Waiting Charge per Min (₹)</Label>
                <Input
                  id="waitingCharge"
                  type="number"
                  value={waitingChargePerMin}
                  onChange={(e) => setWaitingChargePerMin(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="freeWaiting">Free Waiting Minutes</Label>
                <Input
                  id="freeWaiting"
                  type="number"
                  value={freeWaitingMinutes}
                  onChange={(e) => setFreeWaitingMinutes(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="loadingCharge">Loading Charge (₹)</Label>
                <Input
                  id="loadingCharge"
                  type="number"
                  value={loadingCharge}
                  onChange={(e) => setLoadingCharge(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="offLoadingCharge">Off-loading Charge (₹)</Label>
                <Input
                  id="offLoadingCharge"
                  type="number"
                  value={offLoadingCharge}
                  onChange={(e) => setOffLoadingCharge(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label  htmlFor="extraHandsCharge">Extra Hands Charge (₹)</Label>
                <Input
                  id="extraHandsCharge"
                  type="number"
                  value={extraHandsCharge}
                  onChange={(e) => setExtraHandsCharge(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !vehicleType || !vehicleName}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Pricing Rule
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreatePricing;
