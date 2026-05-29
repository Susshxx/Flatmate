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
import cors from 'cors';
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

connectDB();

const app = express();

// Build allowed origins from environment variables with fallback to localhost
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'];

// app.use(cors({
//   origin: allowedOrigins,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));


app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://sumedha2408480-flat-mate.onrender.com',
  ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Remove payload size limit for image uploads
app.use(express.json({ limit: 'infinity' }));
app.use(express.urlencoded({ limit: 'infinity', extended: true }));

app.use('/auth', authRoutes);
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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Server is running on port ${PORT}                        ║
║  📍 Health check: http://localhost:${PORT}/api/health       ║
║  🧪 Contact test: http://localhost:${PORT}/api/contact/test-messages ║
╚════════════════════════════════════════════════════════════╝
  `);
});

