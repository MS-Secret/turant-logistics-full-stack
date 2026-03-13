const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pricing = require('./src/models/pricing.model');
const KYCApplication = require('./src/models/kyc.model');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://developer:developer1234@cluster0.dbw57.mongodb.net/turant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB');
  const pricings = await Pricing.find({});
  console.log('--- PRICING MODELS ---');
  pricings.forEach(p => {
    console.log(`Name: ${p.vehicleName}, Type: ${p.vehicleType}, Body: '${p.vehicleBodyType}', Fuel: '${p.vehicleFuelType}'`);
  });

  const kycs = await KYCApplication.find({ 'vehicle.vehicleType': { $exists: true } }).limit(5);
  console.log('\n--- SAMPLE KYC VEHICLES ---');
  kycs.forEach(k => {
    console.log(`User: ${k.userId}, Type: ${k.vehicle?.vehicleType}, Body: '${k.vehicle?.vehicleBodyType}', Fuel: '${k.vehicle?.vehicleFuelType}'`);
  });

  process.exit(0);
}).catch(console.error);
