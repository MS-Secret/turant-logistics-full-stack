/**
 * Centralized utility for normalizing vehicle attributes across the system.
 * This simplifies matching between consumer selections and driver KYC data.
 */

const normalizeVehicleAttributes = (attributes = {}) => {
  const { vehicleType, vehicleBodyType, vehicleFuelType } = attributes;

  // Normalizer: maps various naming conventions to standard internal values
  const mappings = {
    type: {
      '2 Wheeler': '2w',
      '2 wheeler': '2w',
      '2w': '2w',
      'scooty': '2w',
      'scooter': '2w',
      '3 Wheeler (Passenger Auto/e-rickshaw)': '3w',
      '3 wheeler': '3w',
      '3w': '3w',
      'Piaggio like model': '3w',
      '4 wheeler': '4w',
      '4w': '4w',
      'Truck': 'truck',
      'truck': 'truck',
      'Tata Ace like (upto 1500 kg)': 'truck',
      'Mahindra like (upto 2 Ton)': 'truck',
      'Intercity': 'intercity'
    },
    fuel: {
      'ev': 'electric',
      'electric': 'electric',
      'petrol': 'petrol',
      'cng': 'cng',
      'diesel': 'diesel'
    },
    body: {
      'scooty': 'scooter',
      'scooter': 'scooter',
      'open': 'open',
      'closed': 'closed',
      'container': 'container'
    }
  };

  const normalize = (val, map) => {
    if (!val) return null;
    const cleanVal = val.toString().trim().toLowerCase();
    
    // Check direct mapping first (case-insensitive keys)
    for (const key in map) {
      if (key.toLowerCase() === cleanVal) return map[key];
    }
    
    return cleanVal; // Fallback to lowercase if no mapping found
  };

  return {
    vehicleType: normalize(vehicleType, mappings.type),
    vehicleBodyType: normalize(vehicleBodyType, mappings.body),
    vehicleFuelType: normalize(vehicleFuelType, mappings.fuel)
  };
};

module.exports = {
  normalizeVehicleAttributes
};
