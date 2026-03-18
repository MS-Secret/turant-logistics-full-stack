const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the same directory
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://turantlogisticsofficial_db_user:dV4vr1Aae8iUpDCx@turant-logistics.bhrzkeg.mongodb.net/turant-logistics';

async function resetDailyEarnings() {
  try {
    console.log("Connecting to:", MONGO_URL);
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    // Load Driver model
    const driverSchema = new mongoose.Schema({
        userId: String,
        earnings: {
            totalEarnings: { type: Number, default: 0 },
            todayEarnings: { type: Number, default: 0 },
        }
    }, { strict: false });
    
    const Driver = mongoose.models.Driver || mongoose.model("Driver", driverSchema);

    // Perform the update
    const result = await Driver.updateMany(
      {},
      {
        $set: {
          "earnings.todayEarnings": 0,
        },
      }
    );

    console.log(`Daily earnings reset for ${result.modifiedCount} drivers`);
    
    // Find one to verify
    const sample = await Driver.findOne({ "earnings.todayEarnings": 0 });
    console.log("Verification - Driver Today Earnings:", sample?.earnings?.todayEarnings);

  } catch (err) {
    console.error("Error Details:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from DB");
  }
}

resetDailyEarnings();
