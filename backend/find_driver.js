const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://turantlogisticsofficial_db_user:dV4vr1Aae8iUpDCx@turant-logistics.bhrzkeg.mongodb.net/turant-logistics';

async function findDriver() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    const driverSchema = new mongoose.Schema({}, { strict: false });
    const Driver = mongoose.models.Driver || mongoose.model("Driver", driverSchema);

    // Search for the driver with that specific total or today earning
    const drivers = await Driver.find({
        $or: [
            { "earnings.todayEarnings": { $gt: 0 } },
            { "earnings.totalEarnings": { $gt: 0 } }
        ]
    });

    console.log(`Found ${drivers.length} drivers with earnings.`);
    
    drivers.forEach(d => {
        console.log(`Driver: ${d.userId}, Today: ${d.earnings?.todayEarnings}, Total: ${d.earnings?.totalEarnings}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

findDriver();
