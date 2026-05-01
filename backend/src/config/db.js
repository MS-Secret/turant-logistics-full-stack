const mongoose = require("mongoose");
const logger = require("../utils/logger");

const dbConnection = async (url) => {
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB initial connection failed", { error: error.message });
    process.exit(1); 
  }

  const db = mongoose.connection;

  db.on("error", (error) => {
    logger.error("MongoDB connection error:", { error: error.message });
  });

  db.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Mongoose will auto-reconnect...");
  });

  db.on("reconnected", () => {
    logger.info("MongoDB reconnected successfully");
  });
};

module.exports = {
  dbConnection,
};
