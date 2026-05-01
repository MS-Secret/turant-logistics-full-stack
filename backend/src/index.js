require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { dbConnection } = require("./config/db");
const http = require("http");
const { initializeSocket } = require("./socket/socket");
const mainRoutes = require("./routes/main.routes");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { createDefaultAdmin } = require("./services/auth.service");
const logger = require("./utils/logger");
const { DispatchScheduledCampaigns } = require("./services/campaign.service");
const cron = require('node-cron');
const { ResetDailyEarnings } = require('./services/driver.service');

const app = express();
const port = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL;


const server = http.createServer(app);
const io = initializeSocket(server);
app.set("io", io);

// Enable trust proxy - required for rate limiting behind a proxy
app.set('trust proxy', 1);


// Centralized logger imported above


/**
 * Setup middleware
 */

// Security middleware
app.use(helmet());

// CORS - Allow requests from API gateway and other services
logger.debug("CORS Configured origins", { origins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [] });
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim()) : "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email', 'X-User-Type', 'X-User-Data']
  })
);

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
    timestamp: new Date().toISOString(),
  },
});
app.use(limiter);

// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


// Request logging with connection monitoring
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);

  // Monitor connection state
  req.on('aborted', () => {
    logger.warn(`Request aborted: ${req.method} ${req.path}`);
  });

  req.on('close', () => {
    logger.info(`Request closed: ${req.method} ${req.path}`);
  });

  next();
});

/**
 * Routes
 */
// Health check route
app.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "backend service is running",
    timestamp: new Date().toISOString(),
  });
});

//use main routes
app.use("/api", mainRoutes);

/**
 * Setup error handling
 */
// 404 handler
app.all("*", (req, res) => {
  logger.warn(`Route not found`, { path: req.originalUrl });
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  // Check if response has already been sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle specific connection errors
  if (error.code === 'ECONNABORTED' || error.type === 'request.aborted') {
    logger.warn(`Request aborted: ${req.method} ${req.path}`, {
      error: error.code || error.type,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    // Don't send response for aborted requests
    return;
  }

  logger.error("backend service error:", {
    error: error.message,
    stack: error.stack,
    code: error.code,
    type: error.type,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
async function startServer() {
  try {
    // Connect to database FIRST — don't serve requests until DB is ready
    await dbConnection(MONGO_URL);

    // Create default admin after DB is ready
    await createDefaultAdmin();

    // Start HTTP server
    server.listen(port, () => {
      logger.info(`backend service running on port ${port}`);
      logger.debug(`JWT secret status: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
      logger.debug(`Rate limit window: ${process.env.RATE_LIMIT_WINDOW_MS} ms`);
      logger.debug(`Max requests: ${process.env.RATE_LIMIT_MAX_REQUESTS}`);

      // Start the scheduled campaigns dispatcher (runs every minute)
      setInterval(async () => {
        try {
          await DispatchScheduledCampaigns();
        } catch (err) {
          logger.error("Error in DispatchScheduledCampaigns interval:", err);
        }
      }, 60 * 1000);

      // Schedule ResetDailyEarnings to run every day at midnight (00:00)
      cron.schedule('0 0 * * *', async () => {
        logger.info('Running scheduled task: ResetDailyEarnings at midnight');
        try {
          const result = await ResetDailyEarnings();
          logger.info(`Scheduled ResetDailyEarnings completed: ${result.message}`);
        } catch (err) {
          logger.error("Error in scheduled ResetDailyEarnings:", err);
        }
      });

      // Keep-alive self-ping to prevent free-tier hosting from sleeping
      if (process.env.KEEP_ALIVE_URL) {
        setInterval(async () => {
          try {
            const axios = require('axios');
            await axios.get(`${process.env.KEEP_ALIVE_URL}/health`);
            logger.debug('Keep-alive ping sent successfully');
          } catch (err) {
            logger.warn('Keep-alive ping failed', { error: err.message });
          }
        }, 14 * 60 * 1000); // Every 14 minutes (most free tiers sleep after 15)
      }

    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();