const express = require("express");
const router = express.Router();

/**
 * Test socket emission endpoint
 * POST /api/test-socket
 * Body: { userId, message, orderId }
 */
router.post("/test-socket", (req, res) => {
  try {
    const io = req.app.get("io");
    const { userId, message, orderId } = req.body;

    if (!io) {
      return res.status(500).json({
        success: false,
        message: "Socket.io not initialized",
        timestamp: new Date().toISOString(),
      });
    }

    if (userId) {
      // Send to specific user
      io.to(`user_${userId}`).emit("test_message", {
        message: message || "Test message from server",
        timestamp: new Date().toISOString(),
        userId: userId,
      });
      
      console.log(`Emitted test_message to user_${userId}`);
    }

    if (orderId) {
      // Send order update
      io.to(`order_${orderId}`).emit("order_update", {
        orderId,
        status: "updated",
        message: "Order status updated",
        timestamp: new Date().toISOString(),
      });
      
      console.log(`Emitted order_update to order_${orderId}`);
    }

    // Broadcast to all connected clients
    if (!userId && !orderId) {
      io.emit("broadcast_message", {
        message: message || "Broadcast test message from server",
        timestamp: new Date().toISOString(),
      });
      
      console.log("Emitted broadcast_message to all clients");
    }

    res.json({
      success: true,
      message: "Socket event emitted successfully",
      data: {
        userId,
        orderId,
        message,
        connectedClients: io.sockets.sockets.size,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Socket test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to emit socket event",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get connected clients info
 * GET /api/socket-info
 */
router.get("/socket-info", (req, res) => {
  try {
    const io = req.app.get("io");
    
    if (!io) {
      return res.status(500).json({
        success: false,
        message: "Socket.io not initialized",
        timestamp: new Date().toISOString(),
      });
    }

    const connectedSockets = [];
    io.sockets.sockets.forEach((socket, socketId) => {
      connectedSockets.push({
        id: socketId,
        userId: socket.userId || null,
        rooms: Array.from(socket.rooms),
        connected: socket.connected,
      });
    });

    res.json({
      success: true,
      data: {
        totalConnections: io.sockets.sockets.size,
        connectedSockets: connectedSockets,
        rooms: Object.keys(io.sockets.adapter.rooms),
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Socket info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get socket info",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;