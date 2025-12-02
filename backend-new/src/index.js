require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const { dbConnection } = require("./config/db");
const http = require("http");
const { initializeSocket } = require("./socket/socket");
const mainRoutes=require("./routes/main.routes");
const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');
const { createDefaultAdmin } = require("./services/auth.service");

const app = express();
const port = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL;


const server = http.createServer(app);
const io = initializeSocket(server);
app.set("io", io);

// Enable trust proxy - required for rate limiting behind a proxy
app.set('trust proxy', 1);


/**
 * Setup Winston logger
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "auth-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "logs/auth-service.log" }),
  ],
});


/**
 * Setup middleware
 */

// Security middleware
app.use(helmet());

// CORS - Allow requests from API gateway and other services
console.log("cors data:", process.env.CORS_ORIGIN.split(","))
app.use(
  cors({
    origin:  process.env.CORS_ORIGIN.split(",") || "*",
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
app.use(bodyParser.urlencoded({extended:true}));
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
  console.log(`log Route ${req.originalUrl} not found`);
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

//database connection
dbConnection(MONGO_URL);

//create default admin
createDefaultAdmin();

// Start the server
async function startServer() {
  try {
    
    // Start HTTP server
    server.listen(port, () => {
      console.log(`backend service running on port http://localhost:${port}`);
      logger.info(`backend service running on port ${port}`);
      logger.info(`CORS enabled for origin: ${process.env.CORS_ORIGIN}`);
      logger.info(`JWT secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
      logger.info(`Rate limit window: ${process.env.RATE_LIMIT_WINDOW_MS} ms`);
      logger.info(`Max requests: ${process.env.RATE_LIMIT_MAX_REQUESTS}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    logger.error('Server startup failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// Start the server
startServer();