// Function to format date and time
function formatDateTime(dateString) {
  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-IN", options);
  return formatter.format(new Date(dateString));
}
function formatTime(dateString) {
  const options = {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Use 12-hour format with AM/PM
  };
  const formatter = new Intl.DateTimeFormat("en-IN", options);
  return formatter.format(new Date(dateString));
}
function formatDate(dateString) {
  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formatter = new Intl.DateTimeFormat("en-IN", options);
  return formatter.format(new Date(dateString));
}

module.exports = { formatDateTime, formatTime, formatDate };
