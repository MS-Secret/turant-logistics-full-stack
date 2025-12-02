const admin = require("firebase-admin");

// Module-level variables to maintain state
let firebaseApp = null;
let messaging = null;
let initialized = false;

/**
 * Initialize Firebase Admin SDK
 */

const initializeFirebase = () => {
  console.log("Initializing Firebase Admin...");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  if (initialized) {
    return firebaseApp;
  }

  try {
    // Service account credentials from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
        process.env.FIREBASE_CLIENT_EMAIL
      )}`,
    };

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    // Get messaging instance
    messaging = admin.messaging(firebaseApp);
    initialized = true;

    console.log("Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin");
  }
};

/**
 * Get messaging instance
 */
function getMessaging() {
  if (!initialized) {
    initializeFirebase();
  }
  return messaging;
}


/**
 * Send notification to a single device
 */
const sendToDevice = async (token, notification, data = {}) => {
  try {
    // Convert string data values to strings for FCM compatibility
    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    stringifiedData.timestamp = new Date().toISOString();

    const message = {
      token: token,
      notification: {
        title: notification?.title,
        body: notification?.body
      },
      data: stringifiedData,
      webpush: {
        fcmOptions: {
          link: data.url || '/'
        },
        notification: {
          title: notification?.title,
          body: notification?.body,
          icon: notification?.icon || '/logo-new.png',
          badge: '/logo-new.png',
          requireInteraction: notification?.requireInteraction || false,
          actions: notification?.actions || []
        }
      }
    };

    const messagingInstance = getMessaging();
    const response = await messagingInstance.send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message to device:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple devices
 */
const sendToMultipleDevices = async (tokens, notification, data = {}) => {
  console.log("tokens:",tokens);
  console.log("notification:",notification);
  console.log("data:",data);
  try {
    // Convert string data values to strings for FCM compatibility
    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    stringifiedData.timestamp = new Date().toISOString();

    // Create messages for each token
    const messages = tokens.map(token => ({
      token: token,
      notification: {
        title: notification?.title,
        body: notification?.body
      },
      data: stringifiedData,
      webpush: {
        fcmOptions: {
          link: data.url || '/'
        },
        notification: {
          title: notification?.title,
          body: notification?.body,
          icon: notification?.icon || '/logo-new.png',
          badge: '/logo-new.png',
          requireInteraction: notification?.requireInteraction || false
        }
      }
    }));

    const messagingInstance = getMessaging();
    console.log("messagingInstance:",messagingInstance);
    console.log("messages:",messages);
    // Use sendEach instead of sendMulticast for firebase-admin v13+
    const response = await messagingInstance.sendEach(messages);
    console.log(`Successfully sent ${response.successCount} messages`);
    
    if (response.failureCount > 0) {
      console.log(`Failed to send ${response.failureCount} messages`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Error sending to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Error sending messages to multiple devices:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeFirebase,
  getMessaging,
  sendToDevice,
  sendToMultipleDevices
};
