const mongoose = require("mongoose");

const dbConnection = (url) => {
  mongoose.connect(url, {
   
  });

  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("MongoDb connection error:", error);
  });
  db.once("open", () => {
    console.log("MongoDB connected successfully");
  });
};

module.exports = {
  dbConnection,
};
