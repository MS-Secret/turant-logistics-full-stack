/**
 * Calculate the distance between two geographical points using Haversine formula
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  console.log(`Calculated distance: ${distance} km for points (${lat1}, ${lon1}) and (${lat2}, ${lon2})`);
  return distance;
};

/**
 * Filter drivers within a specific radius
 * @param {Array} drivers - Array of driver objects with currentLocation
 * @param {number} consumerLat - Consumer's latitude
 * @param {number} consumerLng - Consumer's longitude
 * @param {number} radiusInKm - Search radius in kilometers
 * @returns {Array} Filtered drivers with distance information
 */
const filterDriversByRadius = (drivers, consumerLat, consumerLng, radiusInKm = 10) => {
  return drivers
    .map(driver => {
      const distance = calculateDistance(
        consumerLat,
        consumerLng,
        driver.currentLocation.latitude,
        driver.currentLocation.longitude
      );
      return {
        ...driver.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    })
    .filter(driver => driver.distance <= radiusInKm)
    .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)
};

module.exports = {
  calculateDistance,
  filterDriversByRadius
};