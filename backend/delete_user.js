const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function dumpPhones() {
    try {
        const uri = 'mongodb+srv://turantlogisticsofficial_db_user:dV4vr1Aae8iUpDCx@turant-logistics.bhrzkeg.mongodb.net/turant-logistics';
        await mongoose.connect(uri);

        const users = await User.find();
        console.log("All Phone Numbers in DB:");
        users.forEach(u => console.log(u.phone || 'No phone'));

    } catch (e) { console.error(e); }
    finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
dumpPhones();
