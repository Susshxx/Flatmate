/**
 * FLAT-MATE BACKEND SERVER - Express.js API server
 * 
 * PURPOSE:
 * - Main backend server handling all API requests for the Flat-Mate platform
 * - Connects to MongoDB database and provides RESTful API endpoints
 * - Handles authentication, properties, bookings, messages, payments, and more
 * 
 * ARCHITECTURE:
 * - Express.js framework for HTTP server
 * - MongoDB with Mongoose ODM for data persistence
 * - JWT-based authentication for secure user sessions
 * - CORS enabled for frontend communication
 * 
 * API ROUTES:
 * 1. /api/auth - User authentication (signup, login, verify email, forgot password)
 * 2. /api/properties - Property CRUD operations (create, read, update, delete)
 * 3. /api/bookings - Booking management (create, fetch, update status)
 * 4. /api/reviews - Property reviews and ratings
 * 5. /api/khalti - Payment processing with Khalti gateway
 * 6. /api/contact - Contact form submissions
 * 7. /api/messages - Real-time messaging between users
 * 
 * DATABASE MODELS:
 * - User: Stores user accounts (tenants, owners, admins)
 * - Property: Property listings with details, images, and status
 * - Message: Chat messages between tenants and owners
 * - Chat: Chat conversations with participants and messages
 * - ContactMessage: Contact form submissions
 * 
 * MIDDLEWARE:
 * - cors(): Enables cross-origin requests from frontend
 * - express.json(): Parses JSON request bodies
 * - auth middleware: Verifies JWT tokens for protected routes
 * 
 * ENVIRONMENT VARIABLES (.env):
 * - MONGO_URI: MongoDB connection string
 * - JWT_SECRET: Secret key for JWT token signing
 * - EMAIL_USER: Email account for sending notifications
 * - EMAIL_PASS: Email account password
 * - KHALTI_SECRET_KEY: Khalti payment gateway secret
 * - PORT: Server port (default 5000)
 * 
 * FRONTEND CONNECTIONS:
 * - Frontend makes API calls to http://localhost:5000/api/*
 * - All responses are JSON formatted
 * - Authentication uses JWT tokens in Authorization header
 * - File uploads handled as base64 strings in JSON
 */

import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/reviews.js'
import khaltiRoutes from './routes/khalti.js'
import bookingRoutes from './routes/bookings.js'
import propertyRoutes from './routes/properties.js'
import messageRoutes from './routes/messages.js'
import userRoutes from './routes/users.js'
import contactRoutes from './routes/contact.js'
import historyRoutes from './routes/history.js'

// Connect to database (don't exit on failure, let server start anyway)
connectDB().catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.log('⚠️ Server will start without database connection');
});

const app = express();

// CORS Configuration - MUST be FIRST, before any other middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sumedha2408480-flat-mate.onrender.com',
  'https://flatmate-cfq8.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Manual CORS handling for maximum control
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  // Add security headers
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request from:', origin);
    return res.status(204).end();
  }
  
  next();
});

// Remove payload size limit for image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/reviews', reviewRoutes);
app.use('/api/payment/khalti', khaltiRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/history', historyRoutes)

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get collection counts
    let counts = {};
    if (dbStatus === 'connected') {
      try {
        const Property = (await import('./models/Property.js')).default;
        const User = (await import('./models/User.js')).default;
        const Booking = (await import('./models/Booking.js')).default;
        
        counts = {
          properties: await Property.countDocuments(),
          users: await User.countDocuments(),
          bookings: await Booking.countDocuments()
        };
      } catch (error) {
        console.error('Error getting counts:', error);
      }
    }
    
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected',
        collections: counts
      },
      env: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGO_URI,
        frontendUrl: process.env.FRONTEND_URL || 'not set',
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test endpoint for Google auth configuration
app.get('/auth/test', (req, res) => {
  res.json({
    message: 'Auth endpoints are working - CORS configured with manual headers',
    googleClientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
    corsOrigins: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sumedha2408480-flat-mate.onrender.com',
      'https://flatmate-cfq8.onrender.com'
    ],
    requestOrigin: req.headers.origin || 'none',
    corsHeadersSet: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    },
    endpoints: {
      signup: '/auth/google-signup (POST)',
      login: '/auth/google-login (POST)',
      regularSignup: '/auth/signup (POST)',
      regularLogin: '/auth/login (POST)'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Server is running on port ${PORT}                        ║
║  📍 Health check: http://localhost:${PORT}/api/health       ║
║  🧪 Auth test: http://localhost:${PORT}/auth/test           ║
║  🌍 Listening on 0.0.0.0:${PORT}                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    console.log('✅ Server started successfully');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 MongoDB Status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

