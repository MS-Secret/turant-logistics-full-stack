// Helper function to check if current time is night time (9 PM to 7 AM)
const isCheckNightTime = (dateTime = new Date()) => {
  const hour = dateTime.getHours();
  return hour >= 21 || hour < 7; // 9 PM (21:00) to 7 AM (07:00)
};

// Helper function to validate and get distance fare
const calculateDistanceFare = (distance, distanceSlabs) => {
  if (!distanceSlabs || distanceSlabs.length === 0) return 0;
  
  for (const slab of distanceSlabs) {
    if (distance >= slab.minDistance && (slab.maxDistance == null || distance <= slab.maxDistance)) {
      return distance * slab.farePerKm;
    }
  }
  return 0;
};

// Helper function to validate and get weight fare
const calculateWeightFare = (weight, weightSlabs) => {
  if (!weightSlabs || weightSlabs.length === 0) return 0;
  
  for (const slab of weightSlabs) {
    if (weight >= slab.minWeight && (slab.maxWeight == null || weight <= slab.maxWeight)) {
      return weight * slab.farePerKg;
    }
  }
  return 0;
};

module.exports = {
  isCheckNightTime,
  calculateDistanceFare,
  calculateWeightFare
};