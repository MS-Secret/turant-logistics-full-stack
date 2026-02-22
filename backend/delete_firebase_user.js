const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { initializeFirebase } = require('./src/config/firebase.config');
const admin = require('firebase-admin');

async function deleteFirebaseUser() {
    const phone = '+919932584849';
    console.log("Checking:", phone);
    try {
        initializeFirebase();
        const userRecord = await admin.auth().getUserByPhoneNumber(phone);
        await admin.auth().deleteUser(userRecord.uid);
        console.log("SUCCESS_DELETED");
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.log("ALREADY_DELETED_OR_NOT_FOUND");
        } else {
            console.log("ERROR:", e.message);
        }
    }
    process.exit(0);
}

deleteFirebaseUser();
