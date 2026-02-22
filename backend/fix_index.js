const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function checkIndex() {
    try {
        const uri = 'mongodb+srv://turantlogisticsofficial_db_user:dV4vr1Aae8iUpDCx@turant-logistics.bhrzkeg.mongodb.net/turant-logistics';
        await mongoose.connect(uri);

        const indexes = await User.collection.indexes();
        console.log("=== ACTUAL INDEXES IN DB ===");
        indexes.forEach((idx) => {
            let nameStr = idx.name.substring(0, 20).padEnd(20, ' ');
            console.log(`${nameStr} -> ${JSON.stringify(idx.key)}`);
        });

    } catch (e) {
        console.error("Connection Error:", e.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkIndex();
